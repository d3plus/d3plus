import {it} from "vitest";
import assert from "assert";
import {Calendar, ColorScale, Hexbin, RESET, Treemap} from "../../index.ts";
import {isSetEntry} from "../../src/fluent.ts";
import {
  colorScaleTooltipRows,
  colorScaleValueLabel,
  leadWithColorScaleRows,
} from "../../src/charts/features/colorScaleTooltip.ts";
import {colorScaleAccessor} from "../../src/charts/viz/vizFields.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/** A stand-in chart colored by `colorScale` over a few rows. */
function chartOf(colorScale = "value") {
  const cs = new ColorScale()
    .data([{value: 1200}, {value: 3400}, {value: 5600}])
    .value(d => d.value);
  return {
    schema: {
      colorScale: colorScaleAccessor(colorScale),
      translate: s => `[${s}]`,
      locale: "en-US",
    },
    _colorScaleClass: cs,
  };
}

it("colorScaleValueLabel — the scale's title, the field, else Value", () => {
  const viz = chartOf();
  assert.strictEqual(colorScaleValueLabel(viz), "value");
  assert.strictEqual(colorScaleValueLabel(chartOf(d => d.value)), "[Value]");
  viz._colorScaleClass.axisConfig({title: "Population"});
  assert.strictEqual(colorScaleValueLabel(viz), "Population");
});

it("colorScaleTooltipRows — a row's value, named and formatted", () => {
  const viz = chartOf();
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 2500}, 0), [
    ["value", "2.5k"],
  ]);
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: "12"}, 0), [
    ["value", "12"],
  ]);
  viz._colorScaleClass.axisConfig({tickFormat: d => `${d / 1000} k`});
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 2500}, 0), [
    ["value", "2.5 k"],
  ]);
});

it("colorScaleTooltipRows — years read as years", () => {
  const viz = chartOf();
  viz._colorScaleClass.data([{value: 1990}, {value: 2020}]);
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 2001}, 0), [
    ["value", "2001"],
  ]);
});

it("colorScaleTooltipRows — no row without a value to show", () => {
  const viz = chartOf();
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {}, 0), [], "missing");
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: null}, 0), []);
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: "n/a"}, 0), []);
  assert.deepStrictEqual(
    colorScaleTooltipRows(viz, {_isColorScaleBucket: true, value: 3}, 0),
    [],
    "a colorScale swatch",
  );
  assert.deepStrictEqual(colorScaleTooltipRows(viz, undefined, 0), []);
  assert.deepStrictEqual(
    colorScaleTooltipRows({...viz, _colorScaleTooltip: false}, {value: 3}, 0),
    [],
    "a chart whose tooltip already shows it",
  );
  assert.deepStrictEqual(
    colorScaleTooltipRows(chartOf(false), {value: 3}, 0),
    [],
    "no colorScale",
  );
});

it("colorScaleTooltipRows — two rows for a bivariate colorScale", () => {
  const viz = chartOf(["a", "b"]);
  viz._colorScaleClass._bivariateFields = ["a", "b"];
  viz._colorScaleClass._colorScale = Object.assign(() => undefined, {
    domain: () => [],
  });
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {a: 1, b: 2}, 0), [
    ["a", "1"],
    ["b", "2"],
  ]);
});

it("leadWithColorScaleRows — ahead of the chart's or user's own rows", () => {
  const viz = chartOf();
  let tbody = [["Share", "10%"]];
  const tooltip = {
    tbody(_) {
      if (!arguments.length) return tbody;
      tbody = _;
      return this;
    },
  };
  leadWithColorScaleRows(tooltip, viz, {value: 3000}, 0);
  assert.deepStrictEqual(tbody({}, 0), [
    ["value", "3k"],
    ["Share", "10%"],
  ]);
  leadWithColorScaleRows(tooltip, viz, {}, 0);
  assert.deepStrictEqual(tbody, [["Share", "10%"]], "no value: the base back");
});

it("colorScaleTooltip — Calendar and Hexbin show the value themselves", () => {
  assert.strictEqual(new Calendar()._colorScaleTooltip, false);
  assert.strictEqual(new Hexbin()._colorScaleTooltip, false);
  assert.strictEqual(new Treemap()._colorScaleTooltip, undefined);
});

it("isSetEntry — the entries a user's config sets, not a chart's defaults", () => {
  const viz = new Treemap();
  const set = () => isSetEntry(viz, "tooltipConfig", "tbody");
  const share = viz.tooltipConfig().tbody;
  assert.ok(Array.isArray(share), "Treemap's Share row");
  viz.config({}); // takes the defaults snapshot RESET restores
  assert.strictEqual(set(), false, "a chart default isn't the user's");
  viz.tooltipConfig({title: "Name"}).fontFamily("Georgia");
  assert.strictEqual(set(), false, "other entries");
  viz.tooltipConfig({tbody: [["Size", d => d.size]]});
  assert.strictEqual(set(), true);
  viz.tooltipConfig({title: "Other"});
  assert.strictEqual(set(), true, "a later patch keeps it");
  viz.tooltipConfig({tbody: RESET});
  assert.strictEqual(set(), false, "RESET");
  assert.deepStrictEqual(
    viz.tooltipConfig().tbody,
    share,
    "the default is back",
  );
  viz.config({tooltipConfig: {tbody: []}});
  assert.strictEqual(set(), true, "through config()");
  viz.config({tooltipConfig: RESET});
  assert.strictEqual(set(), false, "the whole field RESET");
  viz.tooltipConfig({tbody: () => []});
  viz.tooltipConfig({tbody: undefined});
  assert.strictEqual(set(), false, "undefined");
  assert.strictEqual(
    isSetEntry(new Treemap(), "tooltipConfig", "tbody"),
    false,
  );
});

it("colorScaleTooltipRows — a user's tbody leaves them out", () => {
  const viz = new Treemap().colorScale("value");
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 3}, 0), [
    ["value", "3"],
  ]);
  viz.tooltipConfig({tbody: [["Size", "1"]]});
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 3}, 0), []);
  viz.tooltipConfig({tbody: RESET});
  assert.deepStrictEqual(colorScaleTooltipRows(viz, {value: 3}, 0), [
    ["value", "3"],
  ]);
});
