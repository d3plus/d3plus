import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {colorDefaults} from "@d3plus/color";
import {KPI} from "../../index.ts";
import {runStages} from "../../src/charts/pipeline/stages.ts";
import {
  applyKpiLayout,
  kpiKey,
  rowNumber,
  tileSettings,
} from "../../src/charts/KPI/applyLayout.ts";
import {deltaColors, kpiPercentFormat} from "../../src/charts/KPI/delta.ts";
import {resolveTheme, themeDark} from "../../src/utils/theme.ts";
import {
  comparisonText,
  deltaFormats,
  kpiAriaLabel,
  kpiEmit,
  kpiStyle,
  tileText,
  VALUE_WEIGHT,
  valueSize,
} from "../../src/charts/KPI/emit.ts";
import {
  kpiAccessor,
  kpiDef,
  kpiTooltipRows,
} from "../../src/charts/KPI/index.ts";

useJsdom();

const months = ["2025-01", "2025-02", "2025-03", "2025-04"];
const series = {
  Revenue: [100, 120, 110, 132],
  Churn: [5, 4, 4.5, 4],
  Flat: [7, 7, 7, 7],
};
const rows = Object.entries(series).flatMap(([metric, values]) =>
  values.map((value, i) => ({metric, month: months[i], value})),
);

/** A 600×300 KPI chart laid out with no margins, ready to read. */
function draw(config = {}, data = rows, size = [600, 300]) {
  const viz = new KPI()
    .data(data.map(d => ({...d})))
    .config({groupBy: "metric", time: "month", ...config})
    .width(size[0])
    .height(size[1]);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applyKpiLayout]);
  return {viz, tiles: shapeData};
}

const flat = nodes =>
  nodes.flatMap(n => [n, ...(n.children ? flat(n.children) : [])]);
const byMetric = tiles =>
  Object.fromEntries(tiles.map(t => [t.data.metric, t]));

it("KPI: the def lists ctx then fields last", () => {
  assert.deepStrictEqual(Object.keys(kpiDef).slice(-2), ["ctx", "fields"]);
  assert.strictEqual(kpiDef.name, "KPI");
});

it("KPI: fluent defaults", () => {
  const viz = new KPI();
  assert.strictEqual(viz.delta(), "percent");
  assert.strictEqual(viz.deltaDirection(), "up");
  assert.strictEqual(viz.sparkline(), "area");
  assert.strictEqual(viz.timeline(), false);
  assert.strictEqual(viz.zoom(), false);
  assert.deepStrictEqual(viz.tileConfig(), {});
  assert.strictEqual(viz.comparisonLabel(), undefined);
  assert.strictEqual(viz.value()({value: 6}), 6);
  assert.strictEqual(viz.previous()({previous: 5}), 5);
  assert.strictEqual(viz.previous(false).previous(), false);
  assert.strictEqual(
    viz.value(false).value()({value: 2}),
    2,
    "value can't be turned off",
  );
  assert.strictEqual(viz.valueFormat()(1234), "1.23k");
  assert.strictEqual(
    viz.color()({}, 0),
    colorDefaults.sequential,
    "one accent color",
  );
  assert.strictEqual(viz.color("metric").color()({metric: "A"}), "A");
  assert.deepStrictEqual(
    viz.tileConfig({columns: 2}).tileConfig({rx: 0}).tileConfig(),
    {columns: 2, rx: 0},
    "tileConfig merges",
  );
});

it("KPI: kpiAccessor keeps functions, reads keys, and holds constants", () => {
  const fn = d => d.x;
  assert.strictEqual(kpiAccessor(fn), fn);
  assert.strictEqual(kpiAccessor("goal")({goal: 7}), 7);
  assert.strictEqual(kpiAccessor(90)({}), 90);
  assert.strictEqual(kpiAccessor(false), false);
  assert.strictEqual(kpiAccessor(null), false);
});

