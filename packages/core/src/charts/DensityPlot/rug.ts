/**
    DensityPlot's `rug`: one short tick per observation, hanging just below
    the value axis in its group's color, clear of the curves. The value
    axis's labels move down to make room (see `rugTickSize`). The ticks paint
    with the axes, outside the plot's clip, and are inert.
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

/** The space between the value axis line and the rug's ticks, in pixels. */
const RUG_GAP = 2;

/** The rug's settings, with their defaults filled in. */
export function rugSettings(config: RugConfig = {}): Required<RugConfig> {
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return {
    size: Math.max(0, num(config.size, 8)),
    strokeWidth: num(config.strokeWidth, 1),
    opacity: num(config.opacity, 0.7),
  };
}

/**
    The value axis's `tickSize` that leaves its labels clear of the rug: the
    ticks' length, their gap from the axis line, and a little room below.
    @param config The `rugConfig`.
*/
export function rugTickSize(config: RugConfig = {}): number {
  return rugSettings(config).size + RUG_GAP + 3;
}

/**
    The segment of each observation's tick, hanging from just below the axis
    line at `base`; observations outside `range` (zoomed out of view) get
    none.
    @param values The observations.
    @param x Maps a value to pixels.
    @param base The value axis line's pixel position.
    @param size The ticks' length.
    @param range The `[min, max]` pixels the plot spans along the axis.
*/
export function rugSegments(
  values: number[],
  x: (v: number) => number,
  base: number,
  size: number,
  range: [number, number] = [-Infinity, Infinity],
): [number, number][][] {
  const [lo, hi] = [Math.min(...range), Math.max(...range)];
  return values
    .map(v => x(v))
    .filter(px => Number.isFinite(px) && px >= lo - 0.5 && px <= hi + 0.5)
    .map(px => [
      [px, base + RUG_GAP],
      [px, base + RUG_GAP + size],
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
    The rug's scene node for the drawn curve points: a group, painted with the
    axes (`interactionGroup: "axis"`), holding a tick per observation of each
    group, hanging below the value axis and colored like the group's curve.
    @param ctx The Area emit context.
    @param areas The drawn areas, for their colors.
*/
export function rugNodes(
  ctx: ShapeEmitContext,
  areas: SceneNode[],
): SceneNode[] {
  const {viz, x} = ctx;
  const {size, strokeWidth, opacity} = rugSettings(
    viz.schema.rugConfig as RugConfig,
  );
  const base = Math.max(...ctx.yRange.map(Number)) - (ctx.x2Height ?? 0);
  const range = [Number(ctx.xRange[0]), Number(ctx.xRange[1])] as [
    number,
    number,
  ];
  const colors = areaColors(areas);
  const children: SceneNode[] = [];
  rugGroups(ctx.values).forEach(({values, datum}, id) => {
    rugSegments(values, v => x(v), base, size, range).forEach((points, k) =>
      children.push({
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
  if (!children.length) return [];
  return [
    {
      type: "group",
      key: "density-rug",
      interactionGroup: "axis",
      interactive: false,
      aria: {hidden: true},
      children,
    } as SceneNode,
  ];
}

/** DensityPlot's Area emitter: the curves, then their rug when `rug` is on. */
export const densityAreaEmit: ShapeEmitter = (ctx, key) => {
  const areas = genericEmit(ctx, key);
  return ctx.viz.schema.rug ? [...areas, ...rugNodes(ctx, areas)] : areas;
};
