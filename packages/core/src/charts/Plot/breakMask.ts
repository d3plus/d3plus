/**
    Masks for axis breaks (#767): shapes that cross a break on a Plot's x or y
    axis get a gap cut across them, lined up with the gap the break leaves in
    the axis line. The cut is a real clip — the plot content is wrapped in a
    group whose clip path covers everything except each break's gap band — so
    whatever sits behind the chart shows through on SVG and Canvas alike, in
    any theme. Across a bar the band slants to follow the break marks' angle
    (flattened just enough to stay clear of the break's edges);
    everywhere else it runs straight across the plot.
*/
import type {SceneNode} from "@d3plus/render";

import type Axis from "../../components/Axis/Axis.js";
import {breakGap, breakStyle} from "../../components/Axis/axisBreak.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A polygon as `[x, y]` points. */
type Polygon = [number, number][];

/** Key prefix of the groups `maskBreaks` wraps plot content in. */
export const BREAK_MASK_KEY = "plot-break-mask";

/** The plot rect, in shape coordinates. */
export interface MaskFrame {
  xRange: number[];
  yRange: number[];
  x2Height: number;
}

/** Signed area of a polygon (shoelace); the sign gives its winding. */
const area = (p: Polygon): number =>
  p.reduce((s, [x, y], i) => {
    const [nx, ny] = p[(i + 1) % p.length];
    return s + x * ny - nx * y;
  }, 0) / 2;

/** Serializes polygons into one path; holes wind against the outer ring. */
export function maskPath(outer: Polygon, holes: Polygon[]): string {
  const ring = (p: Polygon) => `M${p.map(([x, y]) => `${x},${y}`).join("L")}Z`;
  const sign = Math.sign(area(outer));
  return [outer, ...holes.map(h => (Math.sign(area(h)) === sign ? h.slice().reverse() : h))]
    .map(ring)
    .join("");
}

/**
    The cross-axis extents (`[from, to]`, merged where they overlap) of the
    bars in `nodes` — the columns a band slants across. `vertical` is true for
    a y-axis band, where columns span x.
*/
export function barColumns(nodes: SceneNode[], vertical: boolean): [number, number][] {
  const spans: [number, number][] = [];
  const walk = (list: SceneNode[], dx: number, dy: number) => {
    for (const n of list) {
      const t = n.transform || {x: 0, y: 0};
      const ox = dx + (t.x || 0);
      const oy = dy + (t.y || 0);
      if (n.type === "rect" && n.shapeType === "Bar") {
        // A pixel of slack keeps a bar's anti-aliased edge inside its column.
        spans.push(vertical ? [ox + n.x - 1, ox + n.x + n.width + 1] : [oy + n.y - 1, oy + n.y + n.height + 1]);
      }
      if (n.type === "group") walk(n.children, ox, oy);
    }
  };
  walk(nodes, 0, 0);
  spans.sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const s of spans) {
    const last = merged[merged.length - 1];
    if (last && s[0] < last[1]) last[1] = Math.max(last[1], s[1]);
    else merged.push([s[0], s[1]]);
  }
  return merged;
}

/**
    The gap bands, as polygons, for one axis's masked breaks: across each bar
    column the band slants by `slope` (pixels along the axis per pixel across
    it), and between columns it runs straight. `toXY` maps `(along, cross)`
    to `[x, y]`.
*/
export function bandPolygons(
  gap: [number, number],
  extent: [number, number],
  columns: [number, number][],
  slope: (width: number) => number,
  toXY: (along: number, cross: number) => [number, number],
): Polygon[] {
  const [g0, g1] = gap;
  const [c0, c1] = extent;
  const out: Polygon[] = [];
  const straight = (a: number, b: number) => {
    if (b > a) out.push([toXY(g0, a), toXY(g0, b), toXY(g1, b), toXY(g1, a)]);
  };
  let from = c0;
  columns.forEach(([a0, a1]) => {
    const a = Math.max(a0, c0);
    const b = Math.min(a1, c1);
    if (b <= a) return;
    straight(from, a);
    const k = slope(b - a);
    const mid = (a + b) / 2;
    const off = (c: number) => k * (c - mid);
    out.push([toXY(g0 + off(a), a), toXY(g0 + off(b), b), toXY(g1 + off(b), b), toXY(g1 + off(a), a)]);
    from = b;
  });
  straight(from, c1);
  return out;
}

/** The masked-gap holes for one of the plot's primary axes. */
function axisHoles(viz: VizInstance, which: "x" | "y", nodes: SceneNode[], frame: MaskFrame): Polygon[] {
  const axis = viz[`_${which}Axis`] as Axis | undefined;
  const breaks = (axis?._breaks || []).filter(b => b.mask);
  if (!axis || !breaks.length) return [];
  const vertical = which === "y";
  const shift = vertical ? frame.x2Height : 0;
  const extent = (vertical ? frame.xRange : frame.yRange.map(r => r - frame.x2Height)).slice(0, 2) as [number, number];
  extent.sort((a, b) => a - b);
  const valueAxis = (viz.schema.discrete === "y" ? "x" : "y") === which;
  const columns = valueAxis ? barColumns(nodes, vertical) : [];
  const inward = ["top", "left"].includes(axis.schema.orient) ? 1 : -1;
  const toXY = (along: number, cross: number): [number, number] => (vertical ? [cross, along] : [along, cross]);
  return breaks.flatMap(brk => {
    const style = breakStyle(axis, brk.baseline ? "baselineBreakConfig" : "breakConfig");
    const gap = breakGap(axis, brk).map(g => g - shift) as [number, number];
    const dir = Math.sign(brk.endPosition - brk.startPosition);
    const tan = Math.tan((style.angle * Math.PI) / 180);
    // Keep the slanted band within the middle of the break's own stretch of
    // axis, clear of the gridlines at its edges.
    const slope = (width: number) => dir * inward * Math.min(tan, Math.max(0, style.space - style.gap) / 2 / width);
    return bandPolygons(gap, extent, columns, slope, toXY);
  });
}

/**
    Wraps `nodes` (the plot content) in a clip group per axis with masked
    breaks, so every shape gets the break's gap cut across it. Returns
    `nodes` unchanged when no break asks for a mask.
*/
export function maskBreaks(viz: VizInstance, nodes: SceneNode[], frame: MaskFrame): SceneNode[] {
  const outer: Polygon = [[-1e6, -1e6], [1e6, -1e6], [1e6, 1e6], [-1e6, 1e6]];
  let content = nodes;
  for (const which of ["y", "x"] as const) {
    const holes = axisHoles(viz, which, nodes, frame);
    if (!holes.length) continue;
    content = [{
      type: "group",
      key: `${BREAK_MASK_KEY}-${which}`,
      clip: {type: "path", d: maskPath(outer, holes)},
      children: content,
    }];
  }
  return content;
}

/** The plot content inside any break-mask groups. */
export function unwrapBreakMasks(nodes: SceneNode[]): SceneNode[] {
  let list = nodes;
  while (list.length === 1 && list[0].type === "group" && String(list[0].key).startsWith(BREAK_MASK_KEY))
    list = list[0].children;
  return list;
}
