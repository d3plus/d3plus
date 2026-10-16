/**
    ParallelCoordinates brushes: one d3-brush strip over each axis, mounted in
    the chart's own <svg> (above the painted scene on SVG, an interactive
    overlay on Canvas). Dragging along an axis filters the lines to the rows
    inside the brush; every brush combines with AND. A brush's state lives in
    `viz.schema.brushes` (data values, not pixels), so it survives redraws and
    resizes, and on small multiples every panel's strip for the same
    dimension moves together. Brushing repaints the scene without a new
    layout (see `lineStates.ts`).
*/

import {brushX, brushY} from "d3-brush";
import type {BrushBehavior, D3BrushEvent} from "d3-brush";
import {select} from "d3-selection";
import type {Selection} from "d3-selection";

import type {VizInstance} from "../viz/vizTypes.js";

import {brushFromPixels, pixelsFromBrush} from "./brushFilter.js";
import type {BrushAxis, BrushRange, BrushSelection} from "./brushFilter.js";
import type {ParallelOrient} from "./paths.js";

/** The class Viz keeps above the painted scene (and interactive on Canvas). */
export const BRUSH_LAYER_CLASS = "d3plus-viz-brush";
const LAYER_CLASS = "d3plus-parallel-brushes";
const STRIP_CLASS = "d3plus-parallel-brush";

/** One axis's brush strip. */
export interface BrushTarget extends BrushAxis {
  /** Unique per panel and dimension. */
  id: string;
  /** The dimension's key. */
  key: string;
  title: string;
  orient: ParallelOrient;
  /** The strip, in surface pixels. */
  x: number;
  y: number;
  width: number;
  height: number;
  /** The chart coordinate (along the axis) of the strip's start. */
  alongStart: number;
}

interface StripState {
  brush: BrushBehavior<BrushTarget>;
  target: BrushTarget;
  signature: string;
  active: boolean;
}

type Strip = Selection<SVGGElement, BrushTarget, null, undefined>;

const states = new WeakMap<SVGGElement, StripState>();

/** The strip's length along its axis. */
export function stripLength(t: Pick<BrushTarget, "orient" | "width" | "height">): number {
  return t.orient === "horizontal" ? t.height : t.width;
}

/** The brush's pixel selection (strip-local) for a filter, or null when it draws nothing. */
export function stripSelection(range: BrushRange | undefined, t: BrushTarget): [number, number] | null {
  if (!range) return null;
  const px = pixelsFromBrush(range, t);
  if (!px) return null;
  const length = stripLength(t);
  const a = Math.max(0, Math.min(length, px[0] - t.alongStart));
  const b = Math.max(0, Math.min(length, px[1] - t.alongStart));
  return b > a ? [a, b] : null;
}

/** Styles a strip's selection rect. `selectAll` (not `select`) keeps d3-brush's own data on its rects. */
function styleStrip(g: Strip, style: Record<string, unknown>, label: string): void {
  const sel = g.selectAll<SVGRectElement, unknown>("rect.selection");
  const attrs: [string, unknown][] = [
    ["fill", style.fill],
    ["fill-opacity", style.fillOpacity],
    ["stroke", style.stroke],
    ["stroke-width", style.strokeWidth],
  ];
  for (const [name, value] of attrs) {
    if (value !== undefined && value !== null) sel.attr(name, `${value}`);
  }
  g.selectAll("rect.overlay").attr("aria-label", label);
}

function onBrush(viz: VizInstance, el: SVGGElement, event: D3BrushEvent<BrushTarget>): void {
  const state = states.get(el);
  if (!state || !event.sourceEvent) return;
  const t = state.target;
  state.active = event.type !== "end";
  const sel = event.selection as [number, number] | null;
  const range = sel ? brushFromPixels([sel[0] + t.alongStart, sel[1] + t.alongStart], t) : null;
  const next: BrushSelection = {...((viz.schema.brushes ?? {}) as BrushSelection)};
  if (range) next[t.key] = range;
  else delete next[t.key];
  viz.schema.brushes = next;

  const layer = el.parentNode;
  if (layer) {
    select(layer as SVGGElement)
      .selectAll<SVGGElement, BrushTarget>(`g.${STRIP_CLASS}`)
      .each(function(o) {
        const other = states.get(this);
        const snap = this === el && event.type === "end" && t.type === "categorical";
        if (!other || o.key !== t.key || (this === el && !snap)) return;
        select<SVGGElement, BrushTarget>(this).call(other.brush.move, stripSelection(range ?? undefined, other.target));
      });
  }
  const handler = viz.schema.on?.brush as ((b: BrushSelection) => void) | undefined;
  if (typeof handler === "function") handler.call(viz, next);
  viz._scheduleSceneRepaint();
}

/**
    Mounts, moves, and removes the brush strips to match `targets`, and draws
    each strip's selection from `viz.schema.brushes`. A strip mid-drag is
    left alone.
*/
export function syncBrushDom(viz: VizInstance, targets: BrushTarget[], style: Record<string, unknown>): void {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  if (!node || typeof (node as Element).querySelector !== "function") return;
  const enabled = viz.schema.brushing !== false && !viz._ssr && targets.length > 0;
  const layer = select(node as SVGSVGElement)
    .selectAll<SVGGElement, number>(`:scope > g.${LAYER_CLASS}`)
    .data(enabled ? [0] : []);
  layer.exit().remove();
  if (!enabled) return;
  const host = layer.enter().append("g").attr("class", `${BRUSH_LAYER_CLASS} ${LAYER_CLASS}`).merge(layer);
  const unique = Array.from(new Map(targets.map(t => [t.id, t])).values());
  const strips = host
    .selectAll<SVGGElement, BrushTarget>(`g.${STRIP_CLASS}`)
    .data(unique, d => d.id);
  strips.exit().remove();
  const brushes = (viz.schema.brushes ?? {}) as BrushSelection;
  const translate = (s: unknown) => viz.schema.translate(s as string) as string;
  strips.enter().append("g").attr("class", STRIP_CLASS).merge(strips).each(function(t) {
    const g: Strip = select<SVGGElement, BrushTarget>(this);
    let state = states.get(this);
    if (!state) {
      const brush = (t.orient === "horizontal" ? brushY<BrushTarget>() : brushX<BrushTarget>());
      state = {brush, target: t, signature: "", active: false};
      states.set(this, state);
      const el = this;
      brush.on("start brush end", (event: D3BrushEvent<BrushTarget>) => onBrush(viz, el, event));
    }
    state.target = t;
    g.attr("transform", `translate(${t.x},${t.y})`);
    if (state.active) return;
    const signature = `${t.width}x${t.height}`;
    if (state.signature !== signature) {
      state.brush.extent([[0, 0], [t.width, t.height]]);
      g.call(state.brush);
      state.signature = signature;
    }
    styleStrip(g, style, `${t.title}: ${translate("Drag to Filter")}`);
    g.call(state.brush.move, stripSelection(brushes[t.key], t));
  });
}
