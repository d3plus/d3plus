import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    BumpChart's tooltips in Chromium on both backends: its rank axes label
    each rank with a series, but a tooltip reads a rank as its number, in
    the shared tooltip's rows and in a single line's rank row, while a
    badge over a rank's tick label names its series.
*/

const box = "<div id='viz' style='width:800px;height:420px'></div>";

/** Three series trading ranks over three years. */
const data = [];
[
  [2021, ["Prime", "Basic", "Select"]],
  [2022, ["Select", "Prime", "Basic"]],
  [2023, ["Basic", "Select", "Prime"]],
].forEach(([year, order]) =>
  order.forEach((plan, k) => data.push({plan, year, rank: k + 1})),
);

/** Hovers Prime at 2022 (rank 2) in a fresh page drawn from `config`; resolves with the tooltip's text. */
const hover = async (config, renderer) => {
  const {page, errors, close} = await openPage(box);
  try {
    const point = await page.evaluate(
      ([config, renderer]) =>
        new Promise(resolve => {
          const viz = new window.d3plus.BumpChart()
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
              rect.left + t.x + viz._xAxis._getPosition(2022),
              rect.top + t.y + viz._yAxis._getPosition(2),
            ]);
          });
        }),
      [config, renderer],
    );
    await page.mouse.move(point[0] - 6, point[1] - 6);
    await page.mouse.move(point[0], point[1], {steps: 3});
    await page.waitForTimeout(150);
    const rows = await page.evaluate(() =>
      [...document.querySelectorAll(".d3plus-tooltip")]
        .filter(el => getComputedStyle(el).opacity !== "0")
        .flatMap(el => [...el.querySelectorAll("tr")])
        .map(tr => [...tr.children].map(td => td.textContent.trim())),
    );
    const badges = await page.evaluate(() =>
      (window.__viz._axisHoverState?.badges ?? []).map(b => [b.axis, b.text]),
    );
    assert.deepStrictEqual(errors, []);
    return Object.assign(rows, {badges});
  } finally {
    await close();
  }
};

const config = {data, groupBy: "plan", x: "year", y: "rank"};

for (const renderer of ["svg", "canvas"]) {
  it(`BumpChart [${renderer}]: the shared tooltip lists each series' rank`, async () => {
    const rows = await hover(config, renderer);
    for (const [plan, rank] of [
      ["Select", "1"],
      ["Prime", "2"],
      ["Basic", "3"],
    ]) {
      const row = rows.find(r => r[0] === plan);
      assert.ok(row, `a row for ${plan} (${JSON.stringify(rows)})`);
      assert.strictEqual(row[1], rank, `${plan}'s rank`);
    }
  });

  it(`BumpChart [${renderer}]: a single line's tooltip reads its rank as a number`, async () => {
    const rows = await hover({...config, tooltipShared: false}, renderer);
    const rank = rows.find(r => r[0] === "rank");
    assert.ok(rank, `a rank row (${JSON.stringify(rows)})`);
    assert.strictEqual(rank[1], "2");
  });

  it(`BumpChart [${renderer}]: a rank's axis badge names its series`, async () => {
    const {badges} = await hover({...config, axisHover: true}, renderer);
    // The left axis names 2021's ranks, the right 2023's.
    const names = {y: "Basic", y2: "Select"};
    const ranks = badges.filter(([axis]) => axis in names);
    assert.ok(ranks.length, `a rank badge (${JSON.stringify(badges)})`);
    for (const [axis, text] of ranks)
      assert.strictEqual(text, names[axis], `the ${axis} tick label at rank 2`);
  });
}
