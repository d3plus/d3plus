/**
    A Plot's `fillBetween`: the area between two series' lines, filled in the
    color of whichever series is higher. Each pair draws the area twice, each
    copy clipped to one side of the first series' line, so the fill switches
    color exactly where the lines cross, following the lines' own curve.
*/
import {area as d3Area} from "d3-shape";

import type {DataPoint} from "@d3plus/data";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {curveFactory, lineCurve} from "./lineCurve.js";

/** The `fillBetween` setting: `true`, one `[a, b]` pair of series ids, or a list of pairs. */
export type FillBetweenSetting = boolean | unknown[];

/** One point shared by both series of a pair, in pixels. */
export interface BetweenPoint {
  /** Position along the discrete axis. */
  pos: number;
  /** The first series' value-axis position. */
  a: number;
  /** The second series' value-axis position. */
  b: number;
}

/** Key prefix of a fill-between group. */
export const FILL_BETWEEN_KEY = "fill-between";

/** How far past the plot a clip's open side reaches, in pixels. */
const CLIP_REACH = 1e5;

/** The `fillBetweenConfig` defaults. */
export function fillBetweenDefaults(): Record<string, unknown> {
  return {fillOpacity: 0.25};
}

/**
    The pairs of series to fill between: `true` pairs the first two series;
    `[a, b]` names one pair; a list of `[a, b]` pairs names several. Pairs
    naming a missing series, or the same series twice, are dropped.
    @param setting The `fillBetween` setting.
    @param ids The plotted series ids, in plotted order.
*/
export function fillBetweenPairs(
  setting: unknown,
  ids: string[],
): [string, string][] {
  let pairs: unknown[][] = [];
  if (setting === true) pairs = ids.length >= 2 ? [[ids[0], ids[1]]] : [];
  else if (Array.isArray(setting))
    pairs = setting.every(Array.isArray) ? (setting as unknown[][]) : [setting];
  const known = new Set(ids);
  return pairs
    .filter(p => p.length >= 2)
    .map(p => [`${p[0]}`, `${p[1]}`] as [string, string])
    .filter(([a, b]) => a !== b && known.has(a) && known.has(b));
}

/**
    The points both series share along the discrete axis, in the first
    series' order.
    @param a The first series' rows.
    @param b The second series' rows.
    @param pos A row's discrete-axis pixel position.
    @param val A row's value-axis pixel position.
*/
export function betweenPoints(
  a: PlotDatum[],
  b: PlotDatum[],
  pos: (d: PlotDatum) => number,
  val: (d: PlotDatum) => number,
): BetweenPoint[] {
  const byKey = new Map<string, PlotDatum>();
  b.forEach(d => byKey.set(`${d.discrete}`, d));
  const out: BetweenPoint[] = [];
  a.forEach(d => {
    const other = byKey.get(`${d.discrete}`);
    if (!other) return;
    const point = {pos: pos(d), a: val(d), b: val(other)};
    if ([point.pos, point.a, point.b].every(Number.isFinite)) out.push(point);
  });
  return out;
}

/**
    The clip region on one side of the first series' line: from the line out
    to `edge` along the value axis.
    @param points The shared points.
    @param edge The value-axis pixel position the region reaches out to.
    @param horizontal Whether the discrete axis is x.
    @param curve The lines' curve name.
*/
export function sideClip(
  points: BetweenPoint[],
  edge: number,
  horizontal: boolean,
  curve: string,
): string {
  const gen = d3Area<BetweenPoint>().curve(curveFactory(curve));
  if (horizontal)
    gen
      .x(p => p.pos)
      .y0(edge)
      .y1(p => p.a);
  else
    gen
      .y(p => p.pos)
      .x0(edge)
      .x1(p => p.a);
  return gen(points) || "";
}

/** The plotted series ids, in plotted order. */
function seriesIds(rows: PlotDatum[]): string[] {
  return Array.from(new Set(rows.map(d => `${d.id}`)));
}

/**
    The fill-between scene for a Line shape group: per pair, two clipped
    copies of the area between the lines, one in each series' color.
    @param ctx The Line shape group's emit context.
*/
export function emitFillBetween(ctx: ShapeEmitContext): SceneNode[] {
  const {viz} = ctx;
  const rows = ctx.values as unknown as PlotDatum[];
  const pairs = fillBetweenPairs(viz.schema.fillBetween, seriesIds(rows));
  if (!pairs.length) return [];
  const horizontal = (viz.schema.discrete || "x") === "x";
  const px = ctx.shapeConfig.x as (d: PlotDatum) => number;
  const py = ctx.shapeConfig.y as (d: PlotDatum) => number;
  const pos = horizontal ? px : py,
    val = horizontal ? py : px;
  const curve = lineCurve(viz, rows[0]);
  return pairs.flatMap(pair =>
    pairNodes(viz, rows, pair, {pos, val, horizontal, curve}),
  );
}

