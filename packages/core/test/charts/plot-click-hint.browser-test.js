import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A Plot's single-mark tooltip (here a single series) offers "Click to
    Expand" while the chart's own `click.shape` handler would drill into the
    next level, and offers nothing once that handler is replaced or unset.
*/

const data = [];
["Oregon", "Nevada"].forEach((state, s) =>
  [2010, 2011, 2012, 2013].forEach((year, k) =>
    data.push({region: "West", state, year, value: 10 * (s + 1) + k}),
  ),
);

const body = `<div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Opens a page with a helper that draws a chart and hovers its plot area. */
async function open() {
  const opened = await openPage(body);
  await opened.page.evaluate(data => {
    window.SETTINGS = {
      own: {},
      user: {on: {"click.shape": () => undefined}},
      bound: {on: {"click.shape": function () {}.bind(null)}},
      none: {on: {"click.shape": null}},
    };
    // Draws a LinePlot of one series and returns the middle of its plot area.
    window.make = (renderer, settings) =>
      new Promise(resolve => {
        if (window.__viz) window.__viz.destroy();
        const viz = new window.d3plus.LinePlot()
          .config({
            data,
            groupBy: ["region", "state"],
            depth: 0,
            x: "year",
            y: "value",
            duration: 0,
            legend: false,
            ...window.SETTINGS[settings],
          })
          .renderer(renderer)
          .select("#viz");
        window.__viz = viz;
        viz.render(() => {
          const surface = document
            .querySelector("#viz svg, #viz canvas")
            .getBoundingClientRect();
          const a = viz._plotArea,
            c = viz._chartTransform;
          resolve([
            surface.left + c.x + a.x + a.width / 2,
            surface.top + c.y + a.y + a.height / 2,
          ]);
        });
      });
    // The title and footer of the tooltip showing.
    window.tip = () => {
      const tip = [...document.querySelectorAll(".d3plus-tooltip")].find(
        t => getComputedStyle(t).visibility === "visible",
      );
      const text = sel =>
        (tip?.querySelector(sel)?.textContent ?? "").trim() || null;
      return tip
        ? {
            title: text(".d3plus-tooltip-title"),
            footer: text(".d3plus-tooltip-footer"),
          }
        : null;
    };
  }, data);
  return opened;
}

/** Draws the chart with `settings`, hovers its plot area, and reads the tooltip. */
async function hover(page, renderer, settings) {
  const point = await page.evaluate(
    ([renderer, settings]) => window.make(renderer, settings),
    [renderer, settings],
  );
  await page.mouse.move(5, 395);
  await page.waitForTimeout(40);
  await page.mouse.move(point[0], point[1], {steps: 3});
  await page.waitForTimeout(120);
  return page.evaluate(() => window.tip());
}

for (const renderer of ["svg", "canvas"]) {
  it(`plot click hint (${renderer}): only the chart's own click.shape offers a drill`, async () => {
    const {page, close} = await open();
    try {
      assert.deepStrictEqual(
        await hover(page, renderer, "own"),
        {title: "West", footer: "Click to Expand"},
        "the chart's own handler",
      );
      for (const settings of ["user", "bound", "none"])
        assert.deepStrictEqual(
          await hover(page, renderer, settings),
          {title: "West", footer: null},
          settings,
        );
    } finally {
      await close();
    }
  });
}
