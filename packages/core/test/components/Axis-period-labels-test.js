import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";
import {timeMonth, utcMonth} from "d3-time";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft, Timeline} from "../../index.ts";
import {
  axisLabelPosition,
  labelPeriod,
  periodCenter,
  periodInterval,
  periodLabelPositions,
} from "../../src/components/Axis/axisPeriods.ts";
import {measureAxis} from "../../src/components/Axis/axisLimit.ts";

/**
    Period labels (`tickLabelPosition: "period"`): a date label is drawn
    centered in the period it names, while its tick and grid line stay on
    the period's start. The file runs in Los Angeles time, where UTC
    midnight is the evening before.
*/

useJsdom();

let zone;
beforeAll(() => {
  zone = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
});
afterAll(() => {
  if (zone === undefined) delete process.env.TZ;
  else process.env.TZ = zone;
});

const months = (count, year = 2024) =>
  Array.from({length: count}, (_, i) => new Date(year, i, 1));

/** Measures a standalone time axis over `dates`. */
function timeAxis(dates, config = {}, Axis = AxisBottom) {
  const axis = new Axis()
    .scale("time")
    .domain([dates[0], dates[dates.length - 1]])
    .data(dates)
    .width(800)
    .height(800)
    .duration(0)
    .config(config);
  const measure = measureAxis(axis);
  return {axis, measure};
}

/** The x (or y) each drawn tick label's box is centered on, by label value. */
function labelCenters(axis) {
  axis.render();
  const key = axis._position.horizontal ? "x" : "y";
  const size = key === "x" ? "width" : "height";
  const out = new Map();
  for (const d of axis._tickShape._data) {
    if (!d.text) continue;
    const box = d.labelBounds;
    out.set(d.id, d[key] + box[key] + box[size] / 2);
  }
  return out;
}

it("periodInterval reads each period on the local or UTC calendar", () => {
  const d = new Date(2024, 4, 17, 13, 45, 30);
  assert.strictEqual(+periodInterval("year").floor(d), +new Date(2024, 0, 1));
  assert.strictEqual(
    +periodInterval("quarter").floor(d),
    +new Date(2024, 3, 1),
  );
  assert.strictEqual(+periodInterval("month").floor(d), +new Date(2024, 4, 1));
  assert.strictEqual(+periodInterval("day").floor(d), +new Date(2024, 4, 17));
  assert.strictEqual(
    +periodInterval("hour").floor(d),
    +new Date(2024, 4, 17, 13),
  );
  assert.strictEqual(
    +periodInterval("minute").floor(d),
    +new Date(2024, 4, 17, 13, 45),
  );
  assert.strictEqual(+periodInterval("second").floor(d), +d);
  const u = new Date(Date.UTC(2024, 4, 1, 3));
  assert.strictEqual(
    +periodInterval("month", true).floor(u),
    Date.UTC(2024, 4, 1),
  );
  assert.strictEqual(
    +periodInterval("year", true).floor(u),
    Date.UTC(2024, 0, 1),
  );
});

it("labelPeriod names the unit the dates step by", () => {
  assert.strictEqual(labelPeriod(months(6)), "month");
  assert.strictEqual(
    labelPeriod([0, 3, 6].map(m => new Date(2024, m, 1))),
    "quarter",
  );
  assert.strictEqual(
    labelPeriod([2020, 2021, 2022].map(y => new Date(y, 0, 1))),
    "year",
  );
  assert.strictEqual(
    labelPeriod([0, 15, 30].map(m => new Date(2024, 0, 1, 9, m))),
    "minute",
  );
  assert.strictEqual(
    labelPeriod([0, 20, 40].map(s => new Date(2024, 0, 1, 9, 0, s))),
    "second",
  );
  assert.strictEqual(
    labelPeriod([0, 250].map(ms => new Date(2024, 0, 1, 9, 0, 0, ms))),
    undefined,
  );
  assert.strictEqual(labelPeriod([]), undefined);
  // UTC midnights read in UTC step by months.
  const utc = [0, 1, 2].map(m => new Date(Date.UTC(2024, m, 1)));
  assert.strictEqual(labelPeriod(utc, true), "month");
});

