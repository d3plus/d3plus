import assert from "assert";
import {
  calendarDateFormat,
  calendarLabelStyle,
  calendarOrient,
  calendarPeriod,
  rowDate,
  rowsExtent,
} from "../../es/src/charts/Calendar/applyLayout.js";
import {calendarPalette, colorValue, hasColorValue} from "../../es/src/charts/Calendar/emit.js";
import {calendarDef, defaultCalendarDate} from "../../es/src/charts/Calendar/index.js";
import {calendarDayKey} from "../../es/src/charts/Calendar/calendarDates.js";
import {calendarInsetRegion} from "../../es/src/charts/Calendar/calendarInset.js";

const field = key => calendarDef.fields.find(f => f.key === key);
const mockViz = (schema = {}) => ({
  ctx: {},
  schema: {
    date: defaultCalendarDate,
    locale: "en-US",
    fontFamily: ["Inter", "sans-serif"],
    translate: s => s,
    ...schema,
  },
});

it("Calendar helpers: defaultCalendarDate reads date, else time", () => {
  assert.strictEqual(defaultCalendarDate({date: "2024-01-01", time: "x"}), "2024-01-01");
  assert.strictEqual(defaultCalendarDate({time: 5}), 5);
  assert.strictEqual(defaultCalendarDate({}), undefined);
});

it("Calendar helpers: rowDate reads a row's day through the date accessor", () => {
  const viz = mockViz();
  assert.strictEqual(calendarDayKey(rowDate(viz, {date: "2024-03-10"}, 0)), "2024-03-10");
  assert.strictEqual(calendarDayKey(rowDate(viz, {time: new Date(2024, 2, 10, 9)}, 0)), "2024-03-10");
  assert.strictEqual(rowDate(viz, {value: 3}, 0), null);
  const custom = mockViz({date: (d, i) => new Date(2024, 0, 1 + i)});
  assert.strictEqual(calendarDayKey(rowDate(custom, {}, 4)), "2024-01-05", "accessor gets the index");
  assert.strictEqual(rowDate(mockViz({date: undefined}), {date: "2024-01-01"}, 0), null);
});

it("Calendar helpers: rowsExtent spans the readable days", () => {
  const viz = mockViz();
  const rows = [{date: "2024-05-01"}, {date: "bad"}, {date: "2023-02-01"}, {date: "2024-01-09"}];
  assert.deepStrictEqual(rowsExtent(viz, rows).map(calendarDayKey), ["2023-02-01", "2024-05-01"]);
  assert.strictEqual(rowsExtent(viz, [{date: "bad"}]), null);
  assert.strictEqual(rowsExtent(viz, []), null);
});

it("Calendar helpers: calendarPeriod and calendarOrient resolve their defaults", () => {
  assert.strictEqual(calendarPeriod(mockViz()), "year");
  assert.strictEqual(calendarPeriod(mockViz({period: "month"})), "month");
  assert.strictEqual(calendarPeriod(mockViz({period: "decade"})), "year");
  assert.strictEqual(calendarOrient(mockViz()), "horizontal");
  assert.strictEqual(calendarOrient(mockViz({period: "month"})), "vertical", "months read as wall calendars");
  assert.strictEqual(calendarOrient(mockViz({period: "month", orient: "horizontal"})), "horizontal");
  assert.strictEqual(calendarOrient(mockViz({orient: "vertical"})), "vertical");
  assert.strictEqual(calendarOrient(mockViz({orient: "diagonal"})), "horizontal");
});

it("Calendar helpers: calendarLabelStyle reads calendarLabelConfig over the chart font", () => {
  const base = calendarLabelStyle(mockViz());
  assert.strictEqual(base.fontSize, 11);
  assert.strictEqual(base.fontWeight, 400);
  assert.strictEqual(base.fontColor, undefined);
  assert.ok(base.fontFamily.includes("Inter"), base.fontFamily);
  const custom = calendarLabelStyle(
    mockViz({calendarLabelConfig: {fontSize: 14, fontColor: "red", fontFamily: "Georgia", fontWeight: 700}}),
  );
  assert.deepStrictEqual(
    [custom.fontSize, custom.fontColor, custom.fontWeight],
    [14, "red", 700],
  );
  assert.ok(custom.fontFamily.includes("Georgia"));
});

