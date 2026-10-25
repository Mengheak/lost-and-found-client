/* eslint-disable @typescript-eslint/no-require-imports -- Compile actual TypeScript modules for contract tests. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");

function loadTs(relative) {
  const filename = path.resolve(relative);
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (name) =>
    name.startsWith("@/lib/")
      ? loadTs(name.replace("@/", "") + ".ts")
      : name.startsWith("./")
        ? loadTs(path.join(path.dirname(filename), name + ".ts"))
        : original(name);
  mod._compile(
    ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText,
    filename,
  );
  return mod.exports;
}
const { POST } = loadTs("app/api/catalog/search/photo/route.ts");
const { validateSearchPhoto } = loadTs("lib/photo-search.ts");
function form() {
  const body = new FormData();
  body.set("file", new File(["test-photo"], "photo.png", { type: "image/png" }));
  return body;
}
function request(body = form(), headers = {}) {
  return POST(
    new Request("http://localhost:3000/api/catalog/search/photo", {
      method: "POST",
      body,
      headers: { origin: "http://localhost:3000", ...headers },
    }),
  );
}

test("photo validation rejects missing, multiple, empty, unsupported, and oversized files", () => {
  for (const files of [
    [],
    [new File(["x"], "x.gif", { type: "image/gif" })],
    [new File([], "x.png", { type: "image/png" })],
    [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "x.png", { type: "image/png" })],
    [new File(["a"], "a.png"), new File(["b"], "b.png")],
  ])
    assert.ok(validateSearchPhoto(files));
  for (const type of ["image/jpeg", "image/png", "image/webp"])
    assert.equal(validateSearchPhoto([new File(["x"], "x", { type })]), null);
});

test("invalid uploads and origins never reach the backend", async (t) => {
  t.mock.method(global, "fetch", () => assert.fail("Unexpected upstream call"));
  assert.equal((await request(form(), { origin: "https://other.invalid" })).status, 403);
  assert.equal((await request("{}", { "content-type": "application/json" })).status, 415);
  assert.equal((await request(new FormData())).status, 400);
  const invalid = form();
  invalid.set("categoryId", "invalid");
  assert.equal((await request(invalid)).status, 400);
  const duplicate = form();
  duplicate.append("file", new File(["x"], "x.png", { type: "image/png" }));
  assert.equal((await request(duplicate)).status, 400);
  assert.equal((await request(form(), { "content-length": String(6 * 1024 * 1024) })).status, 413);
});

test("photo search forwards the actual contract and preserves similarity order without credentials", async (t) => {
  const matches = [
    { item: { id: "first" }, score: 0.9 },
    { item: { id: "second" }, score: 0.7 },
  ];
  const category = "12345678-1234-1234-1234-123456789abc";
  t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url.pathname, "/api/items/search/photo");
    assert.equal(options.method, "POST");
    assert.deepEqual(options.headers, { Accept: "application/json" });
    assert.equal(options.cache, "no-store");
    assert.equal(options.body.get("categoryId"), category);
    assert.equal(options.body.get("limit"), "20");
    assert.equal(await options.body.get("file").text(), "test-photo");
    assert.equal(options.body.get("file").type, "image/png");
    assert.equal(options.body.get("secret"), null);
    return Response.json({ success: true, data: { matches } });
  });
  const body = form();
  body.set("categoryId", category);
  body.set("secret", "ignored");
  const result = await request(body, { cookie: "private-session" });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get("cache-control"), "no-store");
  assert.deepEqual((await result.json()).data.matches, matches);
});

test("empty matches succeed; upstream failures and malformed replies remain recoverable", async (t) => {
  const replies = [
    Response.json({ success: true, data: { matches: [] } }),
    Response.json({ message: "internal detail" }, { status: 400 }),
    Response.json({}, { status: 429 }),
    Response.json({}, { status: 503 }),
    Response.json({ success: true, data: {} }),
    new Error("offline"),
  ];
  t.mock.method(global, "fetch", async () => {
    const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return reply;
  });
  assert.deepEqual((await (await request()).json()).data.matches, []);
  for (const status of [400, 429, 503, 503, 503]) {
    const result = await request();
    assert.equal(result.status, status);
    assert.equal(result.headers.get("cache-control"), "no-store");
    assert.equal((await result.json()).success, false);
  }
});
