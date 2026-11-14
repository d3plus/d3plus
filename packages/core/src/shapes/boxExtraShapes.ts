/**
    Draws a Box's extras (see `boxExtras.ts`): notched bodies, the mean
    marker, and the jittered observation points.
*/

import type {DataPoint} from "@d3plus/data";

import Circle from "./Circle.js";
import Path from "./Path.js";
import {boxMedianConfig} from "./boxStyle.js";
import {diamondPath} from "../charts/Gantt/ganttGeometry.js";
import {
  boxPointData,
  jitterOutliers,
  MEAN_SIZE,
  notchedBoxPath,
} from "./boxExtras.js";
import type {Owned} from "./shapeOwners.js";

/** What the extras read from the Box. */
export interface BoxExtrasDrawHost {
  schema: Record<string, unknown>;
  _owned: Map<object, Owned>;
}

/** The inner shapes the extras draw; any may be absent. */
export interface BoxExtraShapes {
  notched?: Path;
  points?: Circle;
  mean?: Path;
}

/** How a Box mounts and renders an inner shape. */
interface Mount {
  compute: boolean;
  select: (name: string) => unknown;
  /** Prepares a Box config (`meanConfig`, `pointConfig`) the way `configPrep` does. */
  prep: (config: unknown) => Record<string, unknown>;
}

/** Renders `shape` in the Box's mode, mounted under `name`. */
function finish<T extends Path | Circle>(shape: T, name: string, m: Mount): T {
  shape
    .renderMode(m.compute ? "compute" : "full")
    .select(m.select(name) as never)
    .render();
  return shape;
}

/**
    The observation points of every computed box, jittered across its
    width, each recorded as part of its box; outliers move to their jittered
    places too.
*/
function pointRecords(
  host: BoxExtrasDrawHost,
  boxes: DataPoint[],
  outliers: DataPoint[],
): DataPoint[] {
  const points: DataPoint[] = [];
  for (const box of boxes) {
    const owned = host._owned.get(box);
    const mine = outliers.filter(o => owned && host._owned.get(o) === owned);
    jitterOutliers(host, box, mine);
    for (const p of boxPointData(host, box)) {
      if (owned) host._owned.set(p, owned);
      points.push(p);
    }
  }
  return points;
}

/**
    Draws the extras the Box's settings turn on: each notched box's body (a
    Path in place of its Rect), the observation points of computed boxes
    (`boxPoints`), and a diamond at each box's mean (`boxMean`).
    @param host The Box.
    @param boxes The box datums, with their extras applied.
    @param outliers The Box's outlier records.
    @param rectConfig The box body's resolved config.
    @param computed Whether the boxes summarize observations.
    @param m How the Box mounts and renders inner shapes.
*/
export function drawBoxExtras(
  host: BoxExtrasDrawHost,
  boxes: DataPoint[],
  outliers: DataPoint[],
  rectConfig: Record<string, unknown>,
  computed: boolean,
  m: Mount,
): BoxExtraShapes {
  const {schema} = host;
  const out: BoxExtraShapes = {};
  const notched = boxes.filter(b => b.notch);
  if (notched.length) {
    const body = {...rectConfig};
    delete body.width;
    delete body.height;
    out.notched = finish(
      new Path()
        .data(notched)
        .id((d: DataPoint) => `${d.id}-box`)
        .x((d: DataPoint) => d.x)
        .y((d: DataPoint) => d.y)
        .config(body)
        .d((d: DataPoint) => notchedBoxPath(d as Record<string, unknown>)),
      "g.d3plus-Box-Notched",
      m,
    );
  }
  const ink = boxMedianConfig(rectConfig.fill, {}).fill as (
    d: DataPoint,
    i?: number,
  ) => string;
  if (schema.boxPoints && computed) {
    const points = pointRecords(host, boxes, outliers);
    if (points.length)
      out.points = finish(
        new Circle().data(points).config({
          fill: ink,
          fillOpacity: 0.5,
          r: 2.5,
          stroke: "none",
          ...m.prep(schema.pointConfig),
        }),
        "g.d3plus-Box-Points",
        m,
      );
  }
  const means = boxes.filter(b => typeof b.mean === "number");
  if (means.length)
    out.mean = finish(
      new Path()
        .data(means)
        .id((d: DataPoint) => `${d.id}-mean`)
        .x((d: DataPoint) => (d.orient === "vertical" ? d.x : d.mean))
        .y((d: DataPoint) => (d.orient === "vertical" ? d.mean : d.y))
        .d(diamondPath(0, 0, MEAN_SIZE))
        .config({fill: ink, stroke: "none", ...m.prep(schema.meanConfig)}),
      "g.d3plus-Box-Mean",
      m,
    );
  return out;
}
