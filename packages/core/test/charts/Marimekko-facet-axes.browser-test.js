import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {near} from "~test/helpers.js";

/**
    Marimekko small multiples share one value axis: only the grid's left
    column labels the 0–100% axis (or its bottom row, for horizontal bars),
    every panel labels its own categories, and the panels' plot areas line
    up, so the panels without an axis give the room to their bars.
*/

// The SmallMultiples stories' revenue by year, region, and brand.
const brands = ["Apple", "Samsung", "Xiaomi", "Oppo", "Other"];
const byYear = [2020, 2022, 2024].flatMap((year, y) =>
  [
    ["North America", [62, 24, 1, 1, 9]],
    ["Europe", [38, 30, 12, 6, 14]],
    ["Asia Pacific", [70, 34, 40, 38, 58]],
    ["Latin America", [6, 14, 7, 3, 8]],
  ].flatMap(([region, values]) =>
    values.map((revenue, i) => ({
      Year: year,
      Region: region,
      Brand: brands[i],
      Revenue: Math.round(revenue * (0.5 + 0.25 * y + ((i * 7) % 5) * 0.04)),
    })),
  ),
);
const panelKeys = ["facet-2020", "facet-2022", "facet-2024"];
const regionOrder = [
  "North America",
  "Europe",
  "Asia Pacific",
  "Latin America",
];
/** The region each label names, its lines joined and its share line left off. */
const regionsShown = labels =>
  labels.map(l =>
    l
      .split("\n")
      .filter(line => !/%$/.test(line))
      .join(" "),
  );

/**
    Renders faceted Marimekko and reads back, per panel: each axis's painted
    labels, and its bars' extent (each Apple segment spans its bar's width,
    and every bar spans the plot's height).
*/
const draw = ([config, rows]) =>
  new Promise(resolve => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const viz = new window.d3plus.Marimekko()
      .select(el)
      .data(rows)
      .groupBy("Brand")
      .x("Region")
      .y("Revenue")
      .facet("Year")
      .duration(0)
      .width(958)
      .height(350)
      .config(config);
    viz.render(() => {
      const panels = {};
      const panel = key =>
        (panels[key] = panels[key] || {
          x: [],
          y: [],
          left: Infinity,
          right: -Infinity,
          top: Infinity,
          bottom: -Infinity,
        });
      const walk = (node, axis) => {
        if (!node || node.key === "textBox-group") return;
        const match = /^(facet-\d+)\/plot-([xy])-axis$/.exec(node.key || "");
        const inAxis = match ? [match[1], match[2]] : axis;
        if (inAxis && node.type === "text")
          panel(inAxis[0])[inAxis[1]].push(
            node.lines.map(l => l.text).join("\n"),
          );
        (node.children || []).forEach(c => walk(c, inAxis));
      };
      walk(viz._paintedScene && viz._paintedScene.root);
      // Every panel's bars, in page pixels.
      el.querySelectorAll("rect.d3plus-render-rect").forEach(r => {
        const match = /^(facet-\d+)\/(Apple|Samsung|Xiaomi|Oppo|Other)_/.exec(
          r.getAttribute("data-key") || "",
        );
        if (!match) return;
        const b = r.getBoundingClientRect(),
          p = panel(match[1]);
        p.left = Math.min(p.left, b.left);
        p.right = Math.max(p.right, b.right);
        p.top = Math.min(p.top, b.top);
        p.bottom = Math.max(p.bottom, b.bottom);
      });
      resolve(panels);
    });
  });

const width = p => p.right - p.left;

