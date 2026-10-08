/**
    Small multiples: draws a chart as a grid of panels, one per distinct
    `facet` value, sharing one set of chart chrome.

    Each panel's rows go through the chart's own data prep (rollup, legend
    hide/solo, threshold) separately. The chart then draws once with no body,
    to lay out its chrome (title, legend, colorScale, timeline, …) against
    every panel's rows; the area left over is split into a grid; then the
    chart's own body draw runs once per panel, against that panel's rows and
    with the panel's chart area as its margins.
    Each panel's nodes are wrapped in a group of their own (keys prefixed so
    panels never collide) and the groups become the chart's scene. Because
    every panel is drawn by the same chart instance, colors, hover, legend
    hide/solo, and tooltips work across panels exactly as within one chart.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {ClipShape, SceneNode, Transform} from "@d3plus/render";

import {drawWithInset} from "../pipeline/insetPlacement.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  FACET_ASPECT,
  facetActive,
  resolveFacetConfig,
} from "./facetConfig.js";
import type {
  FacetCell,
  FacetConfig,
  FacetValue,
  FacetHooks,
  FacetPanelContext,
  FacetPanelState,
  ResolvedFacetConfig,
} from "./facetConfig.js";
import {facetFilteredData, facetGroups, facetTimeFilter, formatFacetValue} from "./facetData.js";
import type {FacetGroup} from "./facetData.js";
import {facetGrid} from "./facetGrid.js";
import type {FacetArea, FacetGridOptions} from "./facetGrid.js";
import {
  expandArea,
  LABEL_COMBOS,
  labelExpansions,
  labelGutter,
  labelKey,
  labelOverhang,
  NO_SIDES,
  panelBase,
} from "./facetGutter.js";
import type {FacetSides} from "./facetGutter.js";
import {clearPanelSlots} from "./facetPanel.js";
import {
  facetBodyNode,
  facetPanelNode,
  facetTitleNodes,
  measureFacetTitles,
  prefixKeys,
} from "./facetScene.js";
import type {FacetTitle} from "./facetScene.js";

/** A facet group with its drawable rows. */
interface Panel extends FacetGroup {
  data: DataPoint[];
}

/** What one panel draw leaves behind. */
interface PanelDraw {
  scene: SceneNode[];
  /** The data shapes an automatic `zoomMax` measures (see `VizInstance._zoomShapes`). */
  zoomShapes: SceneNode[];
  chartTransform?: Transform;
  chartClip?: ClipShape;
  state: Record<string, unknown>;
}

/** Everything a facet draw needs, resolved once. */
interface FacetPlan {
  config: ResolvedFacetConfig;
  hooks: FacetHooks;
  panels: Panel[];
  area: FacetArea;
  shared: boolean;
  scales: unknown;
  /** `_padding` as the chrome left it; each panel draw starts from it. */
  padding: VizInstance["_padding"];
}

/** Margins that make `area` the chart area of a `viz`-sized surface. */
export function facetAreaMargin(viz: Pick<VizInstance, "schema">, area: FacetArea): VizInstance["_margin"] {
  return {
    top: area.y,
    left: area.x,
    right: viz.schema.width - area.x - area.width,
    bottom: viz.schema.height - area.y - area.height,
  };
}

/** Which axes a panel labels: all of them, or with outer axes only those on the grid's left/bottom edges. */
export function panelLabels(cell: FacetCell, outer: boolean): {x: boolean; y: boolean} {
  return outer ? {x: cell.edges.bottom, y: cell.edges.left} : {x: true, y: true};
}

/** Draws the chart's body for one panel's rows in `area`. */
function drawPanel(
  viz: VizInstance,
  plan: FacetPlan,
  data: DataPoint[],
  area: FacetArea,
  ctx: FacetPanelContext,
): PanelDraw {
  viz._filteredData = data;
  viz._margin = facetAreaMargin(viz, area);
  viz._padding = {...plan.padding};
  viz._chartScene = [];
  viz._chartTransform = undefined;
  viz._chartClip = undefined;
  viz._zoomShapes = undefined;
  if (!data.length || area.width <= 0 || area.height <= 0) return {scene: [], zoomShapes: [], state: {}};
  const undo = plan.hooks.panel ? plan.hooks.panel(viz, ctx) : undefined;
  viz._facetStep = "panel";
  try {
    viz._draw();
  }
  finally {
    viz._facetStep = undefined;
    if (undo) undo();
  }
  const scene = viz._chartScene || [];
  return {
    scene,
    zoomShapes: viz._zoomShapes || scene,
    chartTransform: viz._chartTransform,
    chartClip: viz._chartClip,
    state: plan.hooks.capture ? plan.hooks.capture(viz) : {},
  };
}

