/**
    Bar hit areas: a transparent hover target behind each side-by-side bar
    that fills the bar's slot along the discrete axis and the whole plot along
    the value axis, so a short bar is as easy to hover and click as a tall
    one. Grouped bars each take their own column of the slot. A hovered
    bar's hit area shows as a band (`shapeConfig.Bar.hitAreaStyle`). Stacked
    bars, which fill their slot, take a band over it that the pointer passes
    through. `shapeConfig.Bar.hitArea: false` turns them off.

    @module
*/
import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import type {Shape} from "../../shapes/index.js";

/** Rect bounds in a bar's own coordinates (relative to its transform). */
export interface HitBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    A bar's column of its slot along the discrete axis, as offsets from the
    bar's own center. A lone bar takes the whole slot. Grouped bars split it
    at the midpoints between their centers, and the outermost reach the
    slot's edges, so no column overlaps a neighboring bar.
    @param step The slot's width: the distance between neighboring categories.
    @param count How many bars share the slot.
    @param index The bar's position in the slot.
    @param reach How far the outermost bars' centers sit from the slot's center.
*/
export function hitColumn(
  step: number,
  count: number,
  index: number,
  reach: number,
): [number, number] {
  const half = step / 2;
  if (count < 2) return [-half, half];
  const gap = (2 * reach) / (count - 1);
  const center = -reach + index * gap;
  const lo = index <= 0 ? -half : center - gap / 2;
  const hi = index >= count - 1 ? half : center + gap / 2;
  return [lo - center, hi - center];
}

/**
    A bar's hit rect in its own coordinates: its `column` along the discrete
    axis, and the plot's `valueExtent` along the value axis, both sides of
    the baseline.
    @param discrete The discrete axis.
    @param column The column, as offsets from the bar's center (see `hitColumn`).
    @param valueExtent The value axis's pixel span, in shape coordinates.
    @param origin The bar's transform.
*/
export function hitBounds(
  discrete: "x" | "y",
  column: [number, number],
  valueExtent: [number, number],
  origin: {x?: number; y?: number},
): HitBounds {
  const [lo, hi] = column;
  const [vlo, vhi] = valueExtent;
  return discrete === "x"
    ? {x: lo, y: vlo - (origin.y ?? 0), width: hi - lo, height: vhi - vlo}
    : {x: vlo - (origin.x ?? 0), y: lo, width: vhi - vlo, height: hi - lo};
}

/** How `applyBarHitArea` shows and targets the hit areas. */
export interface BarHitOptions {
  /** The band a hovered bar's hit area shows (`hitAreaStyle`). */
  band?: Paint;
  /** Whether the pointer passes through them: a band, but no target. */
  inert?: boolean;
}

/**
    The band a hovered bar's hit area shows by default: the theme's text
    color at 10% opacity.
    @param text The theme's text color.
*/
export function barHitBand(text: string): Paint {
  return {fill: text, fillOpacity: 0.1};
}

/**
    Gives a Bar shape its slot-filling hit areas (see `hitBounds`) and their
    hover band. Set before the user's `shapeConfig`, so `hitArea` there (or
    `false`) wins, and its `hitAreaStyle` merges over the band.
    @param s The Bar shape.
    @param discrete The discrete axis.
    @param valueExtent The value axis's pixel span, in shape coordinates.
    @param column Each bar's column (see `hitColumn`).
    @param options The band, and whether the pointer passes through.
*/
export function applyBarHitArea(
  s: Shape,
  discrete: "x" | "y",
  valueExtent: [number, number] | undefined,
  column: (d: DataPoint, i: number) => [number, number],
  {band, inert = false}: BarHitOptions = {},
): void {
  if (!valueExtent) return;
  s.config({
    hitArea: (d: DataPoint, i: number) => ({
      ...hitBounds(
        discrete,
        column(d, i),
        valueExtent,
        s._sceneTransform(d, i),
      ),
      ...(inert ? {interactive: false} : {}),
    }),
    ...(band ? {hitAreaStyle: band} : {}),
  });
}