it("KPI: rowNumber reads numbers and treats missing values as NaN", () => {
  const acc = d => d.v;
  assert.strictEqual(rowNumber(acc, {v: "4"}, 0), 4);
  assert.ok(Number.isNaN(rowNumber(acc, {v: null}, 0)));
  assert.ok(Number.isNaN(rowNumber(acc, {v: ""}, 0)));
  assert.ok(Number.isNaN(rowNumber(false, {v: 3}, 0)));
});

it("KPI: tileSettings fills in the grid defaults", () => {
  const {viz} = draw();
  assert.deepStrictEqual(tileSettings(viz), {aspect: 1.75, padding: 12});
  viz.tileConfig({aspect: 3, padding: 0, columns: 1});
  assert.deepStrictEqual(tileSettings(viz), {
    aspect: 3,
    padding: 0,
    columns: 1,
  });
  viz.tileConfig({aspect: -1, padding: "x"});
  const bad = tileSettings(viz);
  assert.strictEqual(bad.aspect, 1.75);
  assert.strictEqual(bad.padding, 12);
});

it("KPI: kpiKey joins the ids, and the facet value with small multiples", () => {
  const {viz} = draw();
  assert.strictEqual(kpiKey(viz, {metric: "Revenue"}, 0), "Revenue");
  viz.facet("region");
  assert.strictEqual(
    kpiKey(viz, {metric: "Revenue", region: "North"}, 0),
    "Revenue|North",
  );
});

it("KPI: with time, each tile shows the latest period against the one before", () => {
  const {viz, tiles} = draw();
  assert.strictEqual(tiles.length, 3);
  const t = byMetric(tiles);
  assert.strictEqual(t.Revenue.value, 132);
  assert.strictEqual(t.Revenue.previous, 110);
  assert.strictEqual(t.Revenue.delta.direction, "up");
  assert.strictEqual(t.Revenue.tone, "good");
  assert.deepStrictEqual(t.Revenue.previousTimes, ["2025-03"]);
  assert.deepStrictEqual(
    t.Revenue.points.map(p => [p.value, p.current]),
    [
      [100, false],
      [120, false],
      [110, false],
      [132, true],
    ],
  );
  assert.strictEqual(t.Churn.tone, "bad", "a fall is bad news by default");
  assert.strictEqual(t.Flat.tone, "neutral");
  assert.ok(viz.ctx.kpi.tiles.get(t.Revenue.data) === t.Revenue);
  for (const tile of tiles) {
    assert.ok(tile.box.width > 0 && tile.box.height > 0);
    assert.ok(tile.box.x + tile.box.width <= 600 + 1e-9);
  }
});

it("KPI: deltaDirection turns a fall into good news, per tile", () => {
  const {tiles} = draw({
    deltaDirection: d => (d.metric === "Churn" ? "down" : "up"),
  });
  const t = byMetric(tiles);
  assert.strictEqual(t.Churn.tone, "good");
  assert.strictEqual(t.Revenue.tone, "good");
  const {tiles: down} = draw({deltaDirection: "down"});
  assert.strictEqual(byMetric(down).Revenue.tone, "bad");
});

it("KPI: a previous value in the data wins over the period before", () => {
  const data = rows.map(d => ({
    ...d,
    previous: d.metric === "Revenue" ? 66 : undefined,
  }));
  const {tiles} = draw({}, data);
  const t = byMetric(tiles);
  assert.strictEqual(t.Revenue.previous, 66);
  assert.strictEqual(t.Revenue.delta.percent, 1);
  assert.strictEqual(t.Churn.previous, 4.5, "others still read the series");
});

it("KPI: without time, tiles read `previous` and draw no sparkline", () => {
  const {tiles} = draw({time: undefined, previous: "last"}, [
    {metric: "A", value: 10, last: 8},
    {metric: "B", value: 3},
  ]);
  const t = byMetric(tiles);
  assert.strictEqual(t.A.previous, 8);
  assert.deepStrictEqual(t.A.points, []);
  assert.ok(Number.isNaN(t.B.previous));
  assert.strictEqual(t.B.delta, undefined);
  assert.strictEqual(t.B.tone, "neutral");
});

