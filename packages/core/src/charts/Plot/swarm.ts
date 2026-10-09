/**
    Plot's swarm mode: Circle marks keep their value along one axis and are
    packed along the other (see `swarmLayout.ts`), so a scatter plot and a
    beeswarm are the same chart with a different `swarm` setting, and the
    renderer tweens each circle between the two.
*/
import type {DataPoint} from "@d3plus/data";

import type {PlotAxisFn} from "../features/plotPaint.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {fitSwarms, type SwarmNode, type SwarmOverflow} from "./swarmLayout.js";

/** The `swarm` setting: off, on (value axis detected), auto, or an explicit value axis. */
export type SwarmSetting = boolean | "auto" | "x" | "y";

/** A resolved swarm for one draw. */
export interface SwarmState {
  /** The value axis circles keep their position along. */
  axis: "x" | "y";
  /** The axis circles are packed along. */
  cross: "x" | "y";
  /** True when the cross axis holds categories, drawing one swarm per category. */
  lanes: boolean;
}

/** The `swarmConfig` options. */
export interface SwarmConfig {
  padding?: number;
  overflow?: SwarmOverflow;
}

/** A placed circle, in plot pixels. */
export interface SwarmPlacement {
  x: number;
  y: number;
  r: number;
}

type Row = Record<string, unknown>;

const isMissing = (v: unknown): boolean =>
  v === undefined || v === null || v === "";
const isValue = (v: unknown): boolean =>
  (typeof v === "number" && Number.isFinite(v)) || v instanceof Date;
/** Every value is numeric (or a date) or missing, and at least one is present. */
const isNumericAxis = (values: unknown[]): boolean =>
  values.some(isValue) && values.every(v => isMissing(v) || isValue(v));

/**
    Resolves a `swarm` setting against a draw's formatted rows. `true` swarms
    along x when x is numeric, else along y. `"auto"` swarms only when every
    row is a Circle and one axis has no values at all (a Plot drawn without
    its y accessor). Returns null when there is nothing to swarm.
*/
export function resolveSwarm(
  setting: SwarmSetting | undefined,
  rows: Row[],
): SwarmState | null {
  if (!setting || !rows.length) return null;
  const xs = rows.map(d => d.x);
  const ys = rows.map(d => d.y);
  let axis: "x" | "y" | undefined;
  if (setting === "x" || setting === "y") axis = setting;
  else if (setting === "auto") {
    if (!rows.every(d => d.shape === "Circle")) return null;
    if (ys.every(isMissing)) axis = "x";
    else if (xs.every(isMissing)) axis = "y";
  } else axis = isNumericAxis(xs) ? "x" : "y";
  if (!axis || !isNumericAxis(axis === "x" ? xs : ys)) return null;
  const cross = axis === "x" ? "y" : "x";
  const lanes = rows.some(d => !isMissing(d[cross]) && !isValue(d[cross]));
  return {axis, cross, lanes};
}

/**
    Rewrites each row's cross-axis value to its lane key: the category as a
    string when the swarm has lanes, otherwise one shared empty lane.
*/
export function applySwarmLanes(rows: Row[], state: SwarmState): void {
  const {cross, lanes} = state;
  for (const d of rows)
    d[cross] = lanes && !isMissing(d[cross]) ? `${d[cross]}` : "";
}

/** Whether the swarm leaves an axis without anything to show (a single, unlabeled lane). */
export const swarmHidesAxis = (viz: VizInstance, axis: "x" | "y"): boolean =>
  !!viz._swarm && viz._swarm.cross === axis && !viz._swarm.lanes;

/** Inputs `swarmPlacements` reads from the paint phase. */
export interface SwarmPaintInputs {
  values: DataPoint[];
  x: PlotAxisFn;
  y: PlotAxisFn;
  xRange: number[];
  yRange: number[];
  /** The cross axis's lanes, in domain order. */
  lanes: unknown[];
  /** The Circle radius accessor (data-unwrapping, as the shape receives it). */
  r: (d: DataPoint, i: number) => number;
}

/**
    Lays out the Circle rows of a swarm-mode Plot: one swarm per lane, centered
    on the lane (or on the plot when there is a single lane) and confined to
    the lane's band. Returns each row's placement, keyed by row.
*/
export function swarmPlacements(
  viz: VizInstance,
  inputs: SwarmPaintInputs,
): Map<DataPoint, SwarmPlacement> {
  const state = viz._swarm as SwarmState;
  const config = (viz.schema.swarmConfig || {}) as SwarmConfig;
  const {axis, cross} = state;
  const valueFn = axis === "x" ? inputs.x : inputs.y;
  const crossFn = cross === "x" ? inputs.x : inputs.y;
  const crossRange = cross === "x" ? inputs.xRange : inputs.yRange;
  const span = Math.abs(crossRange[crossRange.length - 1] - crossRange[0]);

  const centers = new Map<string, number>();
  if (state.lanes)
    inputs.lanes.forEach(lane => centers.set(`${lane}`, crossFn(lane, cross)));
  const positions = Array.from(centers.values()).sort((a, b) => a - b);
  let band = positions.length > 1 ? Infinity : span;
  for (let i = 1; i < positions.length; i++)
    band = Math.min(band, positions[i] - positions[i - 1]);
  const middle = (crossRange[0] + crossRange[crossRange.length - 1]) / 2;

  const lanes = new Map<string, {rows: DataPoint[]; nodes: SwarmNode[]}>();
  inputs.values.forEach((d, i) => {
    const key = `${d[cross]}`;
    if (!lanes.has(key)) lanes.set(key, {rows: [], nodes: []});
    const lane = lanes.get(key)!;
    lane.rows.push(d);
    lane.nodes.push({
      value: valueFn(d[axis]),
      r: Math.max(0, Number(inputs.r(d, i)) || 0),
    });
  });

  const padding = config.padding ?? 1;
  const groups = Array.from(lanes.values());
  const fit = fitSwarms(
    groups.map(g => g.nodes),
    {
      padding,
      extent: Math.max(0, band / 2 - padding / 2),
      overflow: config.overflow ?? "shrink",
    },
  );

  const out = new Map<DataPoint, SwarmPlacement>();
  groups.forEach((group, g) => {
    group.rows.forEach((d, k) => {
      const center = centers.get(`${d[cross]}`) ?? middle;
      const value = group.nodes[k].value;
      const offset = center + fit.offsets[g][k];
      out.set(d, {
        x: axis === "x" ? value : offset,
        y: axis === "x" ? offset : value,
        r: group.nodes[k].r * fit.scale,
      });
    });
  });
  return out;
}
