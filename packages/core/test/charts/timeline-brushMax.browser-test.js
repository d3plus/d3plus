import {it} from "vitest";
import {commands} from "vitest/browser";
import assert from "~test/browser/assert.js";
import {loadD3plus, pageErrors, resetPage} from "~test/browser/render.js";

/**
    `timelineConfig.brushMax` and `brushMin` on a chart, with a real pointer,
    on SVG and Canvas: a brush dragged wider than brushMax ticks (or buttons)
    is pulled in on release, and one narrower than brushMin (buttons too)
    widens, keeping the end being dragged, and the chart filters to what
    remains; a time-axis chart starts on its latest brushMax periods;
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

/**
    A year's position on the brush (its tick, or its button's middle), in
    page pixels; a reversed timeline places the latest year first.
*/
function brushX(year) {
  const tl = window.__viz._timelineClass;
  const ticksMode = tl._buttonBehaviorCurrent === "ticks";
  const periods = ticksMode ? tl._availableTicks : tl.schema.ticks;
  const px = tl._d3Scale(periods[years(periods).indexOf(year)]);
  const m = document.querySelector("#viz .brushGroup").getScreenCTM();
  return m.a * px + m.e;
}

/** The selected years, the last committed ones, and the drawn years. */
async function settle() {
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

/** Clicks one year's tick or button with the real mouse. */
async function click(year) {
  const overlay = document
    .querySelector("#viz .brushGroup .overlay")
    .getBoundingClientRect();
  await commands.mouseClick(brushX(year), overlay.y + overlay.height / 2);
  return settle();
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
  return settle();
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

for (const renderer of ["svg", "canvas"]) {
  it(`brushMin (${renderer}, buttons): narrow drags, clicks, and edges widen to brushMin`, async function () {
    await draw({
      renderer,
      timelineConfig: {brushMin: 3, buttonBehavior: "buttons"},
    });
    // Dragged right to 2015: the start moves back.
    const right = await drag(2014, 2015);
    assert.deepStrictEqual(right.selection, [2013, 2015]);
    assert.deepStrictEqual(right.last, [2013, 2015]);
    assert.deepStrictEqual(right.filtered, range(2013, 2015));
    // Dragged left to 2017 (from outside the selection, which would move
    // it): the end moves on.
    const left = await drag(2018, 2017);
    assert.deepStrictEqual(left.selection, [2017, 2019]);
    // A click selects three buttons from the one clicked.
    const one = await click(2012);
    assert.deepStrictEqual(one.selection, [2012, 2014]);
    assert.deepStrictEqual(one.filtered, range(2012, 2014));
    // At either edge it grows the other way.
    assert.deepStrictEqual((await click(2021)).selection, [2019, 2021]);
    assert.deepStrictEqual((await drag(2011, 2010)).selection, [2010, 2012]);
    assert.deepStrictEqual(pageErrors(), []);
  });
}

it("brushMin unset (buttons): a click selects one button", async function () {
  await draw({renderer: "svg", timelineConfig: {buttonBehavior: "buttons"}});
  // The chart hands a single period back to its Timeline as a range.
  assert.deepStrictEqual((await click(2014)).selection, [2014, 2014]);
});

it("brushMin (buttons): a chart starts on its latest brushMin periods", async function () {
  await draw({
    renderer: "svg",
    timelineConfig: {brushMin: 3, buttonBehavior: "buttons"},
  });
  const out = await settle();
  assert.deepStrictEqual(out.selection, [2019, 2021]);
  assert.deepStrictEqual(out.filtered, range(2019, 2021));
});

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

for (const renderer of ["svg", "canvas"]) {
  for (const buttonBehavior of ["ticks", "buttons"]) {
    it(`reversed timeline (${renderer}, ${buttonBehavior}): brushMax keeps the dragged end, brushMin widens`, async function () {
      await draw({
        renderer,
        timelineConfig: {brushMax: 3, buttonBehavior, reverse: true},
      });
      assert.ok(brushX(2020) < brushX(2011), "latest first on screen");
      // Dragged from 2011 (right) leftward to 2018: 2018 stays put.
      const toLater = await drag(2011, 2018);
      assert.deepStrictEqual(toLater.selection, [2016, 2018]);
      assert.deepStrictEqual(toLater.filtered, range(2016, 2018));
      // Dragged from 2019 rightward to 2012: 2012 stays put.
      const toEarlier = await drag(2019, 2012);
      assert.deepStrictEqual(toEarlier.selection, [2012, 2014]);

      await draw({
        renderer,
        timelineConfig: {brushMin: 3, buttonBehavior, reverse: true},
      });
      // A click selects the clicked period and the ones after it, which a
      // reversed timeline shows to its left.
      const one = await click(2012);
      assert.deepStrictEqual(one.selection, [2012, 2014]);
      assert.deepStrictEqual(one.filtered, range(2012, 2014));
      // At the latest period it grows the other way.
      assert.deepStrictEqual((await click(2021)).selection, [2019, 2021]);
      if (buttonBehavior === "buttons") {
        // A narrow drag keeps the dragged end: dragged to 2015, 2015 stays.
        assert.deepStrictEqual(
          (await drag(2014, 2015)).selection,
          [2013, 2015],
        );
        // Dragged to 2016 (from outside the selection), 2016 stays.
        assert.deepStrictEqual(
          (await drag(2017, 2016)).selection,
          [2016, 2018],
        );
      } else {
        // Ticks grow from the earlier end.
        assert.deepStrictEqual(
          (await drag(2015, 2014)).selection,
          [2014, 2016],
        );
      }
      assert.deepStrictEqual(pageErrors(), []);
    });
  }
}
