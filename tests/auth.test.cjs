/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS harness compiles the real TypeScript route in memory. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const { NextRequest } = require('next/server');

// Compile the real route and validation module in memory, without a second dev server.
function loadTs(relative) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (name) => name === '@/lib/auth' ? loadTs('lib/auth.ts') : original(name);
  mod._compile(compiled, filename);
  return mod.exports;
}
const { POST } = loadTs('app/api/auth/[action]/route.ts');
const { validPassword } = loadTs('lib/auth.ts');
const user = { id: 'test-user', name: 'Test', email: 'test@example.invalid', phone: null, role: 'USER', createdAt: '2026-01-01T00:00:00Z' };
const tokens = { accessToken: 'test-access', refreshToken: 'test-refresh', expiresInSeconds: 900, user };
function request(action, body = {}, cookie = '', origin = 'http://localhost:3000') {
  return POST(new NextRequest(`http://localhost:3000/api/auth/${action}`, {
    method: 'POST', headers: { origin, cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { params: Promise.resolve({ action }) });
}
function backend(t, responses) {
  const calls = [];
  t.mock.method(global, 'fetch', async (url, options) => {
    calls.push({ path: new URL(url).pathname, options });
    const next = responses.shift();
    assert.ok(next, 'Unexpected backend request');
    if (next instanceof Error) throw next;
    return Response.json(next.body ?? { data: tokens }, { status: next.status ?? 200 });
  });
  return calls;
}
test('password validation matches backend Unicode character and UTF-8 byte limits', () => {
  assert.equal(validPassword('12345678'), true);
  assert.equal(validPassword('1234567'), false);
  assert.equal(validPassword(' '.repeat(8)), false);
  assert.equal(validPassword('😀'.repeat(18)), true);
  assert.equal(validPassword('😀'.repeat(19)), false);
});
test('cross-origin authentication is rejected before contacting backend', async t => {
  const calls = backend(t, []);
  assert.equal((await request('login', {}, '', 'https://other.invalid')).status, 403);
  assert.equal(calls.length, 0);
});
test('anonymous session is unauthorized and clears cookies', async t => {
  backend(t, []);
  const result = await request('session');
  assert.equal(result.status, 401);
  assert.equal(result.cookies.get('lf_access').value, '');
});
test('login hides tokens from response and creates HttpOnly cookies', async t => {
  const calls = backend(t, [{}]);
  const result = await request('login', { email: 'test@example.invalid', password: 'test-password' });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { user });
  assert.equal(result.cookies.get('lf_access').httpOnly, true);
  assert.equal(result.cookies.get('lf_refresh').sameSite, 'lax');
  assert.equal(calls[0].path, '/api/auth/login');
});
test('registration validates confirmation-independent backend fields and returns signed-in user', async t => {
  backend(t, [{ status: 201 }]);
  const result = await request('register', { name: 'Test', email: user.email, password: 'test-password' });
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { user });
  assert.equal((await request('register', { name: '', email: user.email, password: 'short' })).status, 400);
});
test('login preserves conflict and rate limit status without leaking backend details', async t => {
  backend(t, [{ status: 409 }, { status: 429 }]);
  assert.equal((await request('login', { email: user.email, password: 'test' })).status, 409);
  assert.equal((await request('login', { email: user.email, password: 'test' })).status, 429);
});
test('expired access token rotates cookies and uses refreshed authenticated user', async t => {
  const calls = backend(t, [{ status: 401 }, {}]);
  const result = await request('session', {}, 'lf_access=expired; lf_refresh=valid');
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { user });
  assert.equal(result.cookies.get('lf_refresh').value, tokens.refreshToken);
  assert.deepEqual(calls.map(c => c.path), ['/api/users/me', '/api/auth/refresh']);
});
test('revoked refresh clears session; service outage does not erase refresh cookie', async t => {
  backend(t, [{ status: 401 }, { status: 503 }]);
  assert.equal((await request('session', {}, 'lf_refresh=revoked')).cookies.get('lf_refresh').value, '');
  const unavailable = await request('session', {}, 'lf_refresh=valid');
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.cookies.get('lf_refresh'), undefined);
});
test('logout revokes backend session and clears both cookies', async t => {
  const calls = backend(t, [{ body: { data: user } }, { body: {} }]);
  const result = await request('logout', {}, 'lf_access=valid');
  assert.equal(result.status, 200);
  assert.equal(result.cookies.get('lf_access').value, '');
  assert.equal(result.cookies.get('lf_refresh').value, '');
  assert.equal(calls[1].path, '/api/auth/logout');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer valid');
});
test('failed logout retains newly rotated tokens for retry', async t => {
  backend(t, [{}, { status: 503 }]);
  const result = await request('logout', {}, 'lf_refresh=valid');
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get('lf_refresh').value, tokens.refreshToken);
});
test('network failure returns a retryable error without exposing credentials', async t => {
  backend(t, [new Error('private upstream diagnostic')]);
  const result = await request('login', { email: user.email, password: 'secret' });
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { message: 'Account service unavailable' });
});
test('logout network failure preserves rotated tokens so the user can retry', async t => {
  backend(t, [{}, new Error('network unavailable')]);
  const result = await request('logout', {}, 'lf_refresh=valid');
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get('lf_refresh').value, tokens.refreshToken);
});
