import assert from "assert";
import {
  fitInset,
  insetBackground,
  insetComponentOffset,
  insetFrame,
  insetOrient,
  insetPlacementFor,
  insetStyle,
  isInsetPending,
  markBoxes,
  sceneInsetRegion,
} from "../../es/internal.js";

/**
    The pure helpers behind drawing a legend inside a chart's negative space
    (#72): mark bounds from the scene graph, the inset box's style and
    frame, and where a box is anchored in the open space it fits.
*/

const fakeViz = (extra = {}) => ({
  schema: {legendInsetConfig: {}, colorDefaults: {dark: "#000", light: "#fff"}},
  _margin: {top: 10, right: 0, bottom: 0, left: 20},
  ...extra,
});

it("markBoxes: measures each mark kind, composing group and node transforms", () => {
  const boxes = markBoxes([
    {type: "rect", key: "r", datum: {}, x: -5, y: -5, width: 10, height: 10, transform: {x: 50, y: 50}},
    {type: "circle", key: "c", datum: {}, cx: 10, cy: 10, r: 5},
    {type: "group", key: "g", transform: {x: 100, y: 0, scale: 2}, children: [
      {type: "rect", key: "gr", datum: {}, x: 0, y: 0, width: 10, height: 5},
    ]},
  ], {x: 1, y: 2});
  assert.deepStrictEqual(boxes, [
    {x: 46, y: 47, width: 10, height: 10},
    {x: 6, y: 7, width: 10, height: 10},
    {x: 101, y: 2, width: 20, height: 10},
  ]);
});

it("markBoxes: covers a rotated mark with the box around its rotated corners", () => {
  const [b] = markBoxes([
    {type: "rect", key: "r", datum: {}, x: -10, y: -1, width: 20, height: 2, transform: {rotate: 90}},
  ]);
  assert.ok(Math.abs(b.width - 2) < 1e-9 && Math.abs(b.height - 20) < 1e-9);
});

it("markBoxes: uses series vertices for lines and areas, and line boxes for text", () => {
  const boxes = markBoxes([
    {type: "line", key: "l", datum: {}, points: [[0, 0], [10, 10]]},
    {type: "area", key: "a", datum: {}, topline: [[0, 5]], baseline: [[0, 20]]},
    {type: "text", key: "t", datum: {}, x: 0, y: 0, font: {size: 10, anchor: "middle"}, lines: [{text: "hi", x: 50, y: 20, width: 20}]},
  ]);
  assert.deepStrictEqual(boxes.slice(0, 4), [
    {x: 0, y: 0, width: 0, height: 0},
    {x: 10, y: 10, width: 0, height: 0},
    {x: 0, y: 5, width: 0, height: 0},
    {x: 0, y: 20, width: 0, height: 0},
  ]);
  assert.deepStrictEqual(boxes[4], {x: 40, y: 12, width: 20, height: 10});
});

it("markBoxes: traces a path's outline rather than its bounding box", () => {
  const boxes = markBoxes([{type: "path", key: "p", datum: {}, d: "M0,0L100,0L0,100Z"}]);
  const pts = boxes.map(b => [b.x, b.y]);
  assert.deepStrictEqual(pts, [[0, 0], [100, 0], [0, 100]], "the triangle's corners, not its square box");
});

it("markBoxes: skips hit duplicates, datum-less decorations, and skipped subtrees", () => {
  const boxes = markBoxes([
    {type: "rect", key: "bg", x: 0, y: 0, width: 999, height: 999},
    {type: "rect", key: "a::hit", datum: {}, x: 0, y: 0, width: 5, height: 5},
    {type: "group", key: "plot-x-axis", children: [{type: "rect", key: "tick", datum: {}, x: 0, y: 0, width: 1, height: 1}]},
    {type: "rect", key: "a", datum: {}, x: 1, y: 1, width: 2, height: 2},
  ], undefined, n => n.key === "plot-x-axis");
  assert.deepStrictEqual(boxes, [{x: 1, y: 1, width: 2, height: 2}]);
});

it("inset state: insetStyle fills in defaults under legendInsetConfig", () => {
  assert.deepStrictEqual(insetStyle(fakeViz()), {padding: 10, margin: 6, fillOpacity: 0.85, strokeWidth: 1, rx: 4});
  const custom = insetStyle(fakeViz({schema: {legendInsetConfig: {fill: "red", margin: 2}}}));
  assert.strictEqual(custom.fill, "red");
  assert.strictEqual(custom.margin, 2);
  assert.strictEqual(custom.padding, 10);
});

it("inset state: insetFrame sizes a column tall and a row wide", () => {
  assert.deepStrictEqual(insetFrame("column", {width: 100, height: 100}), {width: 40, height: 60});
  assert.deepStrictEqual(insetFrame("row", {width: 100, height: 100}), {width: 60, height: 40});
});