/** The panel titles' style: `titleConfig`, defaulting its color to contrast with the chart's background. */
export function facetTitleStyle(
  viz: Pick<VizInstance, "schema" | "_select">,
  config: ResolvedFacetConfig,
): Record<string, unknown> {
  if (config.titleConfig.fontColor !== undefined) return config.titleConfig;
  return {...config.titleConfig, fontColor: backgroundInk(viz)};
}

/** Each panel's title text (empty when titles are off). */
export function facetTitleTexts(
  config: Pick<ResolvedFacetConfig, "title">,
  panels: {value: FacetValue; data: DataPoint[]}[],
): string[] {
  const {title} = config;
  const values = panels.map(p => p.value);
  return panels.map(p =>
    title === false ? "" : title ? `${title(p.value, p.data)}` : formatFacetValue(p.value, values));
}

/** The height every panel reserves for its title: the tallest title at its cell's width. */
export function facetTitleBand(
  viz: Pick<VizInstance, "schema">,
  texts: string[],
  cells: FacetCell[],
  style: Record<string, unknown>,
): number {
  const titles: FacetTitle[] = texts
    .map((text, i) => ({text, x: 0, y: 0, width: cells[i] ? cells[i].width : 0}))
    .filter(t => t.text && t.width > 0);
  return measureFacetTitles(titles, style, viz.schema.locale);
}

/** The grid, and where each panel draws within it. */
interface GridLayout {
  cells: FacetCell[];
  columns: number;
  titleHeight: number;
  outer: boolean;
  gutter: FacetSides;
  /** Each label combination's room beyond a bare panel's (see `labelExpansions`). */
  expansions: Record<string, FacetSides>;
}

/**
    Measures how much room each combination of axis labels takes, by drawing
    a probe panel with each (see `facet/facetGutter.ts`).
*/
function measureLabels(viz: VizInstance, plan: FacetPlan, cell: FacetCell, area: FacetArea): Record<string, FacetSides> {
  const data = plan.panels.find(p => p.data.length)?.data;
  const insets = plan.hooks.insets;
  if (!data || !insets) return {};
  const measured: Record<string, FacetSides> = {};
  for (const labels of LABEL_COMBOS) {
    drawPanel(viz, plan, data, area, {cell, shared: plan.shared, labels, scales: plan.scales});
    measured[labelKey(labels)] = insets(viz);
  }
  return labelExpansions(measured);
}

/**
    Lays the grid out: sized for the panel titles and, with outer axis
    labels, for the room the labeled panels need. Shares the chart's scales
    (see `FacetHooks.share`) along the way, at the panels' size.
*/
function layoutGrid(viz: VizInstance, plan: FacetPlan, texts: string[], style: Record<string, unknown>): GridLayout {
  const {config, hooks, panels, area} = plan;
  const opts: FacetGridOptions = {
    columns: config.columns,
    rows: config.rows,
    padding: config.padding,
    titleHeight: 0,
    aspect: hooks.aspect ?? FACET_ASPECT,
  };
  const titleHeight = facetTitleBand(viz, texts, facetGrid(panels.length, area, opts), style);
  opts.titleHeight = titleHeight;
  const first = facetGrid(panels.length, area, opts)[0];
  const probeArea = panelBase(first, titleHeight, NO_SIDES, 1);
  if (plan.shared && hooks.share) {
    // Scales are shared at the panels' size, which is what pixel-sized
    // domain padding (a bubble's radius) is measured in.
    viz._margin = facetAreaMargin(viz, probeArea);
    plan.scales = hooks.share(viz, panels.map(p => p.data));
  }
  const outer = plan.shared && (config.axes ?? hooks.axes ?? "outer") === "outer";
  const expansions = outer ? measureLabels(viz, plan, first, probeArea) : {};
  const gutter = labelGutter(expansions);
  opts.gutter = gutter;
  opts.columnPadding = config.padding + labelOverhang(expansions);
  opts.titleHeight = titleHeight + gutter.top;
  const cells = facetGrid(panels.length, area, opts);
  const columns = Math.max(1, ...cells.map(c => c.column + 1));
  return {cells, columns, titleHeight, outer, gutter, expansions};
}

