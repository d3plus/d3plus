import assert from "assert";
import {Bar, Circle, Rect} from "../../es/index.js";

// A standalone shape given string accessors (`.x("x")`, `.width("width")`) must
// read that data key — not treat the string as a literal. Regression: these
// fields used "const"/"identity" coercion, so a string became `constant("x")`
// (→ NaN geometry) or a raw string (→ d3-array "keyof is not a function"),
// blanking the shape examples. "accessor" coercion fixes strings while keeping
// numeric constants and function accessors working.
it("shape string accessors coerce to data-key functions", () => {
  const rect = new Rect().x("x").y("y").width("width").height("height").id("id");
  const d = {id: "a", x: 42, y: 7, width: 110, height: 130};
  assert.strictEqual(typeof rect.x(), "function", "x string → accessor fn");
  assert.strictEqual(rect.x()(d), 42, "x reads the key");
  assert.strictEqual(rect.width()(d), 110, "width reads the key");
  assert.strictEqual(rect.height()(d), 130, "height reads the key");
  assert.strictEqual(rect.id()(d), "a", "id reads the key");

  assert.strictEqual(new Circle().r("r").r()({r: 60}), 60, "r string → accessor");

  // Numeric constants and functions are unaffected.
  assert.strictEqual(new Bar().width(15).width()({}), 15, "width number → constant");
  const fn = d2 => d2.v;
  assert.strictEqual(new Rect().x(fn).x(), fn, "x function → passthrough");
});
