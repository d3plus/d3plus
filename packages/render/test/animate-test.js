import assert from "assert";

import {collapse, cubicInOut, interpolateNode, interpolateScene} from "../es/index.js";

it("cubicInOut matches d3 endpoints and midpoint", () => {
  assert.strictEqual(cubicInOut(0), 0, "start");
  assert.strictEqual(cubicInOut(1), 1, "end");
  assert.strictEqual(cubicInOut(0.5), 0.5, "midpoint is symmetric");
});

it("collapse zeroes geometry and opacity", () => {
  const rect = collapse({type: "rect", key: "a", x: 10, y: 20, width: 40, height: 60});
  assert.strictEqual(rect.width, 0, "rect width collapses");
  assert.strictEqual(rect.height, 0, "rect height collapses");
  assert.strictEqual(rect.x, 30, "rect collapses toward center x");
  assert.strictEqual(rect.y, 50, "rect collapses toward center y");
  assert.strictEqual(rect.paint.opacity, 0, "opacity fades to 0");

  const circle = collapse({type: "circle", key: "b", cx: 5, cy: 5, r: 8});
  assert.strictEqual(circle.r, 0, "circle radius collapses");
});

it("collapse grows bars from their baseline, not their center", () => {
  // Vertical bar: rect spans [-H, 0] with its baseline edge at y=0.
  const up = collapse({type: "rect", shapeType: "Bar", key: "a", x: -20, y: -60, width: 40, height: 60});
  assert.strictEqual(up.y, 0, "vertical bar pins its baseline edge at y=0");
  assert.strictEqual(up.height, 0, "vertical bar collapses its height");
  assert.strictEqual(up.x, -20, "vertical bar keeps its full breadth (x)");
  assert.strictEqual(up.width, 40, "vertical bar keeps its full breadth (width)");

  // Horizontal bar: rect spans [0, W] with its baseline edge at x=0.
  const right = collapse({type: "rect", shapeType: "Bar", key: "b", x: 0, y: -20, width: 80, height: 40});
  assert.strictEqual(right.x, 0, "horizontal bar pins its baseline edge at x=0");
  assert.strictEqual(right.width, 0, "horizontal bar collapses its width");
  assert.strictEqual(right.y, -20, "horizontal bar keeps its full breadth (y)");
  assert.strictEqual(right.height, 40, "horizontal bar keeps its full breadth (height)");
});

it("collapse grows a Sankey link's stroke-width from 0, keeping opacity", () => {
  const link = collapse({
    type: "path",
    shapeType: "Link",
    key: "l",
    d: "M0,0L10,10",
    paint: {stroke: "#000", strokeOpacity: 0.5, strokeWidth: 12},
  });
  assert.strictEqual(link.paint.strokeWidth, 0, "link stroke-width collapses to 0");
  assert.strictEqual(link.paint.strokeOpacity, 0.5, "link keeps its stroke-opacity");
  assert.strictEqual(link.paint.opacity, undefined, "link does not force an opacity fade");

  // A plain (non-link) path still fades via opacity only.
  const plain = collapse({type: "path", key: "p", d: "M0,0L10,10", paint: {strokeWidth: 4}});
  assert.strictEqual(plain.paint.opacity, 0, "plain path fades opacity to 0");
  assert.strictEqual(plain.paint.strokeWidth, 4, "plain path keeps its stroke-width");
});

it("interpolateNode interpolates numeric geometry and color", () => {
  const interp = interpolateNode(
    {type: "rect", key: "a", x: 0, y: 0, width: 0, height: 0, paint: {fill: "#000000"}},
    {type: "rect", key: "a", x: 0, y: 0, width: 100, height: 50, paint: {fill: "#ffffff"}},
  );
  const mid = interp(0.5);
  assert.strictEqual(mid.width, 50, "width halfway");
  assert.strictEqual(mid.height, 25, "height halfway");
  assert.strictEqual(mid.paint.fill, "rgb(128, 128, 128)", "fill color halfway");
});

it("interpolateScene fades entering nodes and drops exiting nodes at t=1", () => {
  const prev = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "circle", key: "old", cx: 10, cy: 10, r: 4, paint: {opacity: 1}}],
    },
  };
  const next = {
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [{type: "rect", key: "new", x: 0, y: 0, width: 20, height: 20}],
    },
  };

  const interp = interpolateScene(prev, next);

  const mid = interp(0.5);
  const keys = mid.root.children.map(c => c.key).sort();
  assert.deepStrictEqual(keys, ["new", "old"], "both entering and exiting nodes present mid-animation");
  const entering = mid.root.children.find(c => c.key === "new");
  assert.strictEqual(entering.paint.opacity, 0.5, "entering node is half faded-in");
  const exiting = mid.root.children.find(c => c.key === "old");
  assert.strictEqual(exiting.paint.opacity, 0.5, "exiting node is half faded-out");

  const end = interp(1);
  assert.deepStrictEqual(end.root.children.map(c => c.key), ["new"], "exiting node dropped at t=1");
});
