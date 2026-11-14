import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {AxisBottom, AxisLeft} from "../../index.ts";
import {measureAxis} from "../../src/components/Axis/axisLimit.ts";
import {
  MINOR_TICK_GAP,
  gridValues,
  linearMinorValues,
  logMinorValues,
  majorTicks,
  minorTickCount,
  minorTickValues,
  pickMinorLevel,
  timeMinorLevels,
} from "../../src/components/Axis/axisMinorTicks.ts";

/**
    Minor ticks (`minorTicks`) and minor grid lines (`minorGrid`): on by
    default on a log axis at 2 through 9 times each power of ten, opt-in on
    other continuous axes, thinned when crowded, and never on category axes.
*/

useJsdom();

/** Renders a standalone axis and returns it. */
function draw(config, Axis = AxisBottom) {
  document.body.innerHTML = "";
  const axis = new Axis().width(600).height(300).duration(0).config(config);
  axis.render();
  return axis;
}

const minorMarks = axis => axis._tickShape._data.filter(d => d.minor);

it("minorTickCount: on for log axes by default, opt-in elsewhere", () => {
  const axis = new AxisBottom();
  assert.strictEqual(minorTickCount(axis), 0);
  axis.minorTicks(true);
  assert.strictEqual(minorTickCount(axis), 4);
  axis.minorTicks(9);
  assert.strictEqual(minorTickCount(axis), 9);
  axis.minorTicks(0);
  assert.strictEqual(minorTickCount(axis), 0);
  axis.minorTicks(undefined).scale("log");
  assert.strictEqual(minorTickCount(axis), 4);
  axis.minorTicks(false);
  assert.strictEqual(minorTickCount(axis), 0);
  for (const scale of ["band", "point", "ordinal"])
    assert.strictEqual(minorTickCount(axis.scale(scale).minorTicks(true)), 0);
});

it("logMinorValues: multiples of each power of ten inside the domain", () => {
  assert.deepStrictEqual(
    logMinorValues([1, 100]),
    [2, 3, 4, 5, 6, 7, 8, 9, 20, 30, 40, 50, 60, 70, 80, 90],
  );
  assert.deepStrictEqual(logMinorValues([100, 1], [2, 5]), [2, 5, 20, 50]);
  assert.deepStrictEqual(logMinorValues([0.01, 0.1], [5]), [0.05]);
  assert.deepStrictEqual(logMinorValues([-100, -10], [2, 5]), [-50, -20]);
  assert.deepStrictEqual(logMinorValues([3, 7]), [4, 5, 6]);
  // A domain spanning zero, or empty, has none.
  assert.deepStrictEqual(logMinorValues([-1, 1]), []);
  assert.deepStrictEqual(logMinorValues([5, 5]), []);
});

it("linearMinorValues: evenly between the ticks, across the domain", () => {
  assert.deepStrictEqual(
    linearMinorValues([0, 10, 20], [0, 20], 5),
    [2, 4, 6, 8, 12, 14, 16, 18],
  );
  // An uneven last step (a domain end) splits on the same grid.
  assert.deepStrictEqual(
    linearMinorValues([0, 10, 20, 23], [0, 23], 2),
    [5, 15],
  );
  assert.deepStrictEqual(
    linearMinorValues([0.1, 0.2, 0.3], [0, 0.3], 2),
    [0.05, 0.15, 0.25],
  );
  assert.deepStrictEqual(linearMinorValues([5], [0, 10], 5), []);
  assert.deepStrictEqual(linearMinorValues([0, 10], [0, 10], 1), []);
});

it("timeMinorLevels: the calendar between a time axis's ticks", () => {
  const years = [2020, 2021, 2022].map(y => +new Date(y, 0, 1));
  const [months, quarters, halves] = timeMinorLevels(
    years,
    [years[0], years[2]],
    "year",
  );
  assert.strictEqual(months.length, 22);
  assert.strictEqual(quarters.length, 6);
  assert.strictEqual(halves.length, 2);
  assert.strictEqual(quarters[0], +new Date(2020, 3, 1));
  const days = [0, 1].map(m => +new Date(2024, m, 1));
  const [daily] = timeMinorLevels(days, days, "month");
  assert.strictEqual(daily.length, 30);
  const utc = [0, 1].map(d => Date.UTC(2024, 0, 1 + d));
  const [hours] = timeMinorLevels(utc, utc, "day", true);
  assert.strictEqual(hours.length, 23);
  assert.strictEqual(hours[0], Date.UTC(2024, 0, 1, 1));
  assert.deepStrictEqual(timeMinorLevels(years, years, undefined), []);
  assert.deepStrictEqual(timeMinorLevels(years, years, "second"), []);
});

