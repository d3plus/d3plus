import {it} from "vitest";
import assert from "assert";

import {buildLegendData} from "../../src/charts/features/featuresLegend.ts";
import {
  legendEntryCount,
  legendKeys,
  legendRows,
} from "../../src/charts/features/legendKeys.ts";
import {applyTransform, mapBox} from "../../src/charts/features/sceneBounds.ts";

function seeded(seed) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/** A minimal viz whose legend groups rows by `color`, opacity and texture. */
function fakeViz(data, {color, colorScale = false, shapeConfig = {}} = {}) {
  return {
    _drawDepth: 0,
    _legendData: data,
    _ids: d => [`${d.id}`],
    _drawLabel: d => `${d.id}`,
    schema: {
      aggs: {},
      colorScale,
      color,
      groupBy: [d => d.id],
      shape: d => (d.line ? "Line" : "Circle"),
      shapeConfig: {opacity: 1, texture: false, fill: "#ccc", ...shapeConfig},
      legendSort: () => 0,
    },
  };
}

function rows(random, count, kinds) {
  return Array.from({length: count}, (_, i) => ({
    id: `r${i}`,
    kind: `k${Math.floor(random() * kinds)}`,
    value: random() < 0.3 ? undefined : random() * 10,
    line: random() < 0.2,
  }));
}

it("legendEntryCount — the number of entries buildLegendData rolls up", () => {
  const random = seeded(3);
  const variants = [
    {color: d => d.kind},
    {color: d => ({kind: d.kind})},
    {color: undefined, shapeConfig: {fill: d => d.kind}},
    {color: d => d.kind, colorScale: d => d.value},
    {color: d => d.kind, shapeConfig: {opacity: d => (d.line ? 0.5 : 1)}},
    {color: d => d.kind, shapeConfig: {Line: {stroke: d => `${d.kind}-s`}}},
  ];
  for (const variant of variants)
    for (const [count, kinds] of [
      [0, 1],
      [1, 1],
      [40, 3],
      [300, 50],
      [500, 500],
    ]) {
      const data = rows(random, count, kinds);
      const full = buildLegendData(fakeViz(data, variant)).legendData.length;
      assert.strictEqual(legendEntryCount(fakeViz(data, variant)), full);
      // Capped: exact up to the limit, and past it once there are more.
      for (const limit of [0, 2, 10, full])
        assert.strictEqual(
          legendEntryCount(fakeViz(data, variant), limit),
          Math.min(full, limit + 1),
        );
    }
});

it("legendKeys and legendRows — the legend's grouping", () => {
  const data = [
    {id: "a", kind: "x", value: 1},
    {id: "b", kind: "y"},
    {id: "c", kind: "x", line: true},
  ];
  const viz = fakeViz(data, {
    color: d => d.kind,
    colorScale: d => d.value,
    shapeConfig: {Line: {stroke: "red"}},
  });
  assert.deepStrictEqual(
    legendRows(viz).map(d => d.id),
    ["b", "c"],
    "rows the colorScale colors are left out",
  );
  const {getAttr, colorOf, keyOf} = legendKeys(viz);
  assert.strictEqual(getAttr(data[2], 0, "fill"), "red", "a Line's stroke");
  assert.strictEqual(getAttr(data[0], 0, "fill"), "#ccc");
  assert.strictEqual(colorOf(data[0], 0), "x");
  assert.strictEqual(keyOf(data[0], 0, "x"), "x_1_false");
  assert.strictEqual(keyOf(data[0], 0, undefined), "#ccc_1_false");
  assert.strictEqual(keyOf(data[0], 0, {k: 1}), '{"k":1}_1_false');
});

it("mapBox — a point maps to the box its corners would", () => {
  const random = seeded(17);
  const transforms = [
    undefined,
    {x: 5, y: -3},
    {x: 2, y: 7, scale: 1.7},
    {rotate: 33, rotateAnchor: [10, 4], x: 1},
    {rotate: -90, scale: 0.5},
  ];
  const corners = (b, map) => {
    const c = [
      map([b.x, b.y]),
      map([b.x + b.width, b.y]),
      map([b.x, b.y + b.height]),
      map([b.x + b.width, b.y + b.height]),
    ];
    const xs = c.map(p => p[0]),
      ys = c.map(p => p[1]);
    const x = Math.min(...xs),
      y = Math.min(...ys);
    return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
  };
  for (const t of transforms)
    for (let k = 0; k < 50; k++) {
      const box = {
        x: random() * 400 - 200,
        y: random() * 300,
        width: 0,
        height: 0,
      };
      const map = p => applyTransform(p, t);
      assert.deepStrictEqual(mapBox(box, map), corners(box, map));
    }
});