it("Calendar helpers: calendarDateFormat formats in the chart's locale", () => {
  const monday = new Date(2024, 1, 19);
  assert.strictEqual(calendarDateFormat(mockViz())(monday), "Monday, 2/19/2024");
  assert.strictEqual(calendarDateFormat(mockViz({locale: "es-ES"}))(monday), "lunes, 19 de febrero de 2024");
  assert.strictEqual(
    calendarDateFormat(mockViz({locale: "es-ES"}))(new Date(2024, 1, 5)),
    "lunes, 5 de febrero de 2024",
    "no padding before a one-digit day",
  );
});

it("Calendar helpers: calendarPalette tints toward the text color", () => {
  const light = calendarPalette("rgb(255, 255, 255)", "rgb(0, 0, 0)");
  const dark = calendarPalette("rgb(29, 31, 35)", "rgb(255, 255, 255)");
  const lum = c => c.match(/\d+/g).slice(0, 3).reduce((a, b) => a + +b, 0) / 3;
  assert.ok(lum(light.empty) < 255 && lum(light.empty) > 220, `light empty ${light.empty}`);
  assert.ok(lum(dark.empty) > 31 && lum(dark.empty) < 70, `dark empty ${dark.empty}`);
  assert.ok(lum(light.outline) < lum(light.empty), "outlines stronger than empty days");
  assert.ok(lum(light.text) < lum(light.outline), "labels strongest");
  assert.ok(lum(dark.text) > lum(dark.outline), "and on dark");
});

it("Calendar helpers: colorValue and hasColorValue read the colorScale", () => {
  const viz = mockViz({colorScale: d => d.value});
  assert.strictEqual(colorValue(viz, {value: 4}, 0), 4);
  assert.strictEqual(colorValue(viz, {value: "4.5"}, 0), 4.5);
  for (const v of [undefined, null, "", "n/a", NaN, true]) {
    assert.strictEqual(colorValue(viz, {value: v}, 0), undefined, `${v}`);
    assert.strictEqual(hasColorValue(viz, {value: v}, 0), false, `${v}`);
  }
  assert.strictEqual(colorValue(viz, {value: 0}, 0), 0, "zero is a value");
  assert.strictEqual(hasColorValue(viz, {value: 0}, 0), true);
  const plain = mockViz({colorScale: false});
  assert.strictEqual(colorValue(plain, {value: 4}, 0), undefined);
  assert.strictEqual(hasColorValue(plain, {}, 0), true, "without a colorScale every row is colored");
});

it("Calendar def: ctx and fields come last, accessors before config bags", () => {
  const keys = Object.keys(calendarDef);
  assert.deepStrictEqual(keys.slice(-2), ["ctx", "fields"]);
  const fieldKeys = calendarDef.fields.map(f => f.key);
  const firstBag = fieldKeys.findIndex(k => /Config$/.test(k));
  assert.ok(fieldKeys.slice(firstBag).every(k => /Config$/.test(k)), fieldKeys.join(", "));
});

it("Calendar def: field defaults", () => {
  assert.strictEqual(field("cellPadding").default, 2);
  assert.strictEqual(field("cellRadius").default, 2);
  assert.strictEqual(field("period").default, "year");
  assert.strictEqual(field("monthOutline").default, true);
  assert.strictEqual(field("zoom").default, false);
  assert.strictEqual(field("date").default, defaultCalendarDate);
  assert.strictEqual(field("date").coerce("day")({day: 3}), 3, "a key becomes an accessor");
  const fn = () => 1;
  assert.strictEqual(field("date").coerce(fn), fn);
  assert.strictEqual(field("colorScale").default({value: 7}), 7);
  for (const key of ["emptyFill", "monthFormat", "orient", "weekStart", "weekdayFormat", "yearFormat"]) {
    assert.ok(!("default" in field(key)), `${key} has no static default`);
  }
});

