import {it} from "vitest";
import assert from "assert";
import {ColorScale, Treemap} from "../../index.ts";
import {
  bivariateAccessor,
  bivariateFieldNames,
  bivariateOf,
  bivariateSpec,
  bivariateTooltipRows,
  isBivariateSetting,
  leadWithBivariateRows,
} from "../../src/charts/features/colorScaleBivariate.ts";
import {
  colorScaleAccessor,
  optionalAccessor,
} from "../../src/charts/viz/vizFields.ts";
import {colorScaleHoverValue} from "../../src/charts/features/colorScaleHover.ts";
import {bivariateScale} from "../../src/components/ColorScale/bivariateScale.ts";
import {BIVARIATE_COLORS} from "../../src/components/ColorScale/bivariateScale.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("isBivariateSetting — two keys or accessors", () => {
  assert.ok(isBivariateSetting(["a", "b"]));
  assert.ok(isBivariateSetting(["a", d => d.b]));
  assert.ok(!isBivariateSetting(["a"]));
  assert.ok(!isBivariateSetting(["a", "b", "c"]));
  assert.ok(!isBivariateSetting(["a", 2]));
  assert.ok(!isBivariateSetting("a"));
  assert.ok(!isBivariateSetting(false));
});

it("bivariateAccessor — a row's pair of numbers, or nothing", () => {
  const fn = bivariateAccessor(["a", d => d.b * 2]);
  assert.deepStrictEqual(fn({a: 1, b: 2}, 0), [1, 4]);
  assert.deepStrictEqual(fn({a: "3.5", b: 1}, 0), [3.5, 2], "a numeric string");
  assert.strictEqual(fn({a: 1}, 0), undefined, "the second is missing");
  assert.strictEqual(fn({b: 1}, 0), undefined, "the first is missing");
  assert.strictEqual(fn({a: null, b: 1}, 0), undefined);
  assert.strictEqual(fn({a: "", b: 1}, 0), undefined);
  assert.strictEqual(fn({a: "n/a", b: 1}, 0), undefined);
  assert.strictEqual(fn({a: Infinity, b: 1}, 0), undefined);
  assert.strictEqual(fn({a: [1], b: 1}, 0), undefined);
  const spec = bivariateOf(fn);
  assert.deepStrictEqual(spec.fields, ["a", undefined]);
  assert.strictEqual(spec.accessors.length, 2);
  assert.strictEqual(
    bivariateOf(() => 1),
    null,
  );
  assert.strictEqual(bivariateOf("a"), null);
});

it("colorScaleAccessor — two fields make a bivariate accessor", () => {
  const fn = colorScaleAccessor(["x", "y"]);
  assert.ok(bivariateOf(fn));
  assert.deepStrictEqual(fn({x: 1, y: 2}, 0), [1, 2]);
  // Anything else stores as optionalAccessor does.
  for (const v of ["key", "", false, undefined]) {
    const a = colorScaleAccessor(v);
    const b = optionalAccessor(v);
    assert.strictEqual(typeof a, typeof b);
    if (typeof a === "function") assert.strictEqual(a({key: 3}), b({key: 3}));
    else assert.strictEqual(a, b);
  }
  const own = () => 1;
  assert.strictEqual(colorScaleAccessor(own), own);
});

it("Viz.colorScale — an array of two fields is bivariate", () => {
  const viz = new Treemap().colorScale(["a", "b"]);
  const spec = bivariateSpec(viz);
  assert.ok(spec);
  assert.deepStrictEqual(spec.fields, ["a", "b"]);
  assert.deepStrictEqual(viz.colorScale()({a: 2, b: 3}, 0), [2, 3]);
  viz.colorScale("a");
  assert.strictEqual(bivariateSpec(viz), null, "one field isn't");
});

