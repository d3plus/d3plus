import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {
  polarFacetHooks,
  polarFacetPanel,
  polarSharedExtent,
  sharePolarScale,
} from "../../src/charts/polar/polarFacet.ts";
import {polarSlotTops} from "../../src/charts/polar/wedgeLayout.ts";
import {polarAreaDomainValues} from "../../src/charts/PolarArea/applyLayout.ts";
import {radialBarDomainValues} from "../../src/charts/RadialBar/applyLayout.ts";

/**
    Small multiples for the polar charts: each panel fits its value domain to
    its own rows unless `facetConfig.scales` is "shared", in which case every
    panel shares one domain (pure helpers, then PolarArea and RadialBar drawn
    both ways on SVG and Canvas).
*/

const valueViz = extra => ({schema: {value: d => d.v, ...extra}, ctx: {}});

it("polarSlotTops: each slot's stacked total, in first-appearance order", () => {
  const rows = [
    {s: "b", v: 3},
    {s: "a", v: 2},
    {s: "b", v: 4},
    {s: "a", v: -5},
    {s: "c", v: NaN},
  ];
  assert.deepStrictEqual(
    polarSlotTops(valueViz(), rows, d => d.s),
    [7, 2, 0],
    "negative and non-finite values take no room",
  );
  assert.deepStrictEqual(
    polarSlotTops(valueViz(), [], d => d.s),
    [],
  );
});

it("polarAreaDomainValues: stacked totals per metric, or each row's value without one", () => {
  const rows = [
    {m: "Jan", g: "x", v: 1},
    {m: "Jan", g: "y", v: 2},
    {m: "Feb", g: "x", v: 5},
  ];
  const withMetric = {...valueViz({metric: d => d.m}), _ids: d => [d.g]};
  assert.deepStrictEqual(polarAreaDomainValues(withMetric, rows), [3, 5]);
  const byRow = {...valueViz(), _ids: (d, i) => [d.g, i]};
  assert.deepStrictEqual(polarAreaDomainValues(byRow, rows), [1, 2, 5]);
});

it("radialBarDomainValues: every row's value for tracks, each bar's total for the circular bar chart", () => {
  const rows = [
    {id: "a", v: -2},
    {id: "b", v: 8},
  ];
  const tracks = {...valueViz({discrete: "radius"}), _ids: d => [d.id]};
  assert.deepStrictEqual(radialBarDomainValues(tracks, rows), [-2, 8]);
  const angle = {...valueViz({discrete: "angle"}), _ids: d => [d.id]};
  assert.deepStrictEqual(radialBarDomainValues(angle, rows), [0, 8]);
});

it("sharePolarScale: the extent of every panel's domain values", () => {
  const viz = valueViz();
  const values = (_viz, rows) => rows.map(d => d.v);
  assert.deepStrictEqual(
    sharePolarScale(viz, [[{v: 3}, {v: 9}], [{v: -1}], []], values),
    {extent: [-1, 9]},
  );
  assert.deepStrictEqual(
    sharePolarScale(viz, [[{v: NaN}]], values),
    {extent: []},
    "no finite values, no extent",
  );
});

it("polarFacetPanel: applies the shared extent only when panels share, and undoes it", () => {
  const viz = valueViz();
  viz.ctx.polarSharedExtent = ["before"];
  const scales = {extent: [0, 40]};
  const undo = polarFacetPanel(viz, {shared: true, scales});
  assert.deepStrictEqual(polarSharedExtent(viz), [0, 40]);
  undo();
  assert.deepStrictEqual(
    viz.ctx.polarSharedExtent,
    ["before"],
    "undo restores",
  );
  const undoIndependent = polarFacetPanel(viz, {shared: false, scales});
  assert.deepStrictEqual(
    polarSharedExtent(viz),
    [],
    "independent panels add nothing",
  );
  undoIndependent();
  assert.deepStrictEqual(
    polarSharedExtent(valueViz()),
    [],
    "nothing set, nothing added",
  );
});

