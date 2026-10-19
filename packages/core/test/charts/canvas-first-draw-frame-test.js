import assert from "assert";
import {closeBrowser, openPage} from "../playwright.js";

/**
    A Canvas chart's first draw matches SVG frame for frame.

    Each mark sits inside a few wrapper groups (the chart body, the zoom
    content, …). On SVG those groups show at once and only the marks
    animate. Canvas once faded every entering wrapper group in from 0 too,
    and nested opacities multiply, so halfway through the first draw the
    bars were barely visible. This pauses the clock halfway through a
    BarChart's first draw on each backend and compares each bar's opacity
    and height.
*/

const DURATION = 2000;

const data = [
  {group: "Alpha", x: "Q1", y: 35},
  {group: "Alpha", x: "Q2", y: 50},
  {group: "Beta", x: "Q1", y: 20},
  {group: "Beta", x: "Q2", y: 30},
];

/** Starts the BarChart's first draw. */
const start = ([renderer, rows, duration]) => {
  window.viz = new window.d3plus.BarChart()
    .data(rows)
    .groupBy("group")
    .x("x")
    .y("y")
    .legend(false)
    .renderer(renderer)
    .duration(duration)
    .select("#viz");
  window.viz.render();
};

/** Each SVG bar's on-screen box and its opacity through all its ancestors. */
const svgBars = () =>
  [...document.querySelectorAll("#viz svg rect")]
    .filter(r => r.__data__?.shapeType === "Bar" && !String(r.__data__.key).endsWith("::hit"))
    .map(r => {
      let opacity = 1;
      for (let el = r; el && el.tagName !== "svg"; el = el.parentElement)
        opacity *= parseFloat(getComputedStyle(el).opacity);
      const {x, y, width, height} = r.getBoundingClientRect();
      return {key: r.__data__.key, opacity, box: {x, y, width, height}};
    });

/**
    Measures each bar on the canvas at the SVG bar's position: its opacity
    from the alpha the canvas holds at the bar's middle (the canvas is
    transparent where nothing is painted), and its height from the run of
    that pixel up and down the column.
*/
const canvasBars = bars => {
  const canvas = document.querySelector("#viz canvas");
  const rect = canvas.getBoundingClientRect();
  const k = canvas.width / rect.width;
  const ctx = canvas.getContext("2d");
  const pixel = (x, y) => [...ctx.getImageData(Math.round((x - rect.x) * k), Math.round((y - rect.y) * k), 1, 1).data];
  return bars.map(({key, box}) => {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    // The faintest of a few pixels around the middle, clear of grid lines.
    const mid = [-4, -2, 0, 2, 4]
      .map(dy => pixel(cx, cy + dy))
      .reduce((a, b) => (b[3] < a[3] ? b : a));
    const opacity = mid[3] / 255;
    const near = p => p.every((v, i) => Math.abs(v - mid[i]) < 24);
    // Steps over the grid lines showing through a half-faded bar.
    const run = step => {
      let n = 0;
      for (let i = 1; i - n <= 3 && i < 1000; i++)
        if (near(pixel(cx, cy + (step * i) / k))) n = i;
      return n;
    };
    return {key, opacity, height: (run(-1) + run(1) + 1) / k};
  });
};

after(closeBrowser);

it("a Canvas BarChart's bars match SVG's opacity and size halfway through the first draw", async function () {
  this.timeout(120000);
  const body = '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>';
  const frames = {};
  for (const renderer of ["svg", "canvas"]) {
    const {page, errors, close} = await openPage(body, {clock: true});
    try {
      await page.evaluate(start, [renderer, data, DURATION]);
      await page.clock.runFor(DURATION / 2);
      frames[renderer] = renderer === "svg"
        ? await page.evaluate(svgBars)
        : await page.evaluate(canvasBars, frames.svg);
      assert.deepStrictEqual(errors, [], "no page errors");
    } finally {
      await close();
    }
  }

  assert.strictEqual(frames.svg.length, 4, "four bars drawn on SVG");
  for (const [i, svg] of frames.svg.entries()) {
    const canvas = frames.canvas[i];
    assert.ok(svg.opacity > 0.3 && svg.opacity < 0.7, `${svg.key}: SVG is halfway faded in (${svg.opacity.toFixed(2)})`);
    assert.ok(
      Math.abs(canvas.opacity - svg.opacity) < 0.06,
      `${svg.key}: Canvas opacity ${canvas.opacity.toFixed(2)} matches SVG ${svg.opacity.toFixed(2)}`,
    );
    assert.ok(
      Math.abs(canvas.height - svg.box.height) < 3,
      `${svg.key}: Canvas height ${canvas.height.toFixed(1)} matches SVG ${svg.box.height.toFixed(1)}`,
    );
  }
});
