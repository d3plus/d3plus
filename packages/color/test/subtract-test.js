import assert from "assert";
import {default as subtract} from "../es/src/subtract.js";

it("subtract", () => {
  assert.strictEqual("rgb(254, 255, 0)", subtract("#ff8000", "#ff0000"));
  assert.strictEqual("rgb(254, 255, 0)", subtract("#00ff80", "#0000ff"));
  assert.strictEqual("rgb(1, 0, 255)", subtract("#00ff80", "#ffff00"));
  assert.strictEqual("rgb(0, 0, 255)", subtract("#ff00ff", "#ff0000"));
  assert.strictEqual("rgb(255, 0, 0)", subtract("#ff00ff", "#0000ff"));
  assert.strictEqual("rgb(255, 1, 0)", subtract("#ff8000", "#ffff00"));

  const half = subtract("#ff8000", "#ff0000", 0.5, 0.5);
  assert.ok(half.startsWith("rgb("), "opacity parameters produce valid color");

  const zeroOpacity = subtract("#ff8000", "#ff0000", 1, 0);
  assert.ok(zeroOpacity.startsWith("rgb("), "zero opacity second color");

  const sameColor = subtract("#336699", "#336699");
  assert.ok(sameColor.startsWith("rgb("), "subtracting same color from itself");
});
