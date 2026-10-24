import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    BoxWhisker with `shapeConfig: {Box: {outlier: false}}`, on SVG and
    Canvas: no outlier points draw, the value axis tightens to the whisker
    ends, hovering a box still lists its statistics, the legend still
    toggles boxes, and small multiples hide each panel's outliers.
*/

const observations = {
  alpha: [300, 150, 160, 140, 20, 180, 40, 170, 125, 74, 80, 900],
  beta: [180, 30, 120, 50, 140, 115],
};
// `n` is unique across boxes, so a legend click hides one box's rows only.
const raw = Object.entries(observations)
  .flatMap(([id, values]) => values.map(value => ({id, value})))
  .map((d, n) => ({...d, n}));
const summary = [
  {id: "alpha", min: 20, q1: 78.5, med: 145, q3: 172.5, max: 313.5, out: [900]},
  {id: "beta", min: 30, q1: 66.25, med: 117.5, q3: 135, max: 180, out: []},
];

/**
    Draws a BoxWhisker on a real page and reports its outlier keys, the value
    axis's domain, and the alpha box's center.
*/
async function draw(page, {renderer, stats, config}) {
  return page.evaluate(
    ([raw, summary, renderer, stats, config]) =>
      new Promise(resolve => {
        document.querySelector("#viz").innerHTML = "";
        const viz = new window.d3plus.BoxWhisker()
          .x("id")
          .renderer(renderer)
          .duration(0)
          .select("#viz");
        if (stats)
          viz
            .data(summary)
            .boxMin("min")
            .boxQ1("q1")
            .boxMedian("med")
            .boxQ3("q3")
            .boxMax("max")
            .boxOutliers("out");
        else viz.data(raw).groupBy(["id", "n"]).y("value");
        viz.config(JSON.parse(config));
        window.__viz = viz;
        viz.render(() => {
          const keys = [];
          const walk = list => {
            for (const n of list || []) {
              if (n.type === "group") walk(n.children);
              else if (typeof n.key === "string") keys.push(n.key);
            }
          };
          walk(viz._chartScene);
          const r = document
            .querySelector("#viz [data-key$='alpha-box']")
            ?.getBoundingClientRect();
          resolve({
            outliers: keys.filter(k => k.includes("outlier")),
            domain: viz._yAxis.domain(),
            center: r ? [r.left + r.width / 2, r.top + r.height / 2] : null,
          });
        });
      }),
    [raw, summary, renderer, stats, JSON.stringify(config)],
  );
}

async function tooltipAt(page, [x, y]) {
  await page.mouse.move(5, 5);
  await page.mouse.move(x, y);
  await page.waitForTimeout(100);
  return page.evaluate(
    () => document.querySelector(".d3plus-tooltip")?.textContent ?? null,
  );
}

const hidden = {shapeConfig: {Box: {outlier: false}}};

for (const stats of [false, true]) {
  const path = stats ? "precomputed" : "raw";
  it(
    `BoxWhisker ${path} outlier: false hides the outliers and tightens the axis (SVG and Canvas)`,
    {timeout: 60000},
    async function () {
      const {page, errors, close} = await openPage(
        '<div id="viz" style="width:600px;height:400px;font-family:sans-serif;"></div>',
      );
      try {
        const shown = await draw(page, {renderer: "svg", stats, config: {}});
        assert.strictEqual(shown.outliers.length, 1, "the outlier draws");
        assert.ok(Math.max(...shown.domain) >= 900, `${shown.domain}`);
        let center;
        for (const renderer of ["svg", "canvas"]) {
          const out = await draw(page, {renderer, stats, config: hidden});
          assert.deepStrictEqual(out.outliers, [], `${renderer}: no outliers`);
          const top = Math.max(...out.domain);
          assert.ok(top > 313.5 && top < 500, `${renderer}: ${out.domain}`);
          center = center || out.center;
          const text = await tooltipAt(page, center);
          assert.ok(text && text.includes("alpha"), `${renderer}: ${text}`);
          assert.ok(text.includes("314"), `${renderer}: whisker end: ${text}`);
          assert.ok(text.includes("145"), `${renderer}: median: ${text}`);
        }
        assert.deepStrictEqual(errors, []);
      } finally {
        await close();
      }
    },
  );
}

