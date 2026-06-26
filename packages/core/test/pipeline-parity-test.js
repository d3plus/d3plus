import assert from "assert";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

import it from "./jsdom.js";
import {BarChart, LinePlot, Pack, Pie, Treemap} from "../es/index.js";
import {
  applyPackLayout,
  applyPieLayout,
  applyTreemapLayout,
  runStages,
  vizPreDrawPure,
} from "../es/internal.js";
import {
  computePlotAxisValues,
  computePlotInitialDomains,
  computePlotScales,
  formatPlotData,
} from "../es/src/charts/Plot/pipeline.js";

/**
    Pipeline-parity safety net. Each representative chart drives a pure
    pipeline stage (or chain of stages) in jsdom — no rendering — and we
    snapshot a normalized fingerprint of the resulting context against a
    committed JSON baseline.

    Three layers are covered:

      1. Shared chart-shell prep — `vizPreDrawPure(viz)` (drawDepth, the
         id/ids/drawLabel closures sampled on a datum, filtered/legend ids,
         threshold-tree presence).
      2. Per-chart layout stages — `applyTreemapLayout` / `applyPieLayout` /
         `applyPackLayout` run via `runStages` after `_preDraw`; we snapshot
         each laid-out node's geometry.
      3. Plot's data→domain→scale stage chain — `formatPlotData` →
         `computePlotAxisValues` → `computePlotInitialDomains` →
         `computePlotScales`; we snapshot formatted rows, axis values,
         initial domains, and the constructed scales' domain/range.

    Functions, d3 scales, and cyclic layout nodes are normalized to compact
    scalar summaries so baselines diff cleanly in git. This locks the
    pipeline's per-stage output shape, so the purity refactors (Plot emit /
    full `_preDraw`+`_draw`) fail loudly here if a stage's output shifts.

    Regenerate intended changes with:

      UPDATE_SNAPSHOTS=1 npx mocha test/pipeline-parity-test.js
*/

const here = path.dirname(fileURLToPath(import.meta.url));
const snapDir = path.join(here, "snapshots", "pipeline");
const UPDATE = ["1", "true"].includes(process.env.UPDATE_SNAPSHOTS || "");

const barData = [
  {group: "Alpha", x: "Q1", y: 35}, {group: "Alpha", x: "Q2", y: 50},
  {group: "Beta", x: "Q1", y: 20}, {group: "Beta", x: "Q2", y: 30},
];
const lineData = [
  {group: "S1", x: 1, y: 10}, {group: "S1", x: 2, y: 22}, {group: "S1", x: 3, y: 15},
  {group: "S2", x: 1, y: 25}, {group: "S2", x: 2, y: 18}, {group: "S2", x: 3, y: 32},
];
const treemapData = [
  {group: "Tech", id: "Alpha", value: 30}, {group: "Tech", id: "Beta", value: 25},
  {group: "Health", id: "Gamma", value: 22}, {group: "Health", id: "Delta", value: 16},
  {group: "Energy", id: "Epsilon", value: 14},
];
const pieData = [
  {id: "Alpha", value: 30}, {id: "Beta", value: 22}, {id: "Gamma", value: 18},
  {id: "Delta", value: 15}, {id: "Epsilon", value: 10},
];
const packData = [
  {group: "A", id: "1", value: 10}, {group: "A", id: "2", value: 20},
  {group: "B", id: "3", value: 8}, {group: "B", id: "4", value: 18},
];

// Round to 3 decimals to absorb float jitter; non-numbers pass through.
const round = n =>
  typeof n === "number" && Number.isFinite(n) ? Math.round(n * 1000) / 1000 : n;

// A d3 scale collapses to its domain + range; non-scales pass through.
function scaleInfo(scale) {
  if (typeof scale !== "function") return scale ?? null;
  const out = {};
  if (typeof scale.domain === "function") out.domain = scale.domain().map(round);
  if (typeof scale.range === "function") out.range = scale.range().map(round);
  return out;
}

function compare(name, actual) {
  const file = path.join(snapDir, `${name}.json`);
  const serialized = `${JSON.stringify(actual, null, 2)}\n`;
  if (UPDATE) {
    fs.mkdirSync(snapDir, {recursive: true});
    fs.writeFileSync(file, serialized);
    return;
  }
  assert.ok(
    fs.existsSync(file),
    `no baseline for "${name}" — generate with UPDATE_SNAPSHOTS=1`,
  );
  const expected = fs.readFileSync(file, "utf8");
  assert.strictEqual(
    serialized,
    expected,
    `pipeline snapshot mismatch for "${name}". If intended, regenerate with UPDATE_SNAPSHOTS=1.`,
  );
}

// ---- Layer 1: shared chart-shell prep (vizPreDrawPure) ---------------------

