import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    Every stage label in a funnel shares one font size, in Chromium on SVG
    and Canvas: across chart sizes, orientations and curves, with labels
    inside and beside their stages, under a user's fixed size or limits,
    and per panel (or across panels, with shared facet scales).
*/

after(async () => {
  await closeBrowser();
});

const stages = [
  {id: "Visited Site", value: 12400},
  {id: "Viewed Pricing", value: 6900},
  {id: "Started Trial", value: 3100},
  {id: "Activated", value: 1850},
  {id: "Subscribed", value: 760},
];

/**
    Draws a Funnel per config and returns, per draw, every label line's
    font size and where its stage's label sits (inside or beside), grouped
    by facet panel (one group without facets).
*/
async function drawLabels(configs) {
  return render(
    "<div id='viz'></div>",
    async ({data, configs: list}) => {
      const results = [];
      // Functions can't cross into the page, so configs name them.
      const fns = {
        byValue: (a, b) => b.value - a.value,
        sizeByValue: d => (d.value > 5000 ? 14 : 11),
      };
      for (const {width, height, renderer, sortBy, fontSizeBy, ...config} of list) {
        if (sortBy) config.sort = fns[sortBy];
        if (fontSizeBy) config.shapeConfig = {labelConfig: {fontSize: fns[fontSizeBy]}};
        const el = document.querySelector("#viz");
        el.innerHTML = "";
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        const viz = new window.d3plus.Funnel()
          .select("#viz")
          .duration(0)
          .renderer(renderer || "svg")
          .data(config.data || data)
          .config(config);
        await new Promise(r => viz.render(r));
        const panels = new Map();
        const walk = (n, panel) => {
          const key = /^facet-[^/]+$/.test(n.key || "") ? n.key : panel;
          if (n.type === "text" && /funnel-label-/.test(n.key || "")) {
            if (!panels.has(key)) panels.set(key, []);
            panels.get(key).push({
              text: n.lines.map(l => l.text).join(" "),
              size: n.font.size,
              anchor: n.lines[0].anchor ?? n.anchor,
              x: n.transform.x + n.lines[0].x,
              y: n.transform.y + n.lines[0].y,
            });
          }
          (n.children || []).forEach(c => walk(c, key));
        };
        viz._chartScene.forEach(n => walk(n, "all"));
        results.push({
          panels: [...panels.values()],
          center: viz.ctx.funnel.center,
          canvas: !!document.querySelector("#viz canvas"),
        });
      }
      return results;
    },
    {data: stages, configs},
  );
}

const sizes = labels => [...new Set(labels.map(l => l.size))];

it("Funnel stage labels share one font size at any size, orient, and curve", async function () {
  // The first browser test in this file also builds the UMD bundle.
  this.timeout(180000);
  const configs = [];
  for (const orient of ["vertical", "horizontal"])
    for (const curve of ["linear", "smooth"])
      // A horizontal funnel's stages run across, so it gets wider charts.
      for (const [width, height] of orient === "vertical"
        ? [[600, 400], [320, 600], [900, 260], [260, 260]]
        : [[900, 400], [700, 300], [1200, 260], [600, 600]])
        configs.push({orient, curve, width, height, conversion: "both"});
  const out = await drawLabels(configs);
  out.forEach((o, k) => {
    const {orient, curve, width, height} = configs[k];
    const labels = o.panels[0] || [];
    assert.ok(labels.length >= 5, `${orient} ${curve} ${width}×${height} draws labels (${labels.length})`);
    assert.strictEqual(
      sizes(labels).length,
      1,
      `${orient} ${curve} ${width}×${height}: one size (${sizes(labels)})`,
    );
    assert.ok(sizes(labels)[0] >= 10, "never below fontMin");
  });
});

