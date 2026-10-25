/* eslint-disable @typescript-eslint/no-require-imports -- Node CommonJS harness compiles the real TypeScript route in memory. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const ts = require("typescript");
const { NextRequest } = require("next/server");

// Compile the real route and validation module in memory, without a second dev server.
function loadTs(relative) {
  const filename = path.resolve(relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const mod = new Module(filename, module);
  mod.filename = filename;
  mod.paths = Module._nodeModulePaths(path.dirname(filename));
  const original = mod.require.bind(mod);
  mod.require = (name) =>
    name.startsWith("@/lib/") ? loadTs(name.replace("@/", "") + ".ts") : original(name);
  mod._compile(compiled, filename);
  return mod.exports;
}
const { POST } = loadTs("app/api/auth/[action]/route.ts");
const { validPassword } = loadTs("lib/auth.ts");
const user = {
  id: "test-user",
  name: "Test",
  email: "test@example.invalid",
  phone: null,
  profilePhotoUrl: "https://example.invalid/avatar.jpg",
  role: "USER",
  createdAt: "2026-01-01T00:00:00Z",
};
const tokens = {
  accessToken: "test-access",
  refreshToken: "test-refresh",
  expiresInSeconds: 900,
  user,
};
function request(action, body = {}, cookie = "", origin = "http://localhost:3000") {
  return POST(
    new NextRequest(`http://localhost:3000/api/auth/${action}`, {
      method: "POST",
      headers: { origin, cookie, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ action }) },
  );
}
function backend(t, responses) {
  const calls = [];
  t.mock.method(global, "fetch", async (url, options) => {
    calls.push({ path: new URL(url).pathname, options });
    const next = responses.shift();
    assert.ok(next, "Unexpected backend request");
    if (next instanceof Error) throw next;
    return Response.json(next.body ?? { data: tokens }, {
      status: next.status ?? 200,
      headers: next.headers,
    });
  });
  return calls;
}
test("password validation matches backend Unicode character and UTF-8 byte limits", () => {
  assert.equal(validPassword("12345678"), true);
  assert.equal(validPassword("1234567"), false);
  assert.equal(validPassword(" ".repeat(8)), false);
  assert.equal(validPassword("😀".repeat(18)), true);
  assert.equal(validPassword("😀".repeat(19)), false);
});
test("cross-origin authentication is rejected before contacting backend", async (t) => {
  const calls = backend(t, []);
  assert.equal((await request("login", {}, "", "https://other.invalid")).status, 403);
  assert.equal(calls.length, 0);
});
test("anonymous session is unauthorized and clears cookies", async (t) => {
  backend(t, []);
  const result = await request("session");
  assert.equal(result.status, 401);
  assert.equal(result.cookies.get("lf_access").value, "");
});
test("session preserves profile photo URLs and normalizes missing photos to null", async (t) => {
  const { profilePhotoUrl, ...withoutPhoto } = user;
  backend(t, [{ body: { data: user } }, { body: { data: withoutPhoto } }]);
  const withPhoto = await request("session", {}, "lf_access=valid");
  assert.equal((await withPhoto.json()).user.profilePhotoUrl, profilePhotoUrl);
  const missingPhoto = await request("session", {}, "lf_access=valid");
  assert.equal((await missingPhoto.json()).user.profilePhotoUrl, null);
});
test("login hides tokens from response and creates HttpOnly cookies", async (t) => {
  const calls = backend(t, [{}]);
  const result = await request("login", {
    email: "test@example.invalid",
    password: "test-password",
  });
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { user });
  assert.equal(result.cookies.get("lf_access").httpOnly, true);
  assert.equal(result.cookies.get("lf_refresh").sameSite, "lax");
  assert.equal(calls[0].path, "/api/auth/login");
});
test("registration validates confirmation-independent backend fields and returns signed-in user", async (t) => {
  backend(t, [{ status: 201 }]);
  const result = await request("register", {
    name: "Test",
    email: user.email,
    password: "test-password",
  });
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { user });
  assert.equal(
    (await request("register", { name: "", email: user.email, password: "short" })).status,
    400,
  );
});
test("login preserves conflict and rate limit status without leaking backend details", async (t) => {
  backend(t, [{ status: 409 }, { status: 429 }]);
  assert.equal((await request("login", { email: user.email, password: "test" })).status, 409);
  assert.equal((await request("login", { email: user.email, password: "test" })).status, 429);
});
test("expired access token rotates cookies and uses refreshed authenticated user", async (t) => {
  const calls = backend(t, [{ status: 401 }, {}]);
  const result = await request("session", {}, "lf_access=expired; lf_refresh=valid");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { user });
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
  assert.deepEqual(
    calls.map((c) => c.path),
    ["/api/users/me", "/api/auth/refresh"],
  );
});
test("revoked refresh clears session; service outage does not erase refresh cookie", async (t) => {
  backend(t, [{ status: 401 }, { status: 503 }]);
  assert.equal(
    (await request("session", {}, "lf_refresh=revoked")).cookies.get("lf_refresh").value,
    "",
  );
  const unavailable = await request("session", {}, "lf_refresh=valid");
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.cookies.get("lf_refresh"), undefined);
});
test("logout revokes backend session and clears both cookies", async (t) => {
  const calls = backend(t, [{ body: { data: user } }, { body: {} }]);
  const result = await request("logout", {}, "lf_access=valid");
  assert.equal(result.status, 200);
  assert.equal(result.cookies.get("lf_access").value, "");
  assert.equal(result.cookies.get("lf_refresh").value, "");
  assert.equal(calls[1].path, "/api/auth/logout");
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
});
test("failed logout retains newly rotated tokens for retry", async (t) => {
  backend(t, [{}, { status: 503 }]);
  const result = await request("logout", {}, "lf_refresh=valid");
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});
test("network failure returns a retryable error without exposing credentials", async (t) => {
  backend(t, [new Error("private upstream diagnostic")]);
  const result = await request("login", { email: user.email, password: "secret" });
  assert.equal(result.status, 503);
  assert.deepEqual(await result.json(), { message: "Account service unavailable" });
});
test("logout network failure preserves rotated tokens so the user can retry", async (t) => {
  backend(t, [{}, new Error("network unavailable")]);
  const result = await request("logout", {}, "lf_refresh=valid");
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});
test("Google start forwards the browser session and relays only the handshake cookie", async (t) => {
  const calls = backend(t, [
    {
      body: { data: { authorizationUrl: "/oauth2/authorization/google" } },
      headers: { "Set-Cookie": "JSESSIONID=new-handshake; Path=/; HttpOnly; SameSite=Lax" },
    },
  ]);
  const result = await request(
    "google-start",
    {},
    "JSESSIONID=old-handshake; lf_access=private-app-token",
  );
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    authorizationUrl: "http://localhost:8080/oauth2/authorization/google",
  });
  assert.equal(calls[0].path, "/api/auth/google/start");
  assert.equal(calls[0].options.headers.Origin, "http://localhost:3000");
  assert.equal(calls[0].options.headers.Cookie, "JSESSIONID=old-handshake");
  assert.equal(result.cookies.get("JSESSIONID").httpOnly, true);
  assert.equal(result.cookies.get("JSESSIONID").path, "/");
  assert.equal(result.cookies.get("lf_google_pending").value, "1");
});
test("Google start rejects arbitrary upstream redirects and missing session cookies", async (t) => {
  backend(t, [
    { body: { data: { authorizationUrl: "https://untrusted.invalid" } } },
    { body: { data: { authorizationUrl: "/oauth2/authorization/google" } } },
  ]);
  assert.equal((await request("google-start")).status, 502);
  assert.equal((await request("google-start")).status, 502);
});
test("Google disabled and origin rejection return actionable configuration codes", async (t) => {
  backend(t, [{ status: 404 }, { status: 403 }]);
  assert.equal((await (await request("google-start")).json()).code, "GOOGLE_DISABLED");
  assert.equal((await (await request("google-start")).json()).code, "GOOGLE_CONFIGURATION");
});
test("Google completion requires a flow started in this browser", async (t) => {
  const calls = backend(t, []);
  assert.equal((await request("google-complete")).status, 401);
  assert.equal((await request("google-complete", {}, "JSESSIONID=unsolicited")).status, 401);
  assert.equal(calls.length, 0);
});
test("Google completion stores app tokens privately and clears the consumed handshake", async (t) => {
  const calls = backend(t, [{}]);
  const result = await request("google-complete", {}, "JSESSIONID=completed; lf_google_pending=1");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { user });
  assert.equal(result.cookies.get("lf_access").value, tokens.accessToken);
  assert.equal(result.cookies.get("lf_access").httpOnly, true);
  assert.equal(result.cookies.get("JSESSIONID").maxAge, 0);
  assert.equal(result.cookies.get("lf_google_pending").maxAge, 0);
  assert.equal(calls[0].path, "/api/auth/google/complete");
  assert.equal(calls[0].options.headers.Cookie, "JSESSIONID=completed");
});
test("Google conflict and expired completion clear handshake without clearing an existing app session", async (t) => {
  backend(t, [{ status: 409 }, { status: 401 }]);
  for (const status of [409, 401]) {
    const result = await request(
      "google-complete",
      {},
      "JSESSIONID=completed; lf_google_pending=1; lf_access=existing",
    );
    assert.equal(result.status, status);
    assert.equal(result.cookies.get("JSESSIONID").maxAge, 0);
    assert.equal(result.cookies.get("lf_access"), undefined);
  }
});
test("Google linking response is not treated as a successful sign-in", async (t) => {
  backend(t, [{ body: { data: null } }]);
  const result = await request("google-complete", {}, "JSESSIONID=completed; lf_google_pending=1");
  assert.equal(result.status, 401);
  assert.equal(result.cookies.get("lf_access"), undefined);
});

function reportRequest(
  item,
  files = [],
  cookie = "lf_access=valid",
  origin = "http://localhost:3000",
) {
  const body = new FormData();
  body.set("item", new Blob([JSON.stringify(item)], { type: "application/json" }));
  files.forEach((file) => body.append("files", file));
  return POST(
    new NextRequest("http://localhost:3000/api/auth/report-item", {
      method: "POST",
      headers: { origin, cookie },
      body,
    }),
    { params: Promise.resolve({ action: "report-item" }) },
  );
}
const report = { type: "LOST", name: "Wallet", categoryId: "12345678-1234-1234-1234-123456789012" };
test("reports require authentication and reject cross-origin uploads", async (t) => {
  const calls = backend(t, []);
  assert.equal((await reportRequest(report, [], "")).status, 401);
  assert.equal((await reportRequest(report, [], "", "https://other.invalid")).status, 403);
  assert.equal(calls.length, 0);
});
test("report forwards JSON part and files with a server-only bearer token", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { status: 201, body: { data: { id: "new-item" } } },
  ]);
  const file = new File(["image"], "wallet.png", { type: "image/png" });
  const result = await reportRequest(report, [file]);
  assert.equal(result.status, 201);
  assert.deepEqual(await result.json(), { data: { id: "new-item" } });
  assert.equal(calls[1].path, "/api/items");
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
  assert.equal(calls[1].options.headers["Content-Type"], undefined);
  assert.deepEqual(JSON.parse(await calls[1].options.body.get("item").text()), report);
  assert.equal(calls[1].options.body.getAll("files")[0].name, "wallet.png");
});
test("report validation rejects mixed type fields and unsafe uploads before creation", async (t) => {
  const calls = backend(
    t,
    Array.from({ length: 3 }, () => ({ body: { data: user } })),
  );
  assert.equal((await reportRequest({ ...report, storageLocation: "Desk" })).status, 400);
  assert.equal(
    (await reportRequest(report, [new File(["html"], "photo.html", { type: "text/html" })])).status,
    400,
  );
  assert.equal((await reportRequest({ ...report, locationLat: 30 })).status, 400);
  assert.equal(calls.length, 3);
});
test("rotated session cookies survive report validation failure", async (t) => {
  backend(t, [{}]);
  const result = await reportRequest({ ...report, name: "" }, [], "lf_refresh=old");
  assert.equal(result.status, 400);
  assert.equal(result.cookies.get("lf_access").value, tokens.accessToken);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});
test("failed creation is not retried and retains rotated cookies", async (t) => {
  const calls = backend(t, [{}, new Error("timeout")]);
  const result = await reportRequest(report, [], "lf_refresh=old");
  assert.equal(result.status, 503);
  assert.equal(calls.length, 2);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});

test("report validation enforces photo count, size and coordinate bounds", () => {
  const { validateReport, validatePhotos, MAX_PHOTO_BYTES } = loadTs("lib/report-item.ts");
  assert.equal(validateReport(report), null);
  assert.ok(validateReport({ ...report, locationLat: 91, locationLng: 0 }));
  assert.ok(validateReport({ ...report, type: "FOUND", rewardAmount: 1 }));
  assert.ok(
    validatePhotos(
      Array.from({ length: 11 }, () => new File(["x"], "a.png", { type: "image/png" })),
    ),
  );
  assert.ok(
    validatePhotos([
      new File([new Uint8Array(MAX_PHOTO_BYTES + 1)], "a.png", { type: "image/png" }),
    ]),
  );
  assert.equal(validatePhotos([new File(["x"], "a.png", { type: "image/png" })]), null);
});

test("my reports uses the authenticated endpoint with bounded pagination", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { body: { data: { content: [], page: 2 } } },
    { body: { data: user } },
  ]);
  const result = await request("my-items", { page: 2, userId: "someone-else" }, "lf_access=valid");
  assert.equal(result.status, 200);
  assert.equal(calls[1].path, "/api/items/my");
  assert.equal(calls[1].options.method, "GET");
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
  assert.equal((await request("my-items", { page: -1 }, "lf_access=valid")).status, 400);
});

test("status updates validate allowed actions and preserve backend ownership errors", async (t) => {
  const calls = backend(t, [{ body: { data: user } }, { status: 403 }, { body: { data: user } }]);
  const id = report.categoryId;
  assert.equal(
    (await request("item-status", { id, status: "CLOSED" }, "lf_access=valid")).status,
    403,
  );
  assert.equal(calls[1].path, `/api/items/${id}/status`);
  assert.equal(calls[1].options.method, "PATCH");
  assert.deepEqual(JSON.parse(calls[1].options.body), { status: "CLOSED" });
  assert.equal(
    (await request("item-status", { id, status: "INVALID" }, "lf_access=valid")).status,
    400,
  );
});

function editRequest(item, files = [], cookie = "lf_access=valid") {
  const body = new FormData();
  body.set("id", report.categoryId);
  body.set("item", new Blob([JSON.stringify(item)], { type: "application/json" }));
  files.forEach((file) => body.append("files", file));
  return POST(
    new NextRequest("http://localhost:3000/api/auth/edit-item", {
      method: "POST",
      headers: { origin: "http://localhost:3000", cookie },
      body,
    }),
    { params: Promise.resolve({ action: "edit-item" }) },
  );
}

test("editing preserves photos when omitted and supports explicit replacement", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { body: { data: report } },
    { body: { data: user } },
    { body: { data: report } },
  ]);
  assert.equal((await editRequest(report)).status, 200);
  assert.equal(calls[1].options.method, "PUT");
  assert.equal(calls[1].path, `/api/items/${report.categoryId}`);
  const keep = JSON.parse(await calls[1].options.body.get("item").text());
  assert.equal(keep.photoUrls, undefined);
  assert.equal(keep.replaceAllImages, undefined);
  assert.equal(
    (
      await editRequest({ ...report, replaceAllImages: true }, [
        new File(["image"], "new.png", { type: "image/png" }),
      ])
    ).status,
    200,
  );
  const replace = JSON.parse(await calls[3].options.body.get("item").text());
  assert.equal(replace.replaceAllImages, true);
  assert.equal(calls[3].options.body.getAll("files").length, 1);
});

test("management requires a session and retains refreshed cookies after upstream failure", async (t) => {
  backend(t, [{}, { status: 403 }]);
  assert.equal((await request("my-items")).status, 401);
  assert.equal((await editRequest(report, [], "")).status, 401);
  const result = await request(
    "item-status",
    { id: report.categoryId, status: "RETURNED" },
    "lf_refresh=old",
  );
  assert.equal(result.status, 403);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});

test("delete forwards the authenticated DELETE and returns a confirmation", async (t) => {
  const calls = backend(t, [{ body: { data: user } }, { body: { success: true, data: null } }]);
  const result = await request("delete-item", { id: report.categoryId }, "lf_access=valid");
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { message: "Report deleted." });
  assert.equal(calls[1].path, `/api/items/${report.categoryId}`);
  assert.equal(calls[1].options.method, "DELETE");
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
  assert.equal(calls[1].options.body, undefined);
});

test("delete rejects missing sessions, cross-origin requests and invalid IDs", async (t) => {
  const calls = backend(t, [{ body: { data: user } }, { body: { data: user } }]);
  assert.equal((await request("delete-item", { id: report.categoryId })).status, 401);
  assert.equal(
    (
      await request(
        "delete-item",
        { id: report.categoryId },
        "lf_access=valid",
        "https://other.invalid",
      )
    ).status,
    403,
  );
  assert.equal(
    (await request("delete-item", { id: "../users/me" }, "lf_access=valid")).status,
    400,
  );
  assert.equal((await request("delete-item", null, "lf_access=valid")).status, 400);
  assert.equal(calls.length, 2);
  assert.ok(calls.every((call) => call.options.method === "GET"));
});

test("delete preserves ownership and missing-item errors and rotated cookies", async (t) => {
  const calls = backend(t, [{}, { status: 403 }, { body: { data: user } }, { status: 404 }]);
  const denied = await request("delete-item", { id: report.categoryId }, "lf_refresh=old");
  assert.equal(denied.status, 403);
  assert.equal(denied.cookies.get("lf_refresh").value, tokens.refreshToken);
  assert.equal(calls[1].options.headers.Authorization, `Bearer ${tokens.accessToken}`);
  assert.equal(
    (await request("delete-item", { id: report.categoryId }, "lf_access=valid")).status,
    404,
  );
});

test("delete does not retry an uncertain result and retains the renewed session", async (t) => {
  const calls = backend(t, [{}, new Error("timeout")]);
  const result = await request("delete-item", { id: report.categoryId }, "lf_refresh=old");
  assert.equal(result.status, 503);
  assert.equal(calls.length, 2);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
});

test("messaging starts a conversation using only the item ID and authenticated token", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { body: { data: { id: report.categoryId } } },
  ]);
  const result = await request(
    "start-conversation",
    { itemId: report.categoryId, userId: "other" },
    "lf_access=valid",
  );
  assert.equal(result.status, 200);
  assert.equal(calls[1].path, "/api/conversations");
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].options.body), { itemId: report.categoryId });
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
});

test("conversation and message reads use the backend's participant-scoped endpoints", async (t) => {
  const calls = backend(
    t,
    Array.from({ length: 6 }, () => ({ body: { data: user } })),
  );
  for (const action of ["conversations", "conversation", "messages"])
    assert.equal(
      (await request(action, { id: report.categoryId, page: 1 }, "lf_access=valid")).status,
      200,
    );
  assert.equal(calls[1].path, "/api/conversations");
  assert.equal(calls[3].path, `/api/conversations/${report.categoryId}`);
  assert.equal(calls[5].path, `/api/conversations/${report.categoryId}/messages`);
  assert.ok(calls.every((call) => call.options.method === "GET"));
});

test("sending messages forwards text without accepting a forged sender or image URL", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { status: 201, body: { data: { text: "Hello" } } },
  ]);
  const result = await request(
    "send-message",
    {
      id: report.categoryId,
      text: " Hello ",
      senderId: "other",
      imageUrl: "https://example.invalid",
    },
    "lf_access=valid",
  );
  assert.equal(result.status, 201);
  assert.equal(calls[1].path, `/api/conversations/${report.categoryId}/messages`);
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].options.body), { text: "Hello" });
});

test("messaging rejects invalid identifiers, pagination and empty or oversized text", async (t) => {
  const invalid = [
    ["conversation", { id: "../users" }],
    ["start-conversation", null],
    ["conversations", { page: -1 }],
    ["messages", { id: report.categoryId, page: 0.5 }],
    ["send-message", { id: report.categoryId, text: "  " }],
    ["send-message", { id: report.categoryId, text: "x".repeat(10001) }],
  ];
  const calls = backend(
    t,
    invalid.map(() => ({ body: { data: user } })),
  );
  for (const [action, body] of invalid)
    assert.equal((await request(action, body, "lf_access=valid")).status, 400);
  assert.equal(calls.length, invalid.length);
  assert.ok(calls.every((call) => call.path === "/api/users/me"));
});

test("messaging requires a session and same-origin requests", async (t) => {
  const calls = backend(t, []);
  assert.equal((await request("conversations")).status, 401);
  assert.equal(
    (
      await request(
        "send-message",
        { id: report.categoryId, text: "Hello" },
        "lf_access=valid",
        "https://other.invalid",
      )
    ).status,
    403,
  );
  assert.equal(calls.length, 0);
});

test("messaging preserves participant errors and refreshed cookies without retrying a send", async (t) => {
  const calls = backend(t, [{}, { status: 403 }, {}, new Error("timeout")]);
  const denied = await request("messages", { id: report.categoryId }, "lf_refresh=old");
  assert.equal(denied.status, 403);
  assert.equal(denied.cookies.get("lf_refresh").value, tokens.refreshToken);
  const uncertain = await request(
    "send-message",
    { id: report.categoryId, text: "Hello" },
    "lf_refresh=old",
  );
  assert.equal(uncertain.status, 503);
  assert.equal(uncertain.cookies.get("lf_refresh").value, tokens.refreshToken);
  assert.equal(calls.length, 4);
});

function profileRequest(
  profile,
  avatars = [],
  cookie = "lf_access=valid",
  origin = "http://localhost:3000",
) {
  const body = new FormData();
  body.set("profile", new Blob([JSON.stringify(profile)], { type: "application/json" }));
  avatars.forEach((file) => body.append("avatar", file));
  return POST(
    new NextRequest("http://localhost:3000/api/auth/update-profile", {
      method: "POST",
      headers: { origin, cookie },
      body,
    }),
    { params: Promise.resolve({ action: "update-profile" }) },
  );
}

test("profile updates require authentication and same origin", async (t) => {
  const calls = backend(t, []);
  assert.equal((await profileRequest({ name: "Test", phone: "" }, [], "")).status, 401);
  assert.equal(
    (await profileRequest({ name: "Test", phone: "" }, [], "", "https://other.invalid")).status,
    403,
  );
  assert.equal(calls.length, 0);
});

test("profile updates only forward editable fields and keep the current photo by default", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { body: { data: { ...user, name: "Updated" } } },
  ]);
  const result = await profileRequest({
    name: " Updated ",
    phone: "",
    email: "other@example.invalid",
    role: "ADMIN",
    id: "other-user",
    profilePhotoUrl: "https://other.invalid/photo",
  });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).user.name, "Updated");
  assert.equal(calls[1].path, "/api/users/me");
  assert.equal(calls[1].options.method, "PUT");
  assert.equal(calls[1].options.headers.Authorization, "Bearer valid");
  assert.deepEqual(JSON.parse(await calls[1].options.body.get("profile").text()), {
    name: "Updated",
    phone: "",
  });
  assert.equal(calls[1].options.body.get("avatar"), null);
});

test("profile supports avatar upload and explicit removal without persisting signed URLs", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    { body: { data: user } },
    { body: { data: user } },
    { body: { data: { ...user, profilePhotoUrl: null } } },
  ]);
  const avatar = new File(["image"], "avatar.png", { type: "image/png" });
  assert.equal((await profileRequest({ name: "Test", phone: "" }, [avatar])).status, 200);
  assert.equal(calls[1].options.body.get("avatar").name, "avatar.png");
  assert.equal(
    JSON.parse(await calls[1].options.body.get("profile").text()).profilePhotoUrl,
    undefined,
  );
  const result = await profileRequest({ name: "Test", phone: "", removePhoto: true });
  assert.equal(result.status, 200);
  assert.equal((await result.json()).user.profilePhotoUrl, null);
  assert.equal(JSON.parse(await calls[3].options.body.get("profile").text()).profilePhotoUrl, "");
});

test("invalid profile and conflicting or unsupported photos are rejected before saving", async (t) => {
  const calls = backend(
    t,
    Array.from({ length: 5 }, () => ({ body: { data: user } })),
  );
  const avatar = new File(["image"], "avatar.png", { type: "image/png" });
  assert.equal((await profileRequest({ name: " ", phone: "" })).status, 400);
  assert.equal((await profileRequest({ name: "Test", phone: "1".repeat(51) })).status, 400);
  assert.equal((await profileRequest({ name: "Test", phone: "" }, [avatar, avatar])).status, 400);
  assert.equal(
    (await profileRequest({ name: "Test", phone: "", removePhoto: true }, [avatar])).status,
    400,
  );
  assert.equal(
    (
      await profileRequest({ name: "Test", phone: "" }, [
        new File(["x"], "x.svg", { type: "image/svg+xml" }),
      ])
    ).status,
    400,
  );
  assert.equal(calls.length, 5);
});

test("profile failures retain rotated cookies and never retry a save automatically", async (t) => {
  const calls = backend(t, [{}, new Error("timeout")]);
  const result = await profileRequest({ name: "Test", phone: "" }, [], "lf_refresh=old");
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
  assert.equal(calls.length, 2);
});
function imageRequest({
  id = report.categoryId,
  text = "",
  images = [new File(["image"], "photo.png", { type: "image/png" })],
  cookie = "lf_access=valid",
  origin = "http://localhost:3000",
} = {}) {
  const body = new FormData();
  body.set("id", id);
  body.set("text", text);
  body.set("senderId", "forged-sender");
  images.forEach((image) => body.append("image", image));
  return POST(
    new NextRequest("http://localhost:3000/api/auth/send-image", {
      method: "POST",
      headers: { origin, cookie },
      body,
    }),
    { params: Promise.resolve({ action: "send-image" }) },
  );
}

test("chat photos require authentication and same origin", async (t) => {
  const calls = backend(t, []);
  assert.equal((await imageRequest({ cookie: "" })).status, 401);
  assert.equal((await imageRequest({ origin: "https://other.invalid" })).status, 403);
  assert.equal(calls.length, 0);
});

test("chat photo upload forwards one file and optional caption without forged fields", async (t) => {
  const calls = backend(t, [
    { body: { data: user } },
    {
      status: 201,
      body: { data: { id: "photo-message", imageUrl: "https://example.invalid/photo" } },
    },
    { body: { data: user } },
    { status: 201, body: { data: { id: "photo-only" } } },
  ]);
  const result = await imageRequest({ text: "  Found this  " });
  assert.equal(result.status, 201);
  assert.equal((await result.json()).data.id, "photo-message");
  assert.equal(calls[1].path, `/api/conversations/${report.categoryId}/messages/image`);
  assert.equal(calls[1].options.method, "POST");
  assert.deepEqual(calls[1].options.headers, { Authorization: "Bearer valid" });
  const payload = calls[1].options.body;
  assert.deepEqual([...payload.keys()].sort(), ["image", "text"]);
  assert.equal(payload.get("text"), "Found this");
  assert.equal(payload.get("image").name, "photo.png");
  assert.equal(await payload.get("image").text(), "image");
  assert.equal((await imageRequest()).status, 201);
  assert.equal(calls[3].options.body.has("text"), false);
});

test("chat photos reject invalid IDs, files and oversized captions before upload", async (t) => {
  const cases = [
    { id: "bad" },
    { images: [] },
    {
      images: [
        new File(["a"], "a.png", { type: "image/png" }),
        new File(["b"], "b.png", { type: "image/png" }),
      ],
    },
    { images: [new File(["a"], "a.webp", { type: "image/webp" })] },
    { images: [new File([], "a.png", { type: "image/png" })] },
    { images: [new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", { type: "image/png" })] },
    { text: "a".repeat(10001) },
  ];
  const calls = backend(
    t,
    cases.map(() => ({ body: { data: user } })),
  );
  for (const values of cases) assert.equal((await imageRequest(values)).status, 400);
  assert.equal(calls.length, cases.length);
  assert.ok(calls.every((call) => call.path === "/api/users/me"));
});

test("failed chat photo upload keeps refreshed cookies and does not retry", async (t) => {
  const calls = backend(t, [{ status: 401 }, {}, new Error("uncertain upload")]);
  const result = await imageRequest({ cookie: "lf_access=expired; lf_refresh=valid" });
  assert.equal(result.status, 503);
  assert.equal(result.cookies.get("lf_refresh").value, tokens.refreshToken);
  assert.equal(calls.length, 3);
  assert.equal(calls[2].options.headers.Authorization, `Bearer ${tokens.accessToken}`);
});

test("chat photo upload preserves backend participant and image validation errors", async (t) => {
  backend(
    t,
    [403, 404, 400, 413].flatMap((status) => [{ body: { data: user } }, { status }]),
  );
  for (const status of [403, 404, 400, 413]) assert.equal((await imageRequest()).status, status);
});