it("Calendar def: rows group by day, label as a date, and show a Value row", () => {
  const viz = mockViz({colorScale: d => d.value});
  const [byDay] = field("groupBy").factory(viz);
  assert.strictEqual(byDay({date: "2024-01-05"}, 0), "2024-01-05");
  assert.strictEqual(byDay({date: new Date(2024, 0, 5, 22)}, 0), "2024-01-05", "times fold into their day");
  assert.strictEqual(byDay({id: "x"}, 0), "x", "rows without a day keep their id");
  const label = field("label").factory(viz);
  assert.strictEqual(label({date: "2024-02-19"}, 0), "Monday, 2/19/2024");
  assert.strictEqual(label({}, 0), "");
  const [[title, value]] = field("tooltipConfig").factory(viz).tbody;
  assert.strictEqual(title(), "Value");
  assert.strictEqual(value({value: 1234}, 0), "1.23k");
  assert.strictEqual(value({}, 0), "");
});

it("Calendar def: the legend shows only for a categorical color key", () => {
  const calls = [];
  const viz = mockViz({legend: (config, arr) => (calls.push(arr), true)});
  const legend = field("legend").factory(viz);
  assert.strictEqual(legend({}, [{}, {}]), false);
  viz._legendCategories = ["a", "b"];
  assert.strictEqual(legend({}, [{}, {}]), true);
  assert.strictEqual(calls.length, 1);
});

it("Calendar def: facet panels share one date range", () => {
  const viz = mockViz();
  const shared = calendarDef.facet.share(viz, [
    [{date: "2024-03-01"}, {date: "2024-04-01"}],
    [{date: "2025-01-10"}],
    [{date: "nope"}],
  ]);
  assert.deepStrictEqual(shared.map(calendarDayKey), ["2024-03-01", "2025-01-10"]);
  assert.strictEqual(calendarDef.facet.share(viz, [[{}]]), null);
  const undo = calendarDef.facet.panel(viz, {shared: true, scales: shared});
  assert.strictEqual(viz.ctx.calendarSharedExtent, shared);
  undo();
  assert.strictEqual(viz.ctx.calendarSharedExtent, undefined);
  calendarDef.facet.panel(viz, {shared: false, scales: shared});
  assert.strictEqual(viz.ctx.calendarSharedExtent, undefined, "independent panels fit their own rows");
  assert.strictEqual(calendarDef.facet.aspect, 3);
});

it("Calendar def: days hover with an outline and without dimming the rest", () => {
  assert.deepStrictEqual(field("shapeConfig").default, {hoverOpacity: 1});
  assert.strictEqual(field("shapeConfig").merge, true, "a user's shapeConfig merges over it");
  assert.deepStrictEqual(calendarDef.defaults, {hoverOutline: true});
  assert.strictEqual(calendarDef.insetRegion, calendarInsetRegion);
});

it("Calendar helpers: calendarInsetRegion keeps chrome clear of every node, labels and empty days included", () => {
  const region = calendarInsetRegion({
    schema: {width: 300, height: 200},
    _margin: {top: 20, right: 10, bottom: 0, left: 0},
    _chartTransform: {x: 0, y: 20},
    _chartScene: [
      {type: "rect", key: "calendar-2024-01-01", interactive: false, x: 10, y: 10, width: 8, height: 8},
      {type: "rect", key: "calendar-2024-01-02", datum: {}, x: 20, y: 10, width: 8, height: 8},
      {type: "rect", key: "calendar-2024-01-02::hit", datum: {}, x: 0, y: 0, width: 300, height: 300},
      {type: "path", key: "calendar-2024-outline-01", d: "M0,0L40,0L40,30L0,30Z"},
      {
        type: "text", key: "calendar-label-jan", x: 0, y: 0, transform: {x: 100, y: 5},
        lines: [{text: "Jan", x: 0, y: 0, width: 20}],
        font: {size: 10, anchor: "start", baseline: "middle"},
      },
    ],
  });
  assert.deepStrictEqual(region.bounds, {x: 0, y: 20, width: 290, height: 180});
  const has = box => region.obstacles.some(o => JSON.stringify(o) === JSON.stringify(box));
  assert.ok(has({x: 10, y: 30, width: 8, height: 8}), "an empty day");
  assert.ok(has({x: 20, y: 30, width: 8, height: 8}), "a data day");
  assert.ok(has({x: 40, y: 50, width: 0, height: 0}), "a month outline's corner");
  assert.ok(has({x: 100, y: 20, width: 20, height: 10}), "a label");
  assert.ok(!region.obstacles.some(o => o.width === 300), "hit areas are skipped");
});
