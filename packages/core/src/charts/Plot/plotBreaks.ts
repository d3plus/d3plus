/**
    A Plot's side of axis breaks (#766, #767): the two break lines that run
    across the plot from each break's marks, and the mask that cuts the
    break's gap across the shapes.

    Each break on the x or y axis leaves a small gap in the axis line, marked
    by two short tilted marks. From the foot of each mark a straight line runs
    across the whole plot, perpendicular to that axis, so every break reads as
    two parallel lines with the gap between them. With a mask, the plot
    content is wrapped in a group whose clip path covers everything except
    that gap — a real clip, so whatever sits behind the chart shows through
    on SVG and Canvas alike, in any theme.
*/
import type {LineNode, Paint, SceneNode} from "@d3plus/render";

import type Axis from "../../components/Axis/Axis.js";
import type {AxisBreak} from "../../components/Axis/axisBreak.js";
import {breakGap, breakStyle} from "../../components/Axis/axisBreak.js";
import {configToPaint} from "../../components/Axis/axisRender.js";
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

/** One of a plot's breaks, placed in shape coordinates. */
interface PlacedBreak {
  axis: Axis;
  brk: AxisBreak;
  vertical: boolean;
  /** The gap's edges along the axis, ascending. */
  gap: [number, number];
  /** The plot's extent across the axis, ascending. */
  extent: [number, number];
}

/** Every break on the plot's primary x and y axes, in shape coordinates. */
function placedBreaks(viz: VizInstance, frame: MaskFrame): PlacedBreak[] {
  return (["y", "x"] as const).flatMap(which => {
    const axis = viz[`_${which}Axis`] as Axis | undefined;
    if (!axis || !axis._breaks || !axis._breaks.length) return [];
    const vertical = which === "y";
    const shift = vertical ? frame.x2Height : 0;
    const extent = (vertical ? frame.xRange : frame.yRange.map(r => r - frame.x2Height))
      .slice(0, 2)
      .sort((a, b) => a - b) as [number, number];
    return axis._breaks.map(brk => ({
      axis,
      brk,
      vertical,
      gap: breakGap(axis, brk).map(g => g - shift) as [number, number],
      extent,
    }));
  });
}

/** The config key that styles `brk`. */
const configKey = (brk: AxisBreak) => (brk.baseline ? "baselineBreakConfig" : "breakConfig");

/**
    The paint for a break's lines: the axis's own axis-line style
    (`barConfig`), with the break config's `lineConfig` on top, so the lines
    read as extensions of the axis line they break.
*/
export function breakLinePaint(axis: Axis, brk: AxisBreak): Paint {
  const bar = configToPaint(axis, axis.schema.barConfig as Record<string, unknown>);
  const cfg = (axis.schema[configKey(brk)] || {}) as Record<string, unknown>;
  const own = configToPaint(axis, (cfg.lineConfig || {}) as Record<string, unknown>);
  return {...bar, ...own};
}

/**
    The two break lines for every break on the plot's x and y axes whose
    config has `lines` on: straight lines from the foot of each break mark
    across the plot, perpendicular to the axis, styled like the axis line.
    They sit in the gridline layer, behind the shapes, and ignore the
    pointer.
*/
export function breakLineNodes(viz: VizInstance, frame: MaskFrame): SceneNode[] {
  return placedBreaks(viz, frame).flatMap(({axis, brk, vertical, gap, extent}, i) => {
    if (!breakStyle(axis, configKey(brk)).lines) return [];
    const paint = breakLinePaint(axis, brk);
    const prefix = `break-line-${vertical ? "y" : "x"}-${i}`;
    return gap.map(
      (g, j): LineNode => ({
        type: "line",
        key: `${prefix}-${j}`,
        points: vertical ? [[extent[0], g], [extent[1], g]] : [[g, extent[0]], [g, extent[1]]],
        paint,
        interactive: false,
        interactionGroup: "axis",
      }),
    );
  });
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
    The straight band a masked break cuts across the plot: the gap between
    its two break lines (inset by half a line's width, so the lines stay
    whole), spanning the plot perpendicular to the axis.
*/
export function bandPolygon(gap: [number, number], extent: [number, number], vertical: boolean, inset = 0): Polygon {
  const g0 = gap[0] + inset;
  const g1 = gap[1] - inset;
  const [c0, c1] = extent;
  return vertical
    ? [[c0, g0], [c1, g0], [c1, g1], [c0, g1]]
    : [[g0, c0], [g1, c0], [g1, c1], [g0, c1]];
}

/**
    Wraps `nodes` (the plot content) in a clip group per axis with masked
    breaks, so every shape gets each break's gap cut straight across it.
    Returns `nodes` unchanged when no break asks for a mask.
*/
export function maskBreaks(viz: VizInstance, nodes: SceneNode[], frame: MaskFrame): SceneNode[] {
  const outer: Polygon = [[-1e6, -1e6], [1e6, -1e6], [1e6, 1e6], [-1e6, 1e6]];
  const placed = placedBreaks(viz, frame);
  let content = nodes;
  for (const vertical of [true, false]) {
    const holes = placed
      .filter(p => p.vertical === vertical && p.brk.mask)
      .map(({axis, brk, gap, extent}) => {
        const style = breakStyle(axis, configKey(brk));
        const inset = style.lines ? (breakLinePaint(axis, brk).strokeWidth ?? 1) / 2 : 0;
        return bandPolygon(gap, extent, vertical, inset);
      });
    if (!holes.length) continue;
    content = [{
      type: "group",
      key: `${BREAK_MASK_KEY}-${vertical ? "y" : "x"}`,
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
