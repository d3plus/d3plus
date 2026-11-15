import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A legend entry's highlight held across the gap between two entries (see
    `holdKeyHover`) lets go once a drag starts moving the chart, in Chromium
    on SVG and Canvas with a real mouse: a zoom brush (`zoomDrag: "brush"`)
    or a pan pressed in the gap leaves every bar unlit.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

/** Runs in the page: a stacked BarChart, its legend inside the plot. */
const draw = ([renderer, json]) =>
  new Promise(resolve => {
    const data = ["A", "B", "C", "D"].flatMap((x, i) =>
      ["North", "South"].map((id, j) => ({x, id, y: 3 + i + j})),
    );
    const viz = new window.d3plus.BarChart()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .stacked(true)
      .zoomControls(false)
      .config(JSON.parse(json));
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/** Runs in the page: the hold, the hover, and the client centers of the legend's two swatches. */
const state = () => {
  const viz = window.__viz;
  const host =
    document.querySelector("#viz canvas") || document.querySelector("#viz svg");
  const rect = host.getBoundingClientRect();
  const swatches = [];
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    if (
      n.interactionGroup === "legend" &&
      n.type === "rect" &&
      n.datum !== undefined &&
      !String(n.key).includes("::")
    )
      swatches.push([
        rect.left + nx + n.x + n.width / 2,
        rect.top + ny + n.y + n.height / 2,
      ]);
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return {
    held: Boolean(viz._keyHold),
    hover: typeof viz._hover === "function",
    swatches,
  };
};

const gestures = [
  [{zoomDrag: "brush"}, "a zoom brush"],
  [{}, "a pan"],
];

for (const renderer of ["svg", "canvas"]) {
  for (const [config, gesture] of gestures) {
    it(`${renderer}: ${gesture} pressed in the legend's gap lets go of its held highlight`, async () => {
      const {page, errors, close} = await openPage(box);
      try {
        await page.evaluate(draw, [renderer, JSON.stringify(config)]);
        const {swatches} = await page.evaluate(state);
        assert.strictEqual(swatches.length, 2, "two legend entries");
        const [a, b] = swatches;
        const gap = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        await page.mouse.move(a[0] - 2, a[1]);
        await page.mouse.move(...a, {steps: 2});
        await page.waitForTimeout(60);
        await page.mouse.move(...gap, {steps: 3});
        await page.waitForTimeout(60);
        let s = await page.evaluate(state);
        assert.ok(s.held, "the gap holds the first entry");
        assert.ok(s.hover, "its bars stay lit");

        await page.mouse.down();
        await page.mouse.move(gap[0] + 120, gap[1] + 80, {steps: 10});
        await page.waitForTimeout(60);
        s = await page.evaluate(state);
        assert.ok(!s.held, "the drag lets go of the hold");
        assert.ok(!s.hover, "and of the highlight");

        await page.mouse.up();
        await page.waitForTimeout(100);
        s = await page.evaluate(state);
        assert.ok(!s.held && !s.hover, "still clear after the drag");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }
}
