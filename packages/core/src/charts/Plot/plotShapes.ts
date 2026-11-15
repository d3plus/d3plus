/**
    What a Plot's shapes ask of the chart around them: bars, areas, and boxes
    stand on a discrete axis (see `inferDiscrete.ts`), bars and areas grow
    from `0` as a BarChart's and AreaPlot's do, and only circles swarm.

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

/** The shapes that grow from a baseline of `0` by default. */
const BASELINE_SHAPES = new Set(["Area", "Bar"]);

/** The shape a swarm packs. */
const CIRCLE = new Set(["Circle"]);

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
    The baseline a Plot's bars and areas grow from when neither the chart nor
    the user sets one: `0` when any row draws a Bar or Area, as on a BarChart
    or AreaPlot, else undefined.
    @param viz The Plot.
    @param rows Its data.
*/
export function shapeBaseline(
  viz: VizInstance,
  rows: DataPoint[],
): number | undefined {
  return viz.schema.baseline === undefined &&
    viz._userBaseline === undefined &&
    drawsAnyShape(viz, rows, BASELINE_SHAPES)
    ? 0
    : undefined;
}

/**
    The `swarm` a Plot draws with: its setting, which packs only its circles
    (bars, areas, and boxes beside them keep their places), or `false`, with
    a one-time note, when it draws bars, areas, or boxes and no circles,
    leaving nothing to swarm.
    @param viz The Plot.
*/
export function plotSwarm(viz: VizInstance): SwarmSetting | undefined {
  const swarm = viz.schema.swarm as SwarmSetting | undefined;
  if (!swarm || swarm === "auto") return swarm;
  const rows = viz._data || [];
  if (!drawsDiscreteShapes(viz, rows) || drawsAnyShape(viz, rows, CIRCLE))
    return swarm;
  warnConfigOnce(
    viz,
    "swarm-no-circles",
    "swarm packs a Plot's circles, and this one draws none, so there is nothing to swarm.",
  );
  return false;
}
