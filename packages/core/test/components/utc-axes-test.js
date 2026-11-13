import {afterAll, beforeAll, it} from "vitest";
import assert from "assert";
import {timeFormat, utcFormat} from "d3-time-format";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom} from "../../index.ts";
import {
  axisDateLabel,
  axisUtc,
  configUtc,
  defaultTimeFormat,
  parseTime,
  parseTimeValues,
} from "../../src/components/Axis/timeValues.ts";
import {
  rangeBreakGaps,
  rangeBreakTime,
} from "../../src/components/Axis/rangeBreaks.ts";
import {datesDays} from "../../src/components/Axis/axisRangeBreaks.ts";
import {
  plotAxisUtc,
  timelineUtc,
  timeValueAxes,
} from "../../src/charts/Plot/plotRangeBreaks.ts";
import {widenToValues} from "../../src/charts/Plot/referenceDomains.ts";
import {
  projectionPositions,
  trendStep,
} from "../../src/charts/Plot/trendProjection.ts";
import {
  formatPeriod,
  periodBoundaries,
  periodDate,
  periodLabel,
  periodTickFormat,
  periodTickSets,
  unitIndex,
} from "../../src/charts/Candlestick/periods.ts";
import {ganttDomain} from "../../src/charts/Gantt/applyLayout.ts";
import {
  isUtcAxis,
  parseTime as parseTaskTime,
} from "../../src/charts/Priestley/timeAxis.ts";

/**
    Time axes in UTC (`utc: true`): the helpers that read an axis config's
    `utc`, and each reader of time that follows it (parsing, labels, range
    breaks, trend projections, Candlestick periods, Gantt domains). The file
    runs in Los Angeles time, where UTC midnight is the evening before.
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

const DAY = 864e5;
const utcDay = d => new Date(Date.UTC(2024, 2, d));
const utcMonth = m => new Date(Date.UTC(2024, m, 1));

it("the test runs west of UTC", () => {
  assert.strictEqual(utcDay(1).getDate(), 29);
});

it("configUtc reads an axis config's utc", () => {
  assert.strictEqual(configUtc({utc: true}), true);
  assert.strictEqual(configUtc({utc: false}), false);
  assert.strictEqual(configUtc({}), false);
  assert.strictEqual(configUtc(undefined), false);
  assert.strictEqual(configUtc("utc"), false);
});

it("axisUtc reads an Axis's utc, false by default", () => {
  assert.strictEqual(axisUtc(new AxisBottom()), false);
  assert.strictEqual(axisUtc(new AxisBottom().utc(true)), true);
  assert.strictEqual(new AxisBottom().utc(), false);
});

it("defaultTimeFormat picks d3's UTC or local formatter", () => {
  assert.strictEqual(defaultTimeFormat(true), utcFormat);
  assert.strictEqual(defaultTimeFormat(false), timeFormat);
});

it("parseTime and parseTimeValues read zoneless values in UTC with utc", () => {
  assert.strictEqual(+parseTime("2024-03-01", true), +utcDay(1));
  assert.strictEqual(+parseTime(2024, true), +utcMonth(0));
  assert.strictEqual(+parseTime("2024-03-01"), +new Date(2024, 2, 1));
  assert.deepStrictEqual(
    parseTimeValues(["2024-03-01", "nope", "2024-03-02"], true).map(Number),
    [+utcDay(1), +utcDay(2)],
  );
});

/** Draws a standalone time axis over `domain` and reads its labels and ticks. */
function draw(domain, config = {}) {
  document.body.innerHTML = "";
  const axis = new AxisBottom()
    .scale("time")
    .domain(domain)
    .width(700)
    .height(80)
    .duration(0)
    .config(config);
  axis.render();
  const svg = document.querySelector("svg.d3plus-render-svg");
  return {
    axis,
    labels: [...svg.querySelectorAll("text")].map(t => t.textContent),
    ticks: axis._visibleTicks.map(Number),
  };
}

it("a UTC axis ticks and labels UTC days", () => {
  const {labels, ticks} = draw([utcDay(1), utcDay(8)], {utc: true});
  assert.deepStrictEqual(labels, [
    "Mar 1, 2024",
    "Mar 2",
    "Mar 3",
    "Mar 4",
    "Mar 5",
    "Mar 6",
    "Mar 7",
    "Mar 8",
  ]);
  // Ticks fall every few UTC hours, from UTC midnight.
  ticks.forEach(t =>
    assert.strictEqual(t % (6 * 36e5), 0, `${new Date(t)} is on UTC's clock`),
  );
});

it("a local axis over the same domain ticks local midnights", () => {
  const {labels, ticks} = draw([utcDay(1), utcDay(8)]);
  assert.ok(!labels.includes("Mar 8"), `no Mar 8 locally (${labels})`);
  assert.ok(
    ticks.some(t => t % DAY !== 0),
    "ticks off UTC midnight",
  );
});

it("a UTC axis parses string data and domains in UTC", () => {
  document.body.innerHTML = "";
  const axis = new AxisBottom()
    .scale("time")
    .utc(true)
    .data(["2024-03-01", "2024-03-02", "2024-03-03", "2024-03-04"])
    .domain(["2024-03-01", "2024-03-04"])
    .width(600)
    .height(80)
    .duration(0);
  axis.render();
  assert.deepStrictEqual(axis._d3Scale.domain().map(Number), [
    +utcDay(1),
    +utcDay(4),
  ]);
  assert.strictEqual(axisDateLabel(axis, utcDay(3)), "Mar 3, 2024");
});

