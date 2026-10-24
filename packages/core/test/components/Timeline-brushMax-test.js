import {it} from "vitest";
import assert from "assert";
import {Timeline, Treemap} from "../../index.ts";
import {
  brushSpan,
  growFrom,
  nearestIndex,
  spanIndices,
  timelineBrushSpan,
} from "../../src/components/Timeline/brushSpan.ts";
import {clampSelection} from "../../src/components/Timeline/timelineRender.ts";
import {computeTimeFilter} from "../../src/charts/pipeline/preDrawData.ts";
import {LinePlot} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    Timeline `brushMin` and `brushMax`: the fewest and most ticks (or
    buttons) a brush selection may span. A brush outside them is moved on
    release, keeping the end being dragged; a starting selection outside them
    keeps its latest period.
*/

const year = d => new Date(d).getFullYear();

it("brushSpan: brushMin and brushMax as numbers or functions", () => {
  assert.deepStrictEqual(brushSpan(1, undefined), {min: 1, max: Infinity});
  assert.deepStrictEqual(
    brushSpan(() => 2, 3),
    {min: 2, max: 3},
  );
  assert.deepStrictEqual(
    brushSpan(1, () => 4),
    {min: 1, max: 4},
  );
});

it("brushSpan: an unset or non-finite brushMax is unlimited", () => {
  for (const v of [undefined, null, false, Infinity, NaN, "3", () => null])
    assert.strictEqual(brushSpan(1, v).max, Infinity, `${v}`);
});

it("brushSpan: a fractional brushMax rounds down; one below brushMin rises to it", () => {
  assert.strictEqual(brushSpan(1, 3.7).max, 3);
  assert.strictEqual(brushSpan(1, 0).max, 1);
  assert.strictEqual(brushSpan(4, 2).max, 4);
  assert.strictEqual(
    brushSpan(
      () => 2,
      () => 1,
    ).max,
    2,
  );
  // An unusable brushMin reads as 1.
  assert.strictEqual(brushSpan(undefined, undefined).min, 1);
});

it("spanIndices: a short selection grows to brushMin, its upper end first", () => {
  const span = {min: 3, max: Infinity};
  assert.deepStrictEqual(spanIndices(2, 2, 10, span), [2, 4]);
  // Out of room above, the lower end moves down.
  assert.deepStrictEqual(spanIndices(9, 9, 10, span), [7, 9]);
  // Too few ticks for brushMin: as wide as they go.
  assert.deepStrictEqual(spanIndices(0, 0, 2, span), [0, 1]);
});

it("spanIndices: a long selection shrinks to brushMax, keeping the anchor end", () => {
  const span = {min: 1, max: 3};
  assert.deepStrictEqual(spanIndices(1, 8, 10, span), [6, 8]);
  assert.deepStrictEqual(spanIndices(1, 8, 10, span, "hi"), [6, 8]);
  assert.deepStrictEqual(spanIndices(1, 8, 10, span, "lo"), [1, 3]);
  // Within both limits, nothing moves.
  assert.deepStrictEqual(spanIndices(4, 6, 10, span, "lo"), [4, 6]);
  assert.deepStrictEqual(spanIndices(4, 4, 10, span), [4, 4]);
  // brushMin and brushMax at once.
  assert.deepStrictEqual(spanIndices(5, 5, 10, {min: 2, max: 2}), [5, 6]);
  assert.deepStrictEqual(spanIndices(0, 9, 10, {min: 2, max: 2}, "lo"), [0, 1]);
});

it("nearestIndex: the index of the closest value", () => {
  assert.strictEqual(nearestIndex([0, 10, 20], 12), 1);
  assert.strictEqual(nearestIndex([0, 10, 20], 99), 2);
  assert.strictEqual(nearestIndex([], 5), -1);
});

it("Timeline.brushMax: a fluent setting, unset by default", () => {
  assert.strictEqual(new Timeline().brushMax(), undefined);
  assert.strictEqual(new Timeline().brushMax(3).brushMax()(), 3);
  const fn = () => 2;
  assert.strictEqual(new Timeline().brushMax(fn).brushMax(), fn);
});

/** One tick per year, 2010–2021, as a chart hands its Timeline. */
const years = Array.from({length: 12}, (_, i) => new Date(`${2010 + i}/01/01`));

/** A rendered ticks-mode Timeline over 2010–2021. */
async function timeline(config) {
  const tl = new Timeline()
    .domain([years[0], years[11]])
    .ticks(years)
    .buttonBehavior("ticks")
    .width(600)
    .height(100)
    .config(config);
  await new Promise(cb => tl.render(cb));
  return tl;
}

/** Releases a brush from `from` to `to`, with the pointer at `at`. */
function release(tl, from, to, at) {
  const px = y => tl._d3Scale(new Date(`${y}/01/01`));
  tl._brushEnd({
    type: "end",
    target: tl._brush,
    sourceEvent: {clientX: px(at), clientY: 0},
    selection: [px(from), px(to)],
  });
  return [].concat(tl.selection()).map(year);
}

