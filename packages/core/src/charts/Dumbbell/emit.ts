/**
    Dumbbell's Circle emitter: a connector per category (a Line from its
    smallest to its largest value, an arrow with `arrows`, or a floating bar
    with `connector: "bar"`, see `changeEmit.ts`), then Plot's circles on top,
    one per row.

    Connectors are drawn behind the points and take no pointer events: the
    category's tooltip comes from its points, or from the shared hover
    anywhere along the category. A connector dims and highlights with its
    points.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import {
  shapeEmitters,
  type ShapeEmitContext,
  type ShapeEmitter,
} from "../features/shapeEmit.js";
import {markSharedConfig} from "../../utils/configWarnings.js";
import {dumbbellConnector} from "./changes.js";
import {
  emitArrowConnectors,
  emitBarConnectors,
  pointGeometry,
} from "./changeEmit.js";
import {
  asConnector,
  CONNECTOR_KEY_SUFFIX,
  dumbbellSpans,
  type ConnectorEnd,
} from "./connectors.js";

export {
  asConnector,
  CONNECTOR_KEY_SUFFIX,
  dumbbellSpans,
  type ConnectorEnd,
  type DumbbellSpan,
} from "./connectors.js";

/** The connectors: one two-point Line per category, styled by `shapeConfig.Line`. */
function emitConnectors(ctx: ShapeEmitContext): SceneNode[] {
  const {viz} = ctx;
  const discrete = viz.schema.discrete === "x" ? "x" : "y";
  const spans = dumbbellSpans(ctx.values as unknown as PlotDatum[], discrete);
  if (!spans.length) return [];
  const ends: ConnectorEnd[] = spans.flatMap(({category, lo, hi}) => [
    {__d3plus__: true, data: lo, i: lo.i, category},
    {__d3plus__: true, data: hi, i: hi.i, category},
  ]);
  const at = (axis: "x" | "y") => {
    const fn = ctx.shapeConfig[axis] as (d: PlotDatum, i: number) => number;
    return (p: ConnectorEnd) => fn(p.data, p.data.i);
  };
  const s = makeShape("Line")
    .renderMode("compute")
    .config(ctx.shapeConfig)
    .data(ends);
  const userConfig = shapeConfigFor(viz, "Line");
  if (viz.schema.shapeConfig.duration === undefined) delete userConfig.duration;
  s.config(userConfig).config({
    curve: "linear",
    hitArea: false,
    id: (p: ConnectorEnd) => `${p.category}${CONNECTOR_KEY_SUFFIX}`,
    label: false,
    x: at("x"),
    y: at("y"),
  });
  return collectComputed(s).map(asConnector);
}

/**
    Dumbbell's emitter for its Circle rows: connectors (lines, arrows, or
    floating bars), then the points (each keyed by its series and category),
    which a bar connector draws in place of.
*/
export const dumbbellEmit: ShapeEmitter = (ctx, key) => {
  const shapeConfig = markSharedConfig({
    ...ctx.shapeConfig,
    id: (d: PlotDatum) => `${d.id}_${d.discrete}`,
  });
  const points = shapeEmitters.Circle({...ctx, shapeConfig}, key);
  const {viz} = ctx;
  if (dumbbellConnector(viz.schema.connector) === "bar")
    return [
      ...emitBarConnectors(ctx, pointGeometry(points), !!viz.schema.arrows),
      ...points.map(hidePoint),
    ];
  if (viz.schema.arrows)
    return [...emitArrowConnectors(ctx, pointGeometry(points)), ...points];
  return [...emitConnectors(ctx), ...points];
};

/**
    A point a bar connector draws in place of: kept for hover, the shared
    tooltip and keyboard focus, but painted with nothing, so emphasis leaves
    it unseen too.
*/
function hidePoint(node: SceneNode): SceneNode {
  if (node.type !== "circle") return node;
  return {
    ...node,
    paint: {...node.paint, fill: "transparent", stroke: "transparent"},
  };
}
