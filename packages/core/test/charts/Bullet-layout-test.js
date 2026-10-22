import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Bullet} from "../../index.ts";
import {
  applyBulletLayout,
  bulletExtents,
  bulletKey,
  LABEL_LINE_GAP,
  NAME_FONT_SIZE,
  rowBands,
  rowNumber,
  rowValues,
  SUB_FONT_SIZE,
} from "../../src/charts/Bullet/applyLayout.ts";
import {
  bulletEmit,
  bulletStatics,
  bulletText,
} from "../../src/charts/Bullet/emit.ts";
import {
  bulletStyle,
  TICK_FONT_SIZE,
} from "../../src/charts/Bullet/bulletStyle.ts";
import {
  bulletDef,
  bulletFacet,
  bulletTooltipRows,
  MEASURE_OUTLINE,
  rowAccessor,
} from "../../src/charts/Bullet/index.ts";

useJsdom();

const kpis = [
  {id: "Revenue", unit: "US$", value: 270, target: 250, forecast: 290},
  {id: "Profit", unit: "%", value: 22.5, target: 27},
  {id: "Orders", unit: "count", value: 1650},
];

/** A Bullet with its schema defaults, wired up the way the pipeline leaves it before layout. */
function bullet(data = kpis, config = {}) {
  const viz = new Bullet().config({width: 600, height: 300, ...config});
  viz._filteredData = data;
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._ids = d => [d.id];
  viz._drawLabel = d => `${d.id}`;
  return viz;
}

it("Bullet: rowAccessor keeps functions, reads keys, and holds constants", () => {
  const fn = d => d.x;
  assert.strictEqual(rowAccessor(fn), fn);
  assert.strictEqual(rowAccessor("goal")({goal: 7}), 7);
  assert.strictEqual(rowAccessor(90)({}), 90);
  assert.strictEqual(rowAccessor(false), false);
  assert.strictEqual(rowAccessor(undefined), false);
  assert.strictEqual(rowAccessor(null), false);
});

