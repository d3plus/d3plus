import {it} from "vitest";
import assert from "assert";
import {
  RADIAL_SERIES_LABEL_PADDING,
  radialBoxDepth,
  radialBoxHolds,
  radialBoxWithin,
  radialInsideCandidates,
  radialOutsideCandidates,
  radialSeriesLabels,
} from "../../src/charts/RadialLine/seriesLabels.ts";
import {
  radialClockwise,
  radialCurveName,
  radialDomainOf,
  radialIsArea,
  radialIsStacked,
  radialStart,
  radialXFormatter,
} from "../../src/charts/RadialLine/applyLayout.ts";

const close = (a, b, msg) =>
  assert.ok(Math.abs(a - b) < 1e-9, `${msg ?? ""} ${a} ≈ ${b}`);

/** A series with points at 12, 3, 6 and 9 o'clock. */
const points = (r0, r1s) =>
  r1s.map((r1, k) => ({angle: (k * Math.PI) / 2, r0, r1}));

it("radialBoxDepth is a box's reach along the radius", () => {
  close(radialBoxDepth(0, 40, 10), 10, "at 12 o'clock, its height");
  close(radialBoxDepth(Math.PI / 2, 40, 10), 40, "at 3 o'clock, its width");
});

it("radialOutsideCandidates sit just outside each point, the outermost first", () => {
  const boxes = radialOutsideCandidates({
    points: points(0, [10, 50, 30, 20]),
    width: 20,
    height: 10,
  });
  assert.strictEqual(boxes.length, 4);
  // 3 o'clock, 50 out: the box starts just past the point and is centered on its row.
  close(boxes[0].x, 50 + RADIAL_SERIES_LABEL_PADDING);
  close(boxes[0].y, -5);
  // 6 o'clock, 30 out: below the point.
  close(boxes[1].y, 30 + RADIAL_SERIES_LABEL_PADDING);
  assert.deepStrictEqual(
    radialOutsideCandidates({points: [], width: 1, height: 1}),
    [],
  );
});

it("radialInsideCandidates center a box in each band deep enough for it, the roomiest first", () => {
  const boxes = radialInsideCandidates({
    points: [
      {angle: 0, r0: 10, r1: 40},
      {angle: Math.PI / 2, r0: 10, r1: 40},
      {angle: Math.PI, r0: 10, r1: 15},
    ],
    width: 20,
    height: 10,
  });
  assert.strictEqual(boxes.length, 2, "too thin at 6 o'clock");
  // 12 o'clock needs 10px of its 30: the roomiest.
  close(boxes[0].x, -10);
  close(boxes[0].y, -25 - 5);
  close(boxes[1].x, 25 - 10, "then 3 o'clock, needing 20px");
});

it("radialBoxWithin and radialBoxHolds test a box against a radius and points", () => {
  const box = {x: 0, y: 0, width: 3, height: 4};
  assert.strictEqual(radialBoxWithin(box, 5), true);
  assert.strictEqual(radialBoxWithin(box, 4.9), false);
  assert.strictEqual(radialBoxHolds(box, [[1, 1]]), true);
  assert.strictEqual(radialBoxHolds(box, [[5, 1]]), false);
  assert.strictEqual(
    radialBoxHolds(box, [[5, 1]], 2),
    true,
    "within the margin",
  );
  assert.strictEqual(radialBoxHolds(box, []), false);
});

it("radialSeriesLabels takes each label's first candidate that is clear of the rest", () => {
  const a = {points: points(0, [10, 50, 30, 20]), width: 20, height: 10};
  const b = {points: points(0, [12, 49, 10, 10]), width: 20, height: 10};
  const [boxA, boxB] = radialSeriesLabels([a, b], false);
  close(boxA.x, 56, "A at its outermost point");
  close(boxB.x, -10, "B moves on from where A's label sits, to 12 o'clock");
  close(boxB.y, -12 - RADIAL_SERIES_LABEL_PADDING - 10);
  const limited = radialSeriesLabels([a], false, {limit: 60});
  close(
    limited[0].y,
    30 + RADIAL_SERIES_LABEL_PADDING,
    "inside the circle: 6 o'clock",
  );
  const blocked = radialSeriesLabels([a], false, {
    limit: 60,
    obstacles: [[0, 40]],
  });
  close(
    blocked[0].x,
    -20 - RADIAL_SERIES_LABEL_PADDING - 20,
    "clear of the obstacle: 9 o'clock",
  );
  assert.deepStrictEqual(
    radialSeriesLabels([a], false, {limit: 10}),
    [null],
    "fits nowhere",
  );
  const inside = radialSeriesLabels(
    [{points: points(0, [40, 40, 40, 40]), width: 20, height: 10}],
    true,
  );
  close(inside[0].y + 5, -20, "inside, centered in its band");
});

it("radialStart, radialClockwise, radialIsArea and radialIsStacked read the settings", () => {
  const viz = {schema: {startAngle: 90}, ctx: {}};
  close(radialStart(viz), Math.PI / 2);
  close(radialStart({schema: {startAngle: "x"}}), 0);
  assert.strictEqual(radialClockwise(viz), true);
  assert.strictEqual(
    radialClockwise({schema: {direction: "counterclockwise"}}),
    false,
  );
  assert.strictEqual(radialIsArea(viz), false);
  viz.schema.stacked = true;
  assert.strictEqual(radialIsStacked(viz), false, "lines never stack");
  viz.ctx.radialMark = "area";
  assert.strictEqual(radialIsArea(viz), true);
  assert.strictEqual(radialIsStacked(viz), true);
});

it("radialXFormatter labels numbers, dates and names, or through xFormat", () => {
  const viz = {schema: {locale: "en-US"}};
  const dates = [0, 1, 2].map(m => new Date(2024, m, 1));
  const format = radialXFormatter(viz, dates);
  assert.strictEqual(format(1500), "1.5k");
  assert.strictEqual(format("Jan"), "Jan");
  assert.ok(/Feb/.test(format(dates[1])), format(dates[1]));
  viz.schema.xFormat = d => `#${d}`;
  assert.strictEqual(radialXFormatter(viz, [])(3), "#3");
});

it("radialCurveName reads a curve name or a function of the series", () => {
  assert.strictEqual(radialCurveName(undefined, {}, 0), "linear");
  assert.strictEqual(radialCurveName("", {}, 0), "linear");
  assert.strictEqual(radialCurveName("catmullRom", {}, 0), "catmullRom");
  assert.strictEqual(
    radialCurveName(d => (d.smooth ? "basis" : null), {smooth: true}, 0),
    "basis",
  );
  assert.strictEqual(
    radialCurveName(() => 3, {}, 0),
    "linear",
  );
});

it("radialDomainOf fits the radius to each value, or each stack's top", () => {
  const rows = [
    {id: "A", m: "a", v: 2},
    {id: "B", m: "a", v: 3},
    {id: "A", m: "b", v: 5},
  ];
  const viz = {
    schema: {x: d => d.m, y: d => d.v},
    _id: d => d.id,
    ctx: {},
  };
  assert.deepStrictEqual(radialDomainOf(viz, rows), [2, 5, 3]);
  viz.ctx.radialMark = "area";
  viz.schema.stacked = true;
  assert.deepStrictEqual(radialDomainOf(viz, rows), [2, 5, 5, 5]);
});