it("polarFacetHooks: square panels, independent by default, sharing through the given values", () => {
  const hooks = polarFacetHooks((_viz, rows) => rows.map(d => d.v));
  assert.strictEqual(hooks.aspect, 1);
  assert.strictEqual(hooks.scales, "independent");
  assert.strictEqual(hooks.panel, polarFacetPanel);
  assert.deepStrictEqual(hooks.share(valueViz(), [[{v: 2}], [{v: 6}]]), {
    extent: [2, 6],
  });
});

const panels = ["Small", "Large"].flatMap((panel, p) =>
  ["a", "b", "c", "d"].map((id, i) => ({
    panel,
    id,
    value: (40 - i * 10) * (p * 4 + 1),
  })),
);

/** Draws `chart` faceted by panel, both ways and on both backends; returns each panel's ring/tick labels and largest mark. */
const drawBoth = (chart, extra) =>
  render(
    "<div id='viz' style='width:900px;height:420px'></div>",
    async ({data, chartName, more}) => {
      const panelInfo = viz =>
        viz._facetPanels.map(p => {
          const all = [];
          const walk = nodes =>
            nodes.forEach(n => {
              all.push(n);
              if (n.children) walk(n.children);
            });
          walk(p.scene);
          const texts = all
            .filter(n => /-(level-labels|ticks)$/.test(n.key))
            .flatMap(n => n.children.map(c => c.lines[0].text));
          const marks = all.filter(
            n => n.type === "path" && n.datum && !`${n.key}`.endsWith("::hit"),
          );
          return {
            value: p.value,
            texts,
            reach: Math.max(
              ...marks.map(m =>
                more.discrete === "radius" ? m.arc.endAngle : m.arc.outerRadius,
              ),
            ),
          };
        });
      const draw = async (renderer, facetConfig) => {
        document.querySelector("#viz").innerHTML = "";
        const viz = new window.d3plus[chartName]()
          .select("#viz")
          .duration(0)
          .renderer(renderer)
          .data(data)
          .facet("panel")
          .config(more.config || {});
        if (facetConfig) viz.facetConfig(facetConfig);
        await new Promise(r => viz.render(r));
        return panelInfo(viz);
      };
      return {
        independent: await draw("svg"),
        shared: await draw("svg", {scales: "shared"}),
        canvasIndependent: await draw("canvas"),
        canvasShared: await draw("canvas", {scales: "shared"}),
      };
    },
    {data: panels, chartName: chart, more: extra},
  );

const checkModes = (out, label) => {
  const [large, small] = out.independent;
  assert.strictEqual(large.value, "Large");
  assert.notDeepStrictEqual(
    large.texts,
    small.texts,
    `${label}: independent panels label their own domains`,
  );
  assert.ok(
    Math.abs(large.reach - small.reach) < 0.01 * large.reach,
    `${label}: each panel's largest mark fills its own domain`,
  );
  const [sLarge, sSmall] = out.shared;
  assert.deepStrictEqual(
    sLarge.texts,
    sSmall.texts,
    `${label}: shared panels label one domain`,
  );
  assert.ok(
    sSmall.reach < sLarge.reach * 0.75,
    `${label}: the smaller panel's marks draw smaller`,
  );
  const round = ps => ps.map(p => ({...p, reach: Math.round(p.reach * 100)}));
  assert.deepStrictEqual(
    round(out.canvasIndependent),
    round(out.independent),
    `${label}: Canvas lays out the same (independent)`,
  );
  assert.deepStrictEqual(
    round(out.canvasShared),
    round(out.shared),
    `${label}: Canvas lays out the same (shared)`,
  );
};

it(
  "PolarArea panels fit their own domain by default and share one with facetConfig scales",
  {timeout: 180000},
  async function () {
    checkModes(await drawBoth("PolarArea", {discrete: "metric"}), "PolarArea");
  },
);

it(
  "RadialBar track panels fit their own domain by default and share one with facetConfig scales",
  {timeout: 180000},
  async function () {
    checkModes(
      await drawBoth("RadialBar", {discrete: "radius"}),
      "RadialBar tracks",
    );
  },
);

it(
  "RadialBar circular bar panels fit their own domain by default and share one with facetConfig scales",
  {timeout: 180000},
  async function () {
    checkModes(
      await drawBoth("RadialBar", {
        discrete: "angle",
        config: {discrete: "angle"},
      }),
      "RadialBar angle",
    );
  },
);
