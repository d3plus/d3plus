import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BoxWhisker} from "../../index.ts";
import {
  computedBoxExtras,
  observedExtras,
  observedValues,
  precomputedBoxExtras,
} from "../../src/charts/BoxWhisker/extras.ts";
import {notchInterval} from "../../src/shapes/boxExtras.ts";

useJsdom();

/**
    BoxWhisker's box extras: the Box settings it hands each draw, with means
    and notches computed in data units and placed through the value axis.
*/

// A value axis that doubles: data units → pixels.
const scale = v => v * 2;

it("observedValues: a box's values on the value axis, ascending, preferring x2/y2", () => {
  const rows = [{y: 3}, {y: 1}, {y: "a"}, {y: 9, y2: 2}, {y: new Date(5)}];
  assert.deepStrictEqual(observedValues(rows, "y"), [1, 2, 3, 5]);
  assert.deepStrictEqual(observedValues([{x: 4}], "x"), [4]);
});

it("observedExtras: the mean, the notch, and the count", () => {
  const values = [10, 20, 30, 40, 50];
  assert.deepStrictEqual(observedExtras(values), {
    mean: 30,
    notch: notchInterval(30, 20, 40, 5),
    count: 5,
  });
  assert.deepStrictEqual(observedExtras([]), {
    mean: undefined,
    notch: null,
    count: 0,
  });
});

it("computedBoxExtras: per-category means and notches, in pixels", () => {
  const viz = new BoxWhisker().boxNotch(true).boxWidthByCount(true).jitter(0.3);
  const rows = [
    {discrete: "A", y: 1},
    {discrete: "A", y: 3},
    {discrete: "B", y: 10},
  ];
  const extras = computedBoxExtras(viz, rows, scale);
  assert.strictEqual(extras.boxMean({discrete: "A"}), 4);
  assert.strictEqual(extras.boxMean({discrete: "B"}), 20);
  assert.deepStrictEqual(
    extras.boxNotch({discrete: "A"}),
    notchInterval(2, 1.5, 2.5, 2).map(scale),
  );
  assert.deepStrictEqual(
    [extras.boxPoints, extras.boxWidthByCount, extras.jitter, extras.boxCount],
    [true, true, 0.3, undefined],
  );
  viz.boxMean(false).boxNotch(false).boxPoints(false);
  const off = computedBoxExtras(viz, rows, scale);
  assert.deepStrictEqual(
    [off.boxMean, off.boxNotch, off.boxPoints],
    [false, false, false],
  );
});

it("precomputedBoxExtras: a given mean, and a notch from the row's stats and count", () => {
  const viz = new BoxWhisker()
    .boxMin("min")
    .boxQ1("q1")
    .boxMedian("med")
    .boxQ3("q3")
    .boxMax("max")
    .boxMean("avg")
    .boxCount("n")
    .boxNotch(true);
  const source = {min: 0, q1: 10, med: 20, q3: 30, max: 40, avg: 22, n: 16};
  const row = {__d3plus__: true, data: source, i: 0};
  const extras = precomputedBoxExtras(viz, scale);
  assert.strictEqual(extras.boxPoints, false);
  assert.strictEqual(extras.boxMean(row), 44);
  assert.strictEqual(extras.boxCount(row), 16);
  assert.deepStrictEqual(extras.boxNotch(row), [24.2, 55.8]);
  // Without a count there is no notch; `boxMean: true` has nothing to read.
  viz.boxCount(false).boxMean(true);
  const bare = precomputedBoxExtras(viz, scale);
  assert.strictEqual(bare.boxNotch(row), undefined);
  assert.strictEqual(bare.boxMean, false);
  // An accessor gives each row's notch outright.
  viz.boxNotch(d => [d.q1 + 5, d.q3 - 5]);
  assert.deepStrictEqual(
    precomputedBoxExtras(viz, scale).boxNotch(row),
    [30, 50],
  );
});

it("BoxWhisker: the mean and points are on by default, the notch and widths by count off", () => {
  const viz = new BoxWhisker();
  assert.deepStrictEqual(
    [
      viz.boxMean(),
      viz.boxPoints(),
      viz.boxNotch(),
      viz.boxWidthByCount(),
      viz.jitter(),
    ],
    [true, true, false, false, true],
  );
});
