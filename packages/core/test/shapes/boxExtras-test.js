import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Box} from "../../index.ts";
import {
  applyBoxExtras,
  boxPointData,
  countWidth,
  jitteredCenter,
  jitterOutliers,
  MEAN_SIZE,
  meanOf,
  notchedBoxPath,
  notchInterval,
  toBoxExtra,
} from "../../src/shapes/boxExtras.ts";
import {drawBoxExtras} from "../../src/shapes/boxExtraShapes.ts";
import {jitterOffset} from "../../src/utils/jitter.ts";

useJsdom();

/**
    A Box's extras: the mean marker, the notch, widths by count, and the
    jittered observation points.
*/

it("toBoxExtra: true computes, a function or key reads, anything else is off", () => {
  assert.strictEqual(toBoxExtra(true), true);
  for (const off of [false, undefined, null, 0, ""])
    assert.strictEqual(toBoxExtra(off), false);
  const fn = () => 3;
  assert.strictEqual(toBoxExtra(fn), fn);
  assert.strictEqual(toBoxExtra("avg")({avg: 7}), 7);
});

it("meanOf: the mean of the finite values", () => {
  assert.strictEqual(meanOf([1, 2, 3, 6]), 3);
  assert.strictEqual(meanOf([2, NaN, 4]), 3);
  assert.strictEqual(meanOf([]), undefined);
});

it("notchInterval: median ± 1.58·IQR/√n", () => {
  assert.deepStrictEqual(notchInterval(20, 10, 30, 16), [12.1, 27.9]);
  // Reversed quartiles (pixels on a top-down axis) give the same width.
  assert.deepStrictEqual(notchInterval(20, 30, 10, 16), [12.1, 27.9]);
  assert.strictEqual(notchInterval(20, 10, 30, 0), null);
  assert.strictEqual(notchInterval(NaN, 10, 30, 4), null);
});

it("countWidth: width grows with the square root of a box's share of the largest count", () => {
  assert.strictEqual(countWidth(50, 100, 100), 50);
  assert.strictEqual(countWidth(50, 25, 100), 25);
  assert.strictEqual(countWidth(50, undefined, 100), 50);
  assert.strictEqual(countWidth(50, 4, 0), 50);
});

it("MEAN_SIZE: the mean diamond reaches 5px from its center", () => {
  assert.strictEqual(MEAN_SIZE, 5);
});

it("notchedBoxPath: pinches to half width at the median, between the notch ends", () => {
  const box = {
    orient: "vertical",
    x: 100,
    y: 50,
    width: 40,
    height: 60,
    median: 50,
    notch: [45, 55],
  };
  assert.strictEqual(
    notchedBoxPath(box),
    "M-20,-30L20,-30L20,-5L10,0L20,5L20,30L-20,30L-20,5L-10,0L-20,-5Z",
  );
  // A notch past the quartiles stops at the box's edges; horizontal swaps axes.
  const wide = {...box, orient: "horizontal", width: 60, height: 40};
  wide.x = 50;
  wide.y = 100;
  wide.notch = [0, 100];
  assert.strictEqual(
    notchedBoxPath(wide),
    "M-30,-20L-30,20L-30,20L0,10L30,20L30,20L30,-20L30,-20L0,-10L-30,-20Z",
  );
});

/** A computed vertical box over `values`, in pixels, as Box makes it. */
const computedBox = values => ({
  id: "A",
  orient: "vertical",
  x: 100,
  y: 50,
  width: 40,
  height: 40,
  first: 30,
  median: 50,
  third: 70,
  lowerLimit: 10,
  upperLimit: 90,
  values: values.map((v, k) => ({id: `r${k}`, v})),
  data: {},
  i: 0,
});
const host = schema => ({
  schema: {y: d => d.v, x: () => 100, jitter: true, ...schema},
  _owned: new Map(),
});

it("applyBoxExtras: counts, means, and notches computed boxes, and scales widths by count", () => {
  const a = computedBox([10, 30, 50, 70, 90]);
  const b = computedBox([40, 60]);
  applyBoxExtras(
    host({boxMean: true, boxNotch: true, boxWidthByCount: true}),
    [a, b],
    true,
  );
  assert.strictEqual(a.count, 5);
  assert.strictEqual(a.mean, 50);
  assert.deepStrictEqual(a.notch, notchInterval(50, 30, 70, 5));
  assert.strictEqual(a.width, 40);
  assert.strictEqual(b.width, 40 * Math.sqrt(2 / 5));
  // Off, nothing is stamped but the count.
  const c = computedBox([1, 2]);
  applyBoxExtras(host({boxMean: false, boxNotch: false}), [c], true);
  assert.deepStrictEqual(
    [c.count, c.mean, c.notch, c.width],
    [2, undefined, undefined, 40],
  );
});