it("inset state: pending, placement, and orientation queries read the viz", () => {
  const placement = {key: "legend", orient: "row", x: 100, y: 200, width: 50, height: 30, alignX: "right", alignY: "bottom"};
  const viz = fakeViz({_insetPending: new Set(["legend"]), _insetPlacement: placement});
  assert.ok(isInsetPending(viz, "legend"));
  assert.ok(!isInsetPending(viz, "colorScale"));
  assert.ok(!isInsetPending(fakeViz(), "legend"));
  assert.strictEqual(insetPlacementFor(viz, "legend"), placement);
  assert.strictEqual(insetPlacementFor(viz, "sizeLegend"), null);
  assert.strictEqual(insetOrient(viz, "legend"), "row");
  assert.strictEqual(insetOrient(viz, "colorScale"), "column");
  assert.deepStrictEqual(insetComponentOffset(viz, "legend", {x: 4, y: 8}), {x: 102, y: 198});
  assert.strictEqual(insetComponentOffset(viz, "colorScale", {x: 0, y: 0}), null);
});

it("inset state: insetBackground is a translucent rect over the placement", () => {
  const node = insetBackground(fakeViz(), {key: "legend", orient: "column", x: 1, y: 2, width: 3, height: 4});
  assert.strictEqual(node.type, "rect");
  assert.deepStrictEqual([node.x, node.y, node.width, node.height], [1, 2, 3, 4]);
  assert.strictEqual(node.paint.fill, "rgb(255, 255, 255)", "defaults to a white background without a DOM");
  assert.ok(node.paint.fillOpacity < 1);
});

const bounds = {x: 0, y: 0, width: 100, height: 100};

it("fitInset: takes the first open rect the box fits, hugging the region's edges", () => {
  const rects = [{x: 0, y: 0, width: 10, height: 10}, {x: 60, y: 50, width: 40, height: 50}];
  assert.deepStrictEqual(fitInset(rects, bounds, 20, 20), {x: 80, y: 80, width: 20, height: 20, alignX: "right", alignY: "bottom"});
  assert.deepStrictEqual(fitInset([{x: 0, y: 0, width: 30, height: 30}], bounds, 20, 20).alignX, "left");
});

it("fitInset: prefers the bottom-right, then top-right, bottom-left, and top-left corners", () => {
  const corner = (x, y) => ({x, y, width: 30, height: 30});
  const all = [corner(0, 0), corner(0, 70), corner(70, 0), corner(70, 70)];
  const order = [];
  let rects = all;
  for (let i = 0; i < 4; i++) {
    const spot = fitInset(rects, bounds, 20, 20);
    order.push(`${spot.alignY}-${spot.alignX}`);
    rects = rects.filter(r => !(r.x <= spot.x && spot.x < r.x + r.width && r.y <= spot.y && spot.y < r.y + r.height));
  }
  assert.deepStrictEqual(order, ["bottom-right", "top-right", "bottom-left", "top-left"]);
});

it("fitInset: a corner it fits in beats a larger open rect away from the corners", () => {
  const rects = [{x: 20, y: 20, width: 60, height: 60}, {x: 0, y: 0, width: 25, height: 25}];
  const spot = fitInset(rects, bounds, 20, 20);
  assert.deepStrictEqual([spot.x, spot.y, spot.alignX, spot.alignY], [0, 0, "left", "top"]);
});

it("fitInset: centers along an axis that touches neither edge, and returns null when nothing fits", () => {
  const spot = fitInset([{x: 20, y: 20, width: 40, height: 40}], bounds, 20, 20);
  assert.deepStrictEqual([spot.x, spot.y, spot.alignX, spot.alignY], [30, 30, "center", "middle"]);
  assert.strictEqual(fitInset([{x: 0, y: 0, width: 10, height: 10}], bounds, 20, 20), null);
});

it("sceneInsetRegion: defaults to the chart area, with the scene's marks as obstacles", () => {
  const viz = fakeViz({
    schema: {width: 200, height: 100},
    _chartScene: [{type: "circle", key: "c", datum: {}, cx: 0, cy: 0, r: 5}],
    _chartTransform: {x: 20, y: 10},
  });
  const region = sceneInsetRegion(viz);
  assert.deepStrictEqual(region.bounds, {x: 20, y: 10, width: 180, height: 90});
  assert.deepStrictEqual(region.obstacles, [{x: 15, y: 5, width: 10, height: 10}]);
  assert.deepStrictEqual(sceneInsetRegion(viz, {x: 0, y: 0, width: 5, height: 5}).bounds, {x: 0, y: 0, width: 5, height: 5});
});
