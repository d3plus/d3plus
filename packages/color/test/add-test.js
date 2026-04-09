import assert from "assert";
import {default as add} from "../es/src/add.js";

it("add", () => {
  assert.strictEqual("rgb(255, 128, 0)", add("#ff0000", "#ffff00"));
  assert.strictEqual("rgb(255, 128, 0)", add("#ffff00", "#ff0000"));
  assert.strictEqual("rgb(0, 255, 128)", add("#ffff00", "#0000ff"));
  assert.strictEqual("rgb(0, 255, 128)", add("#0000ff", "#ffff00"));
  assert.strictEqual("rgb(255, 0, 255)", add("#0000ff", "#ff0000"));
  assert.strictEqual("rgb(255, 0, 255)", add("#ff0000", "#0000ff"));

  const half = add("#ff0000", "#0000ff", 0.5, 0.5);
  assert.ok(half.startsWith("rgb("), "opacity parameters produce valid color");

  const fullAndNone = add("#ff0000", "#0000ff", 1, 0);
  assert.ok(fullAndNone.startsWith("rgb("), "zero opacity second color");

  const sameColor = add("#336699", "#336699");
  assert.ok(sameColor.startsWith("rgb("), "adding same color to itself");
});
