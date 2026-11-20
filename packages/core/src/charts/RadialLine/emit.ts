/**
    `radialLineEmit` — one Path per series (a line, or a band for
    RadialArea), the ring value labels when areas would cover them, then
    the dots on every series, then the series labels
    (`lineLabels`). The dots, not the paths, answer the pointer; without
    them a line answers, and an area always does.
*/

import type {DataPoint} from "@d3plus/data";
import type {Paint, SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {radialIsArea} from "./applyLayout.js";
import type {RadialFrame, RadialSeriesDatum} from "./applyLayout.js";
import {radialDotNodes} from "./points.js";
import {radialLabelNodes} from "./seriesLabelNodes.js";
import {pairLabels} from "../features/labelLayering.js";

/** A shape config's paint for one series, with its fill and stroke opacity and dashes. */
export function radialPaint(
  sc: Record<string, unknown>,
  d: DataPoint,
  i: number,
): Paint {
  const paint: Paint = {...paintFromShapeConfig(sc, d, i)};
  const fillOpacity = resolveAccessor<number>(sc.fillOpacity, d, i);
  if (typeof fillOpacity === "number") paint.fillOpacity = fillOpacity;
  const strokeOpacity = resolveAccessor<number>(sc.strokeOpacity, d, i);
  if (typeof strokeOpacity === "number") paint.strokeOpacity = strokeOpacity;
  const dash = resolveAccessor<unknown>(sc.strokeDasharray, d, i);
  const dashes = (
    Array.isArray(dash)
      ? dash
      : typeof dash === "string"
        ? dash.split(/[\s,]+/)
        : []
  )
    .map(Number)
    .filter(Number.isFinite);
  if (dashes.length) paint.strokeDasharray = dashes;
  // Explicit, so an exiting path fades from a real starting opacity.
  return {...paint, opacity: paint.opacity ?? 1};
}

/** The series' path node. */
function seriesNode(
  viz: VizInstance,
  s: RadialSeriesDatum,
  sc: Record<string, unknown>,
  shape: "Line" | "Area",
  interactive: boolean,
): SceneNode {
  return {
    type: "path",
    key: `radial-${shape.toLowerCase()}-${s.id}`,
    shapeType: shape,
    d: s.d,
    enterD: s.enterD,
    datum: s.data,
    index: s.i,
    // The labels of the `x` values it has a point at stay bright on hover.
    hoverKeys: {slot: s.keys},
    paint: radialPaint(sc, s.data, s.i),
    interactive,
    aria: {label: `${viz._drawLabel(s.data, s.i)}.`},
  } as SceneNode;
}

export const radialLineEmit: ChartEmit = pairLabels(({viz, shapeData}) => {
  const series = (shapeData ?? []) as unknown as RadialSeriesDatum[];
  const frame = viz.ctx.radial as RadialFrame | undefined;
  const levelLabels = frame?.levelLabels ?? [];
  if (!series.length) return levelLabels;
  const area = radialIsArea(viz);
  const shape = area ? "Area" : "Line";
  const sc = shapeConfigFor(viz, shape);
  const circleConfig = shapeConfigFor(viz, "Circle");
  const dots = series.map(s =>
    radialDotNodes(viz, s.id, s.dots, circleConfig, "radial"),
  );
  const paths = series.map((s, k) =>
    seriesNode(viz, s, sc, shape, area || !dots[k].length),
  );
  return [
    ...paths,
    ...levelLabels,
    ...dots.flat(),
    ...radialLabelNodes(viz, series, sc),
  ];
});