it("periodCenter centers in the part of the period inside the domain", () => {
  const position = v => v * 10;
  assert.strictEqual(periodCenter([2, 3], [0, 10], position), 25);
  // A period the domain cuts centers in what's left of it.
  assert.strictEqual(periodCenter([-1, 1], [0, 10], position), 5);
  assert.strictEqual(periodCenter([9, 11], [0, 10], position), 95);
  // One starting where the domain ends centers in its whole period.
  assert.strictEqual(periodCenter([10, 11], [0, 10], position), 105);
});

it("periodLabelPositions is off by default and on non-period axes", () => {
  const {axis, measure} = timeAxis(months(12));
  assert.strictEqual(axis.tickLabelPosition(), "tick");
  assert.strictEqual(periodLabelPositions(axis, measure.labels), undefined);
  const linear = new AxisBottom()
    .domain([0, 100])
    .width(400)
    .tickLabelPosition("period");
  measureAxis(linear);
  assert.strictEqual(linear._periodPositions, undefined);
  const band = new AxisBottom()
    .scale("band")
    .domain(["a", "b"])
    .width(400)
    .tickLabelPosition("period");
  measureAxis(band);
  assert.strictEqual(band._periodPositions, undefined);
});

it("period labels center between month ticks; ticks stay put", () => {
  const dates = months(12);
  const tick = timeAxis(dates);
  tick.axis.render();
  const period = timeAxis(dates, {tickLabelPosition: "period"});
  const {axis} = period;
  assert.deepStrictEqual(period.measure.ticks, tick.measure.ticks);
  const centers = labelCenters(axis);
  assert.ok(centers.size >= 6, `labels drawn: ${centers.size}`);
  for (const [value, center] of centers) {
    const start = new Date(value);
    const end = timeMonth.offset(start, 1);
    const mid = (axis._getPosition(+start) + axis._getPosition(+end)) / 2;
    assert.ok(Math.abs(center - mid) < 0.5, `${start}: ${center} vs ${mid}`);
    assert.strictEqual(
      axisLabelPosition(axis, value),
      axis._periodPositions.get(value),
    );
  }
  // Tick marks sit on the month starts.
  const marks = axis._tickShape._data.filter(d => d.tick);
  for (const d of marks) assert.strictEqual(d.x, axis._getPosition(d.id));
  // Grid lines stay on the ticks too.
  assert.deepStrictEqual(
    axis._gridLineData.map(d => d.id),
    tick.axis._gridLineData.map(d => d.id),
  );
});

it("the last period, starting where the axis ends, centers past the end", () => {
  const {axis} = timeAxis(months(12), {tickLabelPosition: "period"});
  const dec = +new Date(2024, 11, 1);
  const end = axis._getPosition(dec);
  const next = axis._getPosition(+new Date(2025, 0, 1));
  assert.ok(Math.abs(axis._periodPositions.get(dec) - (end + next) / 2) < 1e-6);
  assert.ok(axis._periodPositions.get(dec) > end);
  // The axis narrows its range so the label stays within its width.
  const range = axis._getRange();
  assert.ok(range[1] < 795, `range end ${range[1]}`);
});

it("a period the domain cuts centers in the part the axis shows", () => {
  const dates = months(12);
  const axis = new AxisBottom()
    .scale("time")
    .domain([new Date(2024, 0, 16), new Date(2024, 11, 1)])
    .data(dates)
    .width(800)
    .tickLabelPosition("period");
  measureAxis(axis);
  const feb = +new Date(2024, 1, 1);
  const febCenter =
    (axis._getPosition(feb) + axis._getPosition(+new Date(2024, 2, 1))) / 2;
  assert.ok(Math.abs(axis._periodPositions.get(feb) - febCenter) < 1e-6);
});

it("a vertical axis centers its period labels along y", () => {
  const dates = months(6);
  const {axis} = timeAxis(dates, {tickLabelPosition: "period"}, AxisLeft);
  const centers = labelCenters(axis);
  assert.ok(centers.size >= 3);
  for (const [value, center] of centers)
    assert.ok(
      Math.abs(center - axis._periodPositions.get(value)) < 0.5,
      `${new Date(value)}`,
    );
});

