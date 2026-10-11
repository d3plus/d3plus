import assert from "assert";
import jsdomit from "./jsdom.js";

const nativeBtoa = globalThis.btoa;
const nativeAtob = globalThis.atob;

jsdomit("jsdom harness: btoa and atob work inside a test", () => {
  assert.strictEqual(btoa("<svg/>"), "PHN2Zy8+");
  assert.strictEqual(atob("PHN2Zy8+"), "<svg/>");
});

it("jsdom harness: btoa and atob stay Node's natives after a test", () => {
  assert.strictEqual(globalThis.btoa, nativeBtoa);
  assert.strictEqual(globalThis.atob, nativeAtob);
});
