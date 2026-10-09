/**
    Shared multi-series tooltip + crosshair for Plot charts (#779): while the
    pointer is over the plot area, snap to the nearest discrete-axis position
    and list every series' value there in one tooltip, with a guide line drawn
    through that position.
*/
import type {DataPoint} from "@d3plus/data";
import type {InteractionPoint, SceneEvent, SceneNode} from "@d3plus/render";

import {nodeColor, ownerNode, visibleColor} from "../features/tooltipSwatch.js";
import {facetPanelAt} from "../facet/facetPanel.js";
import {linkAs} from "../viz/linkGroup.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {renderSharedTooltip, renderSingleTooltip, restoreTooltip} from "./sharedTooltip.js";
import type {TrendFit, TrendSample} from "./trendLines.js";
import {renderTrendTooltip} from "./trendTooltip.js";

/** One series' entry in the shared tooltip. */
export interface SharedRow {
  id: string;
  name: string;
  value: number;
  color?: string;
  /** The mark's shape type, which picks the row's swatch (dot vs. square). */
  shape?: string;
  datum: DataPoint;
  index: number;
  /** A trend line's projected value, not a plotted one: its band bounds, when drawn. */
  projected?: {lci?: number; hci?: number};
}

/**
    The resolved shared hover: the snapped discrete position (pixel + data
    value) and its rows. `stack` holds the column's stacked-bar rows
    (highlighted together) and every stacked-bar row in the chart, when the
    column has bars; `markers` the column's Line points; `layer` puts the
    crosshair in front of the marks when the chart has areas, else behind.
*/
export interface SharedHover {
  /** "shared": every series at the column; "single": one hovered mark. */
  mode: "shared" | "single";
  axis: "x" | "y";
  px: number;
  value: unknown;
  rows: SharedRow[];
  markers: {datum: DataPoint; x: number; y: number}[];
  layer: "back" | "front";
  stack?: {rows: Set<DataPoint>; bars: Set<DataPoint>};
}

export type ShapeNode = SceneNode & {
  shapeType?: string;
  interactionGroup?: string;
  interactionPoints?: InteractionPoint[];
  interactive?: boolean;
  datum?: DataPoint;
  paint?: {stroke?: unknown; fill?: unknown};
  children?: SceneNode[];
};

type Wrapped = DataPoint & {data?: DataPoint; i?: number; id?: unknown};

/**
    Converts a surface-local pointer position into chart content space: undoes
    the `viz-zoom` group's `_zoomTransform`, then the `viz-chart-body` group's
    `_chartTransform`.
*/
export function contentPoint(viz: VizInstance, point: [number, number]): [number, number] {
  const t = viz._zoomTransform;
  const scale = t && t.scale ? t.scale : 1;
  const c = viz._chartTransform;
  return [
    (point[0] - (t?.x ?? 0)) / scale - (c?.x ?? 0),
    (point[1] - (t?.y ?? 0)) / scale - (c?.y ?? 0),
  ];
}


const discreteKey = (v: unknown): string =>
  v instanceof Date ? String(v.getTime()) : String(v);

/** A column's entry for one series, or for a trend line's projected value (`trend`). */
interface Member {
  wrapped: Wrapped;
  color?: string;
  shape?: string;
  trend?: {fit: TrendFit; sample: TrendSample};
}

interface Column {
  px: number;
  value: unknown;
  members: Map<string, Member>;
  bars: Set<DataPoint>;
  markers: {datum: DataPoint; x: number; y: number}[];
}

/** Collection-wide facts gathered alongside the columns. */
interface Collected {
  bars: Set<DataPoint>;
  area: boolean;
  box: boolean;
}

/**
    Whether a scene node is a data mark the shared tooltip reads: Line/Area
    series and other single marks, but Bars only when stacked (side-by-side
    bars keep the single-bar tooltip).
*/
export function sharedMark(viz: VizInstance, node: ShapeNode): boolean {
  if (!node.shapeType || !node.datum || node.shapeType === "Box") return false;
  return node.shapeType !== "Bar" || !!viz.schema.stacked;
}

/** Whether the chart scene holds any mark the shared tooltip reads. */
export function hasSharedMarks(viz: VizInstance): boolean {
  const walk = (node: ShapeNode): boolean => {
    if (node.interactionGroup || node.interactive === false) return false;
    if (sharedMark(viz, node)) return true;
    return !!node.children && node.children.some(child => walk(child as ShapeNode));
  };
  return (viz._chartScene || []).some(node => walk(node as ShapeNode));
}

