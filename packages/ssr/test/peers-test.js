import assert from "assert";
import {createJsdomWindow} from "../es/src/env.js";
import {fetchOne} from "../es/src/geomapTiles.js";
import {installMeasureContext} from "../es/src/measure.js";
import {loadNapiCanvas} from "../es/src/napiBackend.js";

const missing = () => Promise.reject(new Error("Cannot find package"));

it("loadNapiCanvas explains a missing @napi-rs/canvas", async () => {
  await assert.rejects(loadNapiCanvas(missing), /requires the optional peer dependency `@napi-rs\/canvas`/);
  assert.strictEqual(typeof (await loadNapiCanvas()).createCanvas, "function", "loads the installed package");
});

it("createJsdomWindow explains a missing jsdom", async () => {
  await assert.rejects(createJsdomWindow("<html></html>", missing), /`jsdom` is not installed/);
  const window = await createJsdomWindow("<html><body><p>hi</p></body></html>");
  assert.strictEqual(window.document.querySelector("p").textContent, "hi");
});

it("installMeasureContext leaves the environment alone without @napi-rs/canvas", async () => {
  assert.strictEqual(typeof globalThis.OffscreenCanvas, "undefined");
  const restore = await installMeasureContext(missing);
  assert.strictEqual(typeof globalThis.OffscreenCanvas, "undefined", "no shim when the import fails");
  restore();
  const restoreEmpty = await installMeasureContext(async () => ({}));
  assert.strictEqual(typeof globalThis.OffscreenCanvas, "undefined", "no shim without createCanvas");
  restoreEmpty();
});

it("fetchOne resolves null when the tile request throws", async () => {
  const netFetch = async () => {
    throw new TypeError("fetch failed");
  };
  assert.strictEqual(await fetchOne("https://tile.example/7/7/7.png", {}, netFetch), null);
});
