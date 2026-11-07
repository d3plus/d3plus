import {it} from "vitest";
import assert from "assert";
import {Timeline, Treemap} from "../../index.ts";
import {
  classTimelineMode,
  timelineModeClass,
} from "../../src/components/Timeline/timelineMode.ts";
import {brushOverlayCursor} from "../../src/components/Timeline/timelineConfig.ts";
import {
  computeTimeFilter,
  startingSelection,
} from "../../src/charts/pipeline/preDrawData.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

const year = d => new Date(d).getFullYear();

it("timelineModeClass: names the mode drawn, or none", () => {
  assert.strictEqual(
    timelineModeClass("d3plus-viz-timeline", "ticks"),
    "d3plus-viz-timeline-ticks",
  );
  assert.strictEqual(
    timelineModeClass("d3plus-Timeline", "buttons"),
    "d3plus-Timeline-buttons",
  );
  // "auto" before a render resolves it.
  assert.strictEqual(timelineModeClass("d3plus-Timeline", "auto"), null);
});

it("classTimelineMode: swaps one mode's class for the other's", () => {
  const el = document.createElementNS("http://www.w3.org/2000/svg", "g");
  el.setAttribute("class", "d3plus-viz-timeline mine");
  classTimelineMode(el, "d3plus-viz-timeline", "buttons");
  assert.deepStrictEqual(
    [...el.classList],
    ["d3plus-viz-timeline", "mine", "d3plus-viz-timeline-buttons"],
  );
  classTimelineMode(el, "d3plus-viz-timeline", "ticks");
  assert.deepStrictEqual(
    [...el.classList],
    ["d3plus-viz-timeline", "mine", "d3plus-viz-timeline-ticks"],
  );
  classTimelineMode(el, "d3plus-viz-timeline", "auto");
  assert.deepStrictEqual([...el.classList], ["d3plus-viz-timeline", "mine"]);
  // A missing element is skipped.
  classTimelineMode(null, "d3plus-viz-timeline", "ticks");
});

it("brushOverlayCursor: brushCursor as a string or a function of the mode", () => {
  const tl = new Timeline();
  assert.strictEqual(tl.brushCursor(), "pointer");
  tl._buttonBehaviorCurrent = "buttons";
  assert.strictEqual(brushOverlayCursor(tl), "pointer");
  tl.brushCursor("crosshair");
  assert.strictEqual(brushOverlayCursor(tl), "crosshair");
  tl.brushCursor(mode => (mode === "buttons" ? "grab" : "col-resize"));
  assert.strictEqual(brushOverlayCursor(tl), "grab");
  tl._buttonBehaviorCurrent = "ticks";
  assert.strictEqual(brushOverlayCursor(tl), "col-resize");
  // Unset: no cursor attribute, so the page's CSS decides.
  tl.brushCursor(null);
  assert.strictEqual(brushOverlayCursor(tl), null);
});

it("brushCursor: a chart passes it through timelineConfig", async () => {
  const viz = new Treemap().timelineConfig({brushCursor: "cell"});
  assert.strictEqual(viz.timelineConfig().brushCursor, "cell");
});

it("startingSelection: timelineDefault, then timelineConfig.selection", () => {
  const span = viz => (startingSelection(viz) || []).map(year);
  assert.deepStrictEqual(span(new Treemap()), []);
  assert.deepStrictEqual(
    span(new Treemap().timelineDefault("2014")),
    [2014, 2014],
  );
  assert.deepStrictEqual(
    span(new Treemap().timelineConfig({selection: [2016, 2012].map(String)})),
    [2012, 2016],
  );
  assert.deepStrictEqual(
    span(
      new Treemap()
        .timelineDefault(["2013", "2015"])
        .timelineConfig({selection: new Date("2018/01/01")}),
    ),
    [2013, 2015],
  );
  assert.deepStrictEqual(
    span(new Treemap().timelineConfig({selection: false})),
    [],
  );
});

const yearly = Array.from({length: 5}, (_, i) => ({
  id: "a",
  year: 2016 + i,
  value: i,
}));

it("computeTimeFilter: a chart starts on its starting selection", () => {
  const rows = viz => yearly.filter(computeTimeFilter(viz)).map(d => d.year);
  const treemap = () => new Treemap().data(yearly).groupBy("id").time("year");
  assert.deepStrictEqual(rows(treemap()), [2020]);
  assert.deepStrictEqual(
    rows(treemap().timelineDefault(["2017", "2018"])),
    [2017, 2018],
  );
  assert.deepStrictEqual(
    rows(treemap().timelineConfig({selection: new Date("2019/01/01")})),
    [2019],
  );
  // A configured timeFilter is used as is.
  const filtered = treemap()
    .timelineDefault("2017")
    .timeFilter(d => d.year === 2016);
  assert.strictEqual(computeTimeFilter(filtered), undefined);
});