it("Timeline brushMax (ticks): a wide brush keeps the end being dragged", async () => {
  const tl = await timeline({brushMax: 3});
  assert.deepStrictEqual(release(tl, 2011, 2018, 2018), [2016, 2018]);
  assert.deepStrictEqual(release(tl, 2011, 2018, 2011), [2011, 2013]);
  assert.deepStrictEqual(release(tl, 2014, 2015, 2015), [2014, 2015]);
});

it("Timeline brushMax (ticks): brushMin still applies, and wins a conflict", async () => {
  const tl = await timeline({brushMin: 3, brushMax: 4});
  assert.deepStrictEqual(release(tl, 2012, 2012, 2012), [2012, 2014]);
  assert.deepStrictEqual(release(tl, 2012, 2020, 2020), [2017, 2020]);
  const conflict = await timeline({brushMin: 3, brushMax: 2});
  assert.deepStrictEqual(release(conflict, 2012, 2020, 2020), [2018, 2020]);
});

it("Timeline brushMax: unset leaves a wide brush alone", async () => {
  const tl = await timeline({});
  assert.deepStrictEqual(release(tl, 2011, 2018, 2018), [2011, 2018]);
});

it("Timeline brushMax (buttons): a wide brush is held to brushMax buttons", async () => {
  const tl = new Timeline()
    .domain([years[0], years[11]])
    .ticks(years)
    .buttonBehavior("buttons")
    .brushMax(2)
    .width(600)
    .height(100);
  await new Promise(cb => tl.render(cb));
  const range = tl._d3Scale.range();
  tl._brushEnd({
    type: "end",
    target: tl._brush,
    sourceEvent: {clientX: range[1], clientY: 0},
    selection: [range[1], range[6]],
  });
  assert.deepStrictEqual(tl.selection().map(year), [2011, 2012]);
});

it("clampSelection: a wide starting selection keeps its latest periods", async () => {
  const tl = await timeline({brushMax: 3, selection: [years[0], years[11]]});
  assert.deepStrictEqual(tl.selection().map(year), [2019, 2021]);
  // Within brushMax, or unlimited, it is left as given.
  const within = [new Date("2014/01/01"), new Date("2015/01/01")];
  const narrow = await timeline({brushMax: 3, selection: within});
  assert.deepStrictEqual(narrow.selection().map(year), [2014, 2015]);
  const all = await timeline({selection: [years[0], years[11]]});
  assert.deepStrictEqual(all.selection().map(year), [2010, 2021]);
});

it("clampSelection: pulls the selection's first end in place", () => {
  const periods = [2010, 2011, 2012, 2013].map(y => new Date(`${y}/01/01`));
  const tl = new Timeline().brushMax(2);
  tl._buttonBehaviorCurrent = "ticks";
  const selection = [periods[0], periods[3]];
  clampSelection(tl, selection, periods);
  assert.deepStrictEqual(selection.map(year), [2012, 2013]);
  assert.deepStrictEqual(tl.selection().map(year), [2012, 2013]);
  const untouched = [periods[0], periods[3]];
  clampSelection(new Timeline(), untouched, periods);
  assert.deepStrictEqual(untouched.map(year), [2010, 2013]);
});

const yearly = [2016, 2017, 2018, 2019, 2020].map(y => ({
  id: "a",
  year: y,
  value: y - 2000,
}));

it("computeTimeFilter: a time axis shows only the latest brushMax periods", () => {
  const rows = viz => yearly.filter(computeTimeFilter(viz)).map(d => d.year);
  const line = () =>
    new LinePlot().data(yearly).groupBy("id").x("year").y("value");
  assert.deepStrictEqual(
    rows(line().time("year")),
    [2016, 2017, 2018, 2019, 2020],
  );
  assert.deepStrictEqual(
    rows(line().time("year").timelineConfig({brushMax: 3})),
    [2018, 2019, 2020],
  );
  // No timeline, no cap.
  assert.deepStrictEqual(
    rows(line().time("year").timeline(false).timelineConfig({brushMax: 3})),
    [2016, 2017, 2018, 2019, 2020],
  );
  // A chart without a time axis still shows its latest period.
  const treemap = new Treemap()
    .data(yearly)
    .groupBy("id")
    .time("year")
    .timelineConfig({brushMax: 3});
  assert.deepStrictEqual(rows(treemap), [2020]);
});

it("spanIndices: a short selection can grow from its upper end instead", () => {
  const span = {min: 3, max: Infinity};
  assert.deepStrictEqual(spanIndices(5, 6, 10, span, "hi", "hi"), [4, 6]);
  // Out of room below, the upper end moves up.
  assert.deepStrictEqual(spanIndices(0, 0, 10, span, "hi", "hi"), [0, 2]);
  assert.deepStrictEqual(spanIndices(9, 9, 10, span, "hi", "lo"), [7, 9]);
});

it("growFrom: a click grows from its period; a drag keeps the dragged end", () => {
  assert.strictEqual(growFrom(4, 4, "hi"), "lo");
  assert.strictEqual(growFrom(4, 5, "hi"), "hi");
  assert.strictEqual(growFrom(4, 5, "lo"), "lo");
});

