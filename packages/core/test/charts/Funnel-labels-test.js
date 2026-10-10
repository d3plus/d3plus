import assert from "assert";
import {
  conversionModes,
  fitFontSize,
  lineBoxes,
  planLabel,
} from "../../es/src/charts/Funnel/funnelLabels.js";
import {
  OUTSIDE_GAP,
  percentText,
  stageBoxes,
  stageLines,
} from "../../es/src/charts/Funnel/labelNodes.js";

// Every character is 0.5em wide.
const measure = (text, size) => text.length * size * 0.5;
const sizing = {fontMin: 10, fontMax: 16, padding: 4, lineHeight: 1.2};

function mockViz(schema = {}) {
  return {
    schema: {
      locale: "en-US",
      valueFormat: v => `${v} people`,
      translate: s => `[${s}]`,
      conversion: false,
      ...schema,
    },
    _drawLabel: d => d.id,
  };
}

const stage = (over = {}) => ({
  __d3plus__: true,
  data: {id: "Trial"},
  i: 2,
  value: 300,
  first: 0.3,
  previous: 0.6,
  start: 100,
  end: 150,
  points: [],
  neck: [],
  min: 120,
  max: 160,
  ...over,
});

it("Funnel labels: conversionModes reads every form of the setting", () => {
  assert.deepStrictEqual(conversionModes(false), []);
  assert.deepStrictEqual(conversionModes(undefined), []);
  assert.deepStrictEqual(conversionModes(true), ["first", "previous"]);
  assert.deepStrictEqual(conversionModes("both"), ["first", "previous"]);
  assert.deepStrictEqual(conversionModes("first"), ["first"]);
  assert.deepStrictEqual(conversionModes("previous"), ["previous"]);
  assert.deepStrictEqual(
    conversionModes(["previous", "first", "bogus"]),
    ["first", "previous"],
    "array entries in display order",
  );
});

it("Funnel labels: fitFontSize is limited by fontMax, height, and width", () => {
  assert.strictEqual(
    fitFontSize(["ab"], {width: 500, height: 500}, measure, sizing),
    16,
  );
  // Two lines in 32px minus padding: 24 / 2.4 = 10.
  assert.strictEqual(
    fitFontSize(["ab", "cd"], {width: 500, height: 32}, measure, sizing),
    10,
  );
  // 10 chars at 16px is 80px wide; 48px of room fits 9.6px, floored to 9.5.
  assert.strictEqual(
    fitFontSize(["abcdefghij"], {width: 56, height: 500}, measure, sizing),
    9.5,
  );
  assert.strictEqual(
    fitFontSize([], {width: 9, height: 9}, measure, sizing),
    0,
  );
  assert.strictEqual(
    fitFontSize(["a"], {width: 8, height: 100}, measure, sizing),
    0,
    "no room inside the padding",
  );
});

it("Funnel labels: planLabel prefers inside, then beside, then fewer lines", () => {
  const lines = ["Name", "1.2k", "40% of first"];
  const roomy = planLabel(
    lines,
    {width: 300, height: 80},
    {width: 100, height: 80},
    measure,
    sizing,
  );
  assert.deepStrictEqual(roomy, {position: "inside", fontSize: 16, lines});

  const narrow = planLabel(
    lines,
    {width: 30, height: 80},
    {width: 200, height: 80},
    measure,
    sizing,
  );
  assert.strictEqual(narrow.position, "outside");
  assert.strictEqual(narrow.lines.length, 3);

  const short = planLabel(
    lines,
    {width: 300, height: 34},
    null,
    measure,
    sizing,
  );
  assert.deepStrictEqual(short.lines, ["Name", "1.2k"], "drops trailing lines");

  assert.strictEqual(
    planLabel(
      lines,
      {width: 5, height: 5},
      {width: 5, height: 5},
      measure,
      sizing,
    ),
    null,
  );
});

it("Funnel labels: planLabel stays inside when the text is nearly as large there", () => {
  const plan = planLabel(
    ["abcdefghij"],
    {width: 80, height: 100},
    {width: 300, height: 100},
    measure,
    sizing,
  );
  // Inside fits 14.4px (floored to 14), beside fits 16px: 14 >= 0.8 × 16.
  assert.strictEqual(plan.position, "inside");
  assert.strictEqual(plan.fontSize, 14);
});

it("Funnel labels: lineBoxes stacks lines centered or from the top", () => {
  const box = {x: 10, y: 0, width: 50, height: 100};
  assert.deepStrictEqual(lineBoxes(box, 2, 20, "middle"), [
    {x: 10, y: 30, width: 50, height: 20},
    {x: 10, y: 50, width: 50, height: 20},
  ]);
  assert.deepStrictEqual(
    lineBoxes(box, 2, 20, "top").map(b => b.y),
    [0, 20],
  );
  assert.deepStrictEqual(lineBoxes(box, 0, 20, "top"), []);
});

it("Funnel labels: percentText formats a rate as a percentage", () => {
  const viz = mockViz();
  assert.strictEqual(percentText(viz, 0.5), "50%");
  assert.strictEqual(percentText(viz, 0.1234), "12.3%");
});

it("Funnel labels: stageLines shows the name and value, then requested rates", () => {
  assert.deepStrictEqual(stageLines(mockViz(), stage()), [
    "Trial",
    "300 people",
  ]);
  assert.deepStrictEqual(stageLines(mockViz({conversion: "both"}), stage()), [
    "Trial",
    "300 people",
    "30% [of first]",
    "60% [of previous]",
  ]);
  assert.deepStrictEqual(
    stageLines(mockViz({conversion: "previous"}), stage()),
    ["Trial", "300 people", "60% [of previous]"],
  );
});

it("Funnel labels: stageLines leaves rates off the first stage and skips missing ones", () => {
  const viz = mockViz({conversion: "both"});
  assert.deepStrictEqual(
    stageLines(viz, stage({i: 0, first: 1, previous: NaN})),
    ["Trial", "300 people"],
  );
  assert.deepStrictEqual(
    stageLines(viz, stage({value: NaN, first: NaN, previous: NaN})),
    ["Trial"],
  );
});

it("Funnel labels: stageBoxes puts the outside box right of a vertical stage", () => {
  const shared = {orient: "vertical", center: 200, breadth: 396, offset: 2};
  const {inside, outside} = stageBoxes(stage(), shared);
  assert.deepStrictEqual(inside, {x: 140, y: 100, width: 120, height: 50});
  assert.deepStrictEqual(outside, {
    x: 280 + OUTSIDE_GAP,
    y: 100,
    width: (396 - 160) / 2 - OUTSIDE_GAP,
    height: 50,
  });
});

it("Funnel labels: stageBoxes puts the outside box below a horizontal stage", () => {
  const shared = {orient: "horizontal", center: 100, breadth: 196, offset: 2};
  const {inside, outside} = stageBoxes(stage(), shared);
  assert.deepStrictEqual(inside, {x: 100, y: 40, width: 50, height: 120});
  assert.deepStrictEqual(outside, {
    x: 100,
    y: 180 + OUTSIDE_GAP,
    width: 50,
    height: (196 - 160) / 2 - OUTSIDE_GAP,
  });
  const full = stageBoxes(stage({max: 196}), shared);
  assert.strictEqual(
    full.outside.height,
    0,
    "no room beside a full-width stage",
  );
});
