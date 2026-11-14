import {it} from "vitest";
import assert from "assert";
import {stack, stackOrderNone} from "d3-shape";
import {
  neutralStack,
  neutralStackKeys,
  seriesDataRanks,
  seriesListRanks,
  seriesOrderRanks,
  stackNeutralMatcher,
} from "../../src/charts/Plot/stackNeutral.ts";
import {
  stackPositions,
  stackReadingOrder,
} from "../../src/charts/Plot/stackLegendOrder.ts";
import {
  stackOrderKeyReverse,
  stackOrderTotalDescending,
} from "../../src/charts/Plot/stackHelpers.ts";

const ids = d => [d.question, d.answer];

/** One question's Likert answers, all positive, keyed by series. */
const answers = {SD: 10, D: 20, N: 30, A: 25, SA: 15};
const scale = ["SD", "D", "N", "A", "SA"];
const seriesOf = new Map(scale.map(k => [k, k]));
const dataRanks = new Map(scale.map((k, i) => [k, i]));

/** Runs d3-stack over one stack of `data` with a neutral-centered order and offset. */
const run = (centered, data = answers, keys = Object.keys(data)) =>
  stack().keys(keys).order(centered.order).offset(centered.offset)([data]);

/** Each series' `[start, end]` in the first stack, by key. */
const spans = series =>
  Object.fromEntries(series.map(s => [s.key, [s[0][0], s[0][1]]]));

const expected = {
  SD: [-45, -35],
  D: [-35, -15],
  N: [-15, 15],
  A: [15, 40],
  SA: [40, 55],
};

it("stackNeutralMatcher — matches a value against any of a row's ids", () => {
  const match = stackNeutralMatcher("Neutral", ids);
  assert.strictEqual(match({question: "Q1", answer: "Neutral"}, 0), true);
  assert.strictEqual(match({question: "Q1", answer: "Agree"}, 0), false);
  const number = stackNeutralMatcher(3, d => [d.level]);
  assert.strictEqual(number({level: 3}, 0), true, "numbers match as text");
  assert.strictEqual(number({level: "3"}, 0), true);
});

it("stackNeutralMatcher — calls an accessor, and is null when unset", () => {
  const match = stackNeutralMatcher(
    (d, i) => d.answer.startsWith("N") && i === 2,
    ids,
  );
  assert.strictEqual(match({answer: "Neutral"}, 2), true);
  assert.strictEqual(match({answer: "Neutral"}, 1), false);
  for (const unset of [undefined, null, false])
    assert.strictEqual(stackNeutralMatcher(unset, ids), null);
});

it("neutralStackKeys — collects the stack keys of neutral rows", () => {
  const rows = [
    {id: "Agree_Q1", data: {answer: "Agree"}, i: 0},
    {id: "Neutral_Q1", data: {answer: "Neutral"}, i: 1},
    {id: "Neutral_Q2", data: {answer: "Neutral"}, i: 2},
    {id: "filler"},
  ];
  const keys = neutralStackKeys(rows, d => d.answer === "Neutral");
  assert.deepStrictEqual([...keys], ["Neutral_Q1", "Neutral_Q2"]);
});

it("seriesDataRanks — ranks each series by where it first appears in the data", () => {
  const rows = [
    {series: "A", i: 7},
    {series: "SD", i: 0},
    {series: "N", i: 2},
    {series: "A", i: 3},
    {series: "D", i: 1},
  ];
  assert.deepStrictEqual(
    Object.fromEntries(seriesDataRanks(rows, row => row.series)),
    {SD: 0, D: 1, N: 2, A: 3},
  );
});

it("seriesListRanks — an explicit list, then the rest in data order", () => {
  const ranks = seriesListRanks(["N", "SD", "A"], dataRanks);
  assert.deepStrictEqual(Object.fromEntries(ranks), {
    SD: 1,
    D: 3 + 1,
    N: 0,
    A: 2,
    SA: 3 + 4,
  });
});

it("seriesOrderRanks — each series' first place in a stack order", () => {
  const series = [{key: "A_Q1"}, {key: "B_Q1"}, {key: "A_Q2"}];
  const names = new Map([
    ["A_Q1", "A"],
    ["B_Q1", "B"],
    ["A_Q2", "A"],
  ]);
  const ranks = seriesOrderRanks(series, () => [2, 1, 0], names);
  assert.deepStrictEqual(Object.fromEntries(ranks), {A: 0, B: 1});
});

