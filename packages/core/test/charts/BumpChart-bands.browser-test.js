import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    BumpChart with `size` renders in Chromium on both backends: each series
    a band centered on its rank, as thick as its value (the largest filling
    its rank's slot less `bandPadding`), bending with a bump curve between
    periods and growing out of its center line; the rank axes padded so the
    end bands fit, and labeling each band's ends; the shared tooltip listing
    each series' size, a single band's tooltip adding its size; keyboard
    focus; small multiples sharing one thickness scale; Canvas picking; and
    lines again once `size` is cleared.
*/

const box = "<div id='viz' style='width:800px;height:420px'></div>";

/** Three series holding their ranks: a band's ends sit at its rank. */
const steady = [];
[2021, 2022, 2023].forEach(year =>
  [
    ["a", 1, 100],
    ["b", 2, 50],
    ["c", 3, 25],
  ].forEach(([k, rank, v]) => steady.push({k, year, rank, v})),
);

const base = {data: steady, groupBy: "k", x: "year", y: "rank", size: "v"};

/**
    Page helpers: `draw` renders a BumpChart, `bands` reads each Area path's
    absolute vertical center and thickness (from its `d`, whose numbers
    alternate x and y), and `centerOf` a band's absolute center point.
*/
const helpers = `
  window.draw = (config, renderer) => new Promise(resolve => {
    const viz = new window.d3plus.BumpChart()
      .select("#viz")
      .duration(0)
      .renderer(renderer)
      .config(config);
    window.__viz = viz;
    viz.render(() => resolve(viz));
  });
  window.seriesLines = viz => {
    let count = 0;
    const walk = n => {
      if (n.type === "path" && n.shapeType === "Line" && /^[a-c]$/.test(String(n.key))) count++;
      (n.children || []).forEach(walk);
    };
    viz._chartScene.forEach(walk);
    return count;
  };
  window.bands = viz => {
    const out = {};
    const walk = (n, x, y) => {
      const t = n.transform || {};
      const nx = x + (t.x || 0), ny = y + (t.y || 0);
      if (n.type === "path" && n.shapeType === "Area" && !String(n.key).endsWith("::hit")) {
        const nums = (n.d.match(/-?[\\d.]+(e-?\\d+)?/g) || []).map(Number);
        const ys = nums.filter((_, i) => i % 2 === 1).map(v => v + ny);
        const xs = nums.filter((_, i) => i % 2 === 0).map(v => v + nx);
        out[n.key] = {
          top: Math.min(...ys),
          bottom: Math.max(...ys),
          left: Math.min(...xs),
          right: Math.max(...xs),
          curve: /C/.test(n.d),
          enter: typeof n.enterD === "string" && n.enterD !== n.d,
          enterFlat: n.enterD
            ? new Set((n.enterD.match(/-?[\\d.]+/g) || []).filter((_, i) => i % 2 === 1).map(v => Math.round(+v))).size
            : 0,
        };
      }
      (n.children || []).forEach(c => walk(c, nx, ny));
    };
    const t = viz._chartTransform || {x: 0, y: 0};
    viz._chartScene.forEach(n => walk(n, t.x || 0, t.y || 0));
    return out;
  };
`;

for (const renderer of ["svg", "canvas"]) {
  it(`BumpChart bands [${renderer}]: centered on each rank, as thick as each value`, async () => {
    const out = await render(
      box,
      async ({src, config, renderer}) => {
        eval(src);
        const viz = await window.draw(config, renderer);
        const t = viz._chartTransform;
        return {
          bands: window.bands(viz),
          ranks: [1, 2, 3].map(r => viz._yAxis._getPosition(r) + t.y),
          range: viz._yAxis.range().map(v => v + t.y),
          lines: window.seriesLines(viz),
          padding: viz.yConfig().scalePadding,
          labels: [...document.querySelectorAll("#viz svg text")].map(
            n => n.textContent,
          ),
        };
      },
      {src: helpers, config: base, renderer},
    );
    const {a, b, c} = out.bands;
    assert.ok(a && b && c, `a band per series (${Object.keys(out.bands)})`);
    assert.strictEqual(out.lines, 0, "no lines");
    const step = out.ranks[1] - out.ranks[0];
    const near = (v, e, msg) =>
      assert.ok(Math.abs(v - e) < 0.6, `${msg}: ${v} vs ${e}`);
    near(
      a.bottom - a.top,
      step * 0.75,
      "the largest fills its slot less bandPadding",
    );
    near(b.bottom - b.top, step * 0.375, "half the value, half the thickness");
    near(c.bottom - c.top, step * 0.1875, "linear from zero");
    [a, b, c].forEach((band, i) =>
      near((band.top + band.bottom) / 2, out.ranks[i], "centered on its rank"),
    );
    assert.strictEqual(out.padding, 0.5, "the rank axes are padded");
    assert.ok(a.top >= Math.min(...out.range) - 0.5, "the top band fits");
    assert.ok(c.bottom <= Math.max(...out.range) + 0.5, "the bottom band fits");
    assert.ok(a.curve, "bands bend with a curve");
    assert.ok(
      a.enter && a.enterFlat === 1,
      "bands grow out of their center line",
    );
    if (renderer === "svg")
      for (const k of ["a", "b", "c"])
        assert.ok(
          out.labels.filter(t => t === k).length >= 2,
          `${k} is labeled at both ends (and in the legend)`,
        );
  });

  it(`BumpChart bands [${renderer}]: bands cross as ranks change, and size(false) draws lines again`, async () => {
    const out = await render(
      box,
      async ({src, renderer}) => {
        eval(src);
        const data = [];
        [
          ["a", [1, 2], [80, 60]],
          ["b", [2, 1], [40, 90]],
        ].forEach(([k, ranks, values]) =>
          [2021, 2022].forEach((year, i) =>
            data.push({k, year, rank: ranks[i], v: values[i]}),
          ),
        );
        const viz = await window.draw(
          {data, groupBy: "k", x: "year", y: "rank", size: "v"},
          renderer,
        );
        const t = viz._chartTransform;
        const bands = window.bands(viz);
        const ranks = [1, 2].map(r => viz._yAxis._getPosition(r) + t.y);
        await new Promise(r => viz.size(false).render(r));
        return {
          bands,
          ranks,
          after: Object.keys(window.bands(viz)).length,
          lines: window.seriesLines(viz),
          padding: viz.yConfig().scalePadding,
        };
      },
      {src: helpers, renderer},
    );
    const {a, b} = out.bands;
    assert.ok(
      a.top < out.ranks[0] && a.bottom > out.ranks[1],
      "a spans from rank 1 to rank 2",
    );
    assert.ok(
      b.top < out.ranks[0] && b.bottom > out.ranks[1],
      "and b the other way",
    );
    assert.strictEqual(out.after, 0, "no bands without size");
    assert.strictEqual(out.lines, 2, "lines again");
    assert.strictEqual(out.padding, undefined, "the rank axes are unpadded");
  });

  it(`BumpChart bands [${renderer}]: keyboard focus walks the bands`, async () => {
    const out = await render(
      box,
      async ({src, config, renderer}) => {
        eval(src);
        await window.draw(config, renderer);
        const host = document.querySelector("#viz .d3plus-keyboard-nav");
        const wait = () =>
          new Promise(r => requestAnimationFrame(() => setTimeout(r, 40)));
        const live = () => host.querySelector("[aria-live]").textContent;
        host.focus();
        await wait();
        const seen = [live()];
        for (const key of ["ArrowDown", "ArrowDown"]) {
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key, bubbles: true}),
          );
          await wait();
          seen.push(live());
        }
        return seen;
      },
      {src: helpers, config: base, renderer},
    );
    assert.ok(out[0].length > 0, "announces a band");
    assert.ok(new Set(out).size >= 2, `focus moves (${out.join(" | ")})`);
  });

  it(`BumpChart bands [${renderer}]: the shared tooltip lists each series' size, a single band's adds it`, async () => {
    /** Hovers band b at 2022 in a fresh page drawn from `config`; resolves with the tooltip's text. */
    const hover = async config => {
      const {page, errors, close} = await openPage(box);
      try {
        const point = await page.evaluate(
          async ([src, config, renderer]) => {
            eval(src);
            const viz = await window.draw(JSON.parse(config), renderer);
            const host =
              document.querySelector("#viz svg") ||
              document.querySelector("#viz canvas");
            const rect = host.getBoundingClientRect();
            const t = viz._chartTransform;
            const band = window.bands(viz).b;
            return [
              rect.left + t.x + viz._xAxis._getPosition(2022),
              rect.top + (band.top + band.bottom) / 2,
            ];
          },
          [helpers, JSON.stringify(config), renderer],
        );
        await page.mouse.move(point[0] - 6, point[1] - 6);
        await page.mouse.move(point[0], point[1], {steps: 3});
        await page.waitForTimeout(150);
        const text = await page.evaluate(() =>
          [...document.querySelectorAll(".d3plus-tooltip")]
            .filter(el => getComputedStyle(el).opacity !== "0")
            .map(el => el.textContent)
            .join(" "),
        );
        assert.deepStrictEqual(errors, []);
        return text;
      } finally {
        await close();
      }
    };
    const shared = await hover(base);
    assert.ok(/^\s*v/.test(shared), `titled by the size key (${shared})`);
    for (const s of ["2022", "a", "100", "b", "50", "c", "25"])
      assert.ok(shared.includes(s), `shared tooltip has ${s} (${shared})`);
    const single = await hover({...base, tooltipShared: false});
    assert.ok(
      /^\s*b/.test(single) && /v\s*50/.test(single) && !single.includes("100"),
      `the band's size (${single})`,
    );
  });

  it(`BumpChart bands [${renderer}]: small multiples share one thickness scale`, async () => {
    const out = await render(
      "<div id='viz' style='width:900px;height:420px'></div>",
      async ({src, renderer}) => {
        eval(src);
        const data = [];
        ["p", "q"].forEach(panel =>
          [2021, 2022].forEach(year =>
            [
              ["a", 1, panel === "p" ? 100 : 50],
              ["b", 2, 50],
            ].forEach(([k, rank, v]) => data.push({panel, k, year, rank, v})),
          ),
        );
        const viz = await window.draw(
          {data, groupBy: "k", x: "year", y: "rank", size: "v", facet: "panel"},
          renderer,
        );
        const heights = [];
        const walk = n => {
          if (
            n.type === "path" &&
            n.shapeType === "Area" &&
            !String(n.key).endsWith("::hit")
          ) {
            const ys = (n.d.match(/-?[\d.]+/g) || [])
              .map(Number)
              .filter((_, i) => i % 2 === 1);
            heights.push([String(n.key), Math.max(...ys) - Math.min(...ys)]);
          }
          (n.children || []).forEach(walk);
        };
        viz._chartScene.forEach(walk);
        return heights;
      },
      {src: helpers, renderer},
    );
    assert.strictEqual(out.length, 4, `a band per series per panel (${out})`);
    const sorted = out.map(d => d[1]).sort((a, b) => a - b);
    assert.ok(
      Math.abs(sorted[0] - sorted[2]) < 0.6,
      "50 draws alike in both panels",
    );
    assert.ok(
      Math.abs(sorted[3] - 2 * sorted[0]) < 0.6,
      "and 100 twice as thick",
    );
  });
}

it("BumpChart bands [canvas]: clicking a band picks its series", async () => {
  const out = await render(
    box,
    async ({src, config}) => {
      eval(src);
      const viz = await window.draw(config, "canvas");
      viz.on("click.shape", d => (window.__clicked = d));
      const canvas = document.querySelector("#viz canvas.d3plus-render-canvas");
      const rect = canvas.getBoundingClientRect();
      const t = viz._chartTransform;
      const band = window.bands(viz).b;
      canvas.dispatchEvent(
        new MouseEvent("click", {
          clientX: rect.left + t.x + viz._xAxis._getPosition(2022) + 20,
          clientY: rect.top + (band.top + band.bottom) / 2,
          bubbles: true,
        }),
      );
      return window.__clicked && window.__clicked.k;
    },
    {src: helpers, config: base},
  );
  assert.strictEqual(out, "b");
});
