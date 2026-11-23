import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {BarChart, RESET, Treemap} from "../../index.ts";
import {
  applyResponsive,
  matchBreakpoints,
} from "../../src/charts/viz/responsive.ts";
import {configWarnings} from "../../src/utils/configWarnings.ts";
import {chartWidth} from "../../src/charts/viz/letterbox.ts";

useJsdom();

/**
    `responsive` breakpoints: which ones a width is in, and how their config
    merges over the chart's own and comes back off, keeping what the user
    sets meanwhile.
*/

/** A chart `width` pixels wide with `breakpoints`, as `render()` would see it. */
function chart(width, breakpoints, Chart = Treemap) {
  const viz = new Chart().responsive(breakpoints);
  viz.schema.width = width;
  return viz;
}

/** Re-measures `viz` at `width` and applies its breakpoints. */
function resize(viz, width) {
  viz.schema.width = width;
  return applyResponsive(viz);
}

it("matchBreakpoints: inclusive bounds, list order, and open ends", () => {
  const list = [
    {maxWidth: 480, config: {}},
    {minWidth: 480, maxWidth: 800, config: {}},
    {minWidth: 1200, config: {}},
    {config: {}},
  ];
  assert.deepStrictEqual(matchBreakpoints(list, 320), [0, 3]);
  assert.deepStrictEqual(matchBreakpoints(list, 480), [0, 1, 3]);
  assert.deepStrictEqual(matchBreakpoints(list, 800), [1, 3]);
  assert.deepStrictEqual(matchBreakpoints(list, 1000), [3]);
  assert.deepStrictEqual(matchBreakpoints(list, 1200), [2, 3]);
});

it("matchBreakpoints: no list, no width, or a non-object entry match nothing", () => {
  assert.deepStrictEqual(matchBreakpoints(undefined, 400), []);
  assert.deepStrictEqual(matchBreakpoints([{config: {}}], 0), []);
  assert.deepStrictEqual(matchBreakpoints([{config: {}}], NaN), []);
  assert.deepStrictEqual(matchBreakpoints([null, 4, {config: {}}], 400), [2]);
});

it("applies a breakpoint in range and restores the chart's own value out of it", () => {
  const viz = chart(400, [{maxWidth: 480, config: {legend: false}}]);
  viz.legend(true);
  assert.strictEqual(applyResponsive(viz), true);
  assert.strictEqual(viz.schema.legend(), false);
  assert.strictEqual(resize(viz, 450), false, "same breakpoints: no change");
  assert.strictEqual(resize(viz, 900), true);
  assert.strictEqual(viz.schema.legend(), true);
  assert.strictEqual(resize(viz, 300), true);
  assert.strictEqual(viz.schema.legend(), false);
});

it("deep-merges a config bag and takes the merge back off", () => {
  const viz = chart(400, [
    {maxWidth: 480, config: {titleConfig: {fontSize: 10}}},
  ]);
  viz.titleConfig({fontColor: "red", fontSize: 20});
  const own = viz.schema.titleConfig;
  applyResponsive(viz);
  assert.strictEqual(viz.schema.titleConfig.fontSize, 10);
  assert.strictEqual(viz.schema.titleConfig.fontColor, "red");
  resize(viz, 900);
  assert.strictEqual(viz.schema.titleConfig, own);
});

it("merges every breakpoint in range in list order, later entries winning", () => {
  const viz = chart(400, [
    {maxWidth: 800, config: {titleConfig: {fontSize: 12, fontColor: "red"}}},
    {maxWidth: 480, config: {titleConfig: {fontSize: 10}}},
  ]);
  const own = viz.schema.titleConfig;
  applyResponsive(viz);
  assert.strictEqual(viz.schema.titleConfig.fontSize, 10);
  assert.strictEqual(viz.schema.titleConfig.fontColor, "red");
  resize(viz, 600);
  assert.strictEqual(viz.schema.titleConfig.fontSize, 12);
  resize(viz, 900);
  assert.strictEqual(viz.schema.titleConfig, own);
});

it("restores config a chart keeps outside its schema (Plot's xConfig)", () => {
  const viz = chart(
    400,
    [{maxWidth: 480, config: {xConfig: {ticks: 3}}}],
    BarChart,
  );
  viz.xConfig({title: "Year"});
  const own = viz.xConfig();
  applyResponsive(viz);
  assert.strictEqual(viz.xConfig().ticks, 3);
  assert.strictEqual(viz.xConfig().title, "Year");
  resize(viz, 900);
  assert.strictEqual(viz.xConfig(), own);
});