it("KPI: a selected period compares with the one before it, and rows roll up", () => {
  const {tiles} = draw({timeFilter: d => d.month === "2025-02"});
  const t = byMetric(tiles);
  assert.strictEqual(t.Revenue.value, 120);
  assert.strictEqual(t.Revenue.previous, 100);
  assert.deepStrictEqual(
    t.Revenue.points.map(p => p.current),
    [false, true, false, false],
  );
  const split = rows.flatMap(d => [
    {...d, store: "a", value: d.value / 2},
    {...d, store: "b", value: d.value / 2},
  ]);
  const {tiles: summed} = draw({}, split);
  assert.strictEqual(byMetric(summed).Revenue.value, 132);
  assert.strictEqual(byMetric(summed).Revenue.previous, 110);
  assert.strictEqual(byMetric(summed).Revenue.points[0].value, 100);
});

it("KPI: a filter leaves its rows out of the history", () => {
  const {tiles} = draw({filter: d => d.month !== "2025-03"});
  const t = byMetric(tiles);
  assert.strictEqual(t.Revenue.previous, 120);
  assert.strictEqual(t.Revenue.points.length, 3);
});

it("KPI: comparisonText, deltaFormats, and kpiPercentFormat", () => {
  const {viz} = draw();
  const d = {metric: "Revenue"};
  assert.strictEqual(comparisonText(viz, d, 0), "vs. previous");
  viz.comparisonLabel("vs. last year");
  assert.strictEqual(comparisonText(viz, d, 0), "vs. last year");
  viz.comparisonLabel(row => `vs. ${row.metric}`);
  assert.strictEqual(comparisonText(viz, d, 0), "vs. Revenue");
  viz.comparisonLabel(false);
  assert.strictEqual(comparisonText(viz, d, 0), "");
  viz.comparisonLabel(undefined).locale("es-ES");
  assert.strictEqual(comparisonText(viz, d, 0), "vs. anterior");
  viz.locale("en-US").valueFormat((v, row) => `${row.metric}:${v}`);
  const formats = deltaFormats(viz, d);
  assert.strictEqual(formats.value(5), "Revenue:5");
  assert.strictEqual(formats.percent(0.25), "25%");
  assert.strictEqual(kpiPercentFormat(viz)(-0.5), "-50%");
});

it("KPI: kpiTooltipRows lists the value, previous value, and signed change", () => {
  const {viz, tiles} = draw();
  const revenue = byMetric(tiles).Revenue;
  const rowsOut = kpiTooltipRows(viz, revenue.data);
  assert.deepStrictEqual(rowsOut, [
    ["Value", "132"],
    ["Previous", "110"],
    ["Change", "+22 (+20%)"],
  ]);
  assert.deepStrictEqual(kpiTooltipRows(viz, {metric: "Unknown"}), []);
  viz.locale("pt-BR");
  assert.strictEqual(kpiTooltipRows(viz, revenue.data)[1][0], "Anterior");
});

it("KPI: kpiAriaLabel names the tile, its value, and its change", () => {
  const {viz, tiles} = draw();
  const t = byMetric(tiles);
  assert.strictEqual(
    kpiAriaLabel(viz, t.Revenue),
    "Revenue, 132, +20% vs. previous.",
  );
  viz.delta(false);
  assert.strictEqual(kpiAriaLabel(viz, t.Revenue), "Revenue, 132.");
});

it("KPI: deltaColors are the theme's on and off, never lifted", () => {
  const {viz} = draw();
  const light = deltaColors(viz);
  assert.strictEqual(light.good, colorDefaults.on);
  assert.strictEqual(light.bad, colorDefaults.off);
  assert.notStrictEqual(light.neutral, light.good);
  viz._theme = resolveTheme("dark");
  const dark = deltaColors(viz);
  assert.strictEqual(dark.good, themeDark.on, "the dark theme's own green");
  assert.strictEqual(dark.bad, themeDark.off);
  viz._theme = {
    ...resolveTheme("light"),
    background: "#111111",
    text: "#f8f9fa",
  };
  assert.strictEqual(
    deltaColors(viz).good,
    colorDefaults.on,
    "not lifted on a dark background",
  );
  viz.colorDefaults({on: "#00ff00"});
  viz._theme = resolveTheme("dark");
  assert.strictEqual(deltaColors(viz).good, "#00ff00", "its own on wins");
});

