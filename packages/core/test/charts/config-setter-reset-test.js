import assert from "assert";
import it from "../jsdom.js";
import * as core from "../../es/index.js";
import {RESOLVES_RESET} from "../../es/src/fluent.js";

const {
  Axis,
  BarChart,
  Box,
  ColorScale,
  Legend,
  LinePlot,
  Plot,
  RESET,
  Rect,
  SizeLegend,
  Timeline,
  Tooltip,
  Treemap,
  Whisker,
} = core;

/** Deep copy that keeps function identity, for comparing within one instance. */
function freeze(value) {
  if (Array.isArray(value)) return value.map(freeze);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, freeze(v)]));
  }
  return value;
}

/** Structure with every function replaced by a marker, for comparing across instances. */
function shape(value) {
  if (typeof value === "function") return "[fn]";
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return value;
}

/**
    [label, make, setter, set, nested reset] for every hand-written config-bag
    setter. `set` overrides nested and top-level keys; the reset patch puts
    RESET on each of them (on the parent object where the default has none,
    since a nested RESET leaves its emptied parent in place).
*/
const SETTERS = [
  ["Treemap", () => new Treemap(), "shapeConfig", {fill: "red", labelConfig: {fontSize: 30}}, {fill: RESET, labelConfig: {fontSize: RESET}}],
  ["Treemap", () => new Treemap(), "tooltipConfig", {title: () => "t", tooltipStyle: {padding: "1px"}}, {title: RESET, tooltipStyle: RESET}],
  ["Treemap", () => new Treemap(), "legendTooltip", {title: () => "t", titleStyle: {color: "red"}}, {title: RESET, titleStyle: RESET}],
  ["Treemap", () => new Treemap(), "titleConfig", {fontSize: 40, padding: 9}, {fontSize: RESET, padding: RESET}],
  ["Treemap", () => new Treemap(), "subtitleConfig", {fontSize: 40, padding: 9}, {fontSize: RESET, padding: RESET}],
  ["Treemap", () => new Treemap(), "totalConfig", {fontSize: 40, padding: 9}, {fontSize: RESET, padding: RESET}],
  ["Treemap", () => new Treemap(), "legendConfig", {shapeConfig: {width: 99, labelConfig: {fontSize: 3}}}, {shapeConfig: {width: RESET, labelConfig: RESET}}],
  ["Treemap", () => new Treemap(), "legendInsetConfig", {padding: 9}, {padding: RESET}],
  ["Treemap", () => new Treemap(), "colorScaleConfig", {axisConfig: {rounding: "none"}, scale: "log"}, {axisConfig: {rounding: RESET}, scale: RESET}],
  ["Treemap", () => new Treemap(), "timelineConfig", {brushing: true, shapeConfig: {fill: "red"}}, {brushing: RESET, shapeConfig: RESET}],
  ["Treemap", () => new Treemap(), "backConfig", {fontSize: 40}, {fontSize: RESET}],
  ["Treemap", () => new Treemap(), "attributionStyle", {color: "red"}, {color: RESET}],
  ["Treemap", () => new Treemap(), "messageStyle", {color: "red"}, {color: RESET}],
  ["Treemap", () => new Treemap(), "sizeLegendConfig", {padding: 9, labelConfig: {fontSize: 3}}, {padding: RESET, labelConfig: RESET}],
  ["Treemap", () => new Treemap(), "aggs", {value: () => 1}, {value: RESET}],
  ["BarChart", () => new BarChart(), "shapeConfig", {Bar: {stroke: "red"}, fill: "red"}, {Bar: {stroke: RESET}, fill: RESET}],
  ["LinePlot", () => new LinePlot(), "xConfig", {gridConfig: {stroke: "red"}, title: "X"}, {gridConfig: {stroke: RESET}, title: RESET}],
  ["LinePlot", () => new LinePlot(), "yConfig", {gridConfig: {stroke: "red"}, domain: [0, 10]}, {gridConfig: {stroke: RESET}, domain: RESET}],
  ["LinePlot", () => new LinePlot(), "x2Config", {gridConfig: {stroke: "red"}}, {gridConfig: RESET}],
  ["LinePlot", () => new LinePlot(), "y2Config", {gridConfig: {stroke: "red"}}, {gridConfig: RESET}],
  ["LinePlot", () => new LinePlot(), "confidenceConfig", {fillOpacity: 0.1}, {fillOpacity: RESET}],
  ["LinePlot", () => new LinePlot(), "crosshairConfig", {stroke: "red", strokeWidth: 3}, {stroke: RESET, strokeWidth: RESET}],
  ["LinePlot", () => new LinePlot(), "trendLineConfig", {stroke: "red"}, {stroke: RESET}],
  ["LinePlot", () => new LinePlot(), "lineMarkerConfig", {r: 9, fill: "red"}, {r: RESET, fill: RESET}],
  ["LinePlot", () => new LinePlot(), "labelConnectorConfig", {strokeDasharray: "2 2"}, {strokeDasharray: RESET}],
  ["Plot", () => new Plot(), "backgroundConfig", {fill: "red"}, {fill: RESET}],
  ["Axis", () => new Axis(), "shapeConfig", {labelConfig: {fontSize: 30}, stroke: "red"}, {labelConfig: {fontSize: RESET}, stroke: RESET}],
  ["Axis", () => new Axis(), "gridConfig", {stroke: "red", strokeWidth: 3}, {stroke: RESET, strokeWidth: RESET}],
  ["Axis", () => new Axis(), "titleConfig", {fontSize: 30}, {fontSize: RESET}],
  ["Axis", () => new Axis(), "barConfig", {stroke: "red"}, {stroke: RESET}],
  ["Axis", () => new Axis(), "breakConfig", {stroke: "red"}, {stroke: RESET}],
  ["Axis", () => new Axis(), "baselineBreakConfig", {stroke: "red"}, {stroke: RESET}],
  ["Legend", () => new Legend(), "shapeConfig", {labelConfig: {fontSize: 30}, width: 9}, {labelConfig: {fontSize: RESET}, width: RESET}],
  ["Legend", () => new Legend(), "titleConfig", {fontSize: 30}, {fontSize: RESET}],
  ["ColorScale", () => new ColorScale(), "axisConfig", {shapeConfig: {labelConfig: {fontSize: 3}}}, {shapeConfig: RESET}],
  ["ColorScale", () => new ColorScale(), "labelConfig", {fontSize: 30}, {fontSize: RESET}],
  ["ColorScale", () => new ColorScale(), "legendConfig", {shapeConfig: {width: 3}}, {shapeConfig: {width: RESET}}],
  ["ColorScale", () => new ColorScale(), "rectConfig", {stroke: "red"}, {stroke: RESET}],
  ["Timeline", () => new Timeline(), "handleConfig", {fill: "red"}, {fill: RESET}],
  ["Timeline", () => new Timeline(), "selectionConfig", {fill: "red"}, {fill: RESET}],
  ["Timeline", () => new Timeline(), "playButtonConfig", {fontSize: 30}, {fontSize: RESET}],
  ["Tooltip", () => new Tooltip(), "tooltipStyle", {padding: "1px"}, {padding: RESET}],
  ["Tooltip", () => new Tooltip(), "titleStyle", {color: "red"}, {color: RESET}],
  ["Tooltip", () => new Tooltip(), "tableStyle", {color: "red"}, {color: RESET}],
  ["SizeLegend", () => new SizeLegend(), "labelConfig", {fontSize: 30}, {fontSize: RESET}],
  ["SizeLegend", () => new SizeLegend(), "shapeConfig", {fill: "red"}, {fill: RESET}],
  ["Rect", () => new Rect(), "labelConfig", {fontSize: 30}, {fontSize: RESET}],
  ["Rect", () => new Rect(), "hoverStyle", {stroke: "red"}, {stroke: RESET}],
  ["Rect", () => new Rect(), "activeStyle", {stroke: "red"}, {stroke: RESET}],
  ["Box", () => new Box(), "medianConfig", {fill: "red"}, {fill: RESET}],
  ["Box", () => new Box(), "whiskerConfig", {endpointConfig: {fill: "red"}}, {endpointConfig: RESET}],
  ["Whisker", () => new Whisker(), "lineConfig", {stroke: "red"}, {stroke: RESET}],
];