it("neutralStack — places series by order around the neutral one, at absolute values", () => {
  const centered = neutralStack(
    new Set(["N"]),
    seriesOf,
    stackOrderNone,
    dataRanks,
  );
  assert.deepStrictEqual(spans(run(centered)), expected);
  assert.deepStrictEqual(Object.fromEntries(centered.ranks), {
    SD: 0,
    D: 1,
    N: 2,
    A: 3,
    SA: 4,
  });
  // Negated data lands in the same places.
  const negated = {...answers, SD: -10, D: -20};
  assert.deepStrictEqual(spans(run(centered, negated)), expected);
});

it("neutralStack — numbers the stack from the neutral series outward", () => {
  const centered = neutralStack(
    new Set(["N"]),
    seriesOf,
    stackOrderNone,
    dataRanks,
  );
  const series = run(centered, answers, ["SA", "A", "N", "D", "SD"]);
  const index = Object.fromEntries(series.map(s => [s.key, s.index]));
  assert.strictEqual(index.N, 0);
  assert.ok(index.D < index.SD, "the nearest disagreement first");
  assert.ok(index.A < index.SA, "the nearest agreement first");
  assert.deepStrictEqual(spans(series), expected, "whatever the key order");
});

it("neutralStack — reads the scale from the chart's stack order without fixed ranks", () => {
  const centered = neutralStack(new Set(["N"]), seriesOf, stackOrderKeyReverse);
  // Z→A: SD, SA, N, D, A — SD and SA before N go negative, D and A after it.
  const out = spans(run(centered));
  assert.deepStrictEqual(out.N, [-15, 15]);
  assert.deepStrictEqual(out.SA, [-30, -15], "nearest the neutral");
  assert.deepStrictEqual(out.SD, [-40, -30]);
  assert.deepStrictEqual(out.D, [15, 35]);
  assert.deepStrictEqual(out.A, [35, 60]);
  const descending = neutralStack(
    new Set(["N"]),
    seriesOf,
    stackOrderTotalDescending,
  );
  assert.ok(spans(run(descending)).N[0] === -15, "always centered");
});

it("neutralStack — several neutral series side by side, zeros at the edges", () => {
  const centered = neutralStack(
    new Set(["N", "N2"]),
    new Map([...seriesOf, ["N2", "N2"]]),
    stackOrderNone,
    new Map([...dataRanks, ["N2", 2.5]]),
  );
  const out = spans(run(centered, {SD: 10, D: 0, N: 20, N2: 10, A: 25, SA: 0}));
  assert.deepStrictEqual(out.N, [-15, 5]);
  assert.deepStrictEqual(out.N2, [5, 15]);
  assert.deepStrictEqual(
    out.D,
    [-15, -15],
    "a zero sits at the neutral's edge",
  );
  assert.deepStrictEqual(out.SD, [-25, -15]);
  assert.deepStrictEqual(out.A, [15, 40]);
  assert.deepStrictEqual(out.SA, [40, 40]);
});

it("neutralStack — without a neutral value, the sides meet at zero", () => {
  const centered = neutralStack(
    new Set(["N"]),
    seriesOf,
    stackOrderNone,
    dataRanks,
  );
  const out = spans(run(centered, {...answers, N: 0}));
  assert.deepStrictEqual(out.N, [0, 0]);
  assert.deepStrictEqual(out.D, [-20, 0]);
  assert.deepStrictEqual(out.A, [0, 25]);
});

it("stackPositions — alongAxis reads a neutral stack from its low end", () => {
  const centered = neutralStack(
    new Set(["N"]),
    seriesOf,
    stackOrderNone,
    dataRanks,
  );
  const series = run(centered);
  const keys = series.map(s => s.key);
  assert.deepStrictEqual(
    stackReadingOrder(stackPositions(series, keys, k => k, true)),
    scale,
  );
  assert.deepStrictEqual(
    stackReadingOrder(stackPositions(series, keys, k => k)),
    ["N", "D", "SD", "A", "SA"],
    "stacking order without alongAxis",
  );
});
