import assert from "assert";
import {default as isObject} from "../src/isObject.js";
import it from "./jsdom.js";

it("isObject", () => {

  assert.strictEqual(isObject("id"), false, "String");
  assert.strictEqual(isObject(42), false, "Number");
  assert.strictEqual(isObject([1, 2, 3]), false, "Array");
  assert.strictEqual(isObject(null), false, "null");
  assert.strictEqual(isObject(void 0), false, "undefined");
  assert.strictEqual(isObject(true), false, "true");
  assert.strictEqual(isObject(false), false, "false");
  assert.strictEqual(isObject(window), false, "window");
  assert.strictEqual(isObject(document), false, "document");
  assert.strictEqual(isObject(document.body), false, "DOM element");
  assert.strictEqual(isObject({id: 1}), true, "Object");

});
