import assert from "assert";
import {Line} from "../../es/index.js";

// v3 drew an invisible thick stroke behind each line so the hover target
// extended past the ~1px visible stroke. The v4 scene rewrite dropped it
// (hitAreaNode only emitted rect hit areas). This restores it as a fat,
// transparent path that overlaps the visible line exactly.
it("Line emits a fat transparent hit-area path behind the visible line", () => {
  const data = [
    {id: "a", x: 0, y: 5},
    {id: "a", x: 10, y: 15},
    {id: "a", x: 20, y: 25},
  ];
  const scene = new Line().data(data).x("x").y("y").toScene();

  const hitIdx = scene.children.findIndex(c => String(c.key).endsWith("::hit"));
  const lineIdx = scene.children.findIndex(c => c.key === "a");
  const hit = scene.children[hitIdx];
  const line = scene.children[lineIdx];

  assert.ok(hit, "a ::hit node is emitted");
  assert.ok(hitIdx < lineIdx, "the hit area is painted behind the visible line");
  assert.strictEqual(hit.type, "path");
  assert.strictEqual(hit.paint.fill, "none", "no fill");
  assert.strictEqual(hit.paint.stroke, "transparent", "invisible but painted (so it hit-tests)");
  assert.strictEqual(hit.paint.strokeWidth, 10, "fat stroke widens the hover target");
  assert.strictEqual(hit.d, line.d, "overlaps the visible line's geometry exactly");
  assert.strictEqual(hit.datum.y, 45, "carries the same aggregate datum as the line");
  assert.ok(hit.interactionPoints?.length === 3, "carries interaction points so a hover off the line still resolves nearest");

  // The visible line keeps its real (thin) stroke.
  assert.strictEqual(line.paint.stroke, "black");
  assert.strictEqual(line.paint.strokeWidth, 1);
});
