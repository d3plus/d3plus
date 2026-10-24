import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Bar hit areas in a real browser, on both renderers, with a real pointer:
    hovering anywhere in a side-by-side bar's slot, far from the bar itself,
    shows that bar's tooltip, hovers it (dimming the others), and a click
    there fires `click.shape` and `click.Bar` with the bar's row. Grouped
    bars each own their column, stacked bars and `hitArea: false` draw no
    hit areas, and small multiples get them in every panel.
*/

const sales = [
  {region: "North", sales: 42},
  {region: "South", sales: 58},
  {region: "East", sales: 0.6},
  {region: "West", sales: 51},
];

const teams = [
  {team: "Design", hours: 64},
  {team: "Support", hours: 1},
  {team: "Platform", hours: 71},
];

const change = [
  {quarter: "Q1", unit: "Retail", change: 12},
  {quarter: "Q1", unit: "Wholesale", change: -4},
  {quarter: "Q2", unit: "Retail", change: 0.4},
  {quarter: "Q2", unit: "Wholesale", change: 9},
];

const vertical = {data: sales, groupBy: "region", x: "region", y: "sales"};
const horizontal = {
  data: teams,
  groupBy: "team",
  discrete: "y",
  x: "hours",
  y: "team",
};
const grouped = {data: change, groupBy: "unit", x: "quarter", y: "change"};

/**
    Draws a BarChart from `config` and returns where to point at: inside the
    slot of the bar whose row has every key/value in `match`, `frac` of the
    way across its hit area along the value axis (0 = the top or left edge),
    or across the plot when the bar has none. Also reports how many Bar hit
    areas the scene holds.
*/
const draw = ([config, renderer, match, frac]) =>
  new Promise(resolve => {
    window.__log = [];
    // Rebuilt in the page's realm, where config bags merge as plain objects.
    const viz = new window.d3plus.BarChart()
      .config(JSON.parse(JSON.stringify(config)))
      .renderer(renderer)
      .width(600)
      .height(400)
      .duration(0)
      .legend(false)
      .select("#viz");
    viz.on("click.shape", d => window.__log.push({key: "click.shape", d}));
    viz.on("click.Bar", d => window.__log.push({key: "click.Bar", d}));
    window.__viz = viz;
    viz.render(() => {
      const host =
        document.querySelector("#viz svg") ||
        document.querySelector("#viz canvas");
      const box = host.getBoundingClientRect();
      const matches = row =>
        !!row && Object.entries(match).every(([k, v]) => row[k] === v);
      const placed = {};
      let hits = 0;
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.shapeType === "Bar" && n.type === "rect") {
          const hit = `${n.key}`.endsWith("::hit");
          if (hit) hits++;
          if (n.datum && matches(n.datum.data) && !placed[hit ? "hit" : "bar"])
            placed[hit ? "hit" : "bar"] = {
              x: nx + n.x,
              y: ny + n.y,
              w: n.width,
              h: n.height,
            };
        }
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(viz._paintedScene.root, 0, 0);
      const vertical = viz.schema.discrete !== "y";
      const {bar, hit} = placed;
      let at = null;
      if (hit)
        at = vertical
          ? {x: hit.x + hit.w / 2, y: hit.y + hit.h * frac}
          : {x: hit.x + hit.w * frac, y: hit.y + hit.h / 2};
      else if (bar) {
        const area = viz._plotArea;
        const chart = viz._chartTransform || {x: 0, y: 0};
        at = vertical
          ? {x: bar.x + bar.w / 2, y: chart.y + area.y + area.height * frac}
          : {x: chart.x + area.x + area.width * frac, y: bar.y + bar.h / 2};
      }
      resolve({hits, bar, hit, point: at && [box.left + at.x, box.top + at.y]});
    });
  });

/** The visible tooltip's text, and the rows the chart hovers. */
const state = () => {
  const tips = Array.from(document.querySelectorAll(".d3plus-tooltip"))
    .filter(el => getComputedStyle(el).opacity !== "0")
    .map(el => el.textContent);
  const viz = window.__viz;
  const rows = viz._filteredData || [];
  const hovered =
    typeof viz._hover === "function"
      ? rows.filter((d, i) => viz._hover(d, i))
      : [];
  return {tips, hovered};
};