/**
    Gathers every chart mark by discrete-axis value. Multi-point shapes
    (Line/Area) contribute each of their `interactionPoints`; single marks
    (stacked Bar/Circle/Rect) contribute their datum, positioned at the discrete
    value's axis position. Axis chrome, legend swatches, and inert nodes
    (annotations) are skipped. `found` collects every stacked-bar row and
    whether any Area is present.
*/
function collectColumns(
  viz: VizInstance,
  axis: "x" | "y",
  found: Collected,
): Map<string, Column> {
  const columns = new Map<string, Column>();
  const position = axis === "x" ? viz._xFunc : viz._yFunc;
  const add = (wrapped: Wrapped, px: number, color?: string, shape?: string): Column | null => {
    if (!wrapped || !Number.isFinite(px)) return null;
    const key = discreteKey(wrapped[axis]);
    let column = columns.get(key);
    if (!column) {
      column = {px, value: wrapped[axis], members: new Map(), bars: new Set(), markers: []};
      columns.set(key, column);
    }
    if (shape === "Bar") {
      const row = (wrapped.data || wrapped) as DataPoint;
      column.bars.add(row);
      found.bars.add(row);
    }
    const id = String(wrapped.id);
    const member = column.members.get(id);
    if (!member) column.members.set(id, {wrapped, color, shape});
    else if (!member.color) member.color = color;
    return column;
  };
  // A Line's hit-area and visible path share points; mark each point once.
  const marked = new Set<DataPoint>();
  const walk = (node: ShapeNode): void => {
    if (node.interactionGroup || node.interactive === false) return;
    if (node.children) node.children.forEach(child => walk(child as ShapeNode));
    if (node.shapeType === "Box") found.box = true;
    if (!sharedMark(viz, node)) return;
    const paint = node.paint || {};
    const color = visibleColor(paint.stroke) ?? visibleColor(paint.fill);
    if (node.shapeType === "Area") found.area = true;
    if (node.interactionPoints) {
      for (const p of node.interactionPoints) {
        const column = add(p.datum as Wrapped, p[axis], color, node.shapeType);
        if (column && node.shapeType === "Line" && !marked.has(p.datum)) {
          marked.add(p.datum);
          column.markers.push({datum: p.datum, x: p.x, y: p.y});
        }
      }
    }
    else if (position && !(node.datum as {__d3plusShape__?: boolean}).__d3plusShape__) {
      const wrapped = node.datum as Wrapped;
      add(wrapped, position(wrapped[axis] as DataPoint), color, node.shapeType);
    }
  };
  (viz._chartScene || []).forEach(node => walk(node as ShapeNode));
  if (position) addProjectedColumns(viz, axis, columns, position);
  return columns;
}

/**
    Adds each trend line's projected steps (see `trendLineConfig.projection`)
    as column members, so the crosshair snaps onto future positions and lists
    every series' projected value there.
*/
function addProjectedColumns(
  viz: VizInstance,
  axis: "x" | "y",
  columns: Map<string, Column>,
  position: (d: DataPoint) => number,
): void {
  for (const fit of viz._trendFits || []) {
    if (fit.axis !== axis || viz._trendLineConfig?.tooltip === false) continue;
    for (const sample of fit.samples) {
      if (!sample.step) continue;
      const value = sample[axis];
      const px = position(value as DataPoint);
      if (!Number.isFinite(px)) continue;
      const key = discreteKey(value);
      let column = columns.get(key);
      if (!column) {
        column = {px, value, members: new Map(), bars: new Set(), markers: []};
        columns.set(key, column);
      }
      const wrapped = (fit.row || {}) as Wrapped;
      column.members.set(`${fit.id}::projected`, {wrapped, color: fit.color, shape: "Line", trend: {fit, sample}});
    }
  }
}

/** A row for one column member; null when its value isn't numeric or its tooltip is off. */
function memberRow(
  viz: VizInstance,
  axis: "x" | "y",
  id: string,
  member: Member,
): SharedRow | null {
  if (member.trend) {
    const {fit, sample} = member.trend;
    const value = Number(sample[axis === "x" ? "y" : "x"]);
    if (!Number.isFinite(value)) return null;
    const name = String(fit.label);
    const datum = (fit.row || {}) as DataPoint;
    return {id, name, value, color: member.color, shape: "Line", datum, index: 0, projected: {lci: sample.lci, hci: sample.hci}};
  }
  const valueOf = axis === "x" ? viz._y : viz._x;
  const datum = (member.wrapped.data || member.wrapped) as DataPoint;
  const index = typeof member.wrapped.i === "number" ? member.wrapped.i : 0;
  const value = valueOf ? Number(valueOf(datum, index)) : NaN;
  if (!Number.isFinite(value) || !viz.schema.tooltip(datum, index)) return null;
  const name = String(viz._drawLabel(datum, index));
  return {id, name, value, color: member.color, shape: member.shape, datum, index};
}

