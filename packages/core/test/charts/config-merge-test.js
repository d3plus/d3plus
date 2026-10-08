import assert from "assert";
import it from "../jsdom.js";
import {Gauge, Matrix, Pie, Priestley, Radar, RadialMatrix, RESET, Treemap} from "../../es/index.js";

const fontColorOf = viz => viz.axisConfig().shapeConfig.labelConfig.fontColor;

it("Radar axisConfig: a nested labelConfig key keeps the other axis defaults", () => {
  const viz = new Radar();
  const before = viz.axisConfig().shapeConfig;
  viz.axisConfig({shapeConfig: {labelConfig: {fontSize: 14}}});
  const {shapeConfig} = viz.axisConfig();
  assert.strictEqual(shapeConfig.labelConfig.fontSize, 14);
  assert.strictEqual(shapeConfig.labelConfig.fontColor, before.labelConfig.fontColor, "fontColor kept");
  assert.strictEqual(shapeConfig.labelConfig.verticalAlign, "middle", "verticalAlign kept");
  assert.strictEqual(shapeConfig.fill, before.fill, "fill kept");
  assert.strictEqual(shapeConfig.stroke, before.stroke, "stroke kept");
  assert.strictEqual(shapeConfig.strokeWidth, before.strokeWidth, "strokeWidth kept");
});

it("Radar axisConfig: RESET restores one nested default", () => {
  const viz = new Radar();
  viz.config({axisConfig: {shapeConfig: {labelConfig: {padding: 8, fontSize: 14}}}});
  viz.config({axisConfig: {shapeConfig: {labelConfig: {padding: RESET}}}});
  const {labelConfig} = viz.axisConfig().shapeConfig;
  assert.strictEqual(labelConfig.padding, 0, "padding restored");
  assert.strictEqual(labelConfig.fontSize, 14, "sibling override kept");

  viz.config({axisConfig: {shapeConfig: {labelConfig: RESET}}});
  assert.ok(!("fontSize" in viz.axisConfig().shapeConfig.labelConfig), "labelConfig restored exactly");
  assert.strictEqual(viz.axisConfig().shapeConfig.labelConfig.verticalAlign, "middle");
});

it("fontFamily() keeps the axis defaults of Radar, Priestley, Gauge, and Matrix", () => {
  const radar = new Radar();
  const radarColor = fontColorOf(radar);
  radar.fontFamily("monospace");
  const radarAxis = radar.axisConfig();
  assert.strictEqual(radarAxis.shapeConfig.labelConfig.fontFamily, "monospace");
  assert.strictEqual(fontColorOf(radar), radarColor, "Radar label fontColor kept");
  assert.strictEqual(radarAxis.shapeConfig.labelConfig.padding, 0, "Radar label padding kept");
  assert.ok(radarAxis.shapeConfig.stroke, "Radar axis stroke kept");
  assert.strictEqual(radarAxis.titleConfig.fontFamily, "monospace");

  const priestley = new Priestley().fontFamily("monospace");
  assert.strictEqual(priestley.axisConfig().scale, "time", "Priestley time scale kept");
  assert.strictEqual(priestley.axisConfig().shapeConfig.labelConfig.fontFamily, "monospace");

  const gauge = new Gauge().axisConfig({shapeConfig: {labelConfig: {fontSize: 9}}});
  gauge.fontFamily("monospace");
  assert.deepStrictEqual(
    gauge.axisConfig().shapeConfig.labelConfig,
    {fontSize: 9, fontFamily: "monospace"},
    "Gauge user axis label config kept",
  );

  const matrix = new Matrix().fontFamily("monospace");
  for (const key of ["rowConfig", "columnConfig"]) {
    const config = matrix[key]();
    assert.strictEqual(config.scale, "band", `Matrix ${key} scale kept`);
    assert.deepStrictEqual(config.barConfig, {stroke: 0}, `Matrix ${key} barConfig kept`);
    assert.strictEqual(config.shapeConfig.labelConfig.fontFamily, "monospace");
  }

  const radial = new RadialMatrix().fontFamily("monospace");
  const {labelConfig} = radial.columnConfig().shapeConfig;
  assert.strictEqual(labelConfig.fontFamily, "monospace");
  assert.strictEqual(labelConfig.padding, 5, "RadialMatrix column label padding kept");
  assert.strictEqual(typeof labelConfig.textAnchor, "function", "RadialMatrix textAnchor kept");
});

it("fontFamily() keeps the other tooltip styles", () => {
  const viz = new Treemap().tooltipConfig({tooltipStyle: {padding: "3px"}});
  viz.fontFamily("monospace");
  const {tooltipStyle, titleStyle} = viz.tooltipConfig();
  assert.strictEqual(tooltipStyle.padding, "3px");
  assert.ok(tooltipStyle["font-family"].includes("monospace"));
  assert.strictEqual(titleStyle["max-width"], "200px");
});

it("Treemap and Pie shapeConfig: a nested labelConfig key keeps the chart's label defaults", () => {
  const treemap = new Treemap().shapeConfig({labelConfig: {fontSize: 14}});
  assert.deepStrictEqual(
    {...treemap.shapeConfig().labelConfig, fontColor: undefined},
    {fontColor: undefined, fontMax: 32, fontMin: 8, fontResize: true, padding: 5, fontSize: 14},
  );
  assert.strictEqual(typeof treemap.shapeConfig().labelConfig.fontColor, "function", "fontColor kept");
  assert.strictEqual(typeof treemap.shapeConfig().ariaLabel, "function", "siblings kept");

  const pie = new Pie().shapeConfig({Path: {labelConfig: {fontSize: 14}}});
  assert.deepStrictEqual(pie.shapeConfig().Path.labelConfig, {fontResize: true, fontSize: 14});
  assert.strictEqual(pie.shapeConfig().strokeWidth, 2, "Pie strokeWidth kept");
});

it("matrix row and column defaults are not shared between instances", () => {
  const one = new Matrix().rowConfig({barConfig: {stroke: 2}});
  const two = new Matrix();
  assert.deepStrictEqual(one.rowConfig().barConfig, {stroke: 2});
  assert.deepStrictEqual(two.rowConfig().barConfig, {stroke: 0});
});
