import assert from "assert";
import {colorDefaults} from "@d3plus/color";
import {BaseClass, ColorScale, Pack, Rect, Treemap} from "../../es/index.js";
import {default as RESET} from "../../es/src/utils/RESET.js";
import {render, closeBrowser} from "../playwright.js";
import {computeColorScale} from "../../es/src/components/ColorScale/colorScaleScale.js";

it("colorDefaults() starts from the @d3plus/color defaults and merges overrides", () => {
  const base = new BaseClass();
  const initial = base.colorDefaults();
  for (const key of ["dark", "light", "missing", "off", "on", "sequential"])
    assert.strictEqual(initial[key], colorDefaults[key], key);

  base.colorDefaults({dark: "#111111"}).colorDefaults({light: "#eeeeee"});
  assert.strictEqual(base.colorDefaults().dark, "#111111", "first override kept");
  assert.strictEqual(base.colorDefaults().light, "#eeeeee", "second override merged");
  assert.strictEqual(base.colorDefaults().missing, colorDefaults.missing, "untouched keys keep defaults");
  assert.strictEqual(colorDefaults.dark, "#495057", "library defaults are not mutated");
});

it("colorDefaults() scale accepts an array of colors", () => {
  const viz = new Treemap().colorDefaults({scale: ["#aa0000", "#00aa00"]});
  const fill = viz.schema.shapeConfig.fill;
  assert.strictEqual(fill({id: "a"}, 0), "#aa0000");
  assert.strictEqual(fill({id: "b"}, 1), "#00aa00");
  assert.strictEqual(fill({id: "a"}, 2), "#aa0000", "stable per key");
});

it("each viz keeps its own categorical scale", () => {
  const one = new Treemap();
  const two = new Treemap();
  one.schema.shapeConfig.fill({id: "x"}, 0);
  assert.strictEqual(
    two.schema.shapeConfig.fill({id: "y"}, 0),
    one.schema.shapeConfig.fill({id: "x"}, 0),
    "first key of each viz gets the first palette slot",
  );
});

it("viz colorDefaults() drive fills, label contrast, and child components", () => {
  const viz = new Pack().colorDefaults({
    dark: "#010101",
    light: "#fefefe",
    sequential: "#00ff00",
  });
  const {shapeConfig} = viz.schema;

  viz.color(() => "#000000");
  assert.strictEqual(shapeConfig.labelConfig.fontColor({}, 0), "#fefefe", "light text on dark fill");
  viz.color(() => "#ffffff");
  assert.strictEqual(shapeConfig.labelConfig.fontColor({}, 0), "#010101", "dark text on light fill");

  assert.strictEqual(viz._tooltipClass.schema.background({}, 0), "#fefefe", "tooltip background");
  assert.strictEqual(viz._legendClass.colorDefaults().dark, "#010101", "legend");
  assert.strictEqual(viz._timelineClass.colorDefaults().dark, "#010101", "timeline");
  assert.strictEqual(viz._colorScaleClass.colorDefaults().sequential, "#00ff00", "color scale");
  assert.strictEqual(
    viz._colorScaleClass._axisClass.colorDefaults().dark,
    "#010101",
    "nested children of child components",
  );
});

it("colorDefaults RESET restores the viz defaults", () => {
  const viz = new Treemap();
  const scale = viz.colorDefaults().scale;
  viz.config({colorDefaults: {dark: "#123456", scale: ["#000000"]}});
  assert.strictEqual(viz.colorDefaults().dark, "#123456");
  viz.config({colorDefaults: RESET});
  assert.strictEqual(viz.colorDefaults().dark, colorDefaults.dark, "dark reset");
  assert.strictEqual(viz.colorDefaults().scale, scale, "viz-owned scale restored");
  assert.strictEqual(viz._legendClass.colorDefaults().dark, colorDefaults.dark, "children reset");
});

it("standalone shapes use their own colorDefaults for label contrast", () => {
  const rect = new Rect().fill("#000000").colorDefaults({light: "#fafafa"});
  assert.strictEqual(rect.schema.labelConfig.fontColor({}, 0), "#fafafa");
});

it("ColorScale poles fall back to colorDefaults when unset", () => {
  const data = [{v: 1}, {v: 2}, {v: 3}, {v: 4}];
  const cs = new ColorScale()
    .data(data)
    .value(d => d.v)
    .scale("linear")
    .colorDefaults({sequential: "#ff0000", light: "#ffffff"});
  const {colors} = computeColorScale(cs);
  assert.strictEqual(colors[colors.length - 1], "#ff0000", "high pole from sequential");

  cs.colorMax("#0000ff");
  const explicit = computeColorScale(cs).colors;
  assert.strictEqual(explicit[explicit.length - 1], "#0000ff", "explicit colorMax wins");
});

after(async () => {
  await closeBrowser();
});

it("a rendered chart paints fills and label text from the viz overrides", async function () {
  this.timeout(120000);
  const out = await render(
    '<div id="s" style="width:600px;height:400px;"></div>',
    async () => {
      const viz = new window.d3plus.Treemap()
        .select("#s")
        .duration(0)
        .legend(false)
        .data([
          {id: "alpha", value: 30},
          {id: "beta", value: 20},
        ])
        .colorDefaults({scale: ["#000000", "#ffffff"], dark: "#222222", light: "#dddddd"});
      await new Promise(resolve => viz.render(resolve));
      return {
        fills: [...document.querySelectorAll("#s svg rect")].map(r => r.getAttribute("fill")),
        text: [...document.querySelectorAll("#s svg text")].map(t => t.getAttribute("fill")),
      };
    },
  );
  assert.ok(out.fills.includes("#000000"), "first palette color painted");
  assert.ok(out.fills.includes("#ffffff"), "second palette color painted");
  assert.ok(out.text.includes("#dddddd"), "light text on the dark tile");
  assert.ok(out.text.includes("#222222"), "dark text on the light tile");
});
