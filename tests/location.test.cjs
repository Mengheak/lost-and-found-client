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
const { parseCoordinates, mapCoordinates } = loadTs("lib/location.ts");
const { validateReport } = loadTs("lib/report-item.ts");

test("empty and partial coordinates never become a false pin at zero", () => {
  for (const value of [
    { lat: "", lng: "" },
    { lat: " ", lng: "0" },
    { lat: "10", lng: "" },
    { lat: "NaN", lng: "0" },
    { lat: "91", lng: "0" },
    { lat: "0", lng: "181" },
  ])
    assert.equal(parseCoordinates(value), null);
  assert.deepEqual(parseCoordinates({ lat: "0", lng: "0" }), [0, 0]);
  assert.deepEqual(parseCoordinates({ lat: "-90", lng: "180" }), [-90, 180]);
});

test("map selections wrap the date line and satisfy the backend report contract", () => {
  for (const [lat, lng] of [
    [11.5564, 104.9282],
    [0, 540],
    [-45, -541],
    [90, 180],
  ]) {
    const selected = mapCoordinates(lat, lng);
    const [locationLat, locationLng] = parseCoordinates(selected);
    assert.equal(
      validateReport({
        type: "LOST",
        name: "Wallet",
        categoryId: "12345678-1234-1234-1234-123456789012",
        locationLat,
        locationLng,
      }),
      null,
    );
  }
  assert.equal(mapCoordinates(0, 541).lng, "-179.000000");
  assert.equal(mapCoordinates(0, -541).lng, "179.000000");
});
