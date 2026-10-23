import {it} from "vitest";
import assert from "assert";
// The package entry loads first so the shape modules resolve in their usual order.
import {Box} from "../../index.ts";
import {
  boxMedianConfig,
  boxMedianInk,
  boxOutlierConfig,
  boxRectConfig,
} from "../../src/shapes/boxStyle.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const box = {data: {id: "alpha", value: 300}, i: 4, key: "alpha", values: []};

it("boxRectConfig: passes the Box's texture and backgroundImage to its box Rect", () => {
  const config = boxRectConfig(
    {
      texture: () => "lines",
      textureDefault: {size: 6},
      backgroundImage: () => "a.png",
      backgroundImageFit: () => "contain",
    },
    {fill: "white"},
  );
  assert.strictEqual(config.fill, "white");
  assert.strictEqual(config.texture(box, 0), "lines");
  assert.deepStrictEqual(config.textureDefault, {size: 6});
  assert.strictEqual(config.backgroundImage(box, 0), "a.png");
  assert.strictEqual(config.backgroundImageFit(box, 0), "contain");
});

it("boxRectConfig: passes the Box's fill and stroke to its box Rect", () => {
  const config = boxRectConfig(
    {fill: d => (d.id === "alpha" ? "tomato" : "gray"), stroke: "navy"},
    {strokeWidth: 1},
  );
  assert.strictEqual(config.fill(box, 0), "tomato");
  assert.strictEqual(config.stroke, "navy");
  assert.strictEqual(config.strokeWidth, 1);
});

it("boxRectConfig: resolves accessors against the box's merged datum and index", () => {
  const seen = [];
  const config = boxRectConfig(
    {texture: (d, i) => (seen.push([d, i]), d.id === "alpha" ? "grid" : false)},
    {},
  );
  assert.strictEqual(config.texture(box, 0), "grid");
  assert.deepStrictEqual(seen, [[box.data, 4]]);
});

it("boxRectConfig: rectConfig overrides the Box's own keys", () => {
  const config = boxRectConfig(
    {
      fill: () => "tomato",
      stroke: () => "navy",
      texture: () => "lines",
      backgroundImage: () => "a.png",
    },
    {fill: "white", stroke: "black", texture: false, backgroundImage: "b.png"},
  );
  assert.strictEqual(config.fill, "white");
  assert.strictEqual(config.stroke, "black");
  assert.strictEqual(config.texture, false);
  assert.strictEqual(config.backgroundImage, "b.png");
});

it("boxRectConfig: a white fill and black stroke where neither sets them", () => {
  assert.deepStrictEqual(boxRectConfig({}, {strokeWidth: 1}), {
    fill: "white",
    stroke: "black",
    strokeWidth: 1,
  });
});

it("boxMedianInk: black over light fills, white over dark ones", () => {
  assert.strictEqual(boxMedianInk("white"), "black");
  assert.strictEqual(boxMedianInk("#ffd43b"), "black");
  assert.strictEqual(boxMedianInk("#4c6ef5"), "black");
  assert.strictEqual(boxMedianInk("#1a1b4b"), "white");
  assert.strictEqual(boxMedianInk("black"), "white");
});

it("boxMedianInk: black when the fill isn't an opaque color", () => {
  assert.strictEqual(boxMedianInk("none"), "black");
  assert.strictEqual(boxMedianInk("transparent"), "black");
  assert.strictEqual(boxMedianInk("url(#pattern)"), "black");
  assert.strictEqual(boxMedianInk(undefined), "black");
});

it("boxMedianConfig: contrasts with the box fill, resolved on the same datum", () => {
  const seen = [];
  const config = boxMedianConfig(
    (d, i) => (seen.push([d, i]), d.key === "alpha" ? "#1a1b4b" : "white"),
    {duration: 0},
  );
  assert.strictEqual(config.fill(box, 2), "white");
  assert.strictEqual(config.fill({...box, key: "beta"}, 3), "black");
  assert.deepStrictEqual(seen, [
    [box, 2],
    [{...box, key: "beta"}, 3],
  ]);
  assert.strictEqual(config.duration, 0);
  assert.strictEqual(boxMedianConfig("black", {}).fill(box, 0), "white");
});

it("boxMedianConfig: medianConfig.fill wins", () => {
  const medianConfig = {fill: "red"};
  assert.strictEqual(boxMedianConfig("black", medianConfig), medianConfig);
});