/** Where a panel's title goes: above its cell, across its base area. */
export function panelTitle(text: string, cell: FacetCell, base: FacetArea): FacetTitle {
  return {text, x: base.x, y: cell.y, width: base.width};
}

/** Draws every panel and composes them into the chart's scene; returns the per-panel state and every panel's data shapes. */
function drawPanels(viz: VizInstance, plan: FacetPlan): {states: FacetPanelState[]; zoomShapes: SceneNode[]} {
  const style = facetTitleStyle(viz, plan.config);
  const texts = facetTitleTexts(plan.config, plan.panels);
  const layout = layoutGrid(viz, plan, texts, style);
  const {cells, outer, expansions} = layout;
  const bases = cells.map(cell => panelBase(cell, layout.titleHeight, layout.gutter, layout.columns));
  const titles = facetTitleNodes(
    cells.map((cell, i) => panelTitle(texts[i], cell, bases[i])).filter(t => t.text),
    style,
    viz.schema.locale,
  );
  let t = 0;
  const states: FacetPanelState[] = [];
  const scene: SceneNode[] = [];
  const zoomShapes: SceneNode[] = [];
  plan.panels.forEach((panel, i) => {
    const cell = cells[i];
    const labels = panelLabels(cell, outer);
    const area = expandArea(bases[i], expansions[labelKey(labels)] ?? NO_SIDES);
    const drawn = drawPanel(viz, plan, panel.data, area, {cell, shared: plan.shared, labels, scales: plan.scales});
    const key = `facet-${panel.key}`;
    const title = texts[i] ? titles[t++] : undefined;
    const body = drawn.scene.length
      ? facetBodyNode(key, prefixKeys(drawn.scene, key), drawn.chartTransform, drawn.chartClip)
      : undefined;
    scene.push(facetPanelNode(key, title ? {...title, key: `${key}/title`} : undefined, body, texts[i]));
    zoomShapes.push(...drawn.zoomShapes);
    states.push({
      key, value: panel.value, cell, area,
      chartTransform: drawn.chartTransform, scene: drawn.scene, state: drawn.state,
    });
  });
  viz._chartScene = scene;
  return {states, zoomShapes};
}

/**
    Draws `viz` as small multiples. Returns false (drawing nothing) when
    there's nothing to split: no facet values, or no rows passing the
    chart's filters.
*/
export function drawFacets(viz: VizInstance): boolean {
  const config = resolveFacetConfig(viz.schema.facetConfig as FacetConfig | undefined);
  const groups = facetGroups(viz, config.sort);
  if (!groups.length || !(viz._filteredData || []).length) return false;
  const timeFilter = facetTimeFilter(viz);
  const panels: Panel[] = groups.map(g => ({...g, data: facetFilteredData(viz, g.rows, timeFilter)}));
  // The chart's rows are every panel's rows: the chrome (a colorScale's
  // domain, the title and total) reads the values the panels draw, not
  // values rolled up across panels.
  const all = panels.flatMap(p => p.data);
  if (!all.length) return false;
  viz._filteredData = all;
  viz._insetPending = null;
  viz._insetPlacement = null;

  viz._facetStep = "chrome";
  try {
    viz._draw();
  }
  finally {
    viz._facetStep = undefined;
  }
  const margin = {...viz._margin};
  const padding = {...viz._padding};
  const area: FacetArea = {
    x: margin.left,
    y: margin.top,
    width: viz.schema.width - margin.left - margin.right,
    height: viz.schema.height - margin.top - margin.bottom,
  };

  const hooks = viz._facetHooks ? viz._facetHooks() : {};
  const shared = config.scales === "shared";
  const {states, zoomShapes} = drawPanels(viz, {config, hooks, panels, area, shared, scales: undefined, padding});

  viz._filteredData = all;
  viz._margin = margin;
  viz._padding = padding;
  viz._chartTransform = undefined;
  viz._chartClip = undefined;
  viz._bodyRect = {...area};
  viz._zoomShapes = zoomShapes;
  viz._facetPanels = states;
  // A drill-down redraws every panel in place: there's no single body for
  // the clicked mark to morph out of or back into.
  viz._pendingEnterOrigin = undefined;
  viz._pendingExitReunion = undefined;
  clearPanelSlots(viz, states);
  return true;
}

/**
    Draws the chart for this render: as small multiples when `facet` is set,
    otherwise as one chart (with chrome placed inside it when it fits).
*/
export function drawChart(viz: VizInstance): void {
  viz._facetPanels = undefined;
  if (facetActive(viz) && drawFacets(viz)) return;
  drawWithInset(viz);
}
