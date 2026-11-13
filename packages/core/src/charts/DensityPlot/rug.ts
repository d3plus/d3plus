/**
    DensityPlot's `rug`: one short tick per observation along the value axis,
    rising from the baseline in its group's color, drawn over the curves. The
    ticks are inert, so hovering them still reads the curves beneath.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  genericEmit,
  type ShapeEmitContext,
  type ShapeEmitter,
} from "../features/shapeEmit.js";
import type {DensitySummary} from "../helpers/densityData.js";
import {densityPointMeta} from "./densityPoint.js";

/** The `rugConfig` settings. */
export interface RugConfig {
  /** Each tick's length, in pixels. */
  size?: number;
  /** Each tick's stroke width, in pixels. */
  strokeWidth?: number;
  /** Each tick's opacity. */
  opacity?: number;
}

/**
    Each group's observations, by series id, from the curve points drawn: one
    entry per group (its points share one summary), with a point to stand for
    the group.
    @param rows The drawn curve points.
*/
export function rugGroups(
  rows: DataPoint[],
): Map<string, {values: number[]; datum: DataPoint}> {
  const groups = new Map<string, {values: number[]; datum: DataPoint}>();
  const seen = new Set<DensitySummary>();
  rows.forEach(d => {
    const summary = densityPointMeta(d)?.summary;
    if (!summary || seen.has(summary)) return;
    seen.add(summary);
    const id = `${(d as {id?: unknown}).id}`;
    const group = groups.get(id);
    if (group) group.values.push(...summary.values);
    else groups.set(id, {values: summary.values.slice(), datum: d});
  });
  return groups;
}

/**
    The `[x, top]`–`[x, base]` segment of each observation's tick.
    @param values The observations.
    @param x Maps a value to pixels.
    @param base The baseline's pixel position.
    @param size The ticks' length.
*/
export function rugSegments(
  values: number[],
  x: (v: number) => number,
  base: number,
  size: number,
): [number, number][][] {
  return values
    .map(v => x(v))
    .filter(px => Number.isFinite(px))
    .map(px => [
      [px, base],
      [px, base - size],
    ]);
}

/** Each series' color, read off its drawn areas' strokes (or fills). */
function areaColors(nodes: SceneNode[]): Map<string, string> {
  const colors = new Map<string, string>();
  const visit = (node: SceneNode) => {
    if (node.type === "group") node.children.forEach(visit);
    const datum = node.datum as {id?: unknown; key?: unknown} | undefined;
    const paint = (node.paint ?? {}) as {stroke?: unknown; fill?: unknown};
    const color = [paint.stroke, paint.fill].find(
      c => typeof c === "string" && c !== "none" && c !== "transparent",
    );
    const id = datum?.id ?? datum?.key;
    if ((node as {shapeType?: string}).shapeType !== "Area") return;
    if (id !== undefined && typeof color === "string" && !colors.has(`${id}`))
      colors.set(`${id}`, color);
  };
  nodes.forEach(visit);
  return colors;
}

/**
    The rug's scene nodes for the drawn curve points: a tick per observation
    of each group, from the value axis's baseline up, colored like the
    group's curve.
    @param ctx The Area emit context.
    @param areas The drawn areas, for their colors.
*/
export function rugNodes(
  ctx: ShapeEmitContext,
  areas: SceneNode[],
): SceneNode[] {
  const {viz, x, y} = ctx;
  const config = (viz.schema.rugConfig ?? {}) as RugConfig;
  const size = Number.isFinite(config.size) ? Number(config.size) : 8;
  const strokeWidth = Number.isFinite(config.strokeWidth)
    ? Number(config.strokeWidth)
    : 1;
  const opacity = Number.isFinite(config.opacity)
    ? Number(config.opacity)
    : 0.7;
  const base = y(0);
  const colors = areaColors(areas);
  const out: SceneNode[] = [];
  rugGroups(ctx.values).forEach(({values, datum}, id) => {
    rugSegments(values, v => x(v), base, size).forEach((points, k) =>
      out.push({
        type: "line",
        key: `rug-${id}-${k}`,
        points,
        datum,
        interactive: false,
        aria: {hidden: true},
        paint: {
          stroke: colors.get(id) ?? "#888",
          strokeWidth,
          opacity,
        },
      } as SceneNode),
    );
  });
  return out;
}

/** DensityPlot's Area emitter: the curves, then their rug when `rug` is on. */
export const densityAreaEmit: ShapeEmitter = (ctx, key) => {
  const areas = genericEmit(ctx, key);
  return ctx.viz.schema.rug ? [...areas, ...rugNodes(ctx, areas)] : areas;
};
