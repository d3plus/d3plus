/**
    What Violin draws inside each violin (`inner`): a narrow box plot, lines at
    the quartiles, and/or the raw observations packed into a swarm.
*/
import type {DataPoint} from "@d3plus/data";
import {backgroundColor} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {densityAt} from "../helpers/densityData.js";
import type {DensityMeta} from "../helpers/densityChart.js";
import {growFromLine, growRectsFromCenter} from "../helpers/densityEnter.js";
import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import type {PlotAxisFn} from "../features/plotPaint.js";
import {fitSwarms} from "../Plot/swarmLayout.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import {violinEdges, type ViolinSlot} from "./violinLayout.js";

/** The overlays `inner` can name. */
export type ViolinInner = "box" | "quartiles" | "points";

/** One drawn violin: its formatted row, distribution, and slot. */
export interface PlacedViolin {
  row: DataPoint;
  meta: DensityMeta;
  slot: ViolinSlot;
}

/** The pixel mapping an overlay draws with. */
export interface InnerFrame {
  vertical: boolean;
  /** Maps a value onto the value axis. */
  value: PlotAxisFn;
}

/** The `inner` setting as a set of overlays. */
export function innerSet(inner: unknown): Set<ViolinInner> {
  const list = Array.isArray(inner) ? inner : [inner];
  return new Set(
    list.filter(
      (v): v is ViolinInner =>
        v === "box" || v === "quartiles" || v === "points",
    ),
  );
}

/** Marks a scene subtree as decoration the pointer passes through. */
function inert(nodes: SceneNode[]): SceneNode[] {
  const mark = (node: SceneNode): void => {
    (node as {interactive?: boolean}).interactive = false;
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(mark);
  };
  nodes.forEach(mark);
  return nodes;
}

/** A point at `value` on the value axis and `offset` on the category axis. */
function at(
  frame: InnerFrame,
  value: number,
  offset: number,
): {x: number; y: number} {
  const v = frame.value(value);
  return frame.vertical ? {x: offset, y: v} : {x: v, y: offset};
}

/** The box plot overlay: a Box over each violin's observations, in its own keyed group. */
function boxNodes(
  ctx: ShapeEmitContext,
  placed: PlacedViolin[],
  frame: InnerFrame,
  ink: string,
): SceneNode[] {
  const {viz} = ctx;
  const widths = placed.map(
    p => p.slot.half * (p.slot.side === "both" ? 0.16 : 0.08),
  );
  const rectWidth = Math.max(3, Math.min(10, Math.min(...widths)));
  const vertical = frame.vertical;
  const node =
    viz._select && typeof viz._select.node === "function"
      ? viz._select.node()
      : null;
  const background = node ? backgroundColor(node) : "#fff";
  const nodes = placed.map(({row, meta, slot}): SceneNode => {
    const id = `density-box-${row.id}`;
    const center =
      slot.side === "both"
        ? slot.center
        : slot.center +
          (slot.side === "start" ? -1 : 1) * Math.min(4, slot.half / 4);
    const data = meta.summary.values.map(
      (v, i) => ({...at(frame, v, center), id, i}) as DataPoint,
    );
    const box = makeShape("Box")
      .renderMode("compute")
      .config({
        // Keys every part by the violin, so each moves with its own violin.
        id: (d: DataPoint) => d.id,
        orient: vertical ? "vertical" : "horizontal",
        rectWidth,
        rectConfig: {fill: ink, stroke: ink, strokeWidth: 0},
        medianConfig: {fill: background},
        outlierConfig: {Circle: {fill: ink, r: 1.5, strokeWidth: 0}},
        whiskerConfig: {
          endpoint: "Rect",
          endpointConfig: {
            Rect: {
              fill: ink,
              height: vertical ? 1 : rectWidth / 2,
              width: vertical ? rectWidth / 2 : 1,
            },
          },
          lineConfig: {stroke: ink, strokeWidth: 1},
        },
      })
      .config(
        ((viz.schema.innerConfig as Record<string, unknown>)?.box ??
          {}) as Record<string, unknown>,
      )
      .data(data);
    box.render();
    return {type: "group", key: id, children: collectComputed(box)};
  });
  growRectsFromCenter(nodes, vertical ? "x" : "y");
  return inert(nodes);
}