it("a setter called while a breakpoint holds its key updates the restored value", () => {
  const viz = chart(400, [
    {maxWidth: 480, config: {legend: false, titleConfig: {fontSize: 10}}},
  ]);
  viz.titleConfig({fontColor: "red"});
  const fontSize = viz.schema.titleConfig.fontSize;
  applyResponsive(viz);
  viz.legend(true).titleConfig({fontWeight: 700});
  assert.strictEqual(viz.schema.legend(), false, "the breakpoint still wins");
  assert.strictEqual(viz.schema.titleConfig.fontSize, 10);
  assert.strictEqual(viz.schema.titleConfig.fontWeight, 700);
  resize(viz, 900);
  assert.strictEqual(viz.schema.legend(), true);
  const {titleConfig} = viz.schema;
  assert.strictEqual(titleConfig.fontColor, "red");
  assert.strictEqual(titleConfig.fontWeight, 700, "the user's call is kept");
  assert.strictEqual(titleConfig.fontSize, fontSize, "the breakpoint's is not");
});

it("keeps a value the user sets equal to the breakpoint's", () => {
  const viz = chart(400, [{maxWidth: 480, config: {legend: false}}]);
  applyResponsive(viz);
  viz.legend(false);
  resize(viz, 900);
  assert.strictEqual(viz.schema.legend(), false);
});

it("config() and RESET reach the chart's own value while a breakpoint holds the key", () => {
  const viz = chart(400, [{maxWidth: 480, config: {legend: false}}]);
  const legend = viz.schema.legend;
  viz.config({legend: true});
  applyResponsive(viz);
  viz.config({legend: RESET});
  resize(viz, 900);
  assert.strictEqual(viz.schema.legend, legend, "RESET restored the default");
});

it("leaves a key alone that something else changed while a breakpoint held it", () => {
  const viz = chart(400, [{maxWidth: 480, config: {legendPadding: 2}}]);
  applyResponsive(viz);
  const changed = () => 9;
  viz.schema.legendPadding = changed;
  resize(viz, 900);
  assert.strictEqual(viz.schema.legendPadding, changed);
});

it("a new responsive list replaces the applied breakpoints", () => {
  const viz = chart(400, [{maxWidth: 480, config: {legend: false}}]);
  viz.legend(true);
  const fontSize = viz.schema.titleConfig.fontSize;
  applyResponsive(viz);
  viz.responsive([{maxWidth: 480, config: {titleConfig: {fontSize: 10}}}]);
  assert.strictEqual(applyResponsive(viz), true);
  assert.strictEqual(viz.schema.legend(), true);
  assert.strictEqual(viz.schema.titleConfig.fontSize, 10);
  viz.responsive(RESET);
  applyResponsive(viz);
  assert.strictEqual(viz.schema.titleConfig.fontSize, fontSize);
});

it("waits for a width, and skips a chart with no breakpoints", () => {
  const viz = new Treemap().responsive([
    {maxWidth: 480, config: {legend: false}},
  ]);
  assert.strictEqual(applyResponsive(viz), false);
  assert.strictEqual(applyResponsive(new Treemap()), false);
});

it("warns about, and ignores, the keys a breakpoint cannot set", () => {
  const warned = [];
  const warn = console.warn;
  console.warn = msg => warned.push(msg);
  try {
    configWarnings(true);
    const viz = chart(400, [
      {maxWidth: 480, config: {width: 200, height: 100, legend: false}},
    ]);
    applyResponsive(viz);
    assert.strictEqual(viz.schema.width, 400);
    assert.strictEqual(viz.schema.height, undefined);
    assert.strictEqual(viz.schema.legend(), false);
  } finally {
    console.warn = warn;
  }
  assert.ok(warned.some(m => /cannot set "width"/.test(m)));
  assert.ok(warned.some(m => /cannot set "height"/.test(m)));
});

it("matches a letterboxed chart's width, not the narrower width it draws at", () => {
  const viz = chart(900, [{maxWidth: 800, config: {legend: false}}]);
  viz._letterbox = {width: 900, offset: 100, drawn: 700};
  viz.legend(true);
  assert.strictEqual(chartWidth(viz), 700);
  assert.strictEqual(applyResponsive(viz), true);
  assert.strictEqual(viz.schema.legend(), true, "900 is out of range");
  resize(viz, 700);
  assert.strictEqual(viz.schema.legend(), false, "700 is in range");
});
