/**
    Dumbbell's change connectors: with `arrows`, a line from each category's
    first value to its last that ends in an arrowhead at the last value's
    point; with `connector: "bar"`, a floating bar between them in place of
    the points (ending in an arrowhead with `arrows`).

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import {
  arrowNode,
  arrowSizeFor,
  arrowTrim,
  emphasizedArrowEdge,
  scaledArrowSize,
  scaledStrokeWidth,
} from "../features/edgeArrows.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import {
  barThickness,
  dumbbellChanges,
  dumbbellDirection,
  type DumbbellChange,
  type DumbbellDirection,
} from "./changes.js";
import {
  asConnector,
  CONNECTOR_KEY_SUFFIX,
  dumbbellSpans,
  type ConnectorEnd,
} from "./connectors.js";

type Point = [number, number];

/** A drawn point's center and radius. */
export interface PointGeometry {
  x: number;
  y: number;
  r: number;
}

/**
    Each drawn point's center and radius, by its row.
    @param nodes The points' scene nodes.
*/
export function pointGeometry(
  nodes: SceneNode[],
): Map<PlotDatum, PointGeometry> {
  const out = new Map<PlotDatum, PointGeometry>();
  for (const n of nodes) {
    if (n.type !== "circle" || !n.datum) continue;
    out.set(n.datum as PlotDatum, {
      x: (n.transform?.x ?? 0) + (n.cx ?? 0),
      y: (n.transform?.y ?? 0) + (n.cy ?? 0),
      r: n.r ?? 0,
    });
  }
  return out;
}

/** An arrow from one point to another: where its line runs, and its head. */
export interface ArrowSegment {
  start: Point;
  end: Point;
  tip: Point;
  angle: number;
}

/**
    An arrow from `from` toward `to`: its tip `gap` pixels short of `to`'s
    outline (radius `r`), its line from `from` to `trim` pixels back from the
    tip (the head's base). Null when the head doesn't fit between the two
    points' outlines.
    @param from The first point's center and radius.
    @param to The last point's center and radius.
    @param size The head's tip-to-base length.
    @param trim How far back from the tip the line ends (see `arrowTrim`).
    @param gap The space between the tip and `to`'s outline.
*/
export function arrowSegment(
  from: PointGeometry,
  to: PointGeometry,
  size: number,
  trim: number,
  gap = 1,
): ArrowSegment | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  const inset = Math.max(0, to.r) + gap;
  if (!length || length - inset - size < Math.max(0, from.r)) return null;
  const ux = dx / length;
  const uy = dy / length;
  const tip: Point = [to.x - ux * inset, to.y - uy * inset];
  return {
    start: [from.x, from.y],
    end: [tip[0] - ux * trim, tip[1] - uy * trim],
    tip,
    angle: Math.atan2(dy, dx),
  };
}

const round = (n: number): number => Math.round(n * 100) / 100;
const lineD = (a: Point, b: Point): string =>
  `M${round(a[0])},${round(a[1])}L${round(b[0])},${round(b[1])}`;

/** The connector's two ends, wrapping each row with its category and direction. */
function connectorEnds(
  change: Pick<DumbbellChange, "category" | "from" | "to">,
  direction?: DumbbellDirection,
): [ConnectorEnd, ConnectorEnd] {
  const end = (data: PlotDatum): ConnectorEnd => ({
    __d3plus__: true,
    data,
    i: data.i,
    category: change.category,
    direction,
  });
  return [end(change.from), end(change.to)];
}

/** The value axis, across from the category axis. */
const valueAxis = (ctx: ShapeEmitContext): "x" | "y" =>
  ctx.viz.schema.discrete === "x" ? "y" : "x";

/**
    The arrow connectors: one Line per category from its first value to the
    head's base, styled by `shapeConfig.Line`, and an arrowhead in the
    line's color pointing at its last value's point. Hover and active
    emphasis widen both together (see `emphasizedArrowEdge`).
    @param ctx The shape group's emit context.
    @param points Each drawn point's geometry.
*/
export function emitArrowConnectors(
  ctx: ShapeEmitContext,
  points: Map<PlotDatum, PointGeometry>,
): SceneNode[] {
  const {viz} = ctx;
  const discrete = viz.schema.discrete === "x" ? "x" : "y";
  const opp = valueAxis(ctx);
  const sc = shapeConfigFor(viz, "Line");
  if (viz.schema.shapeConfig.duration === undefined) delete sc.duration;
  const out: SceneNode[] = [];
  for (const change of dumbbellChanges(
    ctx.values as unknown as PlotDatum[],
    discrete,
  )) {
    const from = points.get(change.from);
    const to = points.get(change.to);
    if (!from || !to) continue;
    const ends = connectorEnds(change, dumbbellDirection(change, opp));
    const [, last] = ends;
    const row = last.data.data;
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, row, last.i);
    const linecap = resolveAccessor<string>(sc.strokeLinecap, row, last.i);
    // The line's path is drawn relative to its node's own transform.
    const draw = (scale: number, offset: Point = [0, 0]) => {
      const sw = scaledStrokeWidth(strokeWidth, scale) ?? 1;
      const size = arrowSizeFor(
        scaledArrowSize(viz.schema.arrowSize, scale),
        row,
        last.i,
        sw,
      );
      const seg = arrowSegment(from, to, size, arrowTrim(size, sw, linecap));
      const shift = (p: Point): Point => [p[0] - offset[0], p[1] - offset[1]];
      if (!seg)
        return {
          d: lineD(shift([from.x, from.y]), shift([to.x, to.y])),
          arrows: [],
          start: [from.x, from.y] as Point,
          end: [to.x, to.y] as Point,
        };
      return {
        d: lineD(shift(seg.start), shift(seg.end)),
        arrows: [
          arrowNode({
            key: `${change.category}${CONNECTOR_KEY_SUFFIX}::arrow`,
            datum: last.data as unknown as DataPoint,
            x: seg.tip[0],
            y: seg.tip[1],
            angle: seg.angle,
            size,
          }),
        ],
        start: seg.start,
        end: seg.end,
      };
    };
    const {start: a, end: b} = draw(1);
    const s = makeShape("Line")
      .renderMode("compute")
      .config(ctx.shapeConfig)
      .data(ends)
      .config(sc)
      .config({
        curve: "linear",
        hitArea: false,
        id: () => `${change.category}${CONNECTOR_KEY_SUFFIX}`,
        label: false,
        x: (p: ConnectorEnd) => (p === last ? b[0] : a[0]),
        y: (p: ConnectorEnd) => (p === last ? b[1] : a[1]),
      });
    for (const node of collectComputed(s).map(asConnector)) {
      const t = node.transform;
      const edge = emphasizedArrowEdge(scale =>
        draw(scale, [t?.x ?? 0, t?.y ?? 0]),
      );
      const line =
        node.type === "path" && edge.emphasis
          ? {...node, d: edge.d, emphasis: edge.emphasis}
          : node;
      out.push(line);
      const stroke = (node.paint as {stroke?: unknown} | undefined)?.stroke;
      for (const arrow of edge.arrows)
        out.push(
          asConnector({
            ...arrow,
            interactionPoints: (node as {interactionPoints?: unknown})
              .interactionPoints,
            paint: {
              ...arrow.paint,
              fill: typeof stroke === "string" ? stroke : undefined,
              opacity: (node.paint as {opacity?: number} | undefined)?.opacity,
            },
          } as SceneNode),
        );
    }
  }
  return out;
}