it("applyBoxExtras: precomputed boxes read their mean, count, and notch through accessors", () => {
  const d = {...computedBox([]), values: [{}], data: {avg: 44, n: 9}};
  applyBoxExtras(
    host({
      boxMean: row => row.avg,
      boxCount: row => row.n,
      boxNotch: true,
    }),
    [d],
    false,
  );
  assert.strictEqual(d.mean, 44);
  assert.strictEqual(d.count, 9);
  assert.deepStrictEqual(d.notch, notchInterval(50, 30, 70, 9));
  // `true` has no observations to average.
  const e = {...computedBox([]), data: {}};
  applyBoxExtras(host({boxMean: true}), [e], false);
  assert.strictEqual(e.mean, undefined);
  assert.strictEqual(e.count, undefined);
});

it("jitteredCenter: the box's center plus the key's seeded share of its width", () => {
  const box = computedBox([]);
  assert.strictEqual(
    jitteredCenter(box, "k", true),
    100 + jitterOffset("k") * 24,
  );
  assert.strictEqual(jitteredCenter(box, "k", false), 100);
  const h = {...box, orient: "horizontal", y: 7, height: 10};
  assert.strictEqual(jitteredCenter(h, "k", 0.5), 7 + jitterOffset("k") * 5);
});

it("boxPointData: one jittered point per observation inside the whiskers", () => {
  const box = computedBox([5, 30, 50, 95]);
  const points = boxPointData(host(), box);
  assert.deepStrictEqual(
    points.map(p => [p.id, p.y]),
    [
      ["A-point-r1", 30],
      ["A-point-r2", 50],
    ],
  );
  assert.strictEqual(points[0].x, jitteredCenter(box, "r1", true));
  assert.strictEqual(points[0].data, box.values[1]);
});

it("jitterOutliers: outliers move to their seeded place across the box", () => {
  const box = computedBox([]);
  const outlier = {x: 100, y: 5, data: {id: "r9"}, i: 9};
  jitterOutliers(host(), box, [outlier]);
  assert.strictEqual(outlier.x, jitteredCenter(box, "r9", true));
  assert.strictEqual(outlier.y, 5);
});

it("drawBoxExtras: a notched body, points, and a mean, each owned by its box", () => {
  const box = computedBox([10, 30, 50, 70, 90]);
  const h = host({boxMean: true, boxNotch: true, boxPoints: true});
  h._owned.set(box, {datum: box, index: 0});
  applyBoxExtras(h, [box], true);
  const m = {compute: true, select: () => null, prep: c => ({...c})};
  const out = drawBoxExtras(h, [box], [], {fill: "white"}, true, m);
  const scene = shape =>
    shape.toScene().children.filter(n => !`${n.key}`.endsWith("::hit"));
  assert.deepStrictEqual(
    scene(out.notched).map(n => [n.type, n.key]),
    [["path", "A-box"]],
  );
  assert.strictEqual(scene(out.points).length, 5);
  const [mean] = scene(out.mean);
  assert.strictEqual(mean.key, "A-mean");
  assert.deepStrictEqual([mean.transform.x, mean.transform.y], [100, 50]);
  assert.strictEqual(mean.paint.fill, "black");
  for (const p of out.points._data)
    assert.strictEqual(h._owned.get(p).datum, box);
  // Points need observations: precomputed boxes draw none.
  assert.strictEqual(
    drawBoxExtras(h, [box], [], {}, false, m).points,
    undefined,
  );
  assert.deepStrictEqual(
    drawBoxExtras(host(), [computedBox([])], [], {}, true, m),
    {},
  );
});

it("Box: meanConfig and pointConfig style the mean and points", () => {
  const box = new Box()
    .data([1, 2, 3, 4, 5, 6, 7, 8].map(v => ({id: `o${v}`, key: "A", v})))
    .x(d => d.key)
    .y(d => d.v)
    .config({boxMean: true, boxPoints: true, boxNotch: true})
    .meanConfig({fill: "red"})
    .pointConfig({r: 4})
    .renderMode("compute")
    .render();
  assert.deepStrictEqual(box.meanConfig(), {fill: "red"});
  const nodes = box.toScene().children;
  const mean = nodes.find(n => n.key === "A-mean");
  assert.strictEqual(mean.paint.fill, "red");
  const points = nodes.filter(n => `${n.key}`.startsWith("A-point-"));
  assert.strictEqual(points.length, 8);
  for (const p of points) assert.strictEqual(p.r, 4);
  assert.ok(nodes.find(n => n.key === "A-box").type === "path");
  // Every part names its box.
  for (const n of [mean, ...points])
    assert.strictEqual(n.owners[0].shapeType, "Box");
});