for (const [label, make, key, set, reset] of SETTERS) {
  it(`${label}.${key}(): a direct nested RESET matches config() and restores the default`, () => {
    const direct = make();
    const before = freeze(direct[key]());
    direct.config();
    direct[key](set);
    assert.notDeepStrictEqual(freeze(direct[key]()), before, "the set changed the bag");
    direct[key](reset);
    assert.deepStrictEqual(freeze(direct[key]()), before, "direct RESET restores the default");

    const viaConfig = make();
    viaConfig.config({[key]: set});
    viaConfig.config({[key]: reset});
    assert.deepStrictEqual(shape(direct[key]()), shape(viaConfig[key]()), "direct and config() agree");

    direct[key](set);
    direct[key](RESET);
    assert.deepStrictEqual(freeze(direct[key]()), before, "a top-level RESET restores the whole bag");
  });
}

it("every hand-written setter that merges a config bag is tagged to resolve RESET", () => {
  const untagged = [];
  for (const [name, C] of Object.entries(core)) {
    if (typeof C !== "function" || !(C.prototype instanceof core.BaseClass || C === core.BaseClass)) continue;
    for (let p = C.prototype; p && p !== Object.prototype; p = Object.getPrototypeOf(p)) {
      for (const key of Object.getOwnPropertyNames(p)) {
        const fn = Object.getOwnPropertyDescriptor(p, key).value;
        if (typeof fn === "function" && fn.toString().includes("mergeConfigBag") && !fn[RESOLVES_RESET]) {
          untagged.push(`${name}.${key}`);
        }
      }
    }
  }
  assert.deepStrictEqual(untagged, []);
});

