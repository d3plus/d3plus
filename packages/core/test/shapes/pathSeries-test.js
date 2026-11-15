import {it} from "vitest";
import assert from "assert";
import {seriesPath} from "@d3plus/render";

import {Area, Line} from "../../index.ts";
import {pathSeries} from "../../src/shapes/pathSeries.ts";

const values = [
  {t: 1, x: 0, y: 10, y0: 30},
  {t: 2, x: 10, y: 20, y0: 30},
  {t: 3, x: 20, y: 5, y0: 30},
];
const fns = {
  key: d => d.t,
  curve: "linear",
  x: d => d.x,
  y: d => d.y,
  cx: 10,
  cy: 10,
};

it("pathSeries keys a line's points in its local space", () => {
  assert.deepStrictEqual(pathSeries(values, fns), {
    series: {
      keys: [1, 2, 3],
      top: [
        [-10, 0],
        [0, 10],
        [10, -5],
      ],
      curve: "linear",
    },
  });
});

it("pathSeries adds an area's base edge", () => {
  const {series} = pathSeries(values, {
    ...fns,
    x0: d => d.x,
    y0: d => d.y0,
  });
  assert.deepStrictEqual(series.base, [
    [-10, 20],
    [0, 20],
    [10, 20],
  ]);
});

it("pathSeries keys a Date by its time", () => {
  const dated = values.map(d => ({...d, t: new Date(d.t * 1000)}));
  assert.deepStrictEqual(
    pathSeries(dated, fns).series.keys,
    [1000, 2000, 3000],
  );
});

it("pathSeries gives no series it can't key or draw", () => {
  assert.deepStrictEqual(pathSeries(values, {...fns, key: null}), {});
  assert.deepStrictEqual(pathSeries([], fns), {});
  assert.deepStrictEqual(pathSeries(values, {...fns, curve: "wobbly"}), {});
  assert.deepStrictEqual(pathSeries(values, {...fns, key: () => 1}), {});
  assert.deepStrictEqual(pathSeries(values, {...fns, key: () => ({})}), {});
  assert.deepStrictEqual(
    pathSeries(values, {...fns, defined: d => d.t !== 2}),
    {},
  );
  assert.deepStrictEqual(
    pathSeries([...values, {t: 4, x: 30, y: NaN}], fns),
    {},
  );
});

it("Line carries its keyed points with a pointKey, and draws the same path", () => {
  const data = values.map(d => ({...d, id: "a"}));
  const plain = new Line().data(data).toScene();
  assert.strictEqual(
    plain.children.find(c => c.key === "a").series,
    undefined,
    "no series without a pointKey",
  );
  const keyed = new Line()
    .data(data)
    .pointKey(d => d.t)
    .curve("monotoneX")
    .toScene();
  const line = keyed.children.find(c => c.key === "a");
  assert.deepStrictEqual(line.series.keys, [1, 2, 3]);
  assert.strictEqual(line.series.curve, "monotoneX");
  assert.strictEqual(seriesPath(line.series), line.d);
});

it("Area carries both of its edges with a pointKey, and draws the same path", () => {
  const data = values.map(d => ({...d, id: "a"}));
  const scene = new Area()
    .data(data)
    .x(d => d.x)
    .y0(d => d.y0)
    .y1(d => d.y)
    .pointKey(d => d.t)
    .toScene();
  const area = scene.children.find(c => c.key === "a");
  assert.deepStrictEqual(area.series.keys, [1, 2, 3]);
  assert.strictEqual(area.series.base.length, 3);
  assert.strictEqual(seriesPath(area.series), area.d);
});