it("Bullet: the def lists ctx then fields last, with config bags at the end", () => {
  const keys = Object.keys(bulletDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  const fields = bulletDef.fields.map(f => f.key);
  assert.deepStrictEqual(fields.slice(-4), [
    "forecastConfig",
    "shapeConfig",
    "targetConfig",
    "tooltipConfig",
  ]);
  assert.strictEqual(bulletDef.name, "Bullet");
});

it("Bullet: fluent defaults", () => {
  const viz = new Bullet();
  assert.deepStrictEqual(viz.bands(), []);
  assert.strictEqual(viz.bulletSize(), 40);
  assert.strictEqual(viz.measureSize(), 0.35);
  assert.strictEqual(viz.orient(), "horizontal");
  assert.strictEqual(viz.sharedDomain(), false);
  assert.strictEqual(viz.subLabel(), false);
  assert.strictEqual(viz.zoom(), false);
  assert.strictEqual(viz.target()({target: 4}), 4);
  assert.strictEqual(viz.forecast()({forecast: 5}), 5);
  assert.strictEqual(viz.value()({value: 6}), 6);
  assert.strictEqual(viz.target(false).target(), false, "target can be turned off");
  assert.strictEqual(viz.value(false).value()({value: 2}), 2, "value can't be turned off");
  assert.strictEqual(viz.forecastConfig().opacity, 0.35);
  assert.strictEqual(viz.targetConfig().strokeWidth, 3);
  assert.strictEqual(viz.shapeConfig().strokeWidth, MEASURE_OUTLINE);
});

it("Bullet: rowNumber reads numbers and treats missing values as NaN", () => {
  const acc = d => d.v;
  assert.strictEqual(rowNumber(acc, {v: "4"}, 0), 4);
  assert.ok(Number.isNaN(rowNumber(acc, {v: null}, 0)));
  assert.ok(Number.isNaN(rowNumber(acc, {}, 0)));
  assert.ok(Number.isNaN(rowNumber(acc, {v: ""}, 0)));
  assert.ok(Number.isNaN(rowNumber(false, {v: 3}, 0)));
});

it("Bullet: bulletKey joins the row's ids", () => {
  const viz = bullet();
  viz._ids = d => [d.a, d.b];
  assert.strictEqual(bulletKey(viz, {a: "x", b: "y"}, 0), "x-y");
});

it("Bullet: rowBands reads the shared bands or a per-row accessor", () => {
  assert.deepStrictEqual(rowBands(bullet(kpis, {bands: [50]}), kpis[0], 0), [{max: 50}, {}]);
  const viz = bullet(kpis, {bands: d => (d.id === "Profit" ? [20, 25] : [])});
  assert.deepStrictEqual(rowBands(viz, kpis[1], 1), [{max: 20}, {max: 25}, {}]);
  assert.deepStrictEqual(rowBands(viz, kpis[0], 0), []);
});

it("Bullet: rowValues reads the measure, target, and forecast", () => {
  const viz = bullet();
  assert.deepStrictEqual(rowValues(viz, kpis[0], 0), [270, 250, 290]);
  const [value, target, forecast] = rowValues(viz, kpis[2], 2);
  assert.strictEqual(value, 1650);
  assert.ok(Number.isNaN(target) && Number.isNaN(forecast));
  viz.target(100);
  assert.strictEqual(rowValues(viz, kpis[2], 2)[1], 100, "a constant target");
});

it("Bullet: bulletExtents groups rows by id, or into one shared extent", () => {
  const data = [...kpis, {id: "Revenue", value: 400}];
  const extents = bulletExtents(bullet(data, {bands: [100]}), data);
  assert.deepStrictEqual([...extents.keys()], ["Revenue", "Profit", "Orders"]);
  assert.deepStrictEqual(extents.get("Revenue").extent, [100, 400]);
  assert.deepStrictEqual(extents.get("Profit").extent, [22.5, 100]);
  const shared = bulletExtents(bullet(data, {sharedDomain: true}), data);
  assert.deepStrictEqual([...shared.keys()], ["*"]);
  assert.deepStrictEqual(shared.get("*").extent, [22.5, 1650]);
  const perRow = bulletExtents(bullet(kpis, {domain: d => [0, d.value * 2]}), kpis);
  assert.deepStrictEqual(perRow.get("Profit").input, [0, 45], "a per-row domain");
});

it("Bullet: bulletStyle derives theme colors and reads axisConfig", () => {
  const viz = bullet();
  const style = bulletStyle(viz, kpis[0], 0);
  assert.strictEqual(style.background, "rgb(255, 255, 255)");
  assert.ok(/^rgb/.test(style.fontColor) || /^#/.test(style.fontColor));
  assert.strictEqual(style.mix(0), "rgb(255, 255, 255)");
  assert.notStrictEqual(style.trackFill, style.tickStroke);
  assert.strictEqual(style.tickFontSize, TICK_FONT_SIZE);
  assert.strictEqual(style.tickFormat(1500), "1.5k");
  viz.axisConfig({
    shapeConfig: {fill: "pink", stroke: "navy", labelConfig: {fontColor: "red", fontSize: 14}},
  });
  const custom = bulletStyle(viz, kpis[0], 0);
  assert.strictEqual(custom.trackFill, "pink");
  assert.strictEqual(custom.tickStroke, "navy");
  assert.strictEqual(custom.fontColor, "red");
  assert.strictEqual(custom.tickFontSize, 14);
});

it("Bullet: bulletTooltipRows lists the values a row has", () => {
  const viz = bullet();
  viz.schema.translate = s => `[${s}]`;
  assert.deepStrictEqual(bulletTooltipRows(viz, kpis[0], 0), [
    ["[Value]", "270"],
    ["[Target]", "250"],
    ["[Forecast]", "290"],
  ]);
  assert.deepStrictEqual(bulletTooltipRows(viz, kpis[2], 2), [["[Value]", "1.65k"]]);
});

it("Bullet: applyBulletLayout lays out one bullet per row", () => {
  const viz = bullet(kpis, {bands: [100, 200], subLabel: "unit"});
  const {shapeData} = applyBulletLayout({viz});
  assert.strictEqual(shapeData.length, 3);
  const [rev, profit, orders] = shapeData;
  assert.ok(shapeData.every((b, i) => b.__d3plus__ && b.i === i && b.data === kpis[i]));
  assert.deepStrictEqual(
    [rev.key, rev.name, rev.subLabel, rev.value, rev.target, rev.forecast],
    ["Revenue", "Revenue", "US$", 270, 250, 290],
  );
  assert.ok(Number.isNaN(orders.target));
  assert.strictEqual(rev.track.orient, "horizontal");
  assert.strictEqual(rev.track.domain[0], 0);
  assert.ok(rev.track.domain[1] >= 290, "the domain covers the forecast");
  assert.deepStrictEqual(rev.ticks[0], 0);
  assert.strictEqual(rev.ticks[rev.ticks.length - 1], rev.track.domain[1]);
  assert.strictEqual(rev.bands.length, 3);
  assert.strictEqual(rev.bands[0].max, 100);
  assert.ok(profit.track.band.y > rev.track.band.y, "rows stack downward");
  assert.ok(shapeData.every(b => b.axis), "every row has its own axis");
  const shared = viz.ctx.bullet;
  assert.strictEqual(shared.orient, "horizontal");
  assert.strictEqual(shared.nameFontSize, NAME_FONT_SIZE);
  assert.strictEqual(shared.subFontSize, SUB_FONT_SIZE);
  assert.ok(LABEL_LINE_GAP > 0);
});

it("Bullet: applyBulletLayout shares a domain, reads facet extents, and runs vertical", () => {
  const shared = bullet(kpis, {sharedDomain: true});
  const rows = applyBulletLayout({viz: shared}).shapeData;
  assert.ok(rows.every(b => b.track.domain.join() === rows[0].track.domain.join()));
  assert.deepStrictEqual(rows.map(b => b.axis), [false, false, true]);
  assert.ok(rows.slice(0, 2).every(b => !b.ticks.length));

  const faceted = bullet(kpis);
  faceted.ctx.bulletFacet = bulletExtents(faceted, [...kpis, {id: "Profit", value: 900}]);
  const profit = applyBulletLayout({viz: faceted}).shapeData[1];
  assert.ok(profit.track.domain[1] >= 900, "a facet-shared extent wins");

  const vertical = bullet(kpis, {orient: "vertical"});
  const cols = applyBulletLayout({viz: vertical}).shapeData;
  assert.ok(cols[1].track.band.x > cols[0].track.band.x, "columns run left to right");
  assert.ok(cols[0].track.band.height > cols[0].track.band.width);

  const empty = bullet([]);
  assert.deepStrictEqual(applyBulletLayout({viz: empty}).shapeData, []);
});

it("Bullet: bulletFacet asks for wide panels and shares extents across panels", () => {
  assert.strictEqual(bulletFacet.aspect, 2);
  const viz = bullet();
  const scales = bulletFacet.share(viz, [[kpis[0]], [{id: "Revenue", value: 900}]]);
  assert.deepStrictEqual(scales.get("Revenue").extent, [250, 900]);
  const undo = bulletFacet.panel(viz, {shared: true, scales});
  assert.strictEqual(viz.ctx.bulletFacet, scales);
  undo();
  assert.strictEqual(viz.ctx.bulletFacet, undefined);
  bulletFacet.panel(viz, {shared: false, scales});
  assert.strictEqual(viz.ctx.bulletFacet, undefined, "independent panels fit their own");
});

it("Bullet: bulletText anchors a single-line label", () => {
  const node = bulletText("k", "Hello", 10, 20, {
    size: 12,
    family: "Arial",
    color: "red",
    anchor: "end",
    width: 30,
    weight: 600,
  });
  assert.strictEqual(node.type, "text");
  assert.deepStrictEqual(node.transform, {x: 10, y: 20});
  assert.deepStrictEqual(node.lines, [{text: "Hello", x: 0, y: 0, width: 30}]);
  assert.strictEqual(node.font.anchor, "end");
  assert.strictEqual(node.font.weight, 600);
  assert.strictEqual(node.font.baseline, "middle");
  assert.strictEqual(node.paint.fill, "red");
  assert.strictEqual(bulletText("k", "x", 0, 0, {size: 1, family: "", color: "", anchor: "start", width: 1}).font.weight, 400);
});

it("Bullet: bulletStatics draws the track, bands, and axis as static nodes", () => {
  const viz = bullet(kpis, {bands: [100, 200]});
  const [rev] = applyBulletLayout({viz}).shapeData;
  const nodes = bulletStatics(rev, "b", viz.ctx.bullet.style);
  const keys = nodes.map(n => n.key);
  assert.deepStrictEqual(keys.slice(0, 5), ["b-track", "b-band-0", "b-band-1", "b-band-2", "b-ticks"]);
  assert.strictEqual(keys.filter(k => k.startsWith("b-tick-")).length, rev.ticks.length);
  assert.ok(nodes.every(n => n.interactive === false && !n.datum));
  assert.notStrictEqual(nodes[1].paint.fill, nodes[3].paint.fill, "bands are shaded apart");
  const bare = bulletStatics({...rev, ticks: [], bands: []}, "c", viz.ctx.bullet.style);
  assert.deepStrictEqual(bare.map(n => n.key), ["c-track"]);
});

it("Bullet: bulletEmit draws a group per row with a hit area, labels, and marks", () => {
  const viz = bullet(kpis, {subLabel: "unit"});
  viz.schema.translate = s => s;
  const shapeData = applyBulletLayout({viz}).shapeData;
  const groups = bulletEmit({viz, shapeData});
  assert.deepStrictEqual(groups.map(g => g.key), ["bullet-Revenue", "bullet-Profit", "bullet-Orders"]);
  const kids = groups[0].children;
  assert.deepStrictEqual(kids.map(k => k.key), [
    "bullet-Revenue-static",
    "bullet-Revenue::hit",
    "bullet-Revenue-name",
    "bullet-Revenue-sub",
    "bullet-Revenue-forecast",
    "bullet-Revenue-measure",
    "bullet-Revenue-target",
  ]);
  const [, hit, name, , forecast, measure, target] = kids;
  assert.strictEqual(hit.paint.fill, "transparent");
  assert.strictEqual(hit.datum, kpis[0]);
  assert.strictEqual(name.datum, kpis[0], "labels dim with their row");
  assert.strictEqual(forecast.paint.opacity, 0.35);
  assert.ok(forecast.width > measure.width, "the forecast runs past the measure");
  assert.ok(forecast.height > measure.height, "and is wider");
  assert.strictEqual(measure.shapeType, "Rect");
  assert.strictEqual(measure.aria.label, "Revenue, 270, Target 250.");
  assert.strictEqual(target.type, "line");
  assert.strictEqual(target.paint.strokeWidth, 3);
  const orders = groups[2].children.map(k => k.key);
  assert.ok(!orders.includes("bullet-Orders-target"), "no target, no marker");
  assert.ok(!orders.includes("bullet-Orders-forecast"));
  const dupes = bulletEmit({viz, shapeData: [shapeData[0], shapeData[0]]});
  assert.deepStrictEqual(dupes.map(g => g.key), ["bullet-Revenue", "bullet-Revenue-1"]);
  assert.deepStrictEqual(bulletEmit({viz, shapeData: []}), []);
});
