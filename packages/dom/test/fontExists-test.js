import assert from "assert";
import {default as fontExists} from "../src/fontExists.js";
import it from "./jsdom.js";

it("fontExists", () => {

  const missing = "Missing", valid = "Verdana";

  assert.strictEqual(valid, fontExists(valid), "single - exists");
  assert.strictEqual(false, fontExists(missing), "single - missing");
  assert.strictEqual(valid, fontExists(`${valid}, ${missing}`), "string - first");
  assert.strictEqual(valid, fontExists(`${missing}, ${valid}`), "string - second");
  assert.strictEqual(false, fontExists(`${missing}, ${missing}2`), "string - none");
  assert.strictEqual(valid, fontExists([valid, missing]), "array - first");
  assert.strictEqual(valid, fontExists([missing, valid]), "array - second");
  assert.strictEqual(false, fontExists([missing, `${missing}2`]), "array - none");

});
