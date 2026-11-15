import {afterEach, it, vi} from "vitest";
import assert from "assert";
import {
  appendData,
  appendTime,
  parseTimeSpan,
  windowRows,
} from "../../src/charts/viz/appendRows.ts";
import {dataChanged} from "../../src/charts/viz/dataChanged.ts";
import LinePlot from "../../src/charts/LinePlot/index.ts";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("parseTimeSpan reads a number and a unit, from milliseconds to weeks", () => {
  assert.strictEqual(parseTimeSpan("300000ms"), 300000);
  assert.strictEqual(parseTimeSpan("90s"), 90000);
  assert.strictEqual(parseTimeSpan("90 secs"), 90000);
  assert.strictEqual(parseTimeSpan("5 minutes"), 300000);
  assert.strictEqual(parseTimeSpan("5m"), 300000);
  assert.strictEqual(parseTimeSpan("1.5 hours"), 5400000);
  assert.strictEqual(parseTimeSpan("2 hrs"), 7200000);
  assert.strictEqual(parseTimeSpan("1 day"), 86400000);
  assert.strictEqual(parseTimeSpan("2 W"), 1209600000);
});

it("parseTimeSpan is null for anything else", () => {
  for (const span of [
    "",
    "5",
    "minutes",
    "5 fortnights",
    "five minutes",
    "-5s",
  ])
    assert.strictEqual(parseTimeSpan(span), null, span);
});

const rows = [0, 1, 2, 3, 4].map(i => ({id: "a", t: 1e12 + i * 1000, i}));
const time = d => d.t;

it("windowRows keeps the latest rows for a row count", () => {
  assert.deepStrictEqual(
    windowRows(rows, 2).map(d => d.i),
    [3, 4],
  );
  assert.strictEqual(windowRows(rows, 5), rows);
  assert.strictEqual(windowRows(rows, 50), rows);
  assert.deepStrictEqual(windowRows(rows, 0), []);
});

it("windowRows keeps the rows within a time span of the latest", () => {
  assert.deepStrictEqual(
    windowRows(rows, "2 seconds", time).map(d => d.i),
    [2, 3, 4],
  );
  assert.deepStrictEqual(
    windowRows(rows, "1500ms", time).map(d => d.i),
    [3, 4],
  );
});

it("windowRows reads Dates and date strings, and keeps rows with no time", () => {
  const dated = [
    {at: new Date(Date.UTC(2026, 0, 1, 0, 0, 0))},
    {at: "2026-01-01T00:01:00Z"},
    {at: undefined},
    {at: new Date(Date.UTC(2026, 0, 1, 0, 2, 0))},
  ];
  assert.deepStrictEqual(
    windowRows(dated, "1 minute", d => d.at),
    [dated[1], dated[2], dated[3]],
  );
});

it("windowRows keeps every row for no window or one it can't read", () => {
  assert.strictEqual(windowRows(rows, undefined, time), rows);
  assert.strictEqual(windowRows(rows, false, time), rows);
  assert.strictEqual(windowRows(rows, "soon", time), rows);
  assert.strictEqual(windowRows(rows, "5s"), rows, "no time to read");
  assert.strictEqual(
    windowRows(rows, "5s", () => undefined),
    rows,
    "no readable time",
  );
});

it("appendTime reads the chart's time, else its discrete axis", () => {
  const viz = new LinePlot().x("when");
  assert.strictEqual(appendTime(viz)({when: 5}, 0), 5);
  viz.time("t");
  assert.strictEqual(appendTime(viz)({when: 5, t: 9}, 0), 9);
  assert.strictEqual(appendTime({schema: {}}), null);
});

/** A chart stand-in that counts its redraws. */
function fakeViz(over = {}) {
  const viz = {
    schema: {},
    _data: [{i: 0}],
    draws: 0,
    render() {
      viz.draws++;
    },
    ...over,
  };
  return viz;
}

it("appendData adds rows and redraws once for every append before the next frame", () => {
  vi.useFakeTimers();
  vi.stubGlobal("requestAnimationFrame", cb => setTimeout(cb, 16));
  const viz = fakeViz();
  appendData(viz, {i: 1});
  appendData(viz, [{i: 2}, {i: 3}]);
  assert.deepStrictEqual(
    viz._data.map(d => d.i),
    [0, 1, 2, 3],
  );
  assert.strictEqual(viz.draws, 0, "the redraw waits for the frame");
  vi.advanceTimersByTime(20);
  assert.strictEqual(viz.draws, 1);
  appendData(viz, {i: 4});
  vi.advanceTimersByTime(20);
  assert.strictEqual(viz.draws, 2, "a later append redraws again");
});

it("appendData drops rows outside the window and skips empty rows", () => {
  vi.useFakeTimers();
  const viz = fakeViz({_data: [{i: 0}, {i: 1}]});
  appendData(viz, [{i: 2}, null, undefined], {window: 2});
  assert.deepStrictEqual(
    viz._data.map(d => d.i),
    [1, 2],
  );
  vi.runAllTimers();
  assert.strictEqual(viz.draws, 1);
});

it("appendData re-defaults a timeline the user hasn't brushed", () => {
  vi.useFakeTimers();
  const free = fakeViz({_timelineSelection: [1, 2]});
  appendData(free, {i: 1});
  assert.strictEqual(free._timelineSelection, false);
  const brushed = fakeViz({
    schema: {timeFilter: () => true},
    _timelineSelection: [1, 2],
  });
  appendData(brushed, {i: 1});
  assert.deepStrictEqual(brushed._timelineSelection, [1, 2]);
});

it("append keeps the series a viewer hid, which setting data clears", () => {
  vi.useFakeTimers();
  const viz = new LinePlot().data([{id: "a", x: 1, y: 1}]);
  viz.render = () => viz;
  viz._hidden = ["a"];
  viz._solo = ["b"];
  assert.strictEqual(viz.append({id: "a", x: 2, y: 2}), viz);
  assert.deepStrictEqual(viz._hidden, ["a"]);
  assert.deepStrictEqual(viz._solo, ["b"]);
  assert.strictEqual(viz._data.length, 2);
  viz.data([{id: "a", x: 3, y: 3}]);
  assert.deepStrictEqual(viz._hidden, []);
});

it("config() reflection leaves append alone", () => {
  const viz = new LinePlot().data([{id: "a", x: 1, y: 1}]);
  viz.config();
  assert.strictEqual(viz._data.length, 1);
});

it("dataChanged compares rows only as far as it must", () => {
  const a = [{x: 1}, {x: 2}];
  assert.strictEqual(dataChanged(a, a), false);
  assert.strictEqual(dataChanged([{x: 1}, {x: 2}], a), false);
  assert.strictEqual(dataChanged([a[0], {x: 3}], a), true);
  assert.strictEqual(dataChanged([{x: 1}], a), true);
  assert.strictEqual(dataChanged("data.json", "data.json"), false);
  assert.strictEqual(dataChanged("other.json", "data.json"), true);
  assert.strictEqual(dataChanged(a, "data.json"), true);
  // A row whose JSON differs at the start is read no further.
  let reads = 0;
  const watched = {
    toJSON() {
      reads++;
      return {x: 9};
    },
  };
  assert.strictEqual(dataChanged([{x: 0}, watched], [{x: 1}, {x: 2}]), true);
  assert.strictEqual(reads, 0);
});
