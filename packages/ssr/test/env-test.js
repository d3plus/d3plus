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
