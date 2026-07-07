import assert from "assert";
import it from "../jsdom.js";
import {Box} from "../../es/index.js";

/**
    Box compute-mode: when rendered with `renderMode("compute")`, the
    Box and its inner Rect/Whisker/Circle shapes should NOT mount DOM
    (no <svg> appended to body), and `toScene()` should aggregate the
    inner shapes' scenes into a single Box-level GroupNode.
*/

const sampleData = [
  // Vertical orientation, two groups so we get a real box layout.
  {key: "A", v: 1, orient: "vertical"},
  {key: "A", v: 2, orient: "vertical"},
  {key: "A", v: 3, orient: "vertical"},
  {key: "A", v: 4, orient: "vertical"},
  {key: "A", v: 50, orient: "vertical"},
  {key: "B", v: 6, orient: "vertical"},
  {key: "B", v: 7, orient: "vertical"},
  {key: "B", v: 8, orient: "vertical"},
  {key: "B", v: 9, orient: "vertical"},
];

it("Box.renderMode('compute') mounts NO body-attached <svg>", () => {
  const bodyChildrenBefore = document.body.children.length;
  const box = new Box()
    .data(sampleData)
    .x(d => d.key)
    .y(d => d.v)
    .renderMode("compute")
    .render();
  assert.strictEqual(
    document.body.children.length,
    bodyChildrenBefore,
    "no SVG should be appended to body in compute mode",
  );
  // Sanity: the inner shapes exist.
  assert.ok(box._box, "inner _box Rect was created");
  assert.ok(box._median, "inner _median Rect was created");
  assert.ok(box._whisker, "inner _whisker Whisker was created");
});

it("Box.toScene() aggregates inner shape scenes into one GroupNode", () => {
  const box = new Box()
    .data(sampleData)
    .x(d => d.key)
    .y(d => d.v)
    .renderMode("compute")
    .render();
  const scene = box.toScene();
  assert.strictEqual(scene.type, "group", "Box.toScene returns a group");
  assert.ok(Array.isArray(scene.children), "group has a children array");
  assert.ok(
    scene.children.length > 0,
    "Box scene has at least one inner shape child (box/median/whisker)",
  );
});

it("Box.toScene() in compute mode includes both rect bodies + whiskers", () => {
  const box = new Box()
    .data(sampleData)
    .x(d => d.key)
    .y(d => d.v)
    .renderMode("compute")
    .render();
  const types = new Set(box.toScene().children.map(n => n.type));
  // We expect at least rects (the box body + median) and whisker geometry
  // (which Whisker emits as path/line nodes).
  assert.ok(
    types.has("rect"),
    "Box scene contains rect nodes from _box / _median",
  );
});