/** A stand-in chart with a bivariate colorScale over `a` and `b`. */
function chartOf(fields = ["a", "b"]) {
  const cs = new ColorScale().bivariate(true);
  const viz = {
    schema: {
      colorScale: bivariateAccessor(fields),
      translate: s => `[${s}]`,
      locale: "en-US",
    },
    _colorScaleClass: cs,
  };
  cs._bivariateFields = bivariateFieldNames(viz, bivariateSpec(viz));
  cs._colorScale = bivariateScale(
    [
      [1000, 0.1],
      [2000, 0.2],
      [3000, 0.3],
    ],
    3,
    BIVARIATE_COLORS,
  );
  return viz;
}

it("bivariateFieldNames — the field names, else a numbered Value", () => {
  assert.deepStrictEqual(chartOf()._colorScaleClass._bivariateFields, [
    "a",
    "b",
  ]);
  const viz = chartOf(["a", d => d.b]);
  assert.deepStrictEqual(bivariateFieldNames(viz, bivariateSpec(viz)), [
    "a",
    "[Value] 2",
  ]);
});

it("bivariateTooltipRows — each variable's name and value", () => {
  const viz = chartOf();
  assert.deepStrictEqual(bivariateTooltipRows(viz, {a: 2500, b: 0.25}, 0), [
    ["a", "2.5k"],
    ["b", "0.25"],
  ]);
  assert.deepStrictEqual(
    bivariateTooltipRows(viz, {a: 2500}, 0),
    [["a", "2.5k"]],
    "a missing value gets no row",
  );
  viz._colorScaleClass.bivariateLabels(["Income", "Rent"]);
  viz._colorScaleClass.axisConfig({tickFormat: d => `<${d}>`});
  assert.deepStrictEqual(bivariateTooltipRows(viz, {a: 1, b: 2}, 0), [
    ["Income", "<1>"],
    ["Rent", "<2>"],
  ]);
  assert.deepStrictEqual(
    bivariateTooltipRows(viz, {_isColorScaleBucket: true, a: 1, b: 2}, 0),
    [],
    "a key cell",
  );
  assert.deepStrictEqual(
    bivariateTooltipRows({...viz, schema: {colorScale: () => 1}}, {a: 1}, 0),
    [],
    "not bivariate",
  );
});

it("leadWithBivariateRows — leads the tbody, never stacking", () => {
  const viz = chartOf();
  let tbody = [["Share", "10%"]];
  const tooltip = {
    tbody(_) {
      if (!arguments.length) return tbody;
      tbody = _;
      return this;
    },
  };
  leadWithBivariateRows(tooltip, viz, {a: 1, b: 2}, 0);
  assert.deepStrictEqual(tbody({}, 0), [
    ["a", "1"],
    ["b", "2"],
    ["Share", "10%"],
  ]);
  leadWithBivariateRows(tooltip, viz, {a: 3, b: 4}, 0);
  assert.deepStrictEqual(tbody({}, 0), [
    ["a", "3"],
    ["b", "4"],
    ["Share", "10%"],
  ]);
  leadWithBivariateRows(tooltip, viz, {_isColorScaleBucket: true}, 0);
  assert.deepStrictEqual(tbody, [["Share", "10%"]], "a cell: the base back");
  tbody = d => [["Name", d.name]];
  leadWithBivariateRows(tooltip, viz, {a: 1, b: 2}, 0);
  assert.deepStrictEqual(tbody({name: "x"}, 0), [
    ["a", "1"],
    ["b", "2"],
    ["Name", "x"],
  ]);
});

it("colorScaleHoverValue — a bivariate row's pair", () => {
  const viz = chartOf();
  viz.schema.linkColor = undefined;
  const node = {type: "rect", datum: {a: 1, b: 2}, index: 0};
  assert.deepStrictEqual(colorScaleHoverValue(viz, node), [1, 2]);
  assert.strictEqual(
    colorScaleHoverValue(viz, {type: "rect", datum: {a: 1}, index: 0}),
    null,
  );
});
