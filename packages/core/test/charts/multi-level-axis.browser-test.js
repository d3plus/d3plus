import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    Multi-level category axes (`x: ["year", "quarter"]`) drawn in a chart, on
    both renderers: each tick is labeled with its quarter, each year once in
    a row past them with a divider between years, and hovering a point names
    both levels in the tooltip and the quarter in the axis badge.
*/

const sales = [];
// Listed by quarter, then year, so the chart has to group the years.
["Q1", "Q2", "Q3", "Q4"].forEach((quarter, q) =>
  [2024, 2023, 2022].forEach((year, y) =>
    sales.push({id: "Sales", year, quarter, value: 10 + q + y * 5}),
  ),
);

const countries = [
  {region: "Americas", country: "Brazil", value: 41},
  {region: "Europe", country: "France", value: 37},
  {region: "Americas", country: "Canada", value: 33},
  {region: "Europe", country: "Germany", value: 45},
];

/**
    Opens a page and renders `kind` with `calls` (`[method, ...args]` pairs,
    applied in order) into a 700×400 #viz, kept as `window.__viz`.
*/
async function chart(kind, calls, renderer) {
  const opened = await openPage(
    '<div id="viz" style="width:700px;height:400px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([kind, calls, renderer]) =>
      new Promise(resolve => {
        const viz = new window.d3plus[kind]();
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        window.__surface = renderer === "canvas" ? "canvas" : "svg";
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [kind, calls, renderer],
  );
  return opened;
}

/**
    What the painted scene draws of each axis's levels: its tick labels,
    outer level labels, and level dividers, by axis key.
*/
function axes(page) {
  return page.evaluate(() => {
    const out = {};
    const walk = (n, axis) => {
      const key = `${n.key}`;
      const own = /^plot-(x|y)-axis$/.exec(key);
      const at = own ? own[1] + (n.panel ?? "") : axis;
      if (own && !out[at]) out[at] = {ticks: [], levels: [], dividers: 0};
      if (at && n.type === "text") {
        const text = n.lines.map(l => l.text).join(" ");
        if (/^level-/.test(key)) out[at].levels.push(text);
        else out[at].ticks.push(text);
      }
      if (at && /^level-divider-/.test(key)) out[at].dividers++;
      (n.children || []).forEach(c => walk(c, at));
    };
    walk(window.__viz._paintedScene.root);
    return out;
  });
}

for (const renderer of ["svg", "canvas"]) {
  it(`a bar chart's x axis labels quarters and groups them by year (${renderer})`, async () => {
    const {page, close} = await chart(
      "BarChart",
      [
        ["data", sales],
        ["groupBy", "id"],
        ["legend", false],
        ["x", ["year", "quarter"]],
        ["y", "value"],
      ],
      renderer,
    );
    try {
      const {x} = await axes(page);
      assert.ok(x, "draws the x axis");
      // Years sort ascending, each with its quarters together.
      assert.deepStrictEqual(x.levels, ["2022", "2023", "2024"]);
      assert.deepStrictEqual(
        x.ticks.filter(t => /^Q/.test(t)),
        [
          "Q1",
          "Q2",
          "Q3",
          "Q4",
          "Q1",
          "Q2",
          "Q3",
          "Q4",
          "Q1",
          "Q2",
          "Q3",
          "Q4",
        ],
      );
      assert.strictEqual(x.dividers, 2);
      const canvas = await page.evaluate(
        () => !!document.querySelector("#viz canvas"),
      );
      assert.strictEqual(canvas, renderer === "canvas");
      if (renderer === "svg") {
        const dom = await page.evaluate(() =>
          Array.from(document.querySelectorAll("#viz svg text"))
            .map(t => t.textContent)
            .filter(t => /^20\d\d$/.test(t)),
        );
        assert.deepStrictEqual(dom, ["2022", "2023", "2024"]);
      }
    } finally {
      await close();
    }
  });

  it(`hovering a point names both levels in the tooltip and the quarter in the badge (${renderer})`, async () => {
    const {page, close} = await chart(
      "LinePlot",
      [
        ["data", sales],
        ["groupBy", "id"],
        ["legend", false],
        ["x", ["year", "quarter"]],
        ["y", "value"],
      ],
      renderer,
    );
    try {
      // The second year's first quarter: 2023 Q1.
      const point = await page.evaluate(() => {
        const viz = window.__viz;
        const axis = viz._xAxis;
        const key = axis._d3Scale.domain()[4];
        const surface = document
          .querySelector(`#viz ${window.__surface}`)
          .getBoundingClientRect();
        const c = viz._chartTransform || {x: 0, y: 0};
        const row = viz._formattedData.find(d => d.x === key);
        return [
          surface.left + c.x + axis._getPosition(key),
          surface.top + c.y + viz._yAxis._getPosition(row.y),
        ];
      });
      await page.mouse.move(5, 5);
      await page.mouse.move(point[0], point[1], {steps: 3});
      await page.waitForTimeout(120);
      const result = await page.evaluate(() => {
        const tip = document.querySelector(".d3plus-tooltip");
        const badges = [];
        const walk = n => {
          if (/plot-axis-hover-badge-x$/.test(`${n.key}`))
            badges.push(n.children[1].lines[0].text);
          (n.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        return {tip: tip ? tip.innerText : "", badges};
      });
      assert.ok(result.tip.includes("year / quarter"), result.tip);
      assert.ok(result.tip.includes("2023 / Q1"), result.tip);
      assert.deepStrictEqual(result.badges, ["Q1"]);
    } finally {
      await close();
    }
  });

  it(`a horizontal bar chart groups its y categories by region (${renderer})`, async () => {
    const {page, close} = await chart(
      "BarChart",
      [
        ["data", countries],
        ["groupBy", "country"],
        ["discrete", "y"],
        ["legend", false],
        ["x", "value"],
        ["y", ["region", "country"]],
      ],
      renderer,
    );
    try {
      const {y} = await axes(page);
      assert.deepStrictEqual(y.levels.sort(), ["Americas", "Europe"]);
      assert.strictEqual(y.dividers, 1);
      // Each region's countries sit together.
      const order = await page.evaluate(() =>
        window.__viz._yAxis._d3Scale
          .domain()
          .map(k => window.__viz._y.values(k)[0]),
      );
      const runs = order.filter((region, i) => region !== order[i - 1]);
      assert.strictEqual(runs.length, 2, order.join(","));
    } finally {
      await close();
    }
  });

  it(`small multiples label levels only where they label the axis (${renderer})`, async () => {
    const products = [];
    ["Hardware", "Software", "Services"].forEach(product =>
      sales.forEach(d => products.push({...d, id: product, product})),
    );
    const {page, close} = await chart(
      "BarChart",
      [
        ["data", products],
        ["groupBy", "id"],
        ["facet", "product"],
        ["facetConfig", {columns: 2}],
        ["x", ["year", "quarter"]],
        ["y", "value"],
      ],
      renderer,
    );
    try {
      const counts = await page.evaluate(() => {
        const out = [];
        const walk = n => {
          if (/plot-x-axis$/.test(`${n.key}`)) {
            let levels = 0;
            const count = c => {
              if (c.type === "text" && /level-\d/.test(`${c.key}`)) levels++;
              (c.children || []).forEach(count);
            };
            count(n);
            out.push(levels);
          }
          (n.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        return out;
      });
      assert.strictEqual(counts.length, 3, `${counts}`);
      // The top-left panel sits over another, so its x axis is unlabeled.
      assert.deepStrictEqual(counts.slice().sort(), [0, 3, 3], `${counts}`);
    } finally {
      await close();
    }
  });

  it(`switching back to one level clears the outer labels (${renderer})`, async () => {
    const {page, close} = await chart(
      "BarChart",
      [
        ["data", sales],
        ["groupBy", "id"],
        ["legend", false],
        ["x", ["year", "quarter"]],
        ["y", "value"],
      ],
      renderer,
    );
    try {
      await page.evaluate(
        () => new Promise(resolve => window.__viz.x("quarter").render(resolve)),
      );
      const {x} = await axes(page);
      assert.deepStrictEqual(x.levels, []);
      assert.strictEqual(x.dividers, 0);
      assert.deepStrictEqual(x.ticks.slice(0, 4), ["Q1", "Q2", "Q3", "Q4"]);
    } finally {
      await close();
    }
  });
}