it("KPI: kpiStyle reads tileConfig over the theme", () => {
  const {viz} = draw();
  const style = kpiStyle(viz);
  assert.strictEqual(style.cardStrokeWidth, 1);
  assert.strictEqual(style.rx, 6);
  viz.tileConfig({fill: "red", stroke: "blue", strokeWidth: 0, rx: 0});
  const custom = kpiStyle(viz);
  assert.strictEqual(custom.cardFill, "red");
  assert.strictEqual(custom.cardStroke, "blue");
  assert.strictEqual(custom.cardStrokeWidth, 0);
  assert.strictEqual(custom.rx, 0);
});

it("KPI: tileText is a start-anchored, non-interactive line", () => {
  const node = tileText("k", "Hi", 5, 6, {
    size: 12,
    family: "sans-serif",
    color: "#000",
    width: 20,
    weight: VALUE_WEIGHT,
  });
  assert.strictEqual(node.type, "text");
  assert.strictEqual(node.interactive, false);
  assert.deepStrictEqual(node.transform, {x: 5, y: 6});
  assert.strictEqual(node.font.anchor, "start");
  assert.strictEqual(node.font.weight, VALUE_WEIGHT);
  assert.strictEqual(node.lines[0].text, "Hi");
});

it("KPI: kpiEmit draws a card, its text, and a sparkline per tile", () => {
  const {viz, tiles} = draw();
  const groups = kpiEmit({viz, shapeData: tiles});
  assert.strictEqual(groups.length, 3);
  const nodes = flat(groups);
  const cards = nodes.filter(n => n.key.endsWith("-card"));
  assert.strictEqual(cards.length, 3);
  assert.ok(
    cards.every(c => c.datum && c.aria.label && c.shapeType === "Rect"),
  );
  const text = key => nodes.find(n => n.key === key).lines[0].text;
  assert.strictEqual(text("kpi-Revenue-label"), "Revenue");
  assert.strictEqual(text("kpi-Revenue-value"), "132");
  assert.strictEqual(text("kpi-Revenue-delta"), "▲ 20%");
  assert.strictEqual(text("kpi-Revenue-compare"), "vs. previous");
  const colors = deltaColors(viz);
  const paint = key => nodes.find(n => n.key === key).paint.fill;
  assert.strictEqual(paint("kpi-Revenue-delta"), colors.good);
  assert.strictEqual(paint("kpi-Churn-delta"), colors.bad);
  assert.strictEqual(paint("kpi-Flat-delta"), colors.neutral);
  assert.strictEqual(text("kpi-Flat-delta"), "0%");
  assert.ok(nodes.some(n => n.key === "kpi-Revenue-area" && n.type === "area"));
  const line = nodes.find(n => n.key === "kpi-Revenue-line");
  assert.strictEqual(line.points.length, 4);
  assert.strictEqual(line.paint.stroke, colorDefaults.sequential);
  assert.ok(nodes.some(n => n.key === "kpi-Revenue-current"));
});

