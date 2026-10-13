import assert from "assert";

import it from "./jsdom.js";
import {CanvasRenderer} from "../es/index.js";

// Picking coverage that the jsdom canvas shim supports faithfully: rect,
// circle, line and image hit-testing are pure geometry (no Path2D), and the
// pick index is built in z-order. (Path/area picking relies on the browser's
// real isPointInPath and is exercised in core's Playwright render-parity suite.)

function scene(children) {
  return {width: 200, height: 120, root: {type: "group", key: "root", children}};
}

function mounted() {
  const renderer = new CanvasRenderer();
  renderer.mount({container: document.body, width: 200, height: 120});
  return renderer;
}

it("CanvasRenderer pick is decided by z-order, not document order", () => {
  const renderer = mounted();
  // "high" is FIRST in document order but has the HIGHEST z, so it must still
  // win — proving z, not append order, drives hit priority.
  renderer.drawScene(scene([
    {type: "rect", key: "high", x: 0, y: 0, width: 60, height: 60, z: 100, paint: {fill: "#111"}},
    {type: "rect", key: "mid", x: 0, y: 0, width: 60, height: 60, z: 50, paint: {fill: "#888"}},
    {type: "rect", key: "low", x: 0, y: 0, width: 60, height: 60, z: 1, paint: {fill: "#eee"}},
  ]));
  assert.strictEqual(renderer.pick([30, 30]).node.key, "high", "highest z wins regardless of document order");
  renderer.destroy();
});

it("CanvasRenderer rect pick is inclusive at the edges and misses just outside", () => {
  const renderer = mounted();
  // rect covers [20,60] x [20,60]
  renderer.drawScene(scene([
    {type: "rect", key: "r", x: 20, y: 20, width: 40, height: 40, paint: {fill: "teal"}},
  ]));
  assert.strictEqual(renderer.pick([20, 20]).node.key, "r", "top-left corner is inside (inclusive)");
  assert.strictEqual(renderer.pick([60, 60]).node.key, "r", "bottom-right corner is inside (inclusive)");
  assert.strictEqual(renderer.pick([19, 40]), null, "one pixel left of the edge misses");
  assert.strictEqual(renderer.pick([61, 40]), null, "one pixel right of the edge misses");
  renderer.destroy();
});

it("CanvasRenderer picks a polyline within its stroke tolerance", () => {
  const renderer = mounted();
  // L-shaped polyline; tolerance = strokeWidth/2 + 2 = 4px.
  renderer.drawScene(scene([
    {type: "line", key: "ln", points: [[10, 20], [120, 20], [120, 100]], paint: {stroke: "red", strokeWidth: 4}},
  ]));
  assert.strictEqual(renderer.pick([60, 20]).node.key, "ln", "directly on the horizontal segment");
  assert.strictEqual(renderer.pick([120, 70]).node.key, "ln", "directly on the vertical segment");
  assert.strictEqual(renderer.pick([60, 23]).node.key, "ln", "within tolerance of the segment");
  assert.strictEqual(renderer.pick([60, 40]), null, "well off the line misses");
  renderer.destroy();
});

it("CanvasRenderer pick accumulates nested group transforms", () => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "group", key: "outer", transform: {x: 50, y: 20}, children: [
      {type: "group", key: "inner", transform: {x: 10, y: 10}, children: [
        {type: "rect", key: "leaf", x: 0, y: 0, width: 10, height: 10, paint: {fill: "green"}},
      ]},
    ]},
  ]));
  // leaf origin = (50+10, 20+10) = (60, 30); covers [60,70] x [30,40].
  assert.strictEqual(renderer.pick([65, 35]).node.key, "leaf", "hit through two nested translations");
  assert.strictEqual(renderer.pick([55, 25]), null, "only the outer translation does not reach the leaf");
  renderer.destroy();
});

it("CanvasRenderer pick ignores what a group's clip cuts away", () => {
  const renderer = mounted();
  // A line running from inside the clip rect [20,100] x [20,80] to well below it.
  renderer.drawScene(scene([
    {type: "group", key: "clipped", transform: {x: 10, y: 0}, clip: {type: "rect", x: 10, y: 20, width: 80, height: 60}, children: [
      {type: "line", key: "ln", points: [[30, 40], [30, 110]], paint: {stroke: "red", strokeWidth: 2}},
    ]},
    {type: "rect", key: "under", x: 0, y: 100, width: 20, height: 20, paint: {fill: "blue"}},
  ]));
  assert.strictEqual(renderer.pick([40, 60]).node.key, "ln", "the visible part still picks");
  assert.strictEqual(renderer.pick([40, 80]).node.key, "ln", "the clip's edge is inclusive");
  assert.strictEqual(renderer.pick([40, 100]), null, "the clipped-away part does not");
  assert.strictEqual(renderer.pick([10, 105]).node.key, "under", "nodes outside the group are unaffected");
  renderer.destroy();
});

it("CanvasRenderer pick applies every enclosing clip", () => {
  const renderer = mounted();
  renderer.drawScene(scene([
    {type: "group", key: "outer", clip: {type: "rect", x: 0, y: 0, width: 50, height: 120}, children: [
      {type: "group", key: "inner", clip: {type: "rect", x: 20, y: 0, width: 100, height: 120}, children: [
        {type: "rect", key: "leaf", x: 0, y: 0, width: 100, height: 50, paint: {fill: "green"}},
      ]},
    ]},
  ]));
  assert.strictEqual(renderer.pick([30, 20]).node.key, "leaf", "inside both clips");
  assert.strictEqual(renderer.pick([10, 20]), null, "cut by the inner clip");
  assert.strictEqual(renderer.pick([70, 20]), null, "cut by the outer clip");
  renderer.destroy();
});