async function run(config, renderer, match, frac, check) {
  const {page, errors, close} = await openPage(
    '<div id="viz" style="width:600px;height:400px;"></div>',
  );
  try {
    const drawn = await page.evaluate(draw, [config, renderer, match, frac]);
    await check(page, drawn);
    assert.deepStrictEqual(errors, [], "no page errors");
  } finally {
    await close();
  }
}

/**
    Hovers then clicks `point`, asserting both resolve to the row with
    `match`. The hover covers the row's series (`match`'s last key).
*/
async function hitsBar(page, point, match) {
  const [key, value] = Object.entries(match).pop();
  const same = d => Object.entries(match).every(([k, v]) => d[k] === v);
  await page.mouse.move(point[0] - 4, point[1] - 4);
  await page.mouse.move(...point, {steps: 3});
  await page.waitForTimeout(150);
  const {tips, hovered} = await page.evaluate(state);
  assert.ok(
    tips.some(t => t.includes(String(value))),
    `the tooltip names ${value} (got ${JSON.stringify(tips)})`,
  );
  assert.ok(
    hovered.some(same) && hovered.every(d => d[key] === value),
    `only ${value} is hovered (got ${JSON.stringify(hovered)})`,
  );
  await page.mouse.click(...point);
  const log = await page.evaluate(() => window.__log);
  const keys = log.map(e => e.key).sort();
  assert.deepStrictEqual(keys, ["click.Bar", "click.shape"]);
  log.forEach(e => assert.ok(same(e.d), `${e.key} datum (${key})`));
}

for (const renderer of ["svg", "canvas"]) {
  it(`BarChart ${renderer}: hovering high above a tiny bar picks it`, async () => {
    const match = {region: "East"};
    await run(vertical, renderer, match, 0.1, async (page, {hits, point}) => {
      assert.strictEqual(hits, sales.length, "one hit area per bar");
      await hitsBar(page, point, match);
    });
  });

  it(`BarChart ${renderer}: horizontal bars take the full width of their row`, async () => {
    const match = {team: "Support"};
    await run(
      horizontal,
      renderer,
      match,
      0.9,
      async (page, {point}) => await hitsBar(page, point, match),
    );
  });

  it(`BarChart ${renderer}: a grouped negative bar's column reaches across the baseline`, async () => {
    const match = {quarter: "Q1", unit: "Wholesale"};
    await run(
      grouped,
      renderer,
      match,
      0.05,
      async (page, {bar, hit, point}) => {
        assert.ok(
          hit.x <= bar.x + 0.01 && hit.x + hit.w >= bar.x + bar.w - 0.01,
          "the column covers its bar",
        );
        assert.ok(
          hit.y < bar.y - bar.h,
          "the column reaches above the baseline",
        );
        await hitsBar(page, point, match);
      },
    );
  });

  it(`BarChart ${renderer}: stacked bars draw no hit areas`, async () => {
    await run(
      {...grouped, stacked: true},
      renderer,
      {unit: "Retail"},
      0.1,
      async (page, {hits}) => assert.strictEqual(hits, 0),
    );
  });

  it(`BarChart ${renderer}: shapeConfig.Bar.hitArea false keeps hovers on the bars`, async () => {
    const match = {region: "East"};
    await run(
      {...vertical, shapeConfig: {Bar: {hitArea: false}}},
      renderer,
      match,
      0.1,
      async (page, {hits, point}) => {
        assert.strictEqual(hits, 0, "no hit areas");
        await page.mouse.move(...point, {steps: 3});
        await page.waitForTimeout(150);
        const {tips} = await page.evaluate(state);
        assert.ok(!tips.some(t => t.includes("East")), "no East tooltip");
      },
    );
  });

  it(`BarChart ${renderer}: every small-multiples panel gets hit areas`, async () => {
    const data = ["A", "B"].flatMap(panel => sales.map(d => ({...d, panel})));
    const match = {region: "East"};
    await run(
      {...vertical, data, facet: "panel"},
      renderer,
      match,
      0.1,
      async (page, {hits, point}) => {
        assert.strictEqual(hits, data.length, "one hit area per bar");
        await hitsBar(page, point, match);
      },
    );
  });
}
