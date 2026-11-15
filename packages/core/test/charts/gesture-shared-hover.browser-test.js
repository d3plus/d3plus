import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A Plot's snapped hover (its shared or single tooltip, crosshair, and hover
    emphasis) clears once a drag starts moving the chart or drawing a box, in
    Chromium on SVG and Canvas with a real mouse: a zoom brush
    (`zoomDrag: "brush"`), a pan, and a box select all leave the hovered bar
    unlit and the crosshair gone until the pointer moves again after the drag.
*/

const box = "<div id='viz' style='width:600px;height:400px'></div>";

/** Runs in the page: draws `chart` with `config` (JSON), stacked or not. */
const draw = ([renderer, chart, stacked, json]) =>
  new Promise(resolve => {
    const series = stacked ? ["s1", "s2"] : [null];
    const data =
      chart === "HorizonChart"
        ? ["north", "south"].flatMap((id, s) =>
            Array.from({length: 12}, (_, x) => ({
              id,
              x,
              y: (x * (s + 3)) % 11,
            })),
          )
        : ["A", "B", "C", "D"].flatMap((x, i) =>
            series.map((s, j) => ({x, id: s ?? x, y: 3 + i + j})),
          );
    const viz = new window.d3plus[chart]()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .data(data)
      .groupBy("id")
      .x("x")
      .y("y")
      .legend(false)
      .zoomControls(false)
      .config(JSON.parse(json));
    if (chart === "BarChart") viz.stacked(stacked);
    window.__viz = viz;
    viz.render(() => resolve(true));
  });

/**
    Runs in the page: the visible tooltips, whether a hover emphasis and a
    snapped hover are set, whether a crosshair is drawn, and the client point
    to hover: the center of bar "B" (its first series), or of the chart.
*/
const state = () => {
  const viz = window.__viz;
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const host =
    document.querySelector("#viz canvas") || document.querySelector("#viz svg");
  const rect = host.getBoundingClientRect();
  let at = null;
  let crosshair = false;
  const walk = (n, x, y) => {
    const t = n.transform || {};
    const nx = x + (t.x || 0),
      ny = y + (t.y || 0);
    const d = n.datum && (n.datum.data || n.datum);
    const key = String(n.key);
    if (!at && n.type === "rect" && d && d.x === "B" && !key.includes("::"))
      at = [
        rect.left + nx + n.x + n.width / 2,
        rect.top + ny + n.y + n.height / 2,
      ];
    if (key.includes("crosshair")) crosshair = true;
    (n.children || []).forEach(c => walk(c, nx, ny));
  };
  walk(viz._paintedScene.root, 0, 0);
  return {
    tips,
    hover: typeof viz._hover === "function",
    snapped: Boolean(viz._sharedHoverActive),
    crosshair,
    at: at || [rect.left + rect.width / 2, rect.top + rect.height / 2],
  };
};

const cases = [
  ["BarChart", false, {zoomDrag: "brush"}, "a zoom brush"],
  ["BarChart", true, {zoomDrag: "brush"}, "a zoom brush over stacked bars"],
  ["BarChart", false, {}, "a pan"],
  ["BarChart", false, {selectMode: "box"}, "a box select"],
  ["HorizonChart", false, {zoomDrag: "brush"}, "a zoom brush"],
];

for (const renderer of ["svg", "canvas"]) {
  for (const [chart, stacked, config, gesture] of cases) {
    it(`${renderer}: ${chart}'s snapped hover clears during ${gesture}`, async () => {
      const {page, errors, close} = await openPage(box);
      try {
        await page.evaluate(draw, [
          renderer,
          chart,
          stacked,
          JSON.stringify(config),
        ]);
        const {at} = await page.evaluate(state);
        await page.mouse.move(at[0] - 2, at[1]);
        await page.mouse.move(...at, {steps: 2});
        await page.waitForTimeout(60);
        let s = await page.evaluate(state);
        assert.ok(s.snapped, "hovering snaps the tooltip");
        assert.ok(s.crosshair, "hovering draws the crosshair");
        assert.strictEqual(s.tips.length, 1, "hovering shows a tooltip");
        if (chart === "BarChart" && !stacked)
          assert.ok(s.hover, "hovering a bar lights it");

        await page.mouse.down();
        await page.mouse.move(at[0] + 80, at[1] - 40, {steps: 10});
        await page.waitForTimeout(60);
        s = await page.evaluate(state);
        assert.ok(!s.snapped, "no snapped hover mid-drag");
        assert.ok(!s.hover, "no hover emphasis mid-drag");
        assert.ok(!s.crosshair, "no crosshair mid-drag");
        assert.deepStrictEqual(s.tips, [], "no tooltip mid-drag");

        await page.mouse.up();
        await page.waitForTimeout(100);
        s = await page.evaluate(state);
        assert.ok(!s.snapped && !s.hover && !s.crosshair, "still clear");

        // The next move, back where the drag began, hovers again.
        await page.mouse.move(at[0] - 2, at[1]);
        await page.mouse.move(...at, {steps: 2});
        await page.waitForTimeout(60);
        s = await page.evaluate(state);
        assert.ok(s.snapped, "a move after the drag snaps the tooltip again");
        assert.strictEqual(s.tips.length, 1, "and shows it");
        assert.deepStrictEqual(errors, [], "no page errors");
      } finally {
        await close();
      }
    });
  }
}