it("pickMinorLevel: the richest level whose ticks sit far enough apart", () => {
  const position = v => v;
  const levels = [[1, 2, 3, 4, 6, 7, 8, 9], [2, 4, 6, 8], [5]];
  assert.deepStrictEqual(
    pickMinorLevel(levels, [0, 10], position, 1),
    levels[0],
  );
  assert.deepStrictEqual(
    pickMinorLevel(levels, [0, 10], position, 2),
    levels[1],
  );
  assert.deepStrictEqual(pickMinorLevel(levels, [0, 10], position, 5), [5]);
  assert.deepStrictEqual(pickMinorLevel(levels, [0, 10], position, 6), []);
  assert.strictEqual(MINOR_TICK_GAP, 4);
});

it("majorTicks: a log axis keeps its labels and powers of ten", () => {
  const axis = new AxisBottom().scale("log");
  assert.deepStrictEqual(
    majorTicks(axis, [1, 2, 5, 10, 20, 50, 100, 1000], [1, 100]),
    [1, 10, 100, 1000],
  );
  // Given ticks, and other scales, are kept as given.
  axis.ticks([1, 2, 5]);
  assert.deepStrictEqual(majorTicks(axis, [1, 2, 5], [1]), [1, 2, 5]);
  const linear = new AxisBottom();
  assert.deepStrictEqual(majorTicks(linear, [0, 5, 10], [0, 10]), [0, 5, 10]);
});

it("a log axis draws minor ticks at 2–9 by default", () => {
  const axis = draw({scale: "log", domain: [1, 1000]});
  assert.deepStrictEqual(axis._availableTicks, [1, 10, 100, 1000]);
  assert.deepStrictEqual(axis._minorTickValues, logMinorValues([1, 1000]));
  const marks = minorMarks(axis);
  // A Line tick lists each minor tick twice, once per end of its mark.
  assert.strictEqual(marks.length, 2 * 24);
  assert.ok(marks.every(d => d.text === false && d.tick));
  // Half as long as the decades' ticks.
  const major = axis._tickShape._data.find(d => d.id === 10).size;
  assert.strictEqual(Math.abs(marks[0].size), Math.ceil(Math.abs(major) / 2));
  assert.ok(minorTickValues(axis, axis._availableTicks).length);
});

it("a short log axis thins its minor ticks, then drops them", () => {
  const short = draw({scale: "log", domain: [1, 1e5], width: 240});
  assert.deepStrictEqual(
    short._minorTickValues,
    logMinorValues([1, 1e5], [2, 5]),
  );
  const tiny = draw({scale: "log", domain: [1, 1e8], width: 120});
  assert.deepStrictEqual(tiny._minorTickValues, []);
});

it("minorTicks: false turns a log axis's minor ticks off", () => {
  const axis = draw({scale: "log", domain: [1, 1000], minorTicks: false});
  assert.strictEqual(minorMarks(axis).length, 0);
  // gridLog still draws a line at every multiple.
  const grid = draw({
    scale: "log",
    domain: [1, 1000],
    minorTicks: false,
    gridLog: true,
    gridSize: 100,
  });
  assert.strictEqual(grid._gridLineData.length, 4 + 24);
});

it("a linear axis draws minor ticks only when asked", () => {
  assert.strictEqual(minorMarks(draw({domain: [0, 100]})).length, 0);
  const axis = draw({domain: [0, 100], minorTicks: true});
  const ticks = axis._availableTicks;
  const step = ticks[1] - ticks[0];
  const values = axis._minorTickValues;
  assert.ok(values.length > 0);
  assert.ok(Math.abs(values[1] - values[0] - step / 5) < 1e-9);
  assert.ok(values.every(v => !ticks.includes(v)));
  // Half as long as the unlabeled ticks between labels.
  const unlabeled = axis._tickShape._data.find(
    d => d.tick && !d.text && !d.minor,
  );
  assert.strictEqual(
    Math.abs(minorMarks(axis)[0].size),
    Math.ceil(Math.abs(unlabeled.size) / 2),
  );
  // Nine between ticks 39 pixels apart would sit under 4 pixels apart, so
  // the axis falls back to splitting each step in 5.
  const crowded = draw({domain: [0, 100], minorTicks: 9, width: 2000});
  const c = crowded._availableTicks[1] - crowded._availableTicks[0];
  const cm = crowded._minorTickValues;
  assert.ok(Math.abs(cm[1] - cm[0] - c / 5) < 1e-9, `${cm.slice(0, 4)}`);
  const nine = draw({
    domain: [0, 100],
    minorTicks: 9,
    ticks: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  });
  const s = nine._availableTicks[1] - nine._availableTicks[0];
  const nm = nine._minorTickValues;
  assert.ok(Math.abs(nm[1] - nm[0] - s / 10) < 1e-9, `${nm.slice(0, 4)}`);
  // A vertical axis too.
  const left = draw({domain: [0, 100], minorTicks: true}, AxisLeft);
  assert.ok(minorMarks(left).length > 0);
});