/**
    The floating bars: one rect per category along the value axis, from its
    smallest value to its largest (or, with `arrows`, from its first value
    to an arrowhead at its last), across a thickness of 60% of the step
    between categories (see `barThickness`), styled by `shapeConfig.Rect`.
    Like the line connectors, a bar keeps no datum of its own: it hovers and
    dims with its points.
    @param ctx The shape group's emit context.
    @param points Each drawn point's geometry.
    @param arrows Whether each bar ends in an arrowhead at its last value.
*/
export function emitBarConnectors(
  ctx: ShapeEmitContext,
  points: Map<PlotDatum, PointGeometry>,
  arrows: boolean,
): SceneNode[] {
  const {viz} = ctx;
  const discrete = viz.schema.discrete === "x" ? "x" : "y";
  const opp = valueAxis(ctx);
  const rows = ctx.values as unknown as PlotDatum[];
  const spans: DumbbellChange[] = arrows
    ? dumbbellChanges(rows, discrete)
    : dumbbellSpans(rows, discrete).map(({category, lo, hi}) => ({
        category,
        from: lo,
        to: hi,
      }));
  const across = (g: PointGeometry) => (discrete === "y" ? g.y : g.x);
  const range = discrete === "y" ? ctx.yRange : ctx.xRange;
  const thickness = barThickness(
    [...points.values()].map(across),
    Math.abs((range?.[1] ?? 0) - (range?.[0] ?? 0)),
    viz.schema.connectorWidth,
  );
  const sc = shapeConfigFor(viz, "Rect");
  const out: SceneNode[] = [];
  for (const span of spans) {
    const from = points.get(span.from);
    const to = points.get(span.to);
    if (!from || !to) continue;
    const ends = connectorEnds(
      span,
      arrows ? dumbbellDirection(span, opp) : undefined,
    );
    const [, last] = ends;
    const style = (key: string) =>
      resolveAccessor<unknown>(sc[key], last.data.data, last.i);
    const fill = style("fill") as string | undefined;
    // The head is as long as the bar is thick and a little wider.
    const head = arrows ? thickness : 0;
    const seg = arrows
      ? arrowSegment({...from, r: 0}, {...to, r: 0}, head, head, 0)
      : null;
    const a: Point = [from.x, from.y];
    const b: Point = seg ? seg.end : [to.x, to.y];
    const half = thickness / 2;
    const interactionPoints = ends.map(p => ({
      x: p === last ? to.x : from.x,
      y: p === last ? to.y : from.y,
      datum: p as unknown as DataPoint,
      index: p.i,
    }));
    out.push({
      type: "rect",
      key: `${span.category}${CONNECTOR_KEY_SUFFIX}`,
      x: discrete === "y" ? Math.min(a[0], b[0]) : a[0] - half,
      y: discrete === "y" ? a[1] - half : Math.min(a[1], b[1]),
      width: discrete === "y" ? Math.abs(b[0] - a[0]) : thickness,
      height: discrete === "y" ? thickness : Math.abs(b[1] - a[1]),
      shapeType: "Rect",
      interactive: false,
      interactionPoints,
      paint: {
        fill,
        stroke: style("stroke") as string | undefined,
        strokeWidth: style("strokeWidth") as number | undefined,
        opacity: style("opacity") as number | undefined,
      },
      aria: {hidden: true},
    } as unknown as SceneNode);
    if (seg)
      out.push(
        asConnector({
          ...arrowNode({
            key: `${span.category}${CONNECTOR_KEY_SUFFIX}::arrow`,
            datum: last.data as unknown as DataPoint,
            x: seg.tip[0],
            y: seg.tip[1],
            angle: seg.angle,
            size: head,
            fill,
          }),
          interactionPoints,
        } as unknown as SceneNode),
      );
  }
  return out;
}
