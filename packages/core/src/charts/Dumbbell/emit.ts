/**
    Dumbbell's Circle emitter: a connector per category (a Line from its
    smallest to its largest value), then Plot's circles on top, one per row.

    Connectors are drawn behind the points and take no pointer events: the
    category's tooltip comes from its points, or from the shared hover
    anywhere along the category.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import {collectComputed, makeShape, shapeConfigFor} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import {shapeEmitters, type ShapeEmitContext, type ShapeEmitter} from "../features/shapeEmit.js";
import {markSharedConfig} from "../../utils/configWarnings.js";

/** Key suffix of a category's connector node. */
export const CONNECTOR_KEY_SUFFIX = "::connector";

/** One category's connector: the rows holding its smallest and largest value. */
export interface DumbbellSpan {
  category: string;
  lo: PlotDatum;
  hi: PlotDatum;
}

/**
    One end of a connector, fed to the Line shape. It wraps the row so style
    accessors unwrap to the row, and carries its category as a string so the
    Line's merged datum keeps it.
*/
interface ConnectorEnd {
  __d3plus__: true;
  data: PlotDatum;
  i: number;
  category: string;
}

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
    Each category's span, in first-seen order: the rows holding its smallest
    and largest value along the value axis. Categories whose values don't
    differ (or with fewer than two numeric values) have no span.
    @param rows The plotted rows.
    @param discrete The category axis.
*/
export function dumbbellSpans(rows: PlotDatum[], discrete: "x" | "y"): DumbbellSpan[] {
  const opp = discrete === "x" ? "y" : "x";
  const spans = new Map<string, {lo?: PlotDatum; hi?: PlotDatum}>();
  for (const d of rows) {
    const category = `${d[discrete]}`;
    let span = spans.get(category);
    if (!span) spans.set(category, (span = {}));
    const v = d[opp];
    if (!finite(v)) continue;
    if (!span.lo || v < (span.lo[opp] as number)) span.lo = d;
    if (!span.hi || v > (span.hi[opp] as number)) span.hi = d;
  }
  const out: DumbbellSpan[] = [];
  spans.forEach(({lo, hi}, category) => {
    if (lo && hi && lo !== hi && lo[opp] !== hi[opp]) out.push({category, lo, hi});
  });
  return out;
}

/** A connector node, drawn but never hit-tested or dimmed. */
function asConnector(node: SceneNode): SceneNode {
  const out = {...node, interactive: false} as SceneNode & {interactionPoints?: unknown};
  delete out.interactionPoints;
  delete out.datum;
  return out;
}

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
    Dumbbell's emitter for its Circle rows: connectors, then the points (each
    keyed by its series and category).
*/
export const dumbbellEmit: ShapeEmitter = (ctx, key) => {
  const shapeConfig = markSharedConfig({
    ...ctx.shapeConfig,
    id: (d: PlotDatum) => `${d.id}_${d.discrete}`,
  });
  return [...emitConnectors(ctx), ...shapeEmitters.Circle({...ctx, shapeConfig}, key)];
};