it(
  "BoxWhisker outlier accessor: hides only the outliers it returns false for",
  {timeout: 60000},
  async function () {
    const {page, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;"></div>',
    );
    try {
      const out = await page.evaluate(
        raw =>
          new Promise(resolve => {
            const viz = new window.d3plus.BoxWhisker()
              .data(raw.concat({id: "beta", n: 99, value: 600}))
              .groupBy(["id", "n"])
              .x("id")
              .y("value")
              .duration(0)
              .shapeConfig({Box: {outlier: d => d.id === "beta" && "Rect"}})
              .select("#viz");
            viz.render(() => {
              const keys = [...document.querySelectorAll("#viz [data-key]")]
                .map(n => n.getAttribute("data-key"))
                .filter(k => k.includes("outlier"));
              resolve({keys, domain: viz._yAxis.domain()});
            });
          }),
        raw,
      );
      assert.ok(
        out.keys.length && out.keys.every(k => k.startsWith("beta")),
        `${out.keys}`,
      );
      const top = Math.max(...out.domain);
      assert.ok(top >= 600 && top < 900, `${out.domain}`);
    } finally {
      await close();
    }
  },
);

it(
  "BoxWhisker outlier: false with small multiples",
  {timeout: 60000},
  async function () {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:800px;height:400px;"></div>',
    );
    try {
      const out = await page.evaluate(
        raw =>
          new Promise(resolve => {
            const rows = raw.flatMap(d => [
              {...d, panel: "left"},
              {...d, panel: "right", value: d.value / 2},
            ]);
            const viz = new window.d3plus.BoxWhisker()
              .data(rows)
              .groupBy(["id", "panel", "n"])
              .x("id")
              .y("value")
              .facet("panel")
              .duration(0)
              .shapeConfig({Box: {outlier: false}})
              .select("#viz");
            viz.render(() => {
              const keys = [...document.querySelectorAll("#viz [data-key]")]
                .map(n => n.getAttribute("data-key"))
                .filter(k => k.includes("outlier"));
              const boxes = [...document.querySelectorAll("#viz [data-key]")]
                .map(n => n.getAttribute("data-key"))
                .filter(k => k.endsWith("-box"));
              const ticks = [...document.querySelectorAll("#viz text")]
                .map(t => +t.textContent.replace(/,/g, ""))
                .filter(Number.isFinite);
              resolve({keys, boxes, top: Math.max(...ticks)});
            });
          }),
        raw,
      );
      assert.deepStrictEqual(out.keys, []);
      assert.strictEqual(out.boxes.length, 4, `${out.boxes}`);
      assert.ok(out.top < 900, `axis ticks stop short of 900: ${out.top}`);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  },
);

it(
  "BoxWhisker outlier: false: a legend click keeps outliers hidden and the axis tight",
  {timeout: 60000},
  async function () {
    const {page, errors, close} = await openPage(
      '<div id="viz" style="width:600px;height:400px;"></div>',
    );
    try {
      const legend = await page.evaluate(
        raw =>
          new Promise(resolve => {
            const viz = new window.d3plus.BoxWhisker()
              .data(raw)
              .groupBy(["id", "n"])
              .x("id")
              .y("value")
              .duration(0)
              .shapeConfig({Box: {outlier: false}})
              .select("#viz");
            window.__viz = viz;
            viz.render(() => {
              const keys = [
                ...document.querySelectorAll(
                  '#viz [data-key="viz-legend"] [data-key]',
                ),
              ];
              const beta = keys.find(n =>
                n.getAttribute("data-key").includes("beta"),
              );
              const r = beta?.getBoundingClientRect();
              resolve(r ? [r.left + r.width / 2, r.top + r.height / 2] : null);
            });
          }),
        raw,
      );
      assert.ok(legend, "the legend draws a beta entry");
      await page.mouse.click(legend[0], legend[1]);
      await page.waitForTimeout(300);
      const out = await page.evaluate(() => {
        const keys = [...document.querySelectorAll("#viz [data-key]")].map(n =>
          n.getAttribute("data-key"),
        );
        return {
          boxes: keys.filter(k => k.endsWith("-box")).sort(),
          outliers: keys.filter(k => k.includes("outlier")),
          domain: window.__viz._yAxis.domain(),
        };
      });
      assert.deepStrictEqual(out.boxes, ["alpha-box"]);
      assert.deepStrictEqual(out.outliers, []);
      const top = Math.max(...out.domain);
      assert.ok(top > 313.5 && top < 500, `${out.domain}`);
      assert.deepStrictEqual(errors, []);
    } finally {
      await close();
    }
  },
);