it("UTC axes center labels in UTC periods", () => {
  const dates = [0, 1, 2, 3, 4, 5].map(m => new Date(Date.UTC(2024, m, 1)));
  const {axis} = timeAxis(dates, {tickLabelPosition: "period", utc: true});
  for (const date of dates.slice(0, -1)) {
    const end = utcMonth.offset(date, 1);
    const mid = (axis._getPosition(+date) + axis._getPosition(+end)) / 2;
    assert.ok(Math.abs(axis._periodPositions.get(+date) - mid) < 1e-6);
  }
});

it("range breaks: a Friday centers in its day before the weekend gap", () => {
  // January 2024 starts on a Monday.
  const days = [];
  for (let d = 1; d <= 19; d++) {
    const date = new Date(2024, 0, d);
    if (date.getDay() % 6) days.push(date);
  }
  const fri = +new Date(2024, 0, 5);
  const {axis} = timeAxis(days, {
    labels: [new Date(fri), new Date(2024, 0, 10)],
    tickLabelPosition: "period",
    rangeBreaks: "weekends",
  });
  const mon = +new Date(2024, 0, 8);
  const center = axis._periodPositions.get(fri);
  // Saturday is hidden, so Friday's day runs up to Monday's tick.
  const expected = (axis._getPosition(fri) + axis._getPosition(mon)) / 2;
  assert.ok(Math.abs(center - expected) < 1e-6, `${center} vs ${expected}`);
});

it("rotated labels shift into their periods too", () => {
  const dates = Array.from({length: 40}, (_, i) => new Date(2020, i, 1));
  const {axis} = timeAxis(dates, {
    tickLabelPosition: "period",
    labelRotation: -90,
  });
  axis.render();
  const labeled = axis._tickShape._data.filter(d => d.text);
  assert.ok(labeled.length > 0);
  for (const d of labeled) {
    const tick = axis._getPosition(d.id);
    const shift = axis._periodPositions.get(d.id) - tick;
    assert.ok(shift > 0, "the label sits after its tick");
  }
});

it("an axis of whole-number years centers each label in its year", () => {
  const years = [2018, 2019, 2020, 2021, 2022];
  const axis = new AxisBottom()
    .domain([2018, 2022])
    .data(years)
    .width(600)
    .tickLabelPosition("period");
  measureAxis(axis);
  const integers = [...axis._periodPositions.keys()];
  assert.ok(integers.length && integers.every(Number.isInteger));
  const center = axis._periodPositions.get(2020);
  const expected = (axis._getPosition(2020) + axis._getPosition(2021)) / 2;
  assert.ok(Math.abs(center - expected) < 1e-6);
});

it("a Timeline drawing ticks centers its labels in their periods", () => {
  const years = Array.from({length: 30}, (_, i) => new Date(1990 + i, 0, 1));
  const tl = new Timeline()
    .buttonBehavior("ticks")
    .data(years)
    .domain([years[0], years[years.length - 1]])
    .tickLabelPosition("period")
    .width(600)
    .duration(0)
    .render();
  assert.ok(tl._periodPositions?.size, "period positions set");
  const labeled = tl._tickShape._data.filter(d => d.text);
  assert.ok(labeled.length > 0);
  for (const d of labeled) {
    const start = tl._getPosition(d.id);
    const next = tl._getPosition(
      +new Date(new Date(d.id).getFullYear() + 1, 0, 1),
    );
    const center = d.x + d.labelBounds.x + d.labelBounds.width / 2;
    assert.ok(Math.abs(center - (start + next) / 2) < 0.5, `${new Date(d.id)}`);
  }
  // A Timeline drawing buttons centers its labels in them already.
  const buttons = new Timeline()
    .buttonBehavior("buttons")
    .data(years.slice(0, 5))
    .domain([years[0], years[4]])
    .tickLabelPosition("period")
    .width(600)
    .duration(0)
    .render();
  assert.strictEqual(buttons._periodPositions, undefined);
});