function summarizeShell(ctx) {
  const fd = ctx.filteredData ?? [];
  const ld = ctx.legendData ?? [];
  const sample = fd[0];
  return {
    drawDepth: ctx.drawDepth,
    closures: sample
      ? {
          id: ctx.id(sample, 0),
          ids: ctx.ids(sample, 0),
          drawLabel: ctx.drawLabel(sample, 0),
        }
      : null,
    filteredData: {length: fd.length, ids: fd.map((d, i) => ctx.id(d, i))},
    legendData: {length: ld.length, ids: ld.map((d, i) => ctx.id(d, i))},
    hasThresholdTree: !!ctx._thresholdTree,
    computedTimeFilter: typeof ctx.computedTimeFilter,
  };
}

const shellCharts = [
  ["shell-bar", () => new BarChart().groupBy("group").data(barData).x("x").y("y")],
  ["shell-treemap", () => new Treemap().groupBy(["group", "id"]).data(treemapData).sum("value")],
  ["shell-pie", () => new Pie().groupBy("id").data(pieData)],
];

for (const [name, build] of shellCharts) {
  it(`pipeline snapshot: ${name}`, () => {
    const ctx = vizPreDrawPure(build());
    compare(name, summarizeShell(ctx));
  });
}

// ---- Layer 2: per-chart layout stages --------------------------------------

const GEO_FIELDS = [
  "x", "y", "x0", "x1", "y0", "y1", "r",
  "startAngle", "endAngle", "padAngle", "innerRadius", "outerRadius",
  "value", "depth", "share", "width", "height", "index",
];

function summarizeNode(node) {
  const out = {};
  const id =
    node.id != null
      ? node.id
      : node.data && node.data.id != null
        ? node.data.id
        : undefined;
  if (id !== undefined) out.id = id;
  for (const k of GEO_FIELDS) {
    const v = node[k];
    if (typeof v === "number" && Number.isFinite(v)) out[k] = round(v);
  }
  return out;
}

function summarizeLayout(shapeData) {
  return {length: shapeData.length, nodes: shapeData.map(summarizeNode)};
}

const layoutCharts = [
  ["layout-treemap", () => new Treemap().groupBy(["group", "id"]).data(treemapData).sum("value"), applyTreemapLayout],
  ["layout-pie", () => new Pie().groupBy("id").data(pieData), applyPieLayout],
  ["layout-pack", () => new Pack().groupBy(["group", "id"]).data(packData).sum("value"), applyPackLayout],
];

for (const [name, build, stage] of layoutCharts) {
  it(`pipeline snapshot: ${name}`, () => {
    const chart = build().width(400).height(300);
    chart._preDraw();
    // Layout stages read margin-adjusted bounds; pin a zero margin/padding
    // so geometry is a pure function of the data + dimensions.
    chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
    chart._padding = {top: 0, right: 0, bottom: 0, left: 0};
    const ctx = runStages({viz: chart}, [stage]);
    compare(name, summarizeLayout(ctx.shapeData ?? []));
  });
}

// ---- Layer 3: Plot data→domain→scale stage chain ---------------------------

function summarizeFormatted(data) {
  return data.map(d => ({
    id: d.id,
    x: round(d.x),
    y: round(d.y),
    shape: d.shape,
    discrete: d.discrete,
    group: d.group,
  }));
}

function normalizeDomains(domains) {
  if (!domains) return null;
  const out = {};
  for (const k of Object.keys(domains).sort()) {
    out[k] = Array.isArray(domains[k]) ? domains[k].map(round) : domains[k];
  }
  return out;
}

function summarizePlot(ctx) {
  const cs = ctx.plotConfigScales ?? {};
  return {
    formatted: summarizeFormatted(ctx.plotFormattedData ?? []),
    axisValues: {
      xData: (ctx.xData ?? []).map(round),
      x2Data: (ctx.x2Data ?? []).map(round),
      yData: (ctx.yData ?? []).map(round),
      y2Data: (ctx.y2Data ?? []).map(round),
    },
    initialDomains: normalizeDomains(ctx.plotInitialDomains),
    scales: {
      x: scaleInfo(ctx.plotScales?.x),
      y: scaleInfo(ctx.plotScales?.y),
      x2: scaleInfo(ctx.plotScales?.x2),
      y2: scaleInfo(ctx.plotScales?.y2),
    },
    configScales: {
      xConfigScale: cs.xConfigScale,
      yConfigScale: cs.yConfigScale,
      x2ConfigScale: cs.x2ConfigScale,
      y2ConfigScale: cs.y2ConfigScale,
    },
    opp: ctx.plotOpps ? ctx.plotOpps.opp : undefined,
  };
}

const plotCharts = [
  ["plot-line", () => new LinePlot().groupBy("group").data(lineData).x("x").y("y")],
  ["plot-bar", () => new BarChart().groupBy("group").data(barData).x("x").y("y")],
];

for (const [name, build] of plotCharts) {
  it(`pipeline snapshot: ${name}`, () => {
    const chart = build().width(400).height(300);
    chart._preDraw();
    chart._margin = {top: 0, right: 0, bottom: 0, left: 0};
    const ctx = runStages({viz: chart}, [
      formatPlotData,
      computePlotAxisValues,
      computePlotInitialDomains,
      computePlotScales,
    ]);
    compare(name, summarizePlot(ctx));
  });
}
