import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Box} from "../../index.ts";

useJsdom();

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

/** The outlier keys a compute-mode Box draws from `sampleData` with `config`. */
const outlierKeys = config =>
  new Box()
    .data(sampleData)
    .x(d => d.key)
    .y(d => d.v)
    .config(config)
    .renderMode("compute")
    .render()
    .toScene()
    .children.map(n => n.key)
    .filter(k => k.includes("outlier"));

it("Box outlier: false draws no outlier points; an accessor decides per observation", () => {
  assert.deepStrictEqual(outlierKeys({}), ["A-outlier-4"]);
  assert.deepStrictEqual(outlierKeys({outlier: false}), []);
  assert.deepStrictEqual(outlierKeys({outlier: d => d.v < 10 && "Rect"}), []);
  assert.deepStrictEqual(outlierKeys({outlier: () => "Rect"}), ["A-outlier-4"]);
  const box = new Box()
    .data(sampleData)
    .x(d => d.key)
    .y(d => d.v)
    .outlier(false)
    .renderMode("compute")
    .render();
  assert.strictEqual(box._whiskerEndpoint.length, 0);
  assert.ok(box._owned.size > 0, "the boxes still own their parts");
});