it("Funnel labels beside narrow stages use the shared size, and wide stages keep theirs inside", async function () {
  this.timeout(60000);
  const out = await drawLabels([
    {width: 600, height: 600, conversion: "both"},
    {width: 600, height: 600, conversion: "both", renderer: "canvas"},
    {
      width: 600,
      height: 400,
      conversion: "previous",
      sortBy: "byValue",
      data: stages.slice().reverse(),
    },
  ]);
  for (const o of out.slice(0, 2)) {
    const labels = o.panels[0];
    const visited = labels.find(l => l.text === "Visited Site");
    const subscribed = labels.find(l => l.text === "Subscribed");
    assert.ok(Math.abs(visited.x - o.center) < 1, "a wide stage's label is inside it");
    assert.ok(subscribed.x > o.center + 20, "a narrow stage's label is beside it");
    assert.strictEqual(visited.size, subscribed.size, "inside and beside share a size");
    assert.strictEqual(sizes(labels).length, 1, `conversion lines too (${sizes(labels)})`);
  }
  assert.ok(out[1].canvas, "Canvas draws");
  assert.deepStrictEqual(
    out[1].panels[0].map(l => [l.text, l.size]),
    out[0].panels[0].map(l => [l.text, l.size]),
    "Canvas plans the same labels at the same size",
  );
  assert.strictEqual(sizes(out[2].panels[0]).length, 1, "sorted stages share a size");
});

it("Funnel labels take a user's fixed font size, and stay within fontMin and fontMax", async function () {
  this.timeout(60000);
  const out = await drawLabels([
    {width: 600, height: 400, conversion: "both", shapeConfig: {labelConfig: {fontSize: 9}}},
    {width: 600, height: 400, fontSizeBy: "sizeByValue"},
    {width: 1000, height: 900, shapeConfig: {labelConfig: {fontMax: 12}}},
    {width: 600, height: 400, conversion: "both", shapeConfig: {labelConfig: {fontMin: 6}}},
  ]);
  assert.deepStrictEqual(sizes(out[0].panels[0]), [9], "a fixed size wins");
  const bySize = Object.fromEntries(out[1].panels[0].map(l => [l.text, l.size]));
  assert.strictEqual(bySize["Visited Site"], 14, "a per-stage size, read per stage");
  assert.strictEqual(bySize["Subscribed"], 11);
  assert.deepStrictEqual(sizes(out[2].panels[0]), [12], "fontMax caps the shared size");
  const small = out[3].panels[0];
  assert.strictEqual(sizes(small).length, 1);
  assert.ok(sizes(small)[0] >= 6, "fontMin is the floor");
});

it("Funnel panels each share a label size, or one across panels with shared facet scales", async function () {
  this.timeout(60000);
  // Short names fit large; long names in the same stages fit smaller.
  const names = {
    Short: ["Visit", "Price", "Trial", "Use", "Pay"],
    Long: [
      "Visited the marketing site",
      "Viewed the pricing page",
      "Started a free trial",
      "Activated their account",
      "Subscribed to a paid plan",
    ],
  };
  const rows = Object.entries(names).flatMap(([group, ids]) =>
    ids.map((id, i) => ({group, id, value: 1000 - i * 100})),
  );
  const base = {width: 640, height: 400, data: rows, facet: "group"};
  const out = await drawLabels([
    base,
    {...base, facetConfig: {scales: "shared"}},
    {...base, facetConfig: {scales: "shared"}, renderer: "canvas"},
    {...base, facetConfig: {scales: "shared"}, shapeConfig: {labelConfig: {fontSize: 9}}},
  ]);
  const [independent, shared, canvas, fixed] = out;
  assert.strictEqual(independent.panels.length, 2);
  for (const labels of independent.panels)
    assert.strictEqual(sizes(labels).length, 1, `one size per panel (${sizes(labels)})`);
  const each = independent.panels.map(l => sizes(l)[0]);
  assert.ok(new Set(each).size > 1, `panels size independently by default (${each})`);
  const all = shared.panels.flat();
  assert.strictEqual(sizes(all).length, 1, `one size across panels (${sizes(all)})`);
  // Both panels' widths measure against 1000, so they lay out as before.
  assert.strictEqual(sizes(all)[0], Math.min(...each), "the smallest panel's size");
  assert.deepStrictEqual(sizes(canvas.panels.flat()), sizes(all), "Canvas shares it too");
  assert.deepStrictEqual(sizes(fixed.panels.flat()), [9], "a fixed size wins across panels");
});
