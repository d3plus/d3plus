import assert from "assert";
import it from "../jsdom.js";
import {Radar, RESET} from "../../es/index.js";

/**
    Radar's ring styles (`axisConfig.gridConfig` / `barConfig`) and
    `levelLabelConfig` are deep-merged config bags: a nested override keeps
    its siblings, `fontFamily()` leaves them alone, and RESET restores the
    chart's defaults.
*/

const ringDefaults = viz => {
  const {gridConfig, barConfig} = viz.axisConfig();
  return {grid: gridConfig, bar: barConfig};
};

it("Radar axisConfig seeds Plot-style ring defaults", () => {
  const {grid, bar} = ringDefaults(new Radar());
  assert.strictEqual(typeof grid.stroke, "function", "gridline stroke follows the background");
  assert.strictEqual(grid.strokeWidth, 1);
  assert.strictEqual(grid.stroke(), "#e9ecef", "light gridline gray off-DOM");
  assert.strictEqual(typeof bar.stroke, "function", "axis-line stroke follows the background ink");
  assert.strictEqual(bar.strokeWidth, 1);
});

it("Radar axisConfig: a nested ring override keeps its siblings and the other bags", () => {
  const viz = new Radar();
  const before = ringDefaults(viz);
  viz.axisConfig({gridConfig: {strokeDasharray: "4 2"}});
  viz.config({axisConfig: {barConfig: {strokeWidth: 3}}});
  const {grid, bar} = ringDefaults(viz);
  assert.strictEqual(grid.strokeDasharray, "4 2");
  assert.strictEqual(grid.stroke, before.grid.stroke, "grid stroke kept");
  assert.strictEqual(grid.strokeWidth, 1, "grid strokeWidth kept");
  assert.strictEqual(bar.strokeWidth, 3);
  assert.strictEqual(bar.stroke, before.bar.stroke, "bar stroke kept");
  assert.strictEqual(viz.axisConfig().shapeConfig.labelConfig.verticalAlign, "middle", "label defaults kept");
});

it("Radar axisConfig: RESET restores the ring defaults", () => {
  const viz = new Radar();
  const before = ringDefaults(viz);
  viz.config({axisConfig: {gridConfig: {stroke: "red", strokeWidth: 2}, barConfig: {stroke: "blue"}}});
  viz.config({axisConfig: {gridConfig: {stroke: RESET}}});
  let {grid, bar} = ringDefaults(viz);
  assert.strictEqual(grid.stroke, before.grid.stroke, "one nested key restored");
  assert.strictEqual(grid.strokeWidth, 2, "its sibling override kept");
  assert.strictEqual(bar.stroke, "blue");

  viz.config({axisConfig: {gridConfig: RESET, barConfig: RESET}});
  ({grid, bar} = ringDefaults(viz));
  assert.deepStrictEqual(Object.keys(grid).sort(), ["stroke", "strokeWidth"], "gridConfig restored exactly");
  assert.strictEqual(grid.strokeWidth, 1);
  assert.strictEqual(bar.stroke, before.bar.stroke);
});

it("fontFamily() keeps the Radar ring defaults", () => {
  const viz = new Radar().axisConfig({gridConfig: {strokeDasharray: "2 2"}});
  const before = ringDefaults(viz);
  viz.fontFamily("monospace");
  const {grid, bar} = ringDefaults(viz);
  assert.strictEqual(grid.stroke, before.grid.stroke);
  assert.strictEqual(grid.strokeDasharray, "2 2", "user ring override kept");
  assert.strictEqual(bar.stroke, before.bar.stroke);
  assert.strictEqual(viz.axisConfig().shapeConfig.labelConfig.fontFamily, "monospace");
});

it("Radar levelLabelConfig deep-merges and RESET restores it", () => {
  const viz = new Radar();
  assert.deepStrictEqual(viz.levelLabelConfig(), {});
  viz.config({levelLabelConfig: {fontSize: 12, fontWeight: 600}});
  viz.levelLabelConfig({fontColor: "red"});
  assert.deepStrictEqual(viz.levelLabelConfig(), {fontSize: 12, fontWeight: 600, fontColor: "red"});
  viz.config({levelLabelConfig: {fontSize: RESET}});
  assert.deepStrictEqual(viz.levelLabelConfig(), {fontWeight: 600, fontColor: "red"});
  viz.config({levelLabelConfig: RESET});
  assert.deepStrictEqual(viz.levelLabelConfig(), {});
});

it("Radar config with ring, level, and padding keys raises no config warnings", () => {
  const warn = console.warn;
  const warnings = [];
  console.warn = msg => warnings.push(msg);
  try {
    new Radar().config({
      axisConfig: {barConfig: {stroke: "#495057"}, gridConfig: {"stroke-width": 2}, shapeConfig: {stroke: "#adb5bd"}},
      levelFormat: d => `${d}%`,
      levelLabelAngle: 22.5,
      levelLabelConfig: {fontSize: 11},
      levelLabels: true,
      levels: [0, 50, 100],
      outerPadding: "auto",
      shapeConfig: {Path: {opacity: 0.7}},
    });
  }
  finally {
    console.warn = warn;
  }
  assert.deepStrictEqual(warnings, []);
});