it("boxOutlierConfig: outliers take the Box's fill, resolved on their observation", () => {
  const seen = [];
  const outlier = {data: {id: "beta", value: 9}, i: 7};
  const config = boxOutlierConfig(
    {fill: (d, i) => (seen.push([d, i]), d.id === "beta" ? "teal" : "gray")},
    {r: 5},
  );
  assert.strictEqual(config.fill(outlier, 0), "teal");
  assert.deepStrictEqual(seen, [[outlier.data, 7]]);
  assert.strictEqual(config.r, 5);
  assert.strictEqual(boxOutlierConfig({fill: "teal"}, {}).fill, "teal");
});

it("boxOutlierConfig: outlierConfig.fill wins, and an unset Box fill adds none", () => {
  const outlierConfig = {fill: "red"};
  assert.strictEqual(
    boxOutlierConfig({fill: () => "teal"}, outlierConfig),
    outlierConfig,
  );
  assert.deepStrictEqual(boxOutlierConfig({}, {r: 5}), {r: 5});
});

const rows = [
  {key: "A", v: 1, tone: "dark"},
  {key: "A", v: 2, tone: "dark"},
  {key: "A", v: 3, tone: "dark"},
  {key: "A", v: 4, tone: "dark"},
  {key: "A", v: 50, tone: "dark"},
  {key: "B", v: 6, tone: "light"},
  {key: "B", v: 7, tone: "light"},
  {key: "B", v: 8, tone: "light"},
  {key: "B", v: 9, tone: "light"},
];

/** The fill and stroke of each scene node the Box draws, by key. */
const paints = box => {
  const out = {};
  for (const n of box.toScene().children)
    out[n.key] = {fill: n.paint?.fill, stroke: n.paint?.stroke};
  return out;
};

it("Box: a white box with a black outline and median when no fill is set", () => {
  const box = new Box()
    .data(rows)
    .x(d => d.key)
    .y(d => d.v)
    .renderMode("compute")
    .render();
  const p = paints(box);
  assert.deepStrictEqual(p["A-box"], {fill: "white", stroke: "black"});
  assert.strictEqual(p["A-median"].fill, "black");
  assert.strictEqual(p["A-outlier-4"].fill, "black");
});

it("Box: fill colors the box and outliers, and the median contrasts with it", () => {
  const box = new Box()
    .data(rows)
    .x(d => d.key)
    .y(d => d.v)
    .fill(d => (d.tone === "dark" ? "#1a1b4b" : "#ffd43b"))
    .stroke("gray")
    .renderMode("compute")
    .render();
  const p = paints(box);
  assert.deepStrictEqual(p["A-box"], {fill: "#1a1b4b", stroke: "gray"});
  assert.deepStrictEqual(p["B-box"], {fill: "#ffd43b", stroke: "gray"});
  assert.strictEqual(p["A-median"].fill, "white");
  assert.strictEqual(p["B-median"].fill, "black");
  assert.strictEqual(p["A-outlier-4"].fill, "#1a1b4b");
});

it("Box: rectConfig, medianConfig and outlierConfig fills win over fill", () => {
  const box = new Box()
    .data(rows)
    .x(d => d.key)
    .y(d => d.v)
    .fill("#1a1b4b")
    .rectConfig({fill: "white"})
    .medianConfig({fill: "red"})
    .outlierConfig({Circle: {fill: "green"}})
    .renderMode("compute")
    .render();
  const p = paints(box);
  assert.strictEqual(p["A-box"].fill, "white");
  assert.strictEqual(p["A-median"].fill, "red");
  assert.strictEqual(p["A-outlier-4"].fill, "green");
});

it("box style helpers keep a configPrep'd config marked as shared", async () => {
  const {isSharedConfig, markSharedConfig} =
    await import("../../src/utils/configWarnings.ts");
  const prepped = () => markSharedConfig({Circle: {r: 5}, Rect: {}});
  assert.ok(isSharedConfig(boxRectConfig({fill: "red"}, prepped())));
  assert.ok(isSharedConfig(boxMedianConfig("red", prepped())));
  assert.ok(isSharedConfig(boxOutlierConfig({fill: "red"}, prepped())));
  assert.ok(!isSharedConfig(boxOutlierConfig({fill: "red"}, {r: 5})));
});