/** A rect node's box in its parent's space. */
function boxOf(node: SceneNode & {type: "rect"}): HitBounds {
  const t = node.transform ?? {};
  return {
    x: (t.x ?? 0) + node.x,
    y: (t.y ?? 0) + node.y,
    width: node.width,
    height: node.height,
  };
}

/**
    The pointer targets in the empty part of each stacked column: its slot
    beyond either end of the stack, where a single bar's hit area would
    reach (a pixel or more of it). Each reaches the segment nearest it, the
    stack's outermost at that end, and draws nothing (the segments' own bands show the slot).
    Read off the stacked bars' slot-wide bands (inert `::hit` rects).
    @param nodes A stacked Bar shape's scene nodes.
    @param discrete The discrete axis.
*/
export function stackSlotTargets(
  nodes: SceneNode[],
  discrete: "x" | "y",
): SceneNode[] {
  const along = discrete === "x" ? "y" : "x";
  const size = along === "y" ? "height" : "width";
  const segments = new Map<string, HitBounds>();
  for (const n of nodes)
    if (n.type === "rect" && n.shapeType === "Bar" && !isBarHit(n))
      segments.set(String(n.key), boxOf(n));
  const columns = new Map<string, {band: SceneNode; seg: HitBounds}[]>();
  for (const band of nodes) {
    if (band.type !== "rect" || !isBarHit(band) || band.interactive !== false)
      continue;
    const seg = segments.get(String(band.key).replace(/::hit$/, ""));
    if (!seg) continue;
    const box = boxOf(band);
    const id = [box[discrete], box[discrete === "x" ? "width" : "height"]]
      .map(Math.round)
      .join();
    if (!columns.has(id)) columns.set(id, []);
    columns.get(id)!.push({band, seg});
  }
  const targets: SceneNode[] = [];
  for (const column of columns.values()) {
    const slot = boxOf(column[0].band as SceneNode & {type: "rect"});
    const start = (b: HitBounds) => Math.min(b[along], b[along] + b[size]);
    const end = (b: HitBounds) => Math.max(b[along], b[along] + b[size]);
    const first = column.reduce((a, b) =>
      start(b.seg) < start(a.seg) ? b : a,
    );
    const last = column.reduce((a, b) => (end(b.seg) > end(a.seg) ? b : a));
    const reaches: [string, (typeof column)[number], number, number][] = [
      ["start", first, start(slot), start(first.seg)],
      ["end", last, end(last.seg), end(slot)],
    ];
    for (const [side, {band}, lo, hi] of reaches) {
      // Less than a pixel is a stack's rounding, not an empty slot.
      if (hi - lo < 1) continue;
      const rect = band as SceneNode & {type: "rect"};
      const t = rect.transform ?? {};
      const offset = along === "y" ? (t.y ?? 0) : (t.x ?? 0);
      targets.push({
        type: "rect",
        key: `${String(rect.key).replace(/::hit$/, "")}::${side}::hit`,
        x: along === "y" ? rect.x : lo - offset,
        y: along === "y" ? lo - offset : rect.y,
        width: along === "y" ? rect.width : hi - lo,
        height: along === "y" ? hi - lo : rect.height,
        datum: rect.datum,
        index: rect.index,
        shapeType: "Bar",
        paint: {fill: "transparent"},
        transform: rect.transform,
        aria: {hidden: true},
      } as SceneNode);
    }
  }
  return targets.length ? [...nodes, ...targets] : nodes;
}

/** Whether a scene node is a Bar's hit area. */
const isBarHit = (node: SceneNode): boolean =>
  node.shapeType === "Bar" && String(node.key).endsWith("::hit");

/**
    `nodes` with every Bar hit area moved to the front (painted first), so
    each sits behind every mark: a bar's slot never covers another bar, nor
    the lines, points, and areas drawn over it.
*/
export function barHitsFirst(nodes: SceneNode[]): SceneNode[] {
  if (!nodes.some(isBarHit)) return nodes;
  return [...nodes.filter(isBarHit), ...nodes.filter(node => !isBarHit(node))];
}
