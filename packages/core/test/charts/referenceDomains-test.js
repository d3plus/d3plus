import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {LinePlot} from "../../index.ts";
import {
  openDomainEnds,
  referenceDomainValues,
  widenToValues,
  widenReferenceDomains,
} from "../../src/charts/Plot/referenceDomains.ts";

useJsdom();

// Reference lines and bands widen the continuous and time axes they sit on.

it("referenceDomainValues: each axis's line values and band ends, data units only", () => {
  const values = referenceDomainValues([
    {shape: "ReferenceLine", y: 100},
    {shape: "ReferenceLine", x2: 3},
    {shape: "ReferenceBand", y: [-5, 10]},
    {shape: "ReferenceBand", x: 4},
    {shape: "ReferenceLine", y: 0.5, ref: "plot"},
    {shape: "Callout", data: [{x: 999, y: 999}]},
    {shape: "Line", data: [{x: 999, y: 999}]},
  ]);
  assert.deepStrictEqual(values, {x: [], y: [100, -5, 10], x2: [3], y2: []});
});

it("widenToValues: stretches either end, keeping orientation", () => {
  assert.deepStrictEqual(widenToValues([0, 80], [100]), [0, 100]);
  assert.deepStrictEqual(widenToValues([10, 80], [-5, 20]), [-5, 80]);
  assert.deepStrictEqual(widenToValues([80, 10], [100, 0]), [100, 0]);
  const same = [0, 80];
  assert.strictEqual(widenToValues(same, [40]), same, "inside: unchanged");
  assert.strictEqual(widenToValues(same, ["x", null]), same, "not numbers");
  assert.deepStrictEqual(widenToValues([0, 80], ["120"]), [0, 120]);
});

it("widenToValues: only open ends move; log axes skip values at or below zero", () => {
  assert.deepStrictEqual(
    widenToValues([0, 80], [-10, 100], {open: [false, true]}),
    [0, 100],
  );
  assert.deepStrictEqual(
    widenToValues([0, 80], [-10, 100], {open: [false, false]}),
    [0, 80],
  );
  assert.deepStrictEqual(
    widenToValues([1, 100], [0, 1000], {log: true}),
    [1, 1000],
  );
});

it("widenToValues: a time domain takes in date strings and years as Dates", () => {
  const domain = [new Date(2021, 0, 1), new Date(2021, 11, 1)];
  const out = widenToValues(domain, ["2022-06-01", 2020], {time: true});
  assert.ok(out[0] instanceof Date && out[1] instanceof Date);
  assert.strictEqual(out[0].getFullYear(), 2020);
  assert.strictEqual(out[1].getFullYear(), 2022);
  assert.strictEqual(out[1].getMonth(), 5);
});

it("openDomainEnds: the ends a user domain leaves unset", () => {
  assert.deepStrictEqual(openDomainEnds(undefined), [true, true]);
  assert.deepStrictEqual(openDomainEnds([0, 50]), [false, false]);
  assert.deepStrictEqual(openDomainEnds([0, undefined]), [false, true]);
  assert.deepStrictEqual(openDomainEnds([null, 50]), [true, false]);
  assert.deepStrictEqual(openDomainEnds([0]), [false, true]);
});

const linear = {type: "Linear", config: "linear"};
const scales = {
  x: {type: "Point", config: "point"},
  y: linear,
  x2: linear,
  y2: linear,
};

it("widenReferenceDomains: lines and bands widen continuous axes, never category axes", () => {
  const viz = new LinePlot()
    .referenceLines([{y: 100}, {x: "Z"}])
    .referenceBands([{y2: [-20, 5]}])
    .annotations([
      {shape: "Callout", data: [{x: 1, y: 500}]},
      {shape: "ReferenceLine", y: -10},
    ]);
  const out = widenReferenceDomains(
    viz,
    {x: ["A", "B"], y: [0, 80], x2: undefined, y2: [0, 10]},
    scales,
    {},
  );
  assert.deepStrictEqual(out.x, ["A", "B"], "a category axis is left alone");
  assert.deepStrictEqual(out.y, [-10, 100], "lines (not the callout) widen y");
  assert.deepStrictEqual(out.y2, [-20, 10], "the band widens y2");
  assert.strictEqual(out.x2, undefined);
});

it("widenReferenceDomains: an explicit user domain is not widened", () => {
  const viz = new LinePlot()
    .referenceLines([{y: 100}, {y2: 100}])
    .y2Domain([0, 50]);
  const out = widenReferenceDomains(
    viz,
    {x: [0, 1], y: [0, 50], x2: undefined, y2: [0, 50]},
    scales,
    {y: [0, 50]},
  );
  assert.deepStrictEqual(out.y, [0, 50]);
  assert.deepStrictEqual(out.y2, [0, 50]);
  const open = widenReferenceDomains(
    viz,
    {x: [0, 1], y: [0, 50], x2: undefined, y2: undefined},
    scales,
    {y: [0, undefined]},
  );
  assert.deepStrictEqual(open.y, [0, 100], "an end left open still widens");
});