/** The two clipped area copies for one pair of series. */
function pairNodes(
  viz: VizInstance,
  rows: PlotDatum[],
  [a, b]: [string, string],
  geo: {
    pos: (d: PlotDatum) => number;
    val: (d: PlotDatum) => number;
    horizontal: boolean;
    curve: string;
  },
): SceneNode[] {
  const rowsA = rows.filter(d => `${d.id}` === a),
    rowsB = rows.filter(d => `${d.id}` === b);
  const points = betweenPoints(rowsA, rowsB, geo.pos, geo.val);
  if (points.length < 2) return [];
  const up = valueDirection(rows, geo.val, geo.horizontal ? "y" : "x");
  const key = `${FILL_BETWEEN_KEY}-${a}-${b}`;
  const sides = [
    {
      id: `${key}-${a}`,
      above: a,
      below: b,
      rep: rowsA[0],
      edge: -up * CLIP_REACH,
    },
    {
      id: `${key}-${b}`,
      above: b,
      below: a,
      rep: rowsB[0],
      edge: up * CLIP_REACH,
    },
  ];
  const data = sides.flatMap(side => {
    // Style accessors receive the higher series' source row, tagged with the pair.
    const row = {
      ...(side.rep.data as DataPoint),
      above: side.above,
      below: side.below,
    };
    return points.map(p => ({
      __d3plus__: true,
      data: row,
      i: side.rep.i,
      id: side.id,
      ...p,
    }));
  });
  const place = geo.horizontal
    ? {
        x: (d: BetweenPoint) => d.pos,
        x0: (d: BetweenPoint) => d.pos,
        x1: null,
        y: (d: BetweenPoint) => d.a,
        y0: (d: BetweenPoint) => d.b,
        y1: (d: BetweenPoint) => d.a,
      }
    : {
        y: (d: BetweenPoint) => d.pos,
        y0: (d: BetweenPoint) => d.pos,
        y1: null,
        x: (d: BetweenPoint) => d.a,
        x0: (d: BetweenPoint) => d.b,
        x1: (d: BetweenPoint) => d.a,
      };
  const shape = makeShape("Area")
    .renderMode("compute")
    .data(data as unknown as DataPoint[])
    .config({
      ...place,
      curve: geo.curve,
      duration: viz.schema.duration,
      label: false,
      fill: lineColor(viz),
      strokeWidth: 0,
    })
    .config(
      shapeConfigFor(
        viz,
        "Area",
        viz.schema.fillBetweenConfig as Record<string, unknown>,
      ),
    );
  shape.render();
  const nodes = collectComputed(shape);
  return sides.flatMap(side => {
    const children = nodes.filter(n => n.key === side.id);
    if (!children.length) return [];
    children.forEach(n => (n.interactive = false));
    const clip = sideClip(points, side.edge, geo.horizontal, geo.curve);
    return [
      {
        type: "group",
        key: `${side.id}::clip`,
        interactive: false,
        clip: {type: "path", d: clip},
        children,
      } as GroupNode,
    ];
  });
}

/**
    Which way higher values run along the value axis in pixels: `1` when a
    higher value sits at a higher pixel position, `-1` when lower (a y axis
    unless reversed).
    @param rows Plotted rows.
    @param val A row's value-axis pixel position.
    @param key The value axis ("x" or "y").
*/
export function valueDirection(
  rows: PlotDatum[],
  val: (d: PlotDatum) => number,
  key: string,
): 1 | -1 {
  const first = rows[0];
  for (const d of rows) {
    const dv = Number(d[key]) - Number(first[key]),
      dp = val(d) - val(first);
    if (dv && dp) return Math.sign(dv) === Math.sign(dp) ? 1 : -1;
  }
  return key === "y" ? -1 : 1;
}

/** A series' line color, read from the datum the area wraps: the Line's stroke. */
function lineColor(viz: VizInstance) {
  return (d: DataPoint, i: number): unknown => {
    const {Line, stroke} = viz.schema.shapeConfig;
    const s = Line && Line.stroke !== undefined ? Line.stroke : stroke;
    return typeof s === "function" ? s(d, i) : s;
  };
}
