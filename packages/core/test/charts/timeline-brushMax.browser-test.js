import {it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {loadD3plus, pageErrors, resetPage} from "~test/browser/render.js";

/**
    `timelineConfig.brushMax` on a chart, with a real pointer, on SVG and
    Canvas: a brush dragged wider than brushMax ticks (or buttons) is pulled
    in on release, keeping the end being dragged, and the chart filters to
    what remains; a time-axis chart starts on its latest brushMax periods;
    playback keeps the selection's width.
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
const range = (a, b) => Array.from({length: b - a + 1}, (_, i) => a + i);

/** Renders a Treemap with a timeline; resolves once drawn. */
async function draw({renderer, timelineConfig}) {
  await loadD3plus();
  resetPage(
    '<div id="viz" style="width:760px;height:440px;font-family:sans-serif;"></div>',
  );
  window.__ends = [];
  await new Promise(resolve => {
    window.__viz = new window.d3plus.Treemap()
      .select("#viz")
      .data(data)
      .groupBy("id")
      .sum("value")
      .time("year")
      .renderer(renderer)
      .duration(0)
      .legend(false)
      .timelineConfig({
        ...timelineConfig,
        on: {end: s => window.__ends.push(s)},
      })
      .render(resolve);
  });
}

/** A year's position on the brush (its tick, or its button's middle), in page pixels. */
function brushX(year) {
  const tl = window.__viz._timelineClass;
  const ticksMode = tl._buttonBehaviorCurrent === "ticks";
  const periods = ticksMode ? tl._availableTicks : tl.schema.ticks;
  const i = years(periods).indexOf(year);
  const px = ticksMode ? tl._d3Scale(periods[i]) : tl._d3Scale.range()[i];
  const m = document.querySelector("#viz .brushGroup").getScreenCTM();
  return m.a * px + m.e;
}

/** Drags the brush from one year to another with the real mouse. */
async function drag(from, to) {
  const overlay = document
    .querySelector("#viz .brushGroup .overlay")
    .getBoundingClientRect();
  const y = overlay.y + overlay.height / 2;
  const [a, b] = [brushX(from), brushX(to)];
  await commands.mouseMove(a, y);
  await commands.mouseDown();
  for (let i = 1; i <= 10; i++)
    await commands.mouseMove(a + ((b - a) * i) / 10, y);
  await commands.mouseUp();
  await commands.mouseMove(5, 5);
  await wait(300);
  const viz = window.__viz;
  return {
    selection: years(viz._timelineClass.selection()),
    last: years(window.__ends[window.__ends.length - 1] || []),
    filtered: [...new Set(viz._filteredData.flatMap(d => [].concat(d.year)))]
      .map(Number)
      .sort(),
  };
}

for (const renderer of ["svg", "canvas"]) {
  for (const buttonBehavior of ["ticks", "buttons"]) {
    it(`brushMax (${renderer}, ${buttonBehavior}): a wide drag keeps the dragged end`, async function () {
      await draw({renderer, timelineConfig: {brushMax: 3, buttonBehavior}});
      const right = await drag(2011, 2018);
      assert.deepStrictEqual(right.selection, [2016, 2018]);
      assert.deepStrictEqual(right.last, [2016, 2018]);
      assert.deepStrictEqual(right.filtered, range(2016, 2018));

      const left = await drag(2019, 2012);
      assert.deepStrictEqual(left.selection, [2012, 2014]);
      assert.deepStrictEqual(left.filtered, range(2012, 2014));

      // Within brushMax, a drag commits as it is.
      const narrow = await drag(2015, 2016);
      assert.deepStrictEqual(narrow.selection, [2015, 2016]);
      assert.deepStrictEqual(pageErrors(), []);
    });
  }
}

it("brushMax unset: a wide drag commits as it is", async function () {
  await draw({renderer: "svg", timelineConfig: {buttonBehavior: "ticks"}});
  const out = await drag(2011, 2018);
  assert.deepStrictEqual(out.selection, [2011, 2018]);
});

it("brushMax below brushMin: brushMin wins", async function () {
  await draw({
    renderer: "svg",
    timelineConfig: {brushMin: 4, brushMax: 2, buttonBehavior: "ticks"},
  });
  const out = await drag(2011, 2018);
  assert.deepStrictEqual(out.selection, [2015, 2018]);
});

it("brushMax: a time-axis chart starts on its latest periods, and playback keeps the width", async function () {
  await loadD3plus();
  resetPage('<div id="viz" style="width:760px;height:440px;"></div>');
  const viz = new window.d3plus.LinePlot()
    .select("#viz")
    .data(data)
    .groupBy("id")
    .x("year")
    .y("value")
    .time("year")
    .duration(0)
    .timelineConfig({brushMax: 3});
  await new Promise(resolve => viz.render(resolve));
  const tl = viz._timelineClass;
  assert.deepStrictEqual(years(tl.selection()), [2019, 2021]);
  assert.deepStrictEqual(
    [...new Set(viz._filteredData.map(d => d.year))].sort(),
    range(2019, 2021),
  );
  // Back to the start, then one step of playback.
  tl.selection([new Date("2012/01/01"), new Date("2014/01/01")]).render();
  tl._togglePlay();
  if (tl._playTimer) clearInterval(tl._playTimer);
  tl._playTimer = false;
  assert.deepStrictEqual(years(tl.selection()), [2013, 2015]);
  assert.deepStrictEqual(pageErrors(), []);
});
