import {it} from "vitest";
import assert from "assert";
import {
  allAlongLabeled,
  alongLegendAuto,
  bandLabelsPossible,
  drawWithAlongLegend,
  emptyAlongStats,
} from "../../src/charts/Plot/alongLegend.ts";

const defaultLegend = () => true;
const viz = (schema = {}) => ({
  _defaultLegend: defaultLegend,
  _margin: {top: 1, right: 0, bottom: 0, left: 0},
  _padding: {top: 0, right: 0, bottom: 0, left: 0},
  schema: {legend: defaultLegend, lineLabels: "along", ...schema},
});

it("alongLegendAuto — the default legend with along labels possible", () => {
  assert.strictEqual(alongLegendAuto(viz()), true);
  assert.strictEqual(alongLegendAuto(viz({lineLabels: () => "along"})), true);
  assert.strictEqual(alongLegendAuto(viz({lineLabels: true})), false);
  assert.strictEqual(alongLegendAuto(viz({lineLabels: false})), false);
  assert.strictEqual(
    alongLegendAuto(viz({legend: () => true})),
    false,
    "a user's legend wins",
  );
});

/** A stacked area chart's viz, with no line labels. */
const stack = (schema = {}) =>
  viz({
    lineLabels: false,
    stacked: true,
    shape: () => "Area",
    labelPosition: "auto",
    ...schema,
  });

it("bandLabelsPossible — stacked Areas whose labelPosition can run along", () => {
  assert.strictEqual(bandLabelsPossible(stack()), true);
  assert.strictEqual(bandLabelsPossible(stack({labelPosition: "along"})), true);
  assert.strictEqual(
    bandLabelsPossible(stack({labelPosition: () => "inside"})),
    true,
    "a function may ask for along",
  );
  assert.strictEqual(
    bandLabelsPossible(stack({labelPosition: "inside"})),
    false,
  );
  assert.strictEqual(bandLabelsPossible(stack({stacked: false})), false);
  assert.strictEqual(
    bandLabelsPossible(stack({shape: () => "Bar"})),
    false,
    "stacked bars",
  );
  assert.strictEqual(bandLabelsPossible(stack({shape: "Area"})), true);
});

it("alongLegendAuto — stacked area labels count like line labels", () => {
  assert.strictEqual(alongLegendAuto(stack()), true);
  assert.strictEqual(
    alongLegendAuto(stack({legend: () => true})),
    false,
    "a user's legend wins",
  );
  assert.strictEqual(alongLegendAuto(stack({labelPosition: "inside"})), false);
});

it("alongLegendAuto — a series hidden or soloed from the legend keeps it", () => {
  assert.strictEqual(alongLegendAuto({...viz(), _hidden: ["a"]}), false);
  assert.strictEqual(alongLegendAuto({...stack(), _solo: ["a"]}), false);
  assert.strictEqual(alongLegendAuto({...viz(), _hidden: [], _solo: []}), true);
});

it("allAlongLabeled — more than one line, each asked for and labeled", () => {
  assert.strictEqual(
    allAlongLabeled({series: 3, requested: 3, placed: 3}),
    true,
  );
  assert.strictEqual(
    allAlongLabeled({series: 3, requested: 3, placed: 2}),
    false,
  );
  assert.strictEqual(
    allAlongLabeled({series: 3, requested: 2, placed: 2}),
    false,
  );
  assert.strictEqual(
    allAlongLabeled({series: 1, requested: 1, placed: 0}),
    false,
  );
  assert.strictEqual(allAlongLabeled(undefined), false);
  assert.deepStrictEqual(emptyAlongStats(), {
    series: 0,
    requested: 0,
    placed: 0,
  });
});

it("drawWithAlongLegend — draws once when every line is labeled, again with the legend when not", () => {
  const all = viz();
  const hides = [];
  drawWithAlongLegend(all, () => {
    hides.push(all._alongLegendHide);
    Object.assign(all._alongStats, {series: 2, requested: 2, placed: 2});
  });
  assert.deepStrictEqual(hides, [true], "one draw, legend hidden");

  const some = viz();
  const draws = [];
  drawWithAlongLegend(some, () => {
    draws.push({hide: some._alongLegendHide, top: some._margin.top});
    some._margin.top += 10;
    Object.assign(some._alongStats, {series: 2, requested: 2, placed: 1});
  });
  assert.deepStrictEqual(
    draws,
    [
      {hide: true, top: 1},
      {hide: false, top: 1},
    ],
    "redraws from the starting margins, with the legend",
  );

  const off = viz({lineLabels: false});
  let count = 0;
  drawWithAlongLegend(off, () => count++);
  assert.strictEqual(count, 1);
  assert.strictEqual(off._alongLegendHide, false);
});
