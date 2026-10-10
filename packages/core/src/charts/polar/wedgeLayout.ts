/**
    The layout shared by PolarArea and RadialBar's circular bars: equal-angle
    slots around the circle, each holding one or more wedges stacked outward
    whose radius encodes value, with value rings, ring labels, and category
    labels. Lays the chrome into `viz._chartScene` (beneath the wedges) and
    returns the wedges plus the ring labels, which the emit paints on top.
*/

import {groups} from "d3-array";

import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";
import type {ArcGeometry, Paint, SceneNode} from "@d3plus/render";

import {chartBounds} from "../features/chartGeometry.js";
import {arcPath} from "../Gauge/emitDial.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {RadarLevels} from "../Radar/levels.js";

import {
  polarCategoryLayout,
  polarCategoryNodes,
  polarLevelNodes,
} from "./chrome.js";
import type {PolarCategory} from "./chrome.js";
import {
  polarInnerRadius,
  polarLevels,
  polarPadAngle,
  polarRadius,
  polarSlots,
  polarStack,
} from "./geometry.js";
import type {PolarDomainInput, PolarScale, PolarSlot} from "./geometry.js";

type Viz = Parameters<TransformStage>[0]["viz"];
type Accessor<T> = (d: DataPoint, i: number) => T;

/** Room (px) kept around the circle for the hovered stroke emphasis. */
export const POLAR_STROKE_BUFFER = 2;

/** One wedge: a row's stacked segment in its slot. */
export interface PolarWedge {
  __d3plus__: true;
  data: DataPoint;
  i: number;
  /** The row's slot (category) key. */
  slot: string;
  value: number;
  /** Cumulative values the segment spans within its slot. */
  y0: number;
  y1: number;
  arc: ArcGeometry;
}

/** The circle every wedge is laid out in, stored on `viz.ctx.polar`. */
export interface PolarFrame {
  inner: number;
  outer: number;
  levels: RadarLevels;
  scale: PolarScale;
  slots: (PolarSlot & {key: string})[];
  /** Background tracks, one per slot from the inner to the outer radius. */
  tracks: ArcGeometry[];
}

export interface PolarWedgeOptions {
  /** The rows to lay out, in slot order; defaults to `viz._filteredData`. */
  rows?: DataPoint[];
  /** The slot each row falls in; rows sharing a slot stack outward. */
  slotOf: Accessor<string>;
  /** The category label for a slot, given its rows. */
  slotLabel: (key: string, rows: DataPoint[]) => string;
  scale: PolarScale;
  /** Share of each slot's angle left empty, split between its two sides. */
  slotPadding: number;
  /** The sweep, in radians, starting from `startAngle`. */
  sweep: number;
  /** Paints a background track behind each slot, from the inner to the outer radius. */
  trackPaint?: Paint;
  /** A key prefix for the chrome's scene nodes. */
  key: string;
}

/**
    The annular sector a slot draws between radii `r0` and `r1`: the slot's
    angle less `inset` (a share of it, split between both sides), with the
    pad angle `padAngle` (radians) or `padPixel` (px, at the sector's middle)
    gives.
*/
export function polarSlotArc(
  slot: PolarSlot,
  r0: number,
  r1: number,
  pad: {inset: number; padAngle: number; padPixel: number},
): ArcGeometry {
  const inset = Math.max(0, Math.min(0.95, pad.inset));
  const span = slot.endAngle - slot.startAngle;
  return {
    innerRadius: r0,
    outerRadius: r1,
    startAngle: slot.startAngle + (span * inset) / 2,
    endAngle: slot.endAngle - (span * inset) / 2,
    padAngle: polarPadAngle(pad.padAngle, pad.padPixel, Math.hypot(r0, r1)),
  };
}

/** The background tracks, one non-interactive sector per slot. */
function trackGroup(
  key: string,
  slots: {key: string}[],
  tracks: ArcGeometry[],
  paint: Paint,
): SceneNode {
  return {
    type: "group",
    key: `${key}-tracks`,
    interactive: false,
    children: tracks.map((arc, k): SceneNode => ({
      type: "path",
      key: `${key}-track-${slots[k].key}`,
      interactive: false,
      d: arcPath(arc),
      arc,
      paint,
    })),
  };
}