it("timelineBrushSpan: a single-period Timeline has no brushMin to meet", () => {
  const schema = {brushMin: () => 3, brushMax: () => 4};
  assert.deepStrictEqual(timelineBrushSpan(schema), {min: 3, max: 4});
  assert.deepStrictEqual(timelineBrushSpan({...schema, brushing: false}), {
    min: 1,
    max: 4,
  });
});

/** A rendered buttons-mode Timeline over 2010–2021. */
async function buttons(config) {
  const tl = new Timeline()
    .domain([years[0], years[11]])
    .ticks(years)
    .buttonBehavior("buttons")
    .width(600)
    .height(100)
    .config(config);
  await new Promise(cb => tl.render(cb));
  return tl;
}

/** Releases a buttons brush from `from` to `to` (years), the pointer at `at`. */
function releaseButtons(tl, from, to, at) {
  const px = y => tl._d3Scale.range()[y - 2010];
  tl._brushEnd({
    type: "end",
    target: tl._brush,
    sourceEvent: {clientX: px(at), clientY: 0},
    selection: from === null ? null : [px(from), px(to)],
  });
  return [].concat(tl.selection()).map(year);
}

it("Timeline brushMin (buttons): a narrow drag keeps the dragged end", async () => {
  const tl = await buttons({brushMin: 3});
  // Dragged right to 2015: the start moves back.
  assert.deepStrictEqual(releaseButtons(tl, 2014, 2015, 2015), [2013, 2015]);
  // Dragged left to 2014: the end moves on.
  assert.deepStrictEqual(releaseButtons(tl, 2014, 2015, 2014), [2014, 2016]);
  // Wide enough already.
  assert.deepStrictEqual(releaseButtons(tl, 2014, 2017, 2017), [2014, 2017]);
});

it("Timeline brushMin (buttons): a click selects brushMin from the clicked button", async () => {
  const tl = await buttons({brushMin: 3});
  assert.deepStrictEqual(releaseButtons(tl, null, null, 2014), [2014, 2016]);
  // At the last button, it grows the other way.
  assert.deepStrictEqual(releaseButtons(tl, null, null, 2021), [2019, 2021]);
});

it("Timeline brushMin (buttons): at an edge the selection grows the other way", async () => {
  const tl = await buttons({brushMin: 4});
  // Dragged right to 2011: no room before 2010, so the end moves on.
  assert.deepStrictEqual(releaseButtons(tl, 2010, 2011, 2011), [2010, 2013]);
  assert.deepStrictEqual(releaseButtons(tl, 2020, 2021, 2020), [2018, 2021]);
});

it("Timeline brushMin (buttons): brushMin wins over a smaller brushMax", async () => {
  const tl = await buttons({brushMin: 3, brushMax: 2});
  assert.deepStrictEqual(releaseButtons(tl, 2012, 2019, 2019), [2017, 2019]);
  assert.deepStrictEqual(releaseButtons(tl, null, null, 2012), [2012, 2014]);
});

it("Timeline brushMin: unused with brushing false, and 1 by default", async () => {
  const single = await buttons({brushMin: 3, brushing: false});
  assert.deepStrictEqual(releaseButtons(single, null, null, 2014), [2014]);
  const plain = await buttons({});
  assert.deepStrictEqual(releaseButtons(plain, null, null, 2014), [2014]);
  assert.deepStrictEqual(releaseButtons(plain, 2014, 2015, 2015), [2014, 2015]);
});

it("clampSelection: a narrow starting selection widens to brushMin", async () => {
  const one = await buttons({brushMin: 3, selection: [years[5]]});
  assert.deepStrictEqual(one.selection().map(year), [2013, 2015]);
  const first = await buttons({brushMin: 3, selection: [years[0]]});
  assert.deepStrictEqual(first.selection().map(year), [2010, 2012]);
  const ticks = await timeline({brushMin: 3, selection: [years[5]]});
  assert.deepStrictEqual(ticks.selection().map(year), [2013, 2015]);
  // A single-period Timeline keeps its one period.
  const single = await buttons({
    brushMin: 3,
    brushing: false,
    selection: years[5],
  });
  assert.deepStrictEqual([].concat(single.selection()).map(year), [2015]);
});

it("computeTimeFilter: a chart starts on its latest brushMin periods", () => {
  const rows = viz => yearly.filter(computeTimeFilter(viz)).map(d => d.year);
  const treemap = config =>
    new Treemap().data(yearly).groupBy("id").time("year").config(config);
  assert.deepStrictEqual(rows(treemap({})), [2020]);
  assert.deepStrictEqual(
    rows(treemap({timelineConfig: {brushMin: 3}})),
    [2018, 2019, 2020],
  );
  assert.deepStrictEqual(
    rows(treemap({timelineConfig: {brushMin: 3, brushing: false}})),
    [2020],
  );
  assert.deepStrictEqual(
    rows(treemap({timeline: false, timelineConfig: {brushMin: 3}})),
    [2020],
  );
});
