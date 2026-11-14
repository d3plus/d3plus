import assert from "node:assert";
import {it} from "vitest";

import {useJsdom} from "~test/jsdom.js";
import {Network} from "../../index.ts";
import {
  applyNetworkLayout,
  rectNodeSize,
  runStages,
  sizeRectNodes,
} from "../../internal.ts";

useJsdom();

/**
    A Rect node of a node-link chart draws as `shapeConfig`'s Rect `width`
    and `height` for its row, else a square 2r across.
*/

it("rectNodeSize reads the Rect config for the node's row", () => {
  const node = {shape: "Rect", r: 5, data: {w: 40}, i: 3};
  assert.deepStrictEqual(rectNodeSize({}, node, 5), [10, 10], "a 2r square");
  assert.deepStrictEqual(
    rectNodeSize({width: 30, height: 12}, node, 5),
    [30, 12],
  );
  assert.deepStrictEqual(
    rectNodeSize({width: (d, i) => d.w + i, height: () => undefined}, node, 5),
    [43, 10],
    "an accessor of the row and index; an unset height stays square",
  );
  assert.deepStrictEqual(
    rectNodeSize({width: "wide", height: -4}, node, 5),
    [10, 10],
    "a value that isn't a size falls back",
  );
  assert.deepStrictEqual(
    rectNodeSize({width: (d, i) => i}, {shape: "Rect", r: 2}, 2, 7),
    [7, 4],
    "a node with no index of its own takes the given one",
  );
});

it("sizeRectNodes sizes Rect nodes only, from the chart's shapeConfig", () => {
  const chart = new Network().shapeConfig({
    Rect: {width: d => d.w, height: 8},
  });
  const nodes = [
    {shape: "Rect", r: 5, data: {w: 50}, i: 0, width: 10, height: 10},
    {shape: "Circle", r: 5, data: {w: 50}, i: 1, width: 10, height: 10},
    {shape: "Rect", r: 3, data: {}, i: 2},
  ];
  sizeRectNodes(chart, nodes);
  assert.deepStrictEqual(
    nodes.map(n => [n.width, n.height]),
    [
      [50, 8],
      [10, 10],
      [6, 8],
    ],
  );
});

/** A Network of Rect nodes laid out in a 400×300 chart, by id. */
function layout(config = {}) {
  const chart = new Network().config({
    nodes: [
      {id: "alpha", x: 0, y: 0, w: 80},
      {id: "beta", x: 1, y: 0, w: 40},
      {id: "gamma", x: 0.5, y: 1, w: 60},
    ],
    links: [
      {source: "alpha", target: "beta"},
      {source: "beta", target: "gamma"},
    ],
    shape: "Rect",
    width: 400,
    height: 300,
    ...config,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const laid = runStages({viz: chart}, [applyNetworkLayout]).shapeData;
  return Object.fromEntries(laid.map(n => [n.id, n]));
}

it("Network: Rect nodes take shapeConfig's Rect width and height", () => {
  const byId = layout({
    shapeConfig: {Rect: {width: d => d.w, height: 24}},
  });
  assert.deepStrictEqual(
    ["alpha", "beta", "gamma"].map(id => [byId[id].width, byId[id].height]),
    [
      [80, 24],
      [40, 24],
      [60, 24],
    ],
  );
  for (const n of Object.values(byId)) {
    assert.ok(n.x - n.width / 2 >= 0 && n.x + n.width / 2 <= 400, n.id);
    assert.ok(n.y - n.height / 2 >= 0 && n.y + n.height / 2 <= 300, n.id);
  }
  const square = layout();
  for (const n of Object.values(square)) {
    assert.strictEqual(n.width, n.r * 2, `${n.id} is a 2r square by default`);
    assert.strictEqual(n.height, n.r * 2);
  }
});

it("Network: a circle layout's Rect nodes take their config's size too", () => {
  const byId = layout({
    layout: "circle",
    shapeConfig: {Rect: {width: 30, height: 12}},
  });
  for (const n of Object.values(byId)) {
    assert.strictEqual(n.width, 30);
    assert.strictEqual(n.height, 12);
  }
});

it("Network: the fit keeps Rect nodes' loops inside the chart", () => {
  const chart = new Network().config({
    nodes: ["alpha", "beta", "gamma", "delta", "epsilon"].map((id, i) => ({
      id,
      x: i,
      y: i % 2,
    })),
    links: [
      {source: "alpha", target: "beta"},
      {source: "beta", target: "gamma"},
      {source: "gamma", target: "delta"},
      {source: "delta", target: "epsilon"},
      {source: "alpha", target: "alpha"},
      {source: "epsilon", target: "epsilon"},
    ],
    shape: "Rect",
    shapeConfig: {Rect: {width: 80, height: 16}},
    width: 400,
    height: 300,
  });
  chart._preDraw();
  chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
  chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
  runStages({viz: chart}, [applyNetworkLayout]);
  const loops = chart.ctx.networkCtx.links.filter(l => l.loop);
  assert.strictEqual(loops.length, 2);
  for (const {loop, source} of loops) {
    const [[x0, y0], [x1, y1]] = loop.box;
    assert.ok(
      x0 >= 0 && x1 <= 400 && y0 >= 0 && y1 <= 300,
      `${source.id}'s loop [${x0}, ${y0}, ${x1}, ${y1}] fits the chart`,
    );
  }
});