it("a UTC axis's rangeBreaks hide UTC weekends", () => {
  // March 2, 2024 is a Saturday.
  const {ticks, labels} = draw([utcDay(1), utcDay(15)], {
    utc: true,
    rangeBreaks: "weekends",
  });
  ticks.forEach(t => {
    const day = new Date(t).getUTCDay();
    assert.ok(day !== 0 && day !== 6, `${new Date(t)} is a UTC weekday`);
  });
  assert.ok(labels.includes("Mar 4"), `Monday is labeled (${labels})`);
});

it("rangeBreakTime and rule gaps read zoneless values in UTC with utc", () => {
  assert.strictEqual(rangeBreakTime("2024-03-04", true), +utcDay(4));
  const [gap] = rangeBreakGaps(
    [{values: ["2024-03-04"]}],
    +utcDay(1),
    +utcDay(8),
    true,
  );
  assert.deepStrictEqual([gap.start, gap.end], [+utcDay(4), +utcDay(5)]);
});

it("datesDays reads UTC days with utc", () => {
  const dates = [
    new Date(Date.UTC(2024, 2, 1, 1)),
    new Date(Date.UTC(2024, 2, 1, 23)),
    new Date(Date.UTC(2024, 2, 2, 1)),
  ];
  assert.deepStrictEqual(datesDays(dates, true).map(Number), [
    +utcDay(1),
    +utcDay(2),
  ]);
  assert.strictEqual(datesDays(dates).length, 2);
});

it("trend projections step UTC months with utc", () => {
  const order = [0, 1, 2].map(utcMonth);
  assert.deepStrictEqual(projectionPositions(order, 2, true).map(Number), [
    +utcMonth(3),
    +utcMonth(4),
  ]);
  assert.strictEqual(+trendStep(order, true)(order[2], 1), +utcMonth(3));
  assert.deepStrictEqual(
    projectionPositions(order, {to: "2024-05"}, true).map(Number),
    [+utcMonth(3), +utcMonth(4)],
  );
});

it("Candlestick periods read UTC's calendar with utc", () => {
  assert.deepStrictEqual(periodDate("2024-03-01", true), utcDay(1));
  assert.strictEqual(formatPeriod(utcDay(1), true), "Mar 1, 2024");
  assert.strictEqual(formatPeriod(utcDay(1)), "Feb 29, 2024 4:00 PM");
  assert.notStrictEqual(
    unitIndex(utcDay(1), "month", true),
    unitIndex(utcDay(1), "month"),
  );
  assert.strictEqual(
    periodLabel(utcMonth(12), utcMonth(11), "month", true),
    "2025",
  );
  const days = [27, 28, 29, 30, 31, 32, 33].map(utcDay);
  assert.deepStrictEqual(periodBoundaries(days, "month", true).map(Number), [
    +utcDay(32),
  ]);
  const sets = periodTickSets(days, 10, true);
  assert.ok(sets.some(s => s.some(d => +d === +utcDay(32))));
  assert.strictEqual(periodTickFormat(days, true)(utcDay(28)), "Mar 28, 2024");
});

it("ganttDomain widens a single time by a UTC day with utc", () => {
  // March 10, 2024 springs forward in Los Angeles: a local day there is 23 hours.
  const t = Date.UTC(2024, 2, 10, 12);
  const task = {start: new Date(t), end: new Date(t)};
  const [lo, hi] = ganttDomain([task], true, true);
  assert.deepStrictEqual([t - lo, hi - t], [DAY, DAY]);
  const [localLo] = ganttDomain([task], true);
  assert.strictEqual(t - localLo, DAY - 36e5);
});

it("Gantt and Priestley read axisConfig.utc", () => {
  assert.strictEqual(isUtcAxis({schema: {axisConfig: {utc: true}}}), true);
  assert.strictEqual(isUtcAxis({schema: {axisConfig: {}}}), false);
  assert.strictEqual(+parseTaskTime("2024-03-01", true, true), +utcDay(1));
  assert.strictEqual(+parseTaskTime("2024-03-01", true), +new Date(2024, 2, 1));
});

/** A minimal Plot-like viz plotting `date` on x with its `time`. */
const plotViz = (xConfig, timelineConfig) => ({
  _data: [{date: "2024-03-01", value: 1}],
  _x: d => d.date,
  _y: d => d.value,
  _xConfig: xConfig,
  _yConfig: {},
  schema: {time: d => d.date, timelineConfig},
});

it("timeValueAxes lists the axes plotting the chart's time", () => {
  assert.deepStrictEqual(timeValueAxes(plotViz({})), ["x"]);
  assert.deepStrictEqual(
    timeValueAxes({...plotViz({}), schema: {time: undefined}}),
    [],
  );
});

it("plotAxisUtc reads an axis config's utc", () => {
  assert.strictEqual(plotAxisUtc(plotViz({utc: true}), "x"), true);
  assert.strictEqual(plotAxisUtc(plotViz({utc: true}), "y"), false);
});

it("timelineUtc follows timelineConfig.utc, else the time axis", () => {
  assert.strictEqual(timelineUtc(plotViz({utc: true})), true);
  assert.strictEqual(timelineUtc(plotViz({})), false);
  assert.strictEqual(timelineUtc(plotViz({utc: true}, {utc: false})), false);
  assert.strictEqual(timelineUtc(plotViz({}, {utc: true})), true);
});

it("widenToValues reads zoneless values in UTC with utc", () => {
  const out = widenToValues([utcDay(1), utcDay(5)], ["2024-03-08"], {
    time: true,
    utc: true,
  });
  assert.strictEqual(+out[1], +utcDay(8));
});