/** The quartile overlay: a solid line at each median, dashed lines at the quartiles. */
function quartileNodes(
  ctx: ShapeEmitContext,
  placed: PlacedViolin[],
  frame: InnerFrame,
  ink: string,
): SceneNode[] {
  const {viz} = ctx;
  const user = ((viz.schema.innerConfig as Record<string, unknown>)
    ?.quartiles ?? {}) as Record<string, unknown>;
  const lines = (keys: ("q1" | "median" | "q3")[], dash: string) => {
    const data: DataPoint[] = [];
    const centers = new Map<string, number>();
    placed.forEach(({row, meta, slot}) => {
      keys.forEach(k => {
        const value = meta.summary[k];
        const extent =
          densityAt(meta.summary.curve, value) * meta.scale * slot.half;
        const [low, high] = violinEdges(slot, extent);
        const id = `density-${k}-${row.id}`;
        centers.set(id, slot.center);
        data.push(
          {id, ...at(frame, value, low)} as DataPoint,
          {id, ...at(frame, value, high)} as DataPoint,
        );
      });
    });
    const line = makeShape("Line")
      .renderMode("compute")
      .config({
        stroke: ink,
        strokeWidth: 1,
        strokeDasharray: dash,
        curve: "linear",
      })
      .config(user)
      .data(data);
    line.render();
    const nodes = collectComputed(line);
    growFromLine(nodes, frame.vertical ? "x" : "y", centers);
    return inert(nodes);
  };
  return [...lines(["q1", "q3"], "4 3"), ...lines(["median"], "0")];
}

/** The points overlay: each violin's observations packed into a swarm along its center. */
function pointNodes(
  ctx: ShapeEmitContext,
  placed: PlacedViolin[],
  frame: InnerFrame,
): SceneNode[] {
  const {viz, events} = ctx;
  const user = ((viz.schema.innerConfig as Record<string, unknown>)?.points ??
    {}) as Record<string, unknown>;
  const r = typeof user.r === "number" ? user.r : 2.5;
  const fit = fitSwarms(
    placed.map(({meta}) =>
      meta.summary.observed.map(v => ({value: frame.value(v), r})),
    ),
    {
      padding: 0.5,
      extent: Math.max(
        1,
        Math.min(
          ...placed.map(
            p => p.slot.half * (p.slot.side === "both" ? 0.8 : 0.4),
          ),
        ),
      ),
      overflow: "shrink",
    },
  );
  const data: DataPoint[] = [];
  placed.forEach(({row, meta, slot}, g) => {
    const shift =
      slot.side === "both"
        ? 0
        : (slot.side === "start" ? -1 : 1) * slot.half * 0.45;
    meta.summary.observed.forEach((v, k) => {
      const raw = meta.summary.rows[k];
      data.push({
        __d3plus__: true,
        data: raw,
        i: k,
        id: `density-point-${row.id}-${k}`,
        ...at(frame, v, slot.center + shift + fit.offsets[g][k]),
      } as unknown as DataPoint);
    });
  });
  const circles = makeShape("Circle")
    .renderMode("compute")
    .config(shapeConfigFor(viz, "Circle"))
    .config({
      r: r * fit.scale,
      label: false,
      x: (d: DataPoint) => d.x,
      y: (d: DataPoint) => d.y,
    })
    .config(user)
    .data(data);
  viz._wirePlotShapeEvents!(circles, "Circle", events);
  circles.render();
  return collectComputed(circles);
}

/**
    The scene nodes for every overlay `inner` names, drawn over the violins
    in a fixed order: points, then quartiles, then the box.
*/
export function emitInner(
  ctx: ShapeEmitContext,
  placed: PlacedViolin[],
  frame: InnerFrame,
): SceneNode[] {
  const inner = innerSet(ctx.viz.schema.inner);
  if (!placed.length || !inner.size) return [];
  const ink = backgroundInk(ctx.viz);
  // Each overlay gets its own keyed group, so its nodes' keys can't collide
  // with the chart's.
  const group = (key: string, children: SceneNode[]): SceneNode[] =>
    children.length
      ? [{type: "group", key: `violin-${key}`, children} as SceneNode]
      : [];
  return [
    ...(inner.has("points")
      ? group("points", pointNodes(ctx, placed, frame))
      : []),
    ...(inner.has("quartiles")
      ? group("quartiles", quartileNodes(ctx, placed, frame, ink))
      : []),
    ...(inner.has("box")
      ? group("box", boxNodes(ctx, placed, frame, ink))
      : []),
  ];
}
