import {it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {loadD3plus, pageErrors, resetPage} from "~test/browser/render.js";

/**
    A chart's timeline, on SVG and Canvas: its group names how it is drawn
    (`d3plus-viz-timeline-ticks` / `-buttons`, following `"auto"` across a
    resize), `brushCursor` sets the brush overlay's cursor, `on.end` hands back
    the period a real click picks, and `timeFilter`, `timelineDefault` and
    `timelineConfig.selection` start the chart and its timeline on a chosen
    period.
*/

const data = ["Apples", "Pears", "Plums"].flatMap((id, i) =>
  Array.from({length: 12}, (_, y) => ({
    id,
    year: 2010 + y,
    value: 20 + ((i * 7 + y * 5) % 11) * 6,
  })),
);

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const years = s => [].concat(s).map(d => new Date(d).getFullYear());

/** Renders a Treemap with a timeline; resolves once drawn. */
async function draw(renderer, setup = v => v, width = 760) {
  await loadD3plus();
  resetPage(
    `<div id="viz" style="width:${width}px;height:440px;font-family:sans-serif;"></div>`,
  );
  window.__ends = [];
  const viz = new window.d3plus.Treemap()
    .select("#viz")
    .data(data)
    .groupBy("id")
    .sum("value")
    .time("year")
    .renderer(renderer)
    .duration(0)
    .legend(false);
  setup(viz);
  window.__viz = viz;
  await new Promise(resolve => viz.render(resolve));
  return viz;
}

/** The chart's timeline group, its classes, and its brush overlay's cursor. */
function timeline() {
  const group = document.querySelector("#viz g.d3plus-viz-timeline");
  const inner = group.querySelector(":scope > g");
  return {
    classes: [...group.classList].sort(),
    inner: [...inner.classList].sort(),
    cursor: group.querySelector(".brushGroup .overlay").getAttribute("cursor"),
  };
}

/** The selected years and the drawn years. */
function state(viz) {
  return {
    selection: years(viz._timelineClass.selection()),
    filtered: [...new Set(viz._filteredData.flatMap(d => [].concat(d.year)))]
      .map(Number)
      .sort(),
  };
}

for (const renderer of ["svg", "canvas"]) {
  it(`mode class (${renderer}): ticks and buttons`, async function () {
    for (const mode of ["ticks", "buttons"]) {
      await draw(renderer, v => v.timelineConfig({buttonBehavior: mode}));
      const other = mode === "ticks" ? "buttons" : "ticks";
      const {classes, inner} = timeline();
      assert.deepStrictEqual(classes, [
        "d3plus-viz-timeline",
        `d3plus-viz-timeline-${mode}`,
      ]);
      assert.deepStrictEqual(inner, [`d3plus-Timeline-${mode}`]);
      assert.ok(!classes.includes(`d3plus-viz-timeline-${other}`));
    }
    assert.deepStrictEqual(pageErrors(), []);
  });

  it(`mode class (${renderer}): "auto" follows a resize`, async function () {
    const viz = await draw(renderer);
    assert.strictEqual(viz._timelineClass._buttonBehaviorCurrent, "buttons");
    assert.ok(timeline().classes.includes("d3plus-viz-timeline-buttons"));

    // Too narrow for a button per year: the timeline draws ticks.
    await new Promise(resolve => viz.width(320).render(resolve));
    assert.strictEqual(viz._timelineClass._buttonBehaviorCurrent, "ticks");
    let {classes, inner} = timeline();
    assert.ok(classes.includes("d3plus-viz-timeline-ticks"));
    assert.ok(!classes.includes("d3plus-viz-timeline-buttons"));
    assert.deepStrictEqual(inner, ["d3plus-Timeline-ticks"]);

    // Wide again: back to buttons.
    await new Promise(resolve => viz.width(760).render(resolve));
    ({classes, inner} = timeline());
    assert.ok(classes.includes("d3plus-viz-timeline-buttons"));
    assert.ok(!classes.includes("d3plus-viz-timeline-ticks"));
    assert.deepStrictEqual(inner, ["d3plus-Timeline-buttons"]);
    assert.deepStrictEqual(pageErrors(), []);
  });

  it(`brushCursor (${renderer}): default, string and function`, async function () {
    await draw(renderer);
    assert.strictEqual(timeline().cursor, "pointer");

    await draw(renderer, v => v.timelineConfig({brushCursor: "crosshair"}));
    assert.strictEqual(timeline().cursor, "crosshair");

    for (const mode of ["ticks", "buttons"]) {
      await draw(renderer, v =>
        v.timelineConfig({
          buttonBehavior: mode,
          brushCursor: m => (m === "buttons" ? "grab" : "col-resize"),
        }),
      );
      assert.strictEqual(
        timeline().cursor,
        mode === "buttons" ? "grab" : "col-resize",
      );
      // The handles keep d3-brush's resize cursor.
      const handle = document.querySelector("#viz .brushGroup .handle--e");
      assert.strictEqual(handle.getAttribute("cursor"), "ew-resize");
    }

    // handleConfig and selectionConfig set theirs.
    await draw(renderer, v =>
      v.timelineConfig({
        buttonBehavior: "ticks",
        brushing: true,
        handleConfig: {cursor: "col-resize"},
        selectionConfig: {cursor: "grab"},
      }),
    );
    const brush = document.querySelector("#viz .brushGroup");
    assert.strictEqual(
      brush.querySelector(".handle--e").getAttribute("cursor"),
      "col-resize",
    );
    assert.strictEqual(
      brush.querySelector(".selection").getAttribute("cursor"),
      "grab",
    );
    assert.deepStrictEqual(pageErrors(), []);
  });

  it(`brushCursor (${renderer}): survives a click on the brush`, async function () {
    const viz = await draw(renderer, v =>
      v.timelineConfig({
        buttonBehavior: "buttons",
        brushCursor: "cell",
        on: {end: s => window.__ends.push(s)},
      }),
    );
    const tl = viz._timelineClass;
    const overlay = document
      .querySelector("#viz .brushGroup .overlay")
      .getBoundingClientRect();
    const m = document.querySelector("#viz .brushGroup").getScreenCTM();
    const tick = tl.schema.ticks[years(tl.schema.ticks).indexOf(2014)];
    await commands.mouseClick(
      m.a * tl._d3Scale(tick) + m.e,
      overlay.y + overlay.height / 2,
    );
    await commands.mouseMove(5, 5);
    await wait(300);

    // `on.end` got the picked year, and the chart drew it.
    assert.deepStrictEqual(
      years(window.__ends[window.__ends.length - 1]),
      [2014],
    );
    assert.deepStrictEqual(state(viz), {
      selection: [2014, 2014],
      filtered: [2014],
    });
    assert.strictEqual(timeline().cursor, "cell");
    assert.deepStrictEqual(pageErrors(), []);
  });

  it(`starting period (${renderer}): timeFilter, timelineDefault, timelineConfig.selection`, async function () {
    let viz = await draw(renderer);
    assert.deepStrictEqual(state(viz), {
      selection: [2021, 2021],
      filtered: [2021],
    });

    viz = await draw(renderer, v => v.timeFilter(d => d.year === 2014));
    assert.deepStrictEqual(state(viz), {
      selection: [2014, 2014],
      filtered: [2014],
    });

    viz = await draw(renderer, v => v.timelineDefault(["2013", "2015"]));
    assert.deepStrictEqual(state(viz), {
      selection: [2013, 2015],
      filtered: [2013, 2014, 2015],
    });

    viz = await draw(renderer, v =>
      v.timelineConfig({selection: new Date("2016/01/01")}),
    );
    assert.deepStrictEqual(state(viz), {
      selection: [2016, 2016],
      filtered: [2016],
    });
    assert.deepStrictEqual(pageErrors(), []);
  });
}

it("timelineConfig.selection: a viewer's pick replaces it", async function () {
  const viz = await draw("svg", v =>
    v.timelineConfig({
      buttonBehavior: "buttons",
      selection: new Date("2016/01/01"),
      on: {end: s => window.__ends.push(s)},
    }),
  );
  // Picking a period (as a click's `end` does) redraws on it, and the redraw
  // keeps the pick instead of returning to the starting selection.
  viz._timelineClass.schema.on.end(new Date("2012/01/01"));
  await wait(300);
  assert.deepStrictEqual(state(viz), {
    selection: [2012, 2012],
    filtered: [2012],
  });
  assert.deepStrictEqual(years(window.__ends[0]), [2012]);
  assert.deepStrictEqual(pageErrors(), []);
});

it("standalone Timeline: mode class on its group, brushCursor on its overlay", async function () {
  await loadD3plus();
  resetPage('<svg id="tl" width="600" height="100"></svg>');
  const tl = new window.d3plus.Timeline()
    .select("#tl")
    .domain([2001, 2010])
    .width(600)
    .duration(0)
    .buttonBehavior("buttons")
    .brushCursor(mode => `${mode === "buttons" ? "grab" : "crosshair"}`);
  await new Promise(resolve => tl.render(resolve));
  const group = () => document.querySelector("#tl g[id^='d3plus-Axis-']");
  const cursor = () =>
    document.querySelector("#tl .brushGroup .overlay").getAttribute("cursor");
  assert.ok(group().classList.contains("d3plus-Timeline-buttons"));
  assert.strictEqual(cursor(), "grab");

  await new Promise(resolve => tl.buttonBehavior("ticks").render(resolve));
  assert.ok(group().classList.contains("d3plus-Timeline-ticks"));
  assert.ok(!group().classList.contains("d3plus-Timeline-buttons"));
  assert.strictEqual(cursor(), "crosshair");

  // The play button's hit area: a pointer, or the default arrow once the
  // whole range is selected and there is nothing to play.
  const play = () =>
    document
      .querySelector("#tl .d3plus-Timeline-play-hit")
      .getAttribute("cursor");
  await new Promise(resolve => tl.selection([2005, 2006]).render(resolve));
  assert.strictEqual(play(), "pointer");
  await new Promise(resolve => tl.selection([2001, 2010]).render(resolve));
  assert.strictEqual(play(), "default");
  assert.deepStrictEqual(pageErrors(), []);
});
