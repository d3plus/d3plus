import assert from "node:assert";
import {it} from "vitest";

import {near} from "~test/helpers.js";
import {useJsdom} from "~test/jsdom.js";
import {ArcDiagram} from "../../index.ts";
import {
  alongReach,
  applyArcDiagramLayout,
  arcDiagramEmit,
  arcLabelPath,
  arcLoopReach,
  arcLoopRoom,
  boxSlotPositions,
  clearOfBoxes,
  crossReach,
  placeNodeBoxes,
  runStages,
  selfLoopExtent,
  slotPositions,
} from "../../internal.ts";
import {rectNodeSize} from "../../src/charts/features/rectNodeSize.ts";

useJsdom();

/**
    ArcDiagram's Rect nodes draw as `shapeConfig`'s Rect `width` and
    `height` (a square 2r across by default), space out along the line to
    fit their boxes, and their arcs, loops, and labels meet the box.
*/

it("rectNodeSize reads the Rect config for the node's row, else a 2r square", () => {
  const node = {shape: "Rect", r: 5, data: {w: 40}, i: 3};
  assert.deepStrictEqual(rectNodeSize({}, node, 5), [10, 10]);
  assert.deepStrictEqual(
    rectNodeSize({width: (d, i) => d.w + i, height: 12}, node, 5),
    [43, 12],
  );
  assert.deepStrictEqual(
    rectNodeSize({width: -1, height: "tall"}, node, 5),
    [10, 10],
    "a size that isn't one falls back to the square",
  );
});

it("alongReach and crossReach halve a Rect's box along and across the line", () => {
  const rect = {shape: "Rect", r: 5, width: 40, height: 12};
  assert.strictEqual(alongReach(rect, "horizontal"), 20);
  assert.strictEqual(crossReach(rect, "horizontal"), 6);
  assert.strictEqual(alongReach(rect, "vertical"), 6);
  assert.strictEqual(crossReach(rect, "vertical"), 20);
  const circle = {shape: "Circle", r: 5, width: 40, height: 12};
  assert.strictEqual(alongReach(circle, "horizontal"), 5, "a circle's radius");
  assert.strictEqual(crossReach(circle, "vertical"), 5);
  assert.strictEqual(
    crossReach({shape: "Rect", r: 5}, "horizontal"),
    5,
    "a Rect without a box is a 2r square",
  );
});

it("boxSlotPositions leaves the same gap between every pair of boxes", () => {
  const at = boxSlotPositions([20, 60, 20], 0, 200);
  // 100px of boxes leaves 100px: a third between each, half that at the ends.
  const gap = 100 / 3;
  near(at[0], gap / 2 + 10, 1e-9);
  near(at[1], gap / 2 + 20 + gap + 30, 1e-9);
  near(at[2], 200 - gap / 2 - 10, 1e-9);
  near(at[1] - 30 - (at[0] + 10), gap, 1e-9);
  near(at[2] - 10 - (at[1] + 30), gap, 1e-9);
});

it("boxSlotPositions matches slotPositions for equal boxes", () => {
  const at = boxSlotPositions([12, 12, 12, 12], 10, 400);
  slotPositions(4, 10, 400).forEach((p, i) => near(at[i], p, 1e-9));
  assert.deepStrictEqual(boxSlotPositions([], 0, 100), []);
});

it("boxSlotPositions shrinks boxes too long for the line in proportion", () => {
  const at = boxSlotPositions([100, 300], 0, 200);
  near(at[0], 25, 1e-9);
  near(at[1], 125, 1e-9);
  const odd = boxSlotPositions([NaN, -5, 10], 0, 30);
  assert.ok(odd.every(Number.isFinite), "unusable extents count as none");
});

it("clearOfBoxes trims a polyline to where it leaves each end's box", () => {
  const line = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(x => [x, 0]);
  const box = (x, width) => ({x, y: 0, width, height: 2});
  assert.deepStrictEqual(
    clearOfBoxes(line, box(0, 5), box(10, 3)).map(p => p[0]),
    [3, 4, 5, 6, 7, 8],
  );
  assert.deepStrictEqual(clearOfBoxes(line).length, 11, "no boxes, no trim");
  assert.deepStrictEqual(clearOfBoxes(line, box(5, 30)), [], "covered");
});

it("arcLoopRoom reaches out from a Rect node's box, not its radius", () => {
  const radii = new Map([["a", 5]]);
  const loops = [{id: "a", size: 1}];
  const reach = selfLoopExtent(arcLoopReach(5, 100), 1);
  assert.deepStrictEqual(arcLoopRoom(loops, radii, 100, "above"), {
    above: 5 + reach,
    below: 0,
  });
  assert.deepStrictEqual(
    arcLoopRoom(loops, radii, 100, "above", new Map([["a", 18]])),
    {above: 18 + reach, below: 0},
  );
});