it("category axes draw no minor ticks", () => {
  const axis = draw({scale: "band", domain: ["a", "b", "c"], minorTicks: true});
  assert.strictEqual(minorMarks(axis).length, 0);
});

it("minorGrid draws fainter lines at the minor ticks, beneath the grid", () => {
  const axis = draw({
    domain: [0, 100],
    minorTicks: true,
    minorGrid: true,
    gridSize: 100,
  });
  const {major, minor} = gridValues(
    axis,
    axis._availableTicks,
    axis._availableTicks,
  );
  assert.ok(major.length > 0);
  assert.deepStrictEqual(minor, axis._minorTickValues);
  const scene = axis.toScene();
  const lines = scene.children.filter(n => `${n.key}`.startsWith("grid-"));
  const minors = lines.filter(n => n.key.startsWith("grid-minor-"));
  assert.strictEqual(minors.length, axis._minorTickValues.length);
  assert.strictEqual(minors[0].paint.strokeOpacity, 0.5);
  // Beneath the grid lines.
  assert.ok(
    scene.children.indexOf(minors[minors.length - 1]) <
      scene.children.indexOf(lines.find(n => !n.key.startsWith("grid-minor"))),
  );
  axis.minorGridConfig({"stroke-dasharray": "2 2"}).render();
  const dashed = axis
    .toScene()
    .children.find(n => `${n.key}`.startsWith("grid-minor-"));
  assert.deepStrictEqual(dashed.paint.strokeDasharray, [2, 2]);
  assert.strictEqual(dashed.paint.strokeOpacity, 0.5);
  // Off by default, and only with minor ticks drawn.
  assert.strictEqual(
    draw({domain: [0, 100], minorTicks: true})._minorGridLineData.length,
    0,
  );
  assert.strictEqual(
    draw({domain: [0, 100], minorGrid: true})._minorGridLineData.length,
    0,
  );
  // None at a gridSize of 0.
  const none = draw({
    domain: [0, 100],
    minorTicks: true,
    minorGrid: true,
    gridSize: 0,
  });
  assert.deepStrictEqual(gridValues(none, [0, 50], [0, 50]), {
    major: [],
    minor: [],
  });
});

it("a time axis with minorTicks: true marks the calendar between its ticks", () => {
  const years = Array.from({length: 11}, (_, i) => new Date(2014 + i, 0, 1));
  const axis = new AxisBottom()
    .scale("time")
    .domain([years[0], years[10]])
    .data(years)
    .width(320)
    .minorTicks(true);
  measureAxis(axis);
  // Months crowd 320 pixels (under 3px apart, whatever the label font's
  // metrics), so the quarters stand in for them.
  assert.strictEqual(axis._minorTickValues.length, 30);
  assert.ok(
    axis._minorTickValues.every(v =>
      [3, 6, 9].includes(new Date(v).getMonth()),
    ),
  );
});

it("range breaks and axis breaks leave out hidden minor ticks", () => {
  const axis = new AxisBottom()
    .domain([0, 100])
    .break([40, 60])
    .width(800)
    .minorTicks(true);
  measureAxis(axis);
  assert.ok(axis._minorTickValues.length > 0);
  assert.ok(axis._minorTickValues.every(v => v <= 40 || v >= 60));
  const days = [];
  for (let d = 1; d <= 14; d++) days.push(new Date(2024, 0, d));
  const weekdays = new AxisBottom()
    .scale("time")
    .domain([days[0], days[13]])
    .data(days)
    .rangeBreaks("weekends")
    .width(1400)
    .minorTicks(true);
  measureAxis(weekdays);
  assert.ok(weekdays._minorTickValues.length > 0);
  assert.ok(
    weekdays._minorTickValues.every(v => new Date(v).getDay() % 6 !== 0),
  );
});
