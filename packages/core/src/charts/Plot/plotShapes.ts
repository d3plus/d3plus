/**
    What a Plot's shapes ask of the chart around them: bars, areas, and boxes
    stand on a discrete axis (see `inferDiscrete.ts`), bars grow from `0` as
    a BarChart's do, and none of them can be packed into a swarm.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import type {SwarmSetting} from "./swarm.js";
import {warnConfigOnce} from "../../utils/configWarnings.js";

/** A row accessor, such as a Plot's `shape`. */
type RowAccessor = (d: DataPoint, i: number) => unknown;

/** The shapes that stand on a discrete axis, and draw nothing sensible without one. */
const DISCRETE_SHAPES = new Set(["Area", "Bar", "Box"]);

/** The shape that grows from a baseline of `0` by default. */
const BAR = new Set(["Bar"]);

/**
    Whether any of a Plot's rows draws one of `shapes`.
    @param viz The Plot.
    @param rows Its data.
    @param shapes The shape names to look for.
*/
export function drawsAnyShape(
  viz: VizInstance,
  rows: DataPoint[],
  shapes: ReadonlySet<string>,
): boolean {
  const shape = viz.schema.shape as RowAccessor | undefined;
  return (
    typeof shape === "function" &&
    rows.some((d, i) => shapes.has(shape(d, i) as string))
  );
}

/**
    Whether any of a Plot's rows draws a shape that stands on a discrete
    axis: a Bar, Area, or Box.
    @param viz The Plot.
    @param rows Its data.
*/
export const drawsDiscreteShapes = (
  viz: VizInstance,
  rows: DataPoint[],
): boolean => drawsAnyShape(viz, rows, DISCRETE_SHAPES);

/**
    The baseline a Plot's bars grow from when neither the chart nor the user
    sets one: `0` when any row draws a Bar, as on a BarChart, else undefined.
    @param viz The Plot.
    @param rows Its data.
*/
export function barBaseline(
  viz: VizInstance,
  rows: DataPoint[],
): number | undefined {
  return viz.schema.baseline === undefined &&
    viz._userBaseline === undefined &&
    drawsAnyShape(viz, rows, BAR)
    ? 0
    : undefined;
}

/**
    The `swarm` a Plot draws with: its setting, or `false` when a row draws a
    Bar, Area, or Box, which a swarm can't pack (with a one-time warning).
    @param viz The Plot.
*/
export function plotSwarm(viz: VizInstance): SwarmSetting | undefined {
  const swarm = viz.schema.swarm as SwarmSetting | undefined;
  if (!swarm || swarm === "auto") return swarm;
  if (!drawsDiscreteShapes(viz, viz._data || [])) return swarm;
  warnConfigOnce(
    viz,
    "swarm-shapes",
    "swarm packs circles only, so it is off for a Plot that draws bars, areas, or boxes.",
  );
  return false;
}