/** The column nearest a discrete-axis pixel, optionally only those holding `id`. */
function nearestColumn(columns: Map<string, Column>, target: number, id?: string): Column | null {
  let best: Column | null = null;
  for (const column of columns.values()) {
    if (id !== undefined && !column.members.has(id)) continue;
    if (!best || Math.abs(column.px - target) < Math.abs(best.px - target)) best = column;
  }
  return best;
}

/** A scene node's center along the discrete axis (a side-by-side bar's own center). */
function nodeCenter(node: ShapeNode, axis: "x" | "y"): number {
  const n = node as ShapeNode & {x?: number; y?: number; width?: number; height?: number; cx?: number; cy?: number; transform?: {x?: number; y?: number}};
  const offset = n.transform?.[axis] ?? 0;
  if (n.type === "rect") return offset + (n[axis] ?? 0) + ((axis === "x" ? n.width : n.height) ?? 0) / 2;
  if (n.type === "circle") return offset + ((axis === "x" ? n.cx : n.cy) ?? 0);
  return NaN;
}

/** Whether a picked node is a chart data mark (not chrome, a legend swatch, or inert). */
const isMark = (node?: ShapeNode): node is ShapeNode =>
  !!node && !!node.shapeType && !!node.datum && !node.interactionGroup && node.interactive !== false;

/**
    Resolves the snapped hover for an event. Inside the plot area with
    `tooltipShared` on, the column nearest the cursor lists every series there
    ("shared", needs two or more). Otherwise a hovered mark — or the lone
    series of a single-series column — gets a "single" hover: the mark's own
    point (a Line/Area's point nearest the cursor) or center. Charts with no
    discrete axis, and BoxWhisker, resolve nothing (the default tooltip applies).
*/
function resolveHover(
  viz: VizInstance,
  event: SceneEvent,
  cursor: [number, number],
  inside: boolean,
): SharedHover | null {
  const discrete = viz.schema.discrete;
  if (discrete !== "x" && discrete !== "y") return null;
  const axis: "x" | "y" = discrete;
  const target = axis === "x" ? cursor[0] : cursor[1];
  const found: Collected = {bars: new Set(), area: false, box: false};
  const columns = collectColumns(viz, axis, found);
  if (found.box) return null;
  const layer = found.area ? "front" : "back";
  const pick = event.pick ? (event.pick.node as ShapeNode) : undefined;
  const onMark = isMark(pick) && pick.shapeType !== "Box";
  const single = (column: Column | null, id: string, px: number, wrapped?: Wrapped): SharedHover | null => {
    const member = column?.members.get(id)
      ?? (wrapped ? {wrapped, color: nodeColor(viz, pick), shape: pick?.shapeType} : undefined);
    const row = member ? memberRow(viz, axis, id, member) : null;
    if (!row || !Number.isFinite(px)) return null;
    const markers = column ? column.markers.filter(m => String(m.datum.id) === id) : [];
    const value = column ? column.value : member!.wrapped[axis];
    return {mode: "single", axis, px, value, rows: [row], markers, layer};
  };
  if (inside && viz.schema.tooltipShared) {
    const best = nearestColumn(columns, target);
    if (best) {
      const rows: SharedRow[] = [];
      best.members.forEach((member, id) => {
        const row = memberRow(viz, axis, id, member);
        if (row) rows.push(row);
      });
      if (rows.length >= 2 || rows.some(r => r.projected)) {
        sortRows(viz, axis, rows);
        const stack = best.bars.size ? {rows: best.bars, bars: found.bars} : undefined;
        return {mode: "shared", axis, px: best.px, value: best.value, rows, markers: best.markers, layer, stack};
      }
      if (rows.length === 1 && !onMark) return single(best, rows[0].id, best.px);
    }
  }
  if (!onMark) return null;
  const wrapped = pick.datum as Wrapped;
  const id = String(wrapped.id);
  if (pick.interactionPoints) {
    const column = nearestColumn(columns, target, id);
    return column ? single(column, id, column.px) : null;
  }
  // A bar's error bar snaps to the bar's own center.
  return single(null, id, nodeCenter(ownerNode(viz, pick) ?? pick, axis), wrapped);
}

/**
    Orders rows as they sit on the continuous axis (top/right first), so an
    inverted axis (BumpChart ranks) reads in visual order too.
*/
function sortRows(viz: VizInstance, axis: "x" | "y", rows: SharedRow[]): void {
  const along = axis === "x" ? viz._yFunc : viz._xFunc;
  const rank = (v: number): number => {
    const p = along ? along(v as unknown as DataPoint) : NaN;
    if (!Number.isFinite(p)) return -v;
    return axis === "x" ? p : -p;
  };
  rows.sort((a, b) => rank(a.value) - rank(b.value));
}