/** Resolves the `startAngle` setting (degrees) to radians. */
const startRadians = (viz: Viz): number =>
  ((Number(viz.schema.startAngle) || 0) * Math.PI) / 180;

/**
    Lays out the slots, wedges, rings, and category labels; pushes the rings
    and category labels onto `viz._chartScene` and returns the wedges, the
    frame, and the ring labels.
*/
export function polarWedgeLayout(
  viz: Viz,
  opts: PolarWedgeOptions,
): {wedges: PolarWedge[]; frame: PolarFrame; levelLabels: SceneNode[]} {
  const {width, height} = chartBounds(viz);
  const rows = opts.rows ?? ((viz._filteredData ?? []) as DataPoint[]);
  const valueFn = viz.schema.value as Accessor<number>;
  const aggs = viz.schema.aggs as Parameters<typeof merge>[1];

  const bySlot = groups(
    rows.map((d, i) => ({d, i})),
    r => opts.slotOf(r.d, r.i),
  );
  const slotIndex = new Map(bySlot.map(([key], k) => [key, k]));
  const values = rows.map((d, i) => Number(valueFn(d, i)));
  const stack = polarStack(
    rows.map((d, i) => ({
      slot: slotIndex.get(opts.slotOf(d, i))!,
      value: values[i],
    })),
  );
  const tops = bySlot.map((_s, k) =>
    Math.max(0, ...stack.filter(s => s.slot === k).map(s => s.y1)),
  );
  const levels = polarLevels(
    tops,
    viz.schema.levels as number | number[],
    viz.schema.domain as PolarDomainInput,
  );

  const start = startRadians(viz);
  const slots = polarSlots(bySlot.length, start, opts.sweep).map((s, k) => ({
    ...s,
    key: bySlot[k][0],
  }));
  const categories: PolarCategory[] = slots.map((s, k) => {
    const members = bySlot[k][1].map(r => r.d);
    return {
      key: s.key,
      text: opts.slotLabel(s.key, members),
      angle: s.angle,
      data: (members.length === 1
        ? members[0]
        : merge(members, aggs)) as DataPoint,
    };
  });
  const buffer = POLAR_STROKE_BUFFER * 2;
  const layout = polarCategoryLayout(
    viz,
    categories,
    Math.max(0, width - buffer),
    Math.max(0, height - buffer),
  );
  const outer = Math.max(0, layout.radius);
  const inner = polarInnerRadius(viz.schema.innerRadius, outer);
  const toRadius = (v: number) =>
    polarRadius(v, levels.domain, inner, outer, opts.scale);
  const pad = {
    inset: opts.slotPadding,
    padAngle: Number(viz.schema.padAngle) || 0,
    padPixel: Number(viz.schema.padPixel) || 0,
  };

  const wedges: PolarWedge[] = rows.map((d, i) => {
    const s = stack[i];
    const slot = slots[s.slot];
    return {
      __d3plus__: true,
      data: d,
      i,
      slot: slot.key,
      value: values[i],
      y0: s.y0,
      y1: s.y1,
      arc: polarSlotArc(slot, toRadius(s.y0), toRadius(s.y1), pad),
    };
  });

  const tracks = slots.map(s => polarSlotArc(s, inner, outer, pad));
  const chrome = polarLevelNodes(viz, levels, outer, toRadius);
  const scene = (
    Array.isArray(viz._chartScene) ? viz._chartScene : (viz._chartScene = [])
  ) as SceneNode[];
  if (opts.trackPaint)
    scene.push(trackGroup(opts.key, slots, tracks, opts.trackPaint));
  scene.push(
    ...chrome.rings,
    ...polarCategoryNodes(viz, layout.labels, opts.key),
  );

  const frame: PolarFrame = {
    inner,
    outer,
    levels,
    scale: opts.scale,
    slots,
    tracks,
  };
  viz.ctx.polar = frame;
  return {wedges, frame, levelLabels: chrome.labels};
}
