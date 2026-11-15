import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Hovering one series of a Plot line or area chart on a discrete x axis
    keeps the x tick labels of that series' points lit, in Chromium on both
    backends; the label under the hovered x value's badge counts as lit. A Line or Area's own datum is its points' merged aggregate,
    whose numeric x values sum, so the labels follow its points instead.
*/

const box = "<div id='viz' style='width:800px;height:420px'></div>";

/** Three series over four years, ranked C, B, A. */
const data = [];
[2001, 2002, 2003, 2004].forEach((year, k) =>
  [
    ["A", 10, 3],
    ["B", 20, 2],
    ["C", 30, 1],
  ].forEach(([id, base, rank]) =>
    data.push({id, year, rank, value: base + k * 3}),
  ),
);

/**
    Hovers 2002 at the y value `at` in a fresh page drawn from `config`;
    resolves with each x tick label and the opacity it's painted at.
*/
const hover = async (Chart, config, at, renderer) => {
  const {page, errors, close} = await openPage(box);
  try {
    const point = await page.evaluate(
      ([Chart, config, at, renderer]) =>
        new Promise(resolve => {
          const viz = new window.d3plus[Chart]()
            .select("#viz")
            .duration(0)
            .renderer(renderer)
            .config(config);
          window.__viz = viz;
          viz.render(() => {
            const host =
              document.querySelector("#viz svg") ||
              document.querySelector("#viz canvas");
            const rect = host.getBoundingClientRect();
            const t = viz._chartTransform;
            resolve([
              rect.left + t.x + viz._xAxis._getPosition(2002),
              rect.top + t.y + viz._yAxis._getPosition(at),
            ]);
          });
        }),
      [Chart, config, at, renderer],
    );
    await page.mouse.move(point[0] - 6, point[1] - 6);
    await page.mouse.move(point[0], point[1], {steps: 3});
    await page.waitForTimeout(150);
    const state = await page.evaluate(() => {
      const root = window.__viz._paintedScene.root;
      // The axis hover badges drawn, by key: a tick label a badge overlaps is
      // hidden under it, naming that badge in `coveredBy`, and reads as lit.
      const badges = new Set();
      const findBadges = n => {
        if (/plot-axis-hover-badge-\w+$/.test(String(n.key)))
          badges.add(String(n.key));
        (n.children || []).forEach(findBadges);
      };
      findBadges(root);
      const ticks = [];
      const walk = n => {
        if (n.type === "text" && n.hoverMatch?.field === "x") {
          const covered = n.coveredBy !== undefined && badges.has(n.coveredBy);
          ticks.push([n.lines[0].text, covered ? 1 : (n.paint?.opacity ?? 1)]);
        }
        (n.children || []).forEach(walk);
      };
      walk(root);
      return {hovered: typeof window.__viz._hover === "function", ticks};
    });
    assert.deepStrictEqual(errors, []);
    assert.ok(state.hovered, `${Chart} is hovered`);
    return Object.fromEntries(state.ticks);
  } finally {
    await close();
  }
};

const base = {
  data,
  groupBy: "id",
  x: "year",
  y: "value",
  discrete: "x",
  tooltipShared: false,
};

/** Each chart, its config, and a y value inside one series' mark at 2002. */
const charts = [
  ["LinePlot", base, 13],
  ["AreaPlot", base, 13],
  ["StackedArea", base, 6],
  ["BumpChart", {...base, y: "rank"}, 2],
];

for (const renderer of ["svg", "canvas"]) {
  for (const [Chart, config, at] of charts)
    it(`${Chart} [${renderer}]: hovering a series keeps its x tick labels lit`, async () => {
      const ticks = await hover(Chart, config, at, renderer);
      assert.deepStrictEqual(Object.keys(ticks).sort(), [
        "2001",
        "2002",
        "2003",
        "2004",
      ]);
      for (const [text, opacity] of Object.entries(ticks))
        assert.strictEqual(opacity, 1, `${text}`);
    });

  it(`LinePlot [${renderer}]: a series without a point at an x value dims its label`, async () => {
    const gap = data.filter(d => !(d.id === "A" && d.year === 2004));
    const ticks = await hover("LinePlot", {...base, data: gap}, 13, renderer);
    for (const year of ["2001", "2002", "2003"])
      assert.strictEqual(ticks[year], 1, year);
    assert.ok(ticks["2004"] < 1, `2004 at ${ticks["2004"]}`);
  });
}
