/**
    Small multiples: the `facet` / `facetConfig` config surface and the hooks a
    chart can supply to tune how its panels are laid out and drawn.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode, Transform} from "@d3plus/render";

import {accessor} from "../../utils/index.js";
import type {FacetSides} from "./facetGutter.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A value that splits the data into panels. */
export type FacetValue = string | number | boolean | Date;

/** Reads a row's facet value. */
export type FacetAccessor = (d: DataPoint, i: number) => unknown;

/** Panel ordering: a named order, a comparator over facet values, or an explicit list of values. */
export type FacetSort =
  | "ascending"
  | "descending"
  | "data"
  | ((a: FacetValue, b: FacetValue) => number)
  | FacetValue[];

/** Whether an axis is labeled only along the grid's outer edges (`"outer"`) or on every panel (`"all"`). */
export type FacetAxesMode = "outer" | "all";

/** `facetConfig.axes`: one mode for both axes, or a mode per axis. */
export type FacetAxes = FacetAxesMode | {x?: FacetAxesMode; y?: FacetAxesMode};

// A type alias rather than an interface, so the docs generator doesn't read
// its keys (such as `padding`) as the meaning of other components' keys.
/** The object form of `facetConfig`. */
export type FacetConfig = {
  /** Number of panel columns. Chosen automatically by default, to make the panels as large as the chart's shape allows. */
  columns?: number;
  /** Number of panel rows. Chosen automatically by default. */
  rows?: number;
  /** Space between panels, in pixels. */
  padding?: number;
  /** Panel order. Defaults to `"ascending"`. */
  sort?: FacetSort;
  /** Whether every panel shares one set of scales (`"shared"`) or fits its own (`"independent"`). Applies to charts with axes, where it defaults to `"shared"`, and to Funnel's stage widths, where it defaults to `"independent"`. */
  scales?: "shared" | "independent";
  /** With shared scales, `"outer"` labels axes only along the grid's left and bottom edges; `"all"` labels every panel. An object sets each axis on its own (`{x: "all", y: "outer"}`): every panel then labels its x axis, only the left column labels its y axis, and the panels' plot areas line up. Defaults to `"outer"`, except on charts whose axis labels differ from panel to panel: BumpChart labels every axis on every panel, and Marimekko labels its categories on every panel and its 0–100% share axis only on the outer edge, even with independent scales. */
  axes?: FacetAxes;
  /** Each panel's title: a function of the panel's facet value and rows, or `false` to hide panel titles. */
  title?: false | ((value: FacetValue, data: DataPoint[]) => string);
  /** TextBox config for the panel titles (`fontSize`, `fontColor`, `fontWeight`, `textAnchor`, `padding`, …). */
  titleConfig?: Record<string, unknown>;
};

/** `facetConfig` with every option resolved. */
export interface ResolvedFacetConfig {
  columns?: number;
  rows?: number;
  padding: number;
  sort: FacetSort;
  /** Undefined defers to the chart's default (`FacetHooks.scales`). */
  scales?: "shared" | "independent";
  /** Undefined (or an axis left out) defers to the chart's default (`FacetHooks.axes`). */
  axes?: FacetAxes;
  /** `false` hides panel titles; undefined draws the default (the formatted facet value). */
  title?: false | ((value: FacetValue, data: DataPoint[]) => string);
  titleConfig: Record<string, unknown>;
}

/** Which edges of the grid a panel sits on. A panel with no panel below it is on the bottom edge. */
export interface FacetEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

/** One panel's place in the grid, in surface pixels (title included). */
export interface FacetCell {
  index: number;
  row: number;
  column: number;
  x: number;
  y: number;
  width: number;
  height: number;
  edges: FacetEdges;
}

/** What a chart's per-panel hook is told about the panel about to draw. */
export interface FacetPanelContext {
  cell: FacetCell;
  /** Whether panels share scales this draw. */
  shared: boolean;
  /** Whether this panel labels its axes (see `FacetConfig.axes`). */
  labels: {x: boolean; y: boolean};
  /** The value `FacetHooks.share` returned, when it ran. */
  scales: unknown;
}

/**
    Chart-specific small-multiple behavior. Every hook is optional: a chart
    with none draws each panel exactly as it draws a whole chart, at the
    default panel aspect.
*/
export interface FacetHooks {
  /** The panel width/height ratio the chart reads best at, used to pick the grid shape. */
  aspect?: number;
  /** The chart's default for `FacetConfig.scales` (`"shared"` when unset). */
  scales?: "shared" | "independent";
  /** The chart's default for `FacetConfig.axes` (`"outer"` when unset), or a function of the chart returning it. */
  axes?: FacetAxes | ((viz: VizInstance) => FacetAxes);
  /**
      The axes that read the same in every panel even when panels fit their
      own scales (`scales: "independent"`), such as Marimekko's 0–100% share
      axis. Set to `"outer"`, these still label only the grid's outer edges.
  */
  fixedAxes?: (viz: VizInstance) => {x?: boolean; y?: boolean};
  /** Computes the scales every panel shares from each panel's rows (one array per panel). Runs before any panel draws, when scales are shared. */
  share?: (viz: VizInstance, panels: DataPoint[][]) => unknown;
  /** Applies a panel's overrides before it draws; returns a function undoing them. */
  panel?: (viz: VizInstance, ctx: FacetPanelContext) => () => void;
  /**
      The plot area's insets from the chart area (pixels, per side) for the
      panel just drawn. With shared scales and outer axis labels, probe
      panels drawn with each combination of labeled axes are measured with
      it, so every panel's plot area comes out the same size (see
      `facet/facetGutter.ts`).
  */
  insets?: (viz: VizInstance) => FacetSides;
  /**
      Adds the chart's own nodes to a panel's chart nodes, right after the
      panel draws (with its state still in place), and returns the panel's
      nodes. For chrome a chart layers onto its scene outside `_chartScene`
      (in a `toScene` override), which the composed small-multiples scene
      would otherwise draw once for the whole chart, or not at all.
  */
  scene?: (viz: VizInstance, nodes: SceneNode[]) => SceneNode[];
  /** Captures the chart state (viz slots, by name) a panel puts back while the pointer is over it, for hover and tooltips (see `facet/facetPanel.ts`). */
  capture?: (viz: VizInstance) => Record<string, unknown>;
}

