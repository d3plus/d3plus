import {it} from "vitest";
import assert from "assert";
import {stack, stackOrderNone} from "d3-shape";
import {
  neutralStackKeys,
  stackKeyRanks,
  stackNeutralMatcher,
  stackOffsetNeutral,
  stackOrderNeutral,
} from "../../src/charts/Plot/stackNeutral.ts";
import {
  stackPositions,
  stackReadingOrder,
} from "../../src/charts/Plot/stackLegendOrder.ts";
import {stackOrderTotalDescending} from "../../src/charts/Plot/stackHelpers.ts";

const ids = d => [d.question, d.answer];

/** One question's Likert answers, disagreeing ones negative. */
const answers = {SD: -10, D: -20, N: 30, A: 25, SA: 15};
const group = [answers];

/** Runs d3-stack over `group` with the given order and offset. */
const run = (order, offset, data = group) =>
  stack().keys(Object.keys(answers)).order(order).offset(offset)(data);

/** Each series' `[start, end]` in the first stack, by key. */
const spans = series =>
  Object.fromEntries(series.map(s => [s.key, [s[0][0], s[0][1]]]));

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

it("stackKeyRanks — ranks each key by where its series first appears in the data", () => {
  const rows = [
    {id: "A_Q2", series: "A", i: 7},
    {id: "SD_Q1", series: "SD", i: 0},
    {id: "N_Q1", series: "N", i: 2},
    {id: "A_Q1", series: "A", i: 3},
    {id: "D_Q1", series: "D", i: 1},
  ];
  const ranks = stackKeyRanks(rows, row => row.series);
  assert.deepStrictEqual(Object.fromEntries(ranks), {
    A_Q2: 3,
    SD_Q1: 0,
    N_Q1: 2,
    A_Q1: 3,
    D_Q1: 1,
  });
});

it("stackOffsetNeutral — centers the neutral series on zero, the others outward", () => {
  const neutral = new Set(["N"]);
  const series = run(stackOrderNone, stackOffsetNeutral(neutral));
  // stackOrderNone: SD, D, N, A, SA, each side stacking outward in that order.
  assert.deepStrictEqual(spans(series), {
    SD: [-25, -15],
    D: [-45, -25],
    N: [-15, 15],
    A: [15, 40],
    SA: [40, 55],
  });
});

it("stackOffsetNeutral — places several neutral series side by side, and zeros at the neutral edge", () => {
  const data = [{SD: -10, D: 0, N: 20, A: 25, SA: 10}];
  const keys = ["SD", "D", "N", "A", "SA"];
  const series = stack()
    .keys(keys)
    .order(stackOrderNone)
    .offset(stackOffsetNeutral(new Set(["N", "SA"])))(data);
  const out = spans(series);
  // 30 neutral in all: N then SA span -15…15.
  assert.deepStrictEqual(out.N, [-15, 5]);
  assert.deepStrictEqual(out.SA, [5, 15]);
  assert.deepStrictEqual(out.SD, [-25, -15]);
  assert.deepStrictEqual(out.D, [15, 15], "a zero sits at the neutral's edge");
  assert.deepStrictEqual(out.A, [15, 40]);
});

it("stackOffsetNeutral — without a neutral value, it stacks like a diverging offset", () => {
  const series = run(stackOrderNone, stackOffsetNeutral(new Set(["N"])), [
    {...answers, N: 0},
  ]);
  const out = spans(series);
  assert.deepStrictEqual(out.N, [0, 0]);
  assert.deepStrictEqual(out.A, [0, 25]);
  assert.deepStrictEqual(out.SD, [-10, 0]);
});

it("stackOrderNeutral — puts neutral first, the others in the chart's order", () => {
  const neutral = new Set(["N"]);
  const order = stackOrderNeutral(stackOrderTotalDescending, neutral);
  const series = run(order, stackOffsetNeutral(neutral));
  // Descending by value: A (25) then SA (15) up; SD (-10) then D (-20) down.
  assert.deepStrictEqual(spans(series), {
    SD: [-25, -15],
    D: [-45, -25],
    N: [-15, 15],
    A: [15, 40],
    SA: [40, 55],
  });
  assert.strictEqual(series.find(s => s.key === "N").index, 0);
});

it("stackOrderNeutral — with ranks, stacks outward from neutral in data order", () => {
  const neutral = new Set(["N"]);
  // The scale order: SD, D, N, A, SA.
  const ranks = new Map(["SD", "D", "N", "A", "SA"].map((k, i) => [k, i]));
  const order = stackOrderNeutral(stackOrderTotalDescending, neutral, ranks);
  // Data listed in a different order from the scale.
  const data = [{SA: 15, A: 25, N: 30, D: -20, SD: -10}];
  const series = stack()
    .keys(["SA", "A", "N", "D", "SD"])
    .order(order)
    .offset(stackOffsetNeutral(neutral))(data);
  assert.deepStrictEqual(spans(series), {
    SA: [40, 55],
    A: [15, 40],
    N: [-15, 15],
    D: [-35, -15],
    SD: [-45, -35],
  });
});

it("stackPositions — alongAxis reads a neutral stack from its low end", () => {
  const neutral = new Set(["N"]);
  const order = stackOrderNeutral(stackOrderTotalDescending, neutral);
  const series = run(order, stackOffsetNeutral(neutral));
  const keys = series.map(s => s.key);
  assert.deepStrictEqual(
    stackReadingOrder(stackPositions(series, keys, k => k, true)),
    ["D", "SD", "N", "A", "SA"],
  );
  assert.deepStrictEqual(
    stackReadingOrder(stackPositions(series, keys, k => k)),
    ["N", "A", "SA", "SD", "D"],
    "stacking order without alongAxis",
  );
});
