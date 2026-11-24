/**
    Figure: drawing its charts. Each chart draws into an element of its own,
    placed over its cell of the figure, so it keeps everything it does on
    its own (tooltips, zoom, timeline, keyboard navigation, data loading);
    the figure sizes them, lines up their plot areas, and tracks when they
    have all drawn.

    @module
*/
import type Viz from "../viz/Viz.js";
import {alignCells, NO_SIDES, plotInsets, sidesChanged} from "./figureAlign.js";
import type {FigureSides} from "./figureAlign.js";
import {applyChartConfig} from "./figureCharts.js";
import type {FigureChild} from "./figureCharts.js";
import type {FigureArea, FigureCell} from "./figureGrid.js";

/** The class on the element holding a figure's charts. */
export const FIGURE_CHARTS_CLASS = "d3plus-figure-charts";

/** The class on each chart's element. */
export const FIGURE_CHART_CLASS = "d3plus-figure-chart";

/** How many times a chart may redraw to line up after one layout. */
const ALIGN_PASSES = 2;

/** What a figure keeps between renders. */
export interface FigureState {
  children: FigureChild[];
  /** The element holding the charts' elements. */
  host?: HTMLDivElement;
  /** Whether drawing the charts is queued. */
  queued: boolean;
  /** Whether lining up the charts is queued. */
  aligning: boolean;
  /** Chart renders whose callback hasn't run yet. */
  pending: number;
  /** Called once no chart render is pending. */
  waiters: (() => void)[];
}

/** The figure, as the functions here read it. */
export interface FigureHost {
  _figure: FigureState;
  _select?: Viz["_select"];
  _renderer?: "svg" | "canvas";
  schema: Viz["schema"];
}

/** A new, empty figure state. */
export function figureState(): FigureState {
  return {
    children: [],
    queued: false,
    aligning: false,
    pending: 0,
    waiters: [],
  };
}

/** `cell` shrunk by `inset` on each side. */
export function insetBox(cell: FigureArea, inset: FigureSides): FigureArea {
  return {
    x: cell.x + inset.left,
    y: cell.y + inset.top,
    width: Math.max(0, cell.width - inset.left - inset.right),
    height: Math.max(0, cell.height - inset.top - inset.bottom),
  };
}

/** Positions an absolutely placed element over `box`. */
function place(node: HTMLElement, box: FigureArea): void {
  node.style.left = `${box.x}px`;
  node.style.top = `${box.y}px`;
  node.style.width = `${box.width}px`;
  node.style.height = `${box.height}px`;
}

/**
    The element holding the charts: placed over the figure's own surface,
    after it in the page so the charts draw above the figure's background
    (and are tabbed to after its controls), and letting the pointer through
    everywhere but the charts.
*/
function ensureHost(figure: FigureHost): HTMLDivElement | undefined {
  const svg = figure._select?.node?.() as SVGElement | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  if (!svg || !parent) return undefined;
  let host = figure._figure.host;
  if (!host || host.parentNode !== parent) {
    host?.remove();
    host = parent.ownerDocument.createElement("div");
    host.className = FIGURE_CHARTS_CLASS;
    host.style.position = "absolute";
    host.style.pointerEvents = "none";
    figure._figure.host = host;
  }
  host.style.top = svg.style.top || "0px";
  host.style.left = svg.style.left || "0px";
  if (host !== parent.lastElementChild) parent.appendChild(host);
  return host;
}

/** Runs the figure's waiters once no chart render is pending. */
function settle(state: FigureState): void {
  if (state.pending > 0) return;
  const waiters = state.waiters.splice(0);
  for (const fn of waiters) fn();
}

/**
    Resolves once every chart render the figure started has run its
    callback (straight away when none is pending).
*/
export function figureSettled(state: FigureState): Promise<void> {
  return new Promise(resolve => {
    state.waiters.push(resolve);
    settle(state);
  });
}

/** Sizes `child`'s element and chart to its cell (less its inset), and renders it. */
function drawChild(figure: FigureHost, child: FigureChild): void {
  const state = figure._figure;
  if (!child.cell || !child.node) return;
  const box = insetBox(child.cell, child.inset);
  place(child.node, box);
  const chart = child.chart;
  chart.width(box.width).height(box.height);
  child.drawn = false;
  state.pending++;
  let done = false;
  chart.render(() => {
    if (done) return;
    done = true;
    state.pending--;
    settle(state);
  });
}

/** The link group the figure's charts share, or false when they aren't linked. */
export function figureLinkGroup(link: unknown): string | false {
  if (typeof link === "string") return link || false;
  if (link && typeof link === "object") {
    const group = (link as {group?: unknown}).group;
    return typeof group === "string" && group ? group : false;
  }
  return false;
}

/** The prefix of the link group a figure makes for its charts. */
export const FIGURE_LINK_PREFIX = "d3plus-figure-";

/** Whether `link` is the group a figure made for its charts (not one set by hand). */
export function isFigureLink(link: unknown): boolean {
  return (
    typeof link === "string" &&
    link.startsWith(FIGURE_LINK_PREFIX) &&
    /^\d+$/.test(link.slice(FIGURE_LINK_PREFIX.length))
  );
}

