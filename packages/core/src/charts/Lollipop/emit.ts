/**
    Lollipop's Bar emitter: lays the rows out as bars (category bands, series
    dodging, baseline, clamping), then draws each bar as a stem (a Line from
    the bar's base to its end) topped by a head (a Circle at the value).

    The stem is part of its lollipop's mark: it shares the head's datum and
    shape type, so hover dimming, tooltips, and `.Circle` event handlers treat
    the two as one, and its key is the head's plus a `::stem` suffix. Any
    confidence error bars drawn for the bars are kept, between the stems and
    the heads.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {CONFIDENCE_KEY_SUFFIX} from "../Plot/barConfidence.js";
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
import {
  STEM_KEY_SUFFIX,
  stemFromBar,
  stemPoints,
  type BarBox,
  type StemLayout,
  type StemPoint,
} from "./stemLayout.js";

/** Each row's lollipop, measured from the bars painted for `ctx.values`. */
function measure(
  ctx: ShapeEmitContext,
  bars: SceneNode[],
): Map<PlotDatum, StemLayout> {
  const {viz} = ctx;
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  const opp = discrete === "x" ? "y" : "x";
  const scale = discrete === "x" ? ctx.y : ctx.x;
  const layouts = new Map<PlotDatum, StemLayout>();
  for (const node of bars) {
    if (
      node.type !== "rect" ||
      node.shapeType !== "Bar" ||
      `${node.key}`.endsWith("::hit")
    )
      continue;
    const d = node.datum as unknown as PlotDatum | undefined;
    if (!d || layouts.has(d)) continue;
    const secondary = d[`${opp}2`] !== undefined;
    const value = secondary ? d[`${opp}2`] : d[opp];
    layouts.set(
      d,
      stemFromBar(
        node as unknown as BarBox,
        discrete,
        scale(value, secondary ? `${opp}2` : undefined),
      ),
    );
  }
  return layouts;
}

/** Hands a stem node to its lollipop: the row as its datum, drawn as part of the head. */
function asStem(node: SceneNode): SceneNode {
  const point = node.datum as unknown as StemPoint | undefined;
  const out = {
    ...node,
    datum: point?.data ?? node.datum,
    shapeType: "Circle",
  } as SceneNode & {interactionPoints?: unknown};
  delete out.interactionPoints;
  return out;
}

/** The stems: one two-point Line per row, styled by `shapeConfig.Line`. */
function emitStems(
  ctx: ShapeEmitContext,
  rows: PlotDatum[],
  layouts: Map<PlotDatum, StemLayout>,
): SceneNode[] {
  const {viz} = ctx;
  const at = (p: StemPoint): StemLayout => layouts.get(p.data)!;
  const s = makeShape("Line")
    .renderMode("compute")
    .config(ctx.shapeConfig)
    .data(stemPoints(rows));
  viz._wirePlotShapeEvents!(s, "Circle", ctx.events);
  const userConfig = shapeConfigFor(viz, "Line");
  if (viz.schema.shapeConfig.duration === undefined) delete userConfig.duration;
  s.config(userConfig).config({
    curve: "linear",
    id: (p: StemPoint) => `${p.data.id}${STEM_KEY_SUFFIX}`,
    label: false,
    x: (p: StemPoint) => (p.end ? at(p).x : at(p).x0),
    y: (p: StemPoint) => (p.end ? at(p).y : at(p).y0),
  });
  return collectComputed(s).map(asStem);
}

/** The heads: Plot's Circle emitter, placed at each lollipop's value end. */
function emitHeads(
  ctx: ShapeEmitContext,
  rows: PlotDatum[],
  layouts: Map<PlotDatum, StemLayout>,
): SceneNode[] {
  const shapeConfig = markSharedConfig({
    ...ctx.shapeConfig,
    x: (d: PlotDatum) => layouts.get(d)!.x,
    y: (d: PlotDatum) => layouts.get(d)!.y,
  });
  return shapeEmitters.Circle(
    {...ctx, shapeConfig, values: rows as unknown as DataPoint[]},
    "Circle",
  );
}

/**
    Lollipop's emitter for its Bar rows: stems, then any error bars, then
    heads.
*/
export const lollipopEmit: ShapeEmitter = (ctx, key) => {
  const bars = shapeEmitters.Bar(ctx, key);
  const layouts = measure(ctx, bars);
  const rows = (ctx.values as unknown as PlotDatum[]).filter(d =>
    layouts.has(d),
  );
  const errorBars = bars.filter(n =>
    `${n.key}`.endsWith(CONFIDENCE_KEY_SUFFIX),
  );
  return [
    ...emitStems(ctx, rows, layouts),
    ...errorBars,
    ...emitHeads(ctx, rows, layouts),
  ];
};
