import {it} from "vitest";
import assert from "assert";

import {Area, Line} from "../../index.ts";
import {
  downsampleAreas,
  downsampleIndices,
  drawnValues,
  lttbIndices,
} from "../../src/shapes/downsample.ts";
import {plotDownsample} from "../../src/charts/Plot/downsample.ts";

const wave = n =>
  Array.from({length: n}, (_, i) => [
    i,
    Math.sin(i / 7) * 10 + (i === 500 ? 80 : 0),
  ]);

it("lttbIndices keeps the ends, the target count, and a lone spike", () => {
  const points = wave(1000);
  const keep = lttbIndices(points, 100);
  assert.strictEqual(keep.length, 100);
  assert.strictEqual(keep[0], 0);
  assert.strictEqual(keep[99], 999);
  assert.ok(keep.includes(500), "the spike survives");
  assert.deepStrictEqual(
    keep,
    [...keep].sort((a, b) => a - b),
    "in order",
  );
});

it("lttbIndices keeps every point when the target reaches the count", () => {
  assert.deepStrictEqual(lttbIndices(wave(5), 5), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(lttbIndices(wave(5), 2), [0, 1, 2, 3, 4]);
  assert.deepStrictEqual(lttbIndices([], 10), []);
});

const rows = n =>
  Array.from({length: n}, (_, i) => ({x: i, y: Math.sin(i / 7) * 10, i}));
const line = {along: d => d.x, edges: [d => d.y]};

it("downsampleIndices thins a dense line to its target", () => {
  const keep = downsampleIndices(rows(1000), 50, line);
  assert.strictEqual(keep.length, 50);
  assert.strictEqual(downsampleIndices(rows(40), 50, line), null);
});

it("downsampleIndices keeps only what shows in the extent, and one point beyond each end", () => {
  const keep = downsampleIndices(rows(1000), 500, line, [200.5, 299.5]);
  assert.strictEqual(keep[0], 200);
  assert.strictEqual(keep[keep.length - 1], 300);
  assert.strictEqual(keep.length, 101, "few enough to keep all that show");
});

it("downsampleIndices leaves a line with no more than its target whole, extent or not", () => {
  assert.strictEqual(
    downsampleIndices(rows(400), 500, line, [200.5, 299.5]),
    null,
  );
});

it("downsampleIndices thins each run apart and keeps the gaps between them", () => {
  const data = rows(1000);
  const defined = d => d.i !== 400;
  const keep = downsampleIndices(data, 100, {...line, defined});
  assert.ok(keep.includes(400), "the undefined point still breaks the line");
  assert.ok(
    keep.includes(399) && keep.includes(401),
    "each run keeps its ends",
  );
  assert.ok(keep.length <= 103, `${keep.length} points`);
});

it("downsampleIndices keeps the peaks of both of an area's edges", () => {
  const data = rows(1000).map(d => ({...d, base: d.i === 700 ? -90 : -20}));
  const keep = downsampleIndices(data, 60, {
    along: d => d.x,
    edges: [d => d.y, d => d.base],
  });
  assert.ok(keep.includes(700), "the base's dip survives");
});

it("drawnValues reads what downsampling kept, else every point", () => {
  const values = [{a: 1}, {a: 2}];
  assert.strictEqual(drawnValues({values}), values);
  assert.deepStrictEqual(drawnValues({values, drawn: [values[1]]}), [
    values[1],
  ]);
});

it("downsampleAreas draws every area at the same positions", () => {
  const series = k =>
    rows(1000).map(d => ({...d, y: Math.sin(d.i / (5 + k)) * 10, k}));
  const areas = [0, 1].map(k => ({key: k, values: series(k)}));
  downsampleAreas(areas, {
    downsample: 80,
    x: d => d.x,
    x0: d => d.x,
    x1: null,
    y: d => d.y,
    y0: () => 0,
    y1: d => d.y,
  });
  const [a, b] = areas.map(d => drawnValues(d).map(v => v.x));
  assert.ok(a.length < 1000 && a.length >= 80);
  assert.deepStrictEqual(a, b);
});

it("Line draws its downsampled points, and keeps every point for hover", () => {
  const data = rows(2000).map(d => ({...d, id: "a"}));
  const scene = new Line()
    .data(data)
    .x(d => d.x)
    .y(d => d.y)
    .downsample(100)
    .pointKey(d => d.x)
    .toScene();
  const node = scene.children.find(c => c.key === "a");
  assert.strictEqual(node.series.keys.length, 100);
  assert.strictEqual(node.interactionPoints.length, 2000);
  const full = new Line()
    .data(data)
    .x(d => d.x)
    .y(d => d.y)
    .pointKey(d => d.x)
    .toScene()
    .children.find(c => c.key === "a");
  assert.strictEqual(full.series.keys.length, 2000, "off by default");
});

it("Area draws its downsampled points", () => {
  const data = rows(2000).map(d => ({...d, id: "a"}));
  const node = new Area()
    .data(data)
    .x(d => d.x)
    .y0(() => 0)
    .y1(d => d.y)
    .downsample(100)
    .pointKey(d => d.x)
    .toScene()
    .children.find(c => c.key === "a");
  assert.ok(
    node.series.keys.length <= 101,
    `${node.series.keys.length} points`,
  );
});

it("plotDownsample targets two points per pixel of the discrete axis, or the number set", () => {
  const viz = d => ({schema: {downsample: d, discrete: "x"}});
  assert.deepStrictEqual(plotDownsample(viz(true), [10, 510], [0, 300]), {
    downsample: 1000,
    downsampleExtent: [10, 510],
  });
  assert.deepStrictEqual(plotDownsample(viz(250), [10, 510], [0, 300]), {
    downsample: 250,
    downsampleExtent: [10, 510],
  });
  assert.deepStrictEqual(plotDownsample(viz(false), [10, 510], [0, 300]), {});
  const vertical = {schema: {downsample: true, discrete: "y"}};
  assert.strictEqual(
    plotDownsample(vertical, [10, 510], [0, 300]).downsample,
    600,
  );
});
