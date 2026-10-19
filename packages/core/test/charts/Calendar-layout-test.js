import assert from "assert";
import {
  blockGrid,
  cellCornerRadius,
  fitCalendar,
  monthLabelWeek,
  monthOutlinePath,
  slotPosition,
  weekdayLabelSlots,
} from "../../es/src/charts/Calendar/calendarGrid.js";
import {
  calendarInsets,
  calendarLayout,
  labelPadding,
  weekdayNames,
} from "../../es/src/charts/Calendar/calendarLayout.js";
import {
  calendarDateSpecifier,
  calendarFormatter,
  calendarTimeLocale,
  narrowName,
} from "../../es/src/charts/Calendar/calendarFormat.js";
import {calendarDayKey} from "../../es/src/charts/Calendar/calendarDates.js";

const close = (a, b, msg, eps = 1e-6) =>
  assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} ≈ ${b}`);
const day = (y, m, d) => new Date(y, m - 1, d);

const en = calendarTimeLocale("en-US");
const fmt = spec => calendarFormatter(spec, en, false);

/** Label options measuring every character as 6px wide. */
const labels = (overrides = {}) => ({
  fontSize: 11,
  measure: t => t.length * 6,
  weekday: fmt("%a"),
  month: fmt("%b"),
  year: fmt("%Y"),
  title: [],
  narrow: t => narrowName(t),
  ...overrides,
});

it("Calendar grid: fitCalendar sizes cells to the tighter dimension", () => {
  const fit = fitCalendar({
    count: 2,
    gridColumns: 53,
    gridRows: 7,
    insetTop: 15,
    insetLeft: 40,
    gap: 11,
    width: 1000,
    height: 300,
    columns: 1,
  });
  close(fit.cell, 960 / 53, "width-bound cell");
  assert.deepStrictEqual([fit.columns, fit.rows], [1, 2]);
  close(fit.width, 1000, "fills the width");
  close(fit.height, 2 * (15 + 7 * fit.cell) + 11, "stacked blocks plus a gap");
  close(fit.blockWidth, 40 + 53 * fit.cell, "block width includes its inset");
});

it("Calendar grid: fitCalendar picks the column count with the largest cells", () => {
  const fit = fitCalendar({
    count: 6,
    gridColumns: 7,
    gridRows: 6,
    insetTop: 30,
    insetLeft: 0,
    gap: 16,
    width: 600,
    height: 400,
  });
  assert.deepStrictEqual([fit.columns, fit.rows], [3, 2]);
  close(fit.cell, 27, "the 3×2 grid's cell");
  const forced = fitCalendar({count: 6, gridColumns: 7, gridRows: 6, insetTop: 30, insetLeft: 0, gap: 16, width: 600, height: 400, columns: 9});
  assert.strictEqual(forced.columns, 6, "a fixed column count is capped at the block count");
  const cramped = fitCalendar({count: 1, gridColumns: 53, gridRows: 7, insetTop: 50, insetLeft: 50, gap: 0, width: 20, height: 20});
  assert.strictEqual(cramped.cell, 0, "never negative");
});

it("Calendar grid: slotPosition and blockGrid transpose for vertical", () => {
  assert.deepStrictEqual(slotPosition(10, 3, "horizontal"), [10, 3]);
  assert.deepStrictEqual(slotPosition(10, 3, "vertical"), [3, 10]);
  assert.deepStrictEqual(blockGrid(53, "horizontal"), {columns: 53, rows: 7});
  assert.deepStrictEqual(blockGrid(6, "vertical"), {columns: 7, rows: 6});
});

it("Calendar grid: monthOutlinePath traces a month's cell edges", () => {
  const first = {week: 0, day: 1};
  const last = {week: 4, day: 3};
  assert.strictEqual(
    monthOutlinePath(first, last, 10, "horizontal"),
    "M10,10L0,10L0,70L40,70L40,40L50,40L50,0L10,0Z",
  );
  assert.strictEqual(
    monthOutlinePath(first, last, 10, "vertical"),
    "M10,10L10,0L70,0L70,40L40,40L40,50L0,50L0,10Z",
  );
  assert.strictEqual(
    monthOutlinePath({week: 2, day: 0}, {week: 6, day: 6}, 1, "horizontal"),
    "M3,0L2,0L2,7L6,7L6,7L7,7L7,0L3,0Z",
    "a month of whole weeks is a rectangle",
  );
});

it("Calendar grid: monthLabelWeek, weekdayLabelSlots, cellCornerRadius", () => {
  assert.strictEqual(monthLabelWeek({week: 4, day: 0}), 4, "starts on the week's first day");
  assert.strictEqual(monthLabelWeek({week: 4, day: 3}), 5, "else the first full week");
  assert.deepStrictEqual(weekdayLabelSlots(20, 14), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepStrictEqual(weekdayLabelSlots(10, 14), [1, 3, 5]);
  assert.strictEqual(cellCornerRadius(2, 12), 2);
  assert.strictEqual(cellCornerRadius(10, 12), 4, "a third of the cell at most");
  assert.strictEqual(cellCornerRadius(0, 12), 0);
  assert.strictEqual(cellCornerRadius(2, 0), 0);
});

it("Calendar format: calendarTimeLocale falls back to en-US", () => {
  assert.strictEqual(calendarTimeLocale("es-ES").shortMonths[0], "ene");
  assert.strictEqual(calendarTimeLocale("xx-XX"), en);
  assert.strictEqual(calendarTimeLocale(undefined), en);
});

it("Calendar format: calendarFormatter reads specifiers, functions, and false", () => {
  const friday = day(2024, 1, 5);
  assert.strictEqual(fmt("%b")(friday), "Jan");
  assert.strictEqual(calendarFormatter("%a", calendarTimeLocale("es-ES"), false)(friday), "vie");
  assert.strictEqual(calendarFormatter(d => d.getDate(), en, "%b")(friday), "5");
  assert.strictEqual(calendarFormatter(() => undefined, en, "%b")(friday), "");
  assert.strictEqual(calendarFormatter(undefined, en, "%a")(friday), "Fri", "undefined takes the fallback");
  assert.strictEqual(calendarFormatter(undefined, en, false), null);
  assert.strictEqual(calendarFormatter(false, en, "%a"), null, "false turns labels off");
  assert.strictEqual(calendarFormatter("", en, "%a"), null);
});

it("Calendar format: calendarDateSpecifier keeps each locale's day order", () => {
  assert.strictEqual(calendarDateSpecifier(en), "%A, %x");
  assert.strictEqual(calendarDateSpecifier(calendarTimeLocale("es-ES")), "%A, %-d de %B de %Y");
  assert.strictEqual(calendarDateSpecifier(calendarTimeLocale("en-GB")), "%a %-d %b %Y");
  assert.strictEqual(calendarDateSpecifier(calendarTimeLocale("de-DE")), "%A, der %-d. %B %Y");
  assert.strictEqual(calendarDateSpecifier(calendarTimeLocale("zh-CN")), "%A, %x");
  assert.strictEqual(fmt(calendarDateSpecifier(en))(day(2024, 2, 19)), "Monday, 2/19/2024");
});

it("Calendar format: narrowName keeps the first letter, upper-cased", () => {
  assert.strictEqual(narrowName("lun", "es-ES"), "L");
  assert.strictEqual(narrowName(" mié "), "M");
  assert.strictEqual(narrowName("الأحد", "ar-SA"), "ا");
  assert.strictEqual(narrowName(""), "");
  assert.strictEqual(narrowName("tue", "not a locale!"), "T", "bad locale falls back");
});

it("Calendar layout: labelPadding and weekdayNames", () => {
  assert.strictEqual(labelPadding(11), 4);
  assert.strictEqual(labelPadding(2), 3, "at least 3px");
  assert.deepStrictEqual(weekdayNames(fmt("%a"), 0), ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  assert.deepStrictEqual(weekdayNames(fmt("%a"), 1).slice(0, 2), ["Mon", "Tue"]);
  assert.strictEqual(weekdayNames(fmt("%a"), 6)[0], "Sat");
});

it("Calendar layout: calendarInsets reserves room for each block's labels", () => {
  const opts = labels();
  const pad = labelPadding(11);
  const title = 11 * 1.15 + pad;
  assert.deepStrictEqual(calendarInsets("year", "horizontal", opts, 18, 18), {top: 11 + pad, left: 18 + pad + title});
  assert.deepStrictEqual(calendarInsets("year", "vertical", opts, 18, 24), {top: title + 11 + pad, left: 24 + pad});
  const month = labels({title: [fmt("%B")]});
  assert.deepStrictEqual(calendarInsets("month", "vertical", month, 18, 0), {top: title + 11 + pad, left: 0});
  assert.deepStrictEqual(calendarInsets("month", "horizontal", month, 18, 0), {top: title, left: 18 + pad});
  const bare = labels({weekday: null, month: null, year: null});
  assert.deepStrictEqual(calendarInsets("year", "horizontal", bare, 0, 0), {top: 0, left: 0});
});

it("Calendar layout: stacked years place every day inside the area", () => {
  const layout = calendarLayout({
    start: day(2024, 3, 5),
    end: day(2025, 8, 1),
    period: "year",
    orient: "horizontal",
    weekStart: 0,
    width: 900,
    height: 300,
    labels: labels(),
  });
  assert.deepStrictEqual(layout.blocks.map(b => b.key), ["2024", "2025"]);
  assert.strictEqual(layout.cells.length, 366 + 365, "whole years, not just the data range");
  const cell = layout.fit.cell;
  assert.ok(layout.cells.every(c => c.x >= 0 && c.y >= 0 && c.x + cell <= 900 + 1e-6 && c.y + cell <= 300 + 1e-6));
  const jan1 = layout.cells.find(c => c.key === "2024-01-01");
  const jan7 = layout.cells.find(c => c.key === "2024-01-07");
  close(jan7.x - jan1.x, cell, "Sunday starts the next column");
  close(jan1.y - layout.cells[0].y, 0, "first cell is Jan 1");
  const jan1b = layout.cells.find(c => c.key === "2025-01-01");
  assert.ok(jan1b.y > jan1.y + 6 * cell, "the second year sits below the first");
  assert.strictEqual(layout.outlines.length, 24, "a month outline per month");
  const kinds = layout.labels.reduce((acc, l) => ((acc[l.kind] = (acc[l.kind] || 0) + 1), acc), {});
  assert.strictEqual(kinds.year, 2);
  assert.strictEqual(kinds.month, 24);
  assert.ok(kinds.weekday === 14 || kinds.weekday === 6, "seven or three weekday labels per year");
  const year = layout.labels.find(l => l.kind === "year");
  assert.deepStrictEqual([year.text, year.rotate, year.anchor], ["2024", -90, "middle"]);
});

it("Calendar layout: month labels that would overlap are dropped", () => {
  const layout = calendarLayout({
    start: day(2024, 1, 1),
    end: day(2024, 12, 31),
    period: "year",
    orient: "horizontal",
    weekStart: 0,
    width: 300,
    height: 120,
    labels: labels({month: fmt("%B")}),
  });
  const months = layout.labels.filter(l => l.kind === "month");
  assert.ok(months.length > 0 && months.length < 12, `${months.length} labels fit`);
  const widths = months.map(l => l.text.length * 6);
  months.forEach((l, i) => {
    if (i) assert.ok(l.x >= months[i - 1].x + widths[i - 1], "no overlap");
  });
});

it("Calendar layout: vertical years run weeks down and blocks across", () => {
  const layout = calendarLayout({
    start: day(2023, 1, 1),
    end: day(2024, 12, 31),
    period: "year",
    orient: "vertical",
    weekStart: 1,
    width: 400,
    height: 700,
    labels: labels(),
  });
  const cell = layout.fit.cell;
  const at = k => layout.cells.find(c => c.key === k);
  close(at("2024-01-02").x - at("2024-01-01").x, cell, "weekdays run across");
  close(at("2024-01-08").y - at("2024-01-01").y, cell, "weeks run down");
  assert.ok(at("2024-01-01").x > at("2023-12-31").x + cell, "years sit side by side");
  assert.strictEqual(layout.fit.columns, 2);
  const weekday = layout.labels.filter(l => l.kind === "weekday" && l.key.startsWith("2024"));
  assert.ok(weekday.every(l => l.anchor === "middle"), "weekday labels head the columns");
  const month = layout.labels.find(l => l.kind === "month");
  assert.strictEqual(month.anchor, "end", "month names sit left of their rows");
});

it("Calendar layout: weekday headers shorten to fit narrow cells", () => {
  const run = width =>
    calendarLayout({
      start: day(2024, 1, 1),
      end: day(2024, 12, 31),
      period: "year",
      orient: "vertical",
      weekStart: 0,
      width,
      height: 2000,
      labels: labels(),
    }).labels.filter(l => l.kind === "weekday");
  assert.deepStrictEqual(run(400).map(l => l.text).slice(0, 2), ["Sun", "Mon"], "room for full names");
  assert.deepStrictEqual(run(120).map(l => l.text), ["S", "M", "T", "W", "T", "F", "S"], "first letters");
  assert.deepStrictEqual(run(60).map(l => l.text), ["S", "T", "T", "S"], "every other letter");
  assert.deepStrictEqual(run(45).map(l => l.text), [], "none when even that won't fit");
});

it("Calendar layout: month blocks form a grid of small calendars", () => {
  const titles = [fmt("%B %Y"), fmt("%b %Y"), fmt("%b")];
  const layout = calendarLayout({
    start: day(2025, 1, 15),
    end: day(2025, 6, 2),
    period: "month",
    orient: "vertical",
    weekStart: 0,
    width: 600,
    height: 400,
    labels: labels({title: titles}),
  });
  assert.deepStrictEqual(layout.blocks.map(b => b.key), ["2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06"]);
  assert.strictEqual(layout.cells.length, 31 + 28 + 31 + 30 + 31 + 30);
  assert.strictEqual(layout.outlines.length, 0, "month blocks need no outlines");
  assert.ok(!layout.labels.some(l => l.kind === "month" || l.kind === "year"));
  const blockTitles = layout.labels.filter(l => l.kind === "title");
  assert.strictEqual(blockTitles.length, 6);
  assert.strictEqual(blockTitles[0].text, "January 2025");
  const at = k => layout.cells.find(c => c.key === k);
  assert.strictEqual(at("2025-01-01").y, at("2025-01-04").y, "Wednesday–Saturday share the first row");
  close(at("2025-01-05").y - at("2025-01-01").y, layout.fit.cell, "Sunday starts the next row");
  assert.ok(at("2025-02-01").x > at("2025-01-31").x, "February sits beside January");

  const narrow = calendarLayout({
    start: day(2025, 9, 1),
    end: day(2025, 9, 30),
    period: "month",
    orient: "vertical",
    weekStart: 0,
    width: 40,
    height: 400,
    labels: labels({title: titles}),
  });
  assert.strictEqual(narrow.labels.find(l => l.kind === "title").text, "Sep", "titles shorten to fit");
});

it("Calendar layout: cells carry their day keys and block", () => {
  const layout = calendarLayout({
    start: day(2024, 12, 30),
    end: day(2025, 1, 2),
    period: "month",
    orient: "horizontal",
    weekStart: 1,
    width: 400,
    height: 300,
    labels: labels({weekday: null, title: []}),
  });
  const cell = layout.cells.find(c => c.key === "2025-01-01");
  assert.strictEqual(cell.block, "2025-01");
  assert.strictEqual(calendarDayKey(cell.date), "2025-01-01");
  assert.strictEqual(layout.labels.length, 0, "no labels when every format is off");
});