/** State held for each drawn panel, read back while the pointer is over it. */
export interface FacetPanelState {
  key: string;
  value: FacetValue;
  cell: FacetCell;
  /** The chart area the panel drew in, in surface pixels. */
  area: {x: number; y: number; width: number; height: number};
  chartTransform?: Transform;
  /** The panel's own chart nodes (before key prefixing). */
  scene: SceneNode[];
  /** Chart state captured by `FacetHooks.capture`. */
  state: Record<string, unknown>;
}

/** Default panel title style: smaller than the chart title, centered over its panel. */
export const FACET_TITLE_DEFAULTS: Record<string, unknown> = {
  fontSize: 12,
  fontWeight: 600,
  padding: 4,
  textAnchor: "middle",
};

/** Default space between panels, in pixels. */
export const FACET_PADDING = 20;

/** Default panel aspect (width / height) for charts that don't set one. */
export const FACET_ASPECT = 4 / 3;

/**
    Coerces a `facet` setter argument: a string becomes a key accessor, a
    function is kept, and anything else (`false`, `undefined`) turns faceting off.
*/
export function coerceFacet(value: unknown): FacetAccessor | undefined {
  if (typeof value === "function") return value as FacetAccessor;
  if (typeof value === "string" && value) return accessor(value) as FacetAccessor;
  return undefined;
}

/** `facetConfig` with defaults filled in. */
export function resolveFacetConfig(config: FacetConfig | undefined): ResolvedFacetConfig {
  const c = config ?? {};
  const count = (n: unknown): number | undefined =>
    typeof n === "number" && Number.isFinite(n) && n >= 1 ? Math.floor(n) : undefined;
  return {
    columns: count(c.columns),
    rows: count(c.rows),
    padding: typeof c.padding === "number" && c.padding >= 0 ? c.padding : FACET_PADDING,
    sort: c.sort ?? "ascending",
    scales: c.scales === "shared" || c.scales === "independent" ? c.scales : undefined,
    axes: resolveFacetAxes(c.axes),
    title: c.title === false || typeof c.title === "function" ? c.title : undefined,
    titleConfig: {...FACET_TITLE_DEFAULTS, ...(c.titleConfig ?? {})},
  };
}

/** Whether `value` is an axes mode. */
const isAxesMode = (value: unknown): value is FacetAxesMode => value === "outer" || value === "all";

/** A `facetConfig.axes` value with invalid modes dropped (an object keeps its valid axes). */
export function resolveFacetAxes(value: unknown): FacetAxes | undefined {
  if (isAxesMode(value)) return value;
  if (!value || typeof value !== "object") return undefined;
  const {x, y} = value as Record<string, unknown>;
  const out: {x?: FacetAxesMode; y?: FacetAxesMode} = {};
  if (isAxesMode(x)) out.x = x;
  if (isAxesMode(y)) out.y = y;
  return out.x || out.y ? out : undefined;
}

/** `axis`'s mode in a `FacetAxes` value, if it sets one. */
function axisMode(value: FacetAxes | undefined, axis: "x" | "y"): FacetAxesMode | undefined {
  return typeof value === "object" ? value[axis] : value;
}

/**
    Which axes label only the grid's outer edges this draw, per axis:
    `facetConfig.axes`, else the chart's default, else `"outer"`, and only
    while panels share scales or the chart says the axis reads the same in
    every panel anyway (`FacetHooks.fixedAxes`).
*/
export function facetOuterAxes(
  viz: VizInstance,
  config: Pick<ResolvedFacetConfig, "axes">,
  hooks: Pick<FacetHooks, "axes" | "fixedAxes">,
  shared: boolean,
): {x: boolean; y: boolean} {
  const chart = typeof hooks.axes === "function" ? hooks.axes(viz) : hooks.axes;
  const fixed = hooks.fixedAxes ? hooks.fixedAxes(viz) : {};
  const outer = (axis: "x" | "y") =>
    (axisMode(config.axes, axis) ?? axisMode(chart, axis) ?? "outer") === "outer" && (shared || !!fixed[axis]);
  return {x: outer("x"), y: outer("y")};
}

/** Whether panels share scales: `facetConfig.scales`, else the chart's default, else shared. */
export function facetScalesShared(
  config: Pick<ResolvedFacetConfig, "scales">,
  hooks: Pick<FacetHooks, "scales">,
): boolean {
  return (config.scales ?? hooks.scales ?? "shared") === "shared";
}

/** Whether `viz` splits its data into small multiples this draw. */
export function facetActive(viz: Pick<VizInstance, "schema">): boolean {
  return typeof viz.schema.facet === "function";
}