/**
    Plot's `_sharedHover`: snaps the tooltip to the hovered discrete position
    (see `resolveHover`), hiding its arrow and drawing a crosshair through it —
    one tooltip for every series ("shared"), or the hovered mark's x/y values
    ("single"). Replaces the default shape tooltip while active; clears on
    leaving the plot area (or the mark) or the chart.
*/
export function handleSharedHover(viz: VizInstance, event: SceneEvent): void {
  let hover: SharedHover | null = null;
  const area = viz._plotArea;
  // The renderer fires "mouseenter" before the move onto a mark; resolving it
  // there too means the shared hover is active before the default enter
  // handler would dim the other series.
  if (event.type === "mousemove" || event.type === "mouseenter") {
    // Repainting mid-transition would snap it to its end (see `_routeSceneEvent`).
    if (viz._transitionEndsAt && Date.now() < viz._transitionEndsAt) return;
    const pick = event.pick && (event.pick.node as {interactionGroup?: string; trendFit?: TrendFit});
    if (pick && pick.trendFit) {
      handleTrendHover(viz, pick.trendFit, event);
      return;
    }
    if (area && Array.isArray(event.point) && !(pick && pick.interactionGroup === "legend")) {
      const [cx, cy] = contentPoint(viz, event.point);
      const inside =
        cx >= area.x && cx <= area.x + area.width && cy >= area.y && cy <= area.y + area.height;
      hover = resolveHover(viz, event, [cx, cy], inside);
    }
  }
  // Only leaving the whole surface clears; a node-to-node hand-off also
  // dispatches "mouseleave" (from a native mousemove) and is followed by a move.
  else if (event.type !== "mouseleave" || (event.nativeEvent && event.nativeEvent.type !== "mouseleave")) return;
  const prev = viz._sharedHoverState;
  if (hover) {
    viz._sharedHoverActive = true;
    const {mode, axis, px, value, markers, layer} = hover;
    const panel = facetPanelAt(viz, event.point)?.key;
    viz._sharedHoverState = {mode, axis, px, value, markers, layer, panel};
    if (mode === "shared") renderSharedTooltip(viz, hover, event);
    else renderSingleTooltip(viz, hover, event);
    if (!prev || prev.px !== px || prev.mode !== mode || prev.panel !== panel) {
      sharedHighlight(viz, hover, prev?.mode);
      viz._scheduleSceneRepaint();
    }
  }
  else if (viz._sharedHoverActive) {
    viz._sharedHoverActive = false;
    viz._sharedHoverState = null;
    viz._tooltipClass!.data([]).render();
    restoreTooltip(viz);
    if (typeof viz._hover === "function") viz.hover!(false);
    viz._scheduleSceneRepaint();
  }
}

/**
    Hovering a trend line: its own tooltip replaces any snapped hover, and the
    crosshair clears. The leave path in `handleSharedHover` tears it down.
*/
function handleTrendHover(viz: VizInstance, trend: TrendFit, event: SceneEvent): void {
  const prev = viz._sharedHoverState;
  viz._sharedHoverActive = true;
  viz._sharedHoverState = null;
  const cursor = Array.isArray(event.point) ? contentPoint(viz, event.point) : undefined;
  renderTrendTooltip(viz, trend, event, cursor);
  if (prev) {
    if (prev.mode === "shared" && typeof viz._hover === "function") viz.hover!(false);
    viz._scheduleSceneRepaint();
  }
}

/**
    Hover emphasis: a shared stacked-bar column highlights its whole stack
    (other stacks dim; non-bar marks and legend swatches stay put), and a
    shared Line/Area column dims nothing. A single hover leaves emphasis to
    the default enter/leave handlers, clearing only a shared highlight.
*/
function sharedHighlight(viz: VizInstance, hover: SharedHover, prevMode?: string): void {
  const stack = hover.stack;
  const clear = (): void => {
    if (typeof viz._hover === "function") viz.hover!(false);
  };
  if (hover.mode === "single") {
    if (prevMode === "shared") clear();
  }
  else if (stack) {
    // Non-bar marks stay bright in the column hover, but only the stack's
    // own rows are what linked charts should match.
    linkAs(viz, (d: DataPoint) => stack.rows.has(d));
    viz.hover!((d: DataPoint) => stack.rows.has(d) || !stack.bars.has(d));
  }
  else clear();
}