it("placeNodeBoxes sizes, places, and measures each node out from the line", () => {
  const viz = new ArcDiagram().config({
    shapeConfig: {Rect: {width: d => d.w, height: 10}},
  });
  const nodes = [
    {shape: "Rect", r: 1, data: {w: 40}, i: 0},
    {shape: "Circle", r: 2, data: {}, i: 1},
    {shape: "Rect", r: 3, data: {w: 20}, i: 2},
  ];
  const line = {start: 0, length: 200, orient: "horizontal"};
  const out = placeNodeBoxes(viz, nodes, v => v * 5, line);
  assert.deepStrictEqual(out.radii, [5, 10, 15]);
  assert.deepStrictEqual(
    out.boxes.map(b => [b.width, b.height]),
    [
      [40, 10],
      [20, 20],
      [20, 10],
    ],
  );
  assert.deepStrictEqual(out.reaches, [5, 10, 5]);
  assert.deepStrictEqual(out.positions, boxSlotPositions([40, 20, 20], 0, 200));
  const vertical = placeNodeBoxes(viz, nodes, v => v * 5, {
    ...line,
    orient: "vertical",
  });
  assert.deepStrictEqual(vertical.reaches, [20, 10, 10]);
  const circles = placeNodeBoxes(viz, [nodes[1], nodes[1]], () => 4, line);
  assert.deepStrictEqual(circles.positions, slotPositions(2, 0, 200));
  assert.deepStrictEqual(
    placeNodeBoxes(viz, [nodes[1]], () => 0, line).radii,
    [1],
    "a node is at least 1px",
  );
});

/** An ArcDiagram laid out in a 600×300 chart. */
function layout(config = {}) {
  const chart = new ArcDiagram().config({
    nodes: [
      {id: "alpha", w: 80},
      {id: "beta", w: 20},
      {id: "gamma", w: 50},
      {id: "delta", w: 20},
    ],
    links: [
      {source: "alpha", target: "beta"},
      {source: "beta", target: "gamma"},
      {source: "alpha", target: "delta"},
      {source: "gamma", target: "gamma"},
    ],
    shape: "Rect",
    width: 600,
    height: 300,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  runStages({viz: chart}, [applyArcDiagramLayout]);
  return {chart, c: chart.ctx.arcCtx};
}

const byId = c => Object.fromEntries(c.nodes.map(n => [n.id, n]));

it("ArcDiagram: Rect nodes take shapeConfig's Rect width and height", () => {
  const {c} = layout({shapeConfig: {Rect: {width: d => d.w, height: 30}}});
  const nodes = byId(c);
  assert.deepStrictEqual(
    ["alpha", "beta", "gamma", "delta"].map(id => [
      nodes[id].width,
      nodes[id].height,
    ]),
    [
      [80, 30],
      [20, 30],
      [50, 30],
      [20, 30],
    ],
  );
  const square = byId(layout().c);
  for (const n of Object.values(square)) {
    assert.strictEqual(n.width, n.r * 2, `${n.id} is a 2r square by default`);
    assert.strictEqual(n.height, n.r * 2);
  }
});

it("ArcDiagram: Rect nodes leave equal gaps between their boxes", () => {
  for (const orient of ["horizontal", "vertical"]) {
    const {c} = layout({
      orient,
      shapeConfig: {
        Rect:
          orient === "horizontal"
            ? {width: d => d.w, height: 20}
            : {width: 20, height: d => d.w / 2},
      },
    });
    const key = orient === "horizontal" ? "x" : "y";
    const size = orient === "horizontal" ? "width" : "height";
    const nodes = [...c.nodes].sort((a, b) => a[key] - b[key]);
    const gaps = nodes
      .slice(1)
      .map(
        (n, i) => n[key] - n[size] / 2 - (nodes[i][key] + nodes[i][size] / 2),
      );
    gaps.forEach(g => {
      assert.ok(g > 0, `${orient} ${gaps}`);
      near(g, gaps[0], 1e-6, `${orient} ${gaps}`);
    });
  }
});

it("ArcDiagram: labels, arcs, and loops clear a tall Rect node's box", () => {
  const {chart, c} = layout({
    shapeConfig: {Rect: {width: 24, height: d => (d.id === "gamma" ? 60 : 16)}},
  });
  const gamma = byId(c).gamma;
  // Labels hang below the line, past the tallest box.
  assert.strictEqual(c.labels.length, 4);
  for (const label of c.labels)
    assert.ok(label.y > gamma.y + 30, `${label.text} at ${label.y}`);
  const scene = arcDiagramEmit({viz: chart});
  const rect = scene.find(n => n.key === "arc-node-gamma");
  assert.deepStrictEqual(
    [rect.x, rect.y, rect.width, rect.height],
    [gamma.x - 12, gamma.y - 30, 24, 60],
  );
  // An arc's label path starts and ends clear of the box, above it.
  const arc = c.links.find(l => !l.loop && l.target.id === "gamma");
  const path = arcLabelPath(arc);
  assert.ok(path.length > 1);
  assert.ok(path[path.length - 1][1] <= gamma.y - 30 + 0.5);
  // The loop on gamma leaves from the top of its box (its line half a
  // stroke out from the outline).
  const loop = c.links.find(l => l.loop);
  for (const end of [loop.loop.source, loop.loop.target]) {
    const top = gamma.y - 30;
    assert.ok(end.y <= top + 0.01 && end.y >= top - loop.size, `${end.y}`);
  }
});