/**
    Puts `child` in the figure's link group, unless it has a `link` of its
    own (a nested figure's own group counts as none, so its charts join the
    outer figure's); takes it back out when the figure's charts stop being
    linked.
*/
function linkChild(figure: FigureHost, child: FigureChild): void {
  const group = figureLinkGroup(figure.schema.link);
  const chart = child.chart;
  const own = chart.schema.link;
  const nested = "_figure" in chart && isFigureLink(own);
  if (own && own !== child.linked && !nested) return;
  if (group && own !== group) {
    chart.link(group);
    child.linked = group;
  } else if (!group && child.linked) {
    chart.link(false);
    child.linked = undefined;
  }
}

/**
    Readies `child` for the figure: its config, its element (in `host`, in
    reading order), the figure's renderer, and its link group. A chart in a
    figure draws when the figure does and at the size the figure gives it,
    so it neither waits to scroll into view nor watches its own size.
*/
function prepareChild(
  figure: FigureHost,
  child: FigureChild,
  host: HTMLDivElement,
): void {
  applyChartConfig(
    child,
    figure.schema.chartConfig as Record<string, unknown> | undefined,
  );
  if (!child.node) {
    const node = host.ownerDocument.createElement("div");
    node.className = FIGURE_CHART_CLASS;
    node.style.position = "absolute";
    node.style.pointerEvents = "auto";
    child.node = node;
  }
  host.appendChild(child.node);
  const chart = child.chart;
  const current = chart._select?.node?.() as Element | undefined;
  if (!current || (current !== child.node && current.parentNode !== child.node))
    chart.select(child.node);
  if (figure._renderer && chart.renderer() !== figure._renderer)
    chart.renderer(figure._renderer);
  if (chart.schema.detectVisible) chart.detectVisible(false);
  if (chart.schema.detectResize) chart.detectResize(false);
  linkChild(figure, child);
  chart._onDrawn = () => {
    child.drawn = true;
    queueAlign(figure);
  };
}

/**
    Draws every chart in its cell. Called once the figure has laid out
    (queued, so the figure's own draw has painted first).
*/
export function drawFigureCharts(
  figure: FigureHost,
  cells: FigureCell[],
): void {
  const state = figure._figure;
  const host = ensureHost(figure);
  if (!host) return;
  const width = figure.schema.width as number,
    height = figure.schema.height as number;
  host.style.width = `${width}px`;
  host.style.height = `${height}px`;
  // A chart keeps its inset through a new layout, so it doesn't jump before
  // lining up again.
  const align = figureAligns(figure);
  state.children.forEach((child, i) => {
    child.cell = cells[i];
    child.aligned = 0;
    if (!align) child.inset = {...NO_SIDES};
    prepareChild(figure, child, host);
  });
  for (const child of state.children) drawChild(figure, child);
}

/** Whether the figure lines up its charts' plot areas (`layoutConfig.align`). */
function figureAligns(figure: FigureHost): boolean {
  const layout = figure.schema.layoutConfig as {align?: boolean} | undefined;
  return layout?.align !== false;
}

/** Queues `drawFigureCharts` after the current draw, once however often it is asked for. */
export function queueFigureCharts(
  figure: FigureHost,
  cells: () => FigureCell[],
): void {
  const state = figure._figure;
  if (state.queued) return;
  state.queued = true;
  queueMicrotask(() => {
    state.queued = false;
    drawFigureCharts(figure, cells());
  });
}

/**
    Lines up the plot areas of charts on the same grid lines (see
    `alignCells`) once every chart has drawn, redrawing those whose box
    changes. Each chart redraws to line up at most `ALIGN_PASSES` times per
    layout, so charts whose insets keep changing with their size can't
    redraw forever.
*/
export function alignFigureCharts(figure: FigureHost): void {
  const state = figure._figure;
  if (!figureAligns(figure)) return;
  const children = state.children.filter(c => c.cell);
  if (children.some(c => !c.drawn)) return;
  const insets = children.map(c => plotInsets(c.chart));
  const next = alignCells(
    children.map(c => c.cell!),
    insets,
  );
  children.forEach((child, i) => {
    if (!sidesChanged(next[i], child.inset)) return;
    if (child.aligned >= ALIGN_PASSES) return;
    child.aligned++;
    child.inset = next[i];
    drawChild(figure, child);
  });
}

/** Queues `alignFigureCharts`, once however many charts finish drawing together. */
function queueAlign(figure: FigureHost): void {
  const state = figure._figure;
  if (state.aligning) return;
  state.aligning = true;
  queueMicrotask(() => {
    state.aligning = false;
    alignFigureCharts(figure);
  });
}

/** Tears down `child`: its chart (if the figure made or owns it) and its element. */
export function removeFigureChart(child: FigureChild): void {
  child.chart._onDrawn = undefined;
  child.chart.destroy();
  child.node?.remove();
  child.node = undefined;
}