it("a direct shapeConfig RESET restores a Viz default without warning", () => {
  const warn = console.warn,
    warnings = [];
  console.warn = msg => warnings.push(msg);
  try {
    const viz = new Treemap();
    const fill = viz.shapeConfig().fill;
    viz.config({shapeConfig: {fill: "red"}});
    viz.shapeConfig({fill: RESET});
    assert.strictEqual(viz.shapeConfig().fill, fill);
    assert.notStrictEqual(viz.shapeConfig().fill, RESET);

    viz.shapeConfig({Rect: {labelConfig: {fontSize: 3}}});
    viz.shapeConfig({Rect: RESET});
    viz.shapeConfig(RESET);
    assert.strictEqual(viz.shapeConfig().fill, fill);
  } finally {
    console.warn = warn;
  }
  assert.deepStrictEqual(warnings, []);
});

it("a direct tooltipConfig RESET restores the chart's title function", () => {
  const viz = new Treemap();
  const title = viz.tooltipConfig().title;
  viz.config({tooltipConfig: {title: () => "mine"}});
  viz.tooltipConfig({title: RESET});
  assert.strictEqual(viz.tooltipConfig().title, title);
});

it("a direct xConfig RESET restores one nested grid default and keeps the rest", () => {
  const viz = new LinePlot();
  const {gridConfig} = viz.xConfig();
  viz.config({xConfig: {gridConfig: {stroke: "red", strokeWidth: 9}}});
  viz.xConfig({gridConfig: {stroke: RESET}});
  assert.strictEqual(viz.xConfig().gridConfig.stroke, gridConfig.stroke);
  assert.strictEqual(viz.xConfig().gridConfig.strokeWidth, 9);
});

it("a component's direct shapeConfig RESET restores its nested label default", () => {
  const axis = new Axis();
  const {fontSize} = axis.shapeConfig().labelConfig;
  axis.config({shapeConfig: {labelConfig: {fontSize: 40, fontColor: "red"}}});
  axis.shapeConfig({labelConfig: {fontSize: RESET}});
  assert.strictEqual(axis.shapeConfig().labelConfig.fontSize, fontSize);
  assert.strictEqual(axis.shapeConfig().labelConfig.fontColor, "red");
});

it("config() restores falsy shapeConfig and legendConfig defaults exactly", () => {
  const viz = new LinePlot();
  const fontResize = () => viz.shapeConfig().Line.labelConfig.fontResize;
  assert.strictEqual(fontResize(), false);
  viz.config({shapeConfig: {Line: {labelConfig: {fontResize: true}}}});
  viz.config({shapeConfig: {Line: {labelConfig: {fontResize: RESET}}}});
  assert.strictEqual(fontResize(), false);

  const padding = () => viz.legendConfig().shapeConfig.labelConfig.padding;
  assert.strictEqual(padding(), 0);
  viz.config({legendConfig: {shapeConfig: {labelConfig: {padding: 9}}}});
  viz.config({legendConfig: {shapeConfig: {labelConfig: {padding: RESET}}}});
  assert.strictEqual(padding(), 0);
});

it("config() restores a falsy default for a setter that leaves RESET to it", () => {
  const viz = new Plot();
  const {Bar} = viz.buffer();
  assert.strictEqual(Bar, false);
  viz.config({buffer: {Bar: true}});
  assert.notStrictEqual(viz.buffer().Bar, false);
  viz.config({buffer: {Bar: RESET}});
  assert.strictEqual(viz.buffer().Bar, false);
});

it("yConfig reverses a domain without mutating the caller's patch", () => {
  const viz = new LinePlot();
  const patch = {domain: [0, 10]};
  viz.yConfig(patch);
  assert.deepStrictEqual(viz.yConfig().domain, [10, 0]);
  assert.deepStrictEqual(patch.domain, [0, 10]);
});

it("setting a config bag never mutates the stored bag or a shared default", () => {
  const one = new Treemap();
  const two = new Treemap();
  const style = one.attributionStyle();
  one.attributionStyle({color: "red"});
  assert.notStrictEqual(style.color, "red", "the previous bag is untouched");
  assert.notStrictEqual(two.attributionStyle().color, "red", "other charts are untouched");
});
