import assert from "assert";
import {installDom, withDom} from "../es/index.js";

it("installDom mirrors DOM globals and restores them on teardown", async () => {
  const hadDocument = "document" in globalThis;
  const env = await installDom({});
  assert.strictEqual(typeof globalThis.document, "object", "document installed");
  assert.strictEqual(typeof globalThis.SVGElement, "function", "SVGElement installed");
  assert.strictEqual(typeof globalThis.Element, "function", "Element installed");
  env.teardown();
  assert.strictEqual("document" in globalThis, hadDocument, "document restored");
});

it("withDom tears the DOM down even when the callback throws", async () => {
  await assert.rejects(
    () => withDom({}, async () => {
      throw new Error("boom");
    }),
    /boom/,
  );
  assert.strictEqual(typeof globalThis.document, "undefined", "document torn down");
});

it("installDom accepts an injected window", async () => {
  const {JSDOM} = await import("jsdom");
  const {window} = new JSDOM("<!doctype html><body></body>");
  const env = await installDom({window});
  assert.strictEqual(globalThis.window, window, "uses the injected window");
  env.teardown();
});

it("installDom keeps Node's native btoa and atob working", async () => {
  const nativeBtoa = globalThis.btoa;
  const nativeAtob = globalThis.atob;
  const env = await installDom({});
  try {
    assert.strictEqual(globalThis.btoa("<svg/>"), "PHN2Zy8+", "btoa encodes");
    assert.strictEqual(globalThis.atob("PHN2Zy8+"), "<svg/>", "atob decodes");
  } finally {
    env.teardown();
  }
  assert.strictEqual(globalThis.btoa, nativeBtoa, "btoa restored");
  assert.strictEqual(globalThis.atob, nativeAtob, "atob restored");
});