for (const facetConfig of [{}, {scales: "independent"}]) {
  const name = facetConfig.scales || "shared";
  it(`Marimekko facet (${name} scales): only the left column labels the value axis`, async function () {
    const panels = await render("", draw, [{facetConfig}, byYear]);
    assert.deepStrictEqual(Object.keys(panels).sort(), panelKeys);
    const [first, ...rest] = panelKeys.map(k => panels[k]);
    assert.ok(
      first.y.includes("0%") && first.y.includes("80%"),
      `the left panel's y axis: ${first.y}`,
    );
    assert.ok(first.y.includes("Revenue"), "with its title");
    rest.forEach((p, i) =>
      assert.deepStrictEqual(p.y, [], `${panelKeys[i + 1]} draws no y labels`),
    );
    // Every panel labels its own categories, but for one too long for its bar.
    panelKeys.forEach(k => {
      const shown = regionsShown(panels[k].x);
      assert.ok(shown.length >= 3, `${k} labels its bars: ${panels[k].x}`);
      assert.deepStrictEqual(
        shown,
        regionOrder.filter(r => shown.includes(r)),
        `${k}: whole names, in bar order`,
      );
    });
    // Every plot spans the same height, so the left axis reads for all.
    rest.forEach(p => {
      near(p.top, first.top, 1, "plot tops line up");
      near(p.bottom, first.bottom, 1, "plot bottoms line up");
    });
  });

  it(`Marimekko facet (${name} scales): panels without a y axis give its room to their bars`, async function () {
    const shared = await render("", draw, [{facetConfig}, byYear]);
    const all = await render("", draw, [
      {facetConfig: {...facetConfig, axes: "all"}},
      byYear,
    ]);
    panelKeys.forEach(k =>
      assert.ok(
        width(shared[k]) > width(all[k]) + 10,
        `${k}: ${width(shared[k])}px wide, vs ${width(all[k])}px with every panel's own y axis`,
      ),
    );
    if (name === "independent") {
      // Every independent panel fills the same plot width.
      panelKeys
        .slice(1)
        .forEach(k =>
          near(
            width(shared[k]),
            width(shared[panelKeys[0]]),
            1.5,
            `${k} fills its plot`,
          ),
        );
    }
  });
}

it("Marimekko facet: facetConfig axes sets each axis on its own, or both at once", async function () {
  const both = await render("", draw, [
    {facetConfig: {axes: {y: "all"}}},
    byYear,
  ]);
  panelKeys.forEach(k =>
    assert.ok(both[k].y.includes("0%"), `${k} labels its y axis`),
  );
  const outer = await render("", draw, [
    {facetConfig: {axes: "outer"}},
    byYear,
  ]);
  // One row: every panel is on the bottom edge, so each still labels its categories.
  panelKeys.forEach(k =>
    assert.ok(outer[k].x.length >= 3, `${k} x labels: ${outer[k].x}`),
  );
  assert.deepStrictEqual(outer["facet-2022"].y, []);
});

it("Marimekko facet: horizontal bars label the value axis along the bottom row only", async function () {
  const config = {
    discrete: "y",
    x: "Revenue",
    y: "Region",
    facetConfig: {columns: 1},
    height: 900,
  };
  const panels = await render("", draw, [config, byYear]);
  const [top, middle, bottom] = panelKeys.map(k => panels[k]);
  assert.deepStrictEqual(top.x, [], "the top panel draws no x labels");
  assert.deepStrictEqual(middle.x, []);
  assert.ok(bottom.x.includes("0%"), `the bottom panel's x axis: ${bottom.x}`);
  panelKeys.forEach(k =>
    assert.strictEqual(
      panels[k].y.length,
      4,
      `${k} labels its categories: ${panels[k].y}`,
    ),
  );
  near(top.left, bottom.left, 1, "plot lefts line up");
  near(top.right, bottom.right, 1, "plot rights line up");
});

it("Marimekko facet: absolute heights with independent scales label every panel's value axis", async function () {
  const config = {stackOffset: "none", facetConfig: {scales: "independent"}};
  const panels = await render("", draw, [config, byYear]);
  panelKeys.forEach(k =>
    assert.ok(
      panels[k].y.length > 1,
      `${k} labels its own y axis: ${panels[k].y}`,
    ),
  );
});