it("KPI: kpiEmit honors sparkline, delta, and comparisonLabel settings", () => {
  const nodesFor = config => {
    const {viz, tiles} = draw(config);
    return flat(kpiEmit({viz, shapeData: tiles}));
  };
  const bars = nodesFor({sparkline: "bar"});
  const revenueBars = bars.filter(n => n.key.startsWith("kpi-Revenue-bar-"));
  assert.strictEqual(revenueBars.length, 4);
  assert.deepStrictEqual(
    revenueBars.map(n => n.paint.opacity),
    [0.4, 0.4, 0.4, 1],
    "the current period in full color",
  );
  const line = nodesFor({sparkline: "line"});
  assert.ok(!line.some(n => n.type === "area"));
  assert.ok(line.some(n => n.type === "line"));
  const none = nodesFor({sparkline: false, delta: false});
  assert.ok(!none.some(n => n.type === "line" || n.type === "area"));
  assert.ok(!none.some(n => n.key.endsWith("-delta")));
  const quiet = nodesFor({comparisonLabel: false, delta: "both"});
  assert.ok(!quiet.some(n => n.key.endsWith("-compare")));
  assert.strictEqual(
    quiet.find(n => n.key === "kpi-Revenue-delta").lines[0].text,
    "▲ 22 (20%)",
  );
  const colored = nodesFor({color: "metric"});
  const strokes = new Set(
    colored.filter(n => n.type === "line").map(n => n.paint.stroke),
  );
  assert.strictEqual(strokes.size, 3, "a color of your own colors by it");
});

it("KPI: kpiEmit keeps every line of a tiny tile inside its card", () => {
  for (const size of [
    [600, 40],
    [600, 24],
    [90, 60],
  ]) {
    const {viz, tiles} = draw({}, rows, size);
    const groups = kpiEmit({viz, shapeData: tiles});
    for (const g of groups) {
      const card = g.children.find(n => n.key.endsWith("-card"));
      for (const n of g.children.filter(c => c.type === "text")) {
        const half = (n.font.size * 1.25) / 2;
        const {x, y} = n.transform;
        assert.ok(
          y - half >= 0 && y + half <= card.height,
          `${size}: ${n.key} y`,
        );
        assert.ok(
          x >= 0 && x + n.lines[0].width <= card.width,
          `${size}: ${n.key} x`,
        );
      }
      assert.ok(
        !g.children.some(n => n.type === "line" || n.type === "area"),
        "no room for a sparkline",
      );
    }
  }
  const {viz, tiles} = draw({}, rows, [600, 40]);
  const keys = flat(kpiEmit({viz, shapeData: tiles})).map(n => n.key);
  assert.ok(
    !keys.some(k => k.endsWith("-compare")),
    "comparison words go first",
  );
});

it("KPI: kpiEmit lays the text out right to left on a right-to-left page", () => {
  assert.strictEqual(kpiStyle(draw().viz).rtl, false);
  document.documentElement.dir = "rtl";
  try {
    const {viz, tiles} = draw({locale: "ar-SA"});
    assert.strictEqual(kpiStyle(viz).rtl, true);
    const nodes = flat(kpiEmit({viz, shapeData: tiles}));
    const get = part => nodes.find(n => n.key === `kpi-Revenue-${part}`);
    const card = get("card");
    const texts = ["label", "value", "delta", "compare"].map(get);
    for (const n of texts) {
      assert.strictEqual(n.font.dir, "rtl", n.key);
      assert.strictEqual(n.font.anchor, "start", n.key);
    }
    const [label, value, delta, compare] = texts;
    assert.strictEqual(label.transform.x, value.transform.x);
    assert.strictEqual(value.transform.x, delta.transform.x);
    assert.ok(delta.transform.x > card.width / 2, "lines start at the right");
    assert.ok(
      compare.transform.x <= delta.transform.x - delta.lines[0].width,
      "the comparison words follow the delta, to its left",
    );
    assert.ok(delta.lines[0].text.startsWith("▲"), "the glyph leads");
    assert.strictEqual(compare.lines[0].text, "مقارنة بالسابق");
  } finally {
    document.documentElement.dir = "";
  }
});

it("KPI: valueSize shrinks an overflowing value just past its fit", () => {
  assert.strictEqual(valueSize("12", "sans-serif", 20, 1000), 20);
  const size = valueSize("$230.3K", "sans-serif", 40, 60);
  assert.ok(size < 40 && size > 0);
  const wide = valueSize("$230.3K", "sans-serif", 40, 120);
  assert.ok(wide > size, "more room, larger text");
});

it("KPI: kpiEmit draws nothing without tiles", () => {
  const {viz} = draw();
  assert.deepStrictEqual(kpiEmit({viz, shapeData: []}), []);
});
