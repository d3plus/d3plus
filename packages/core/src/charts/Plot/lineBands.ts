/**
    A line's `confidence` bands: one Area per band around each line, drawn
    outermost first. A lone band takes `confidenceConfig` as is; nested bands
    each take their layer of the `bandOpacity` ramp.
*/
import type {DataPoint} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext} from "../features/shapeEmit.js";
import {markSharedConfig} from "../../utils/configWarnings.js";
import {
  bandOpacityTargets,
  boundOrValue,
  confidenceBands,
  layerOpacities,
} from "./confidenceBands.js";

/** `confidenceConfig` keys that style error bars, tooltips, or the ramp rather than the band's Area. */
const NON_AREA_KEYS = ["bandOpacity", "capWidth", "tooltip"];

/**
    The scene nodes for every line's confidence bands, outermost first.
    @param ctx The Line shape group's emit context.
*/
export function emitLineBands(ctx: ShapeEmitContext): SceneNode[] {
  const {viz, x, y, values} = ctx;
  const bands = confidenceBands(viz);
  if (!bands.length) return [];
  const discrete = viz.schema.discrete || "x";
  const key = discrete === "x" ? "y" : "x";
  const scaleFunction = discrete === "x" ? y : x;
  // Fresh object — must NOT mutate the shared `shapeConfig`, or the confidence
  // fill/fillOpacity leak onto every other shape and every later render.
  const confidenceConfig = Object.assign(
    {},
    viz.schema.shapeConfig,
    viz._confidenceConfig,
  );
  const bandConfig = assign(
    shapeConfigFor(viz, "Line", confidenceConfig),
    shapeConfigFor(viz, "Area", confidenceConfig),
  );
  NON_AREA_KEYS.forEach(k => delete bandConfig[k]);
  const nested = bands.length > 1;
  const opacities = nested
    ? layerOpacities(
        bandOpacityTargets(viz._confidenceConfig?.bandOpacity, bands.length),
      )
    : [];

  const out: SceneNode[] = [];
  bands.forEach((band, k) => {
    const bound = (
      accessor: typeof band.lower,
      d: PlotDatum,
      fallback: unknown,
    ) =>
      scaleFunction(
        accessor ? boundOrValue(accessor(d.data, d.i), fallback) : fallback,
      );
    const areaConfig: Record<string, unknown> = markSharedConfig(
      Object.assign({}, ctx.shapeConfig),
    );
    areaConfig[`${key}0`] = (d: PlotDatum) => bound(band.lower, d, d[key]);
    areaConfig[`${key}1`] = (d: PlotDatum) => bound(band.upper, d, d[key]);
    // The first band keeps its line's id, so adding inner bands leaves it in place.
    if (k) areaConfig.id = (d: PlotDatum) => `${d.id}::band-${k}`;
    const area = makeShape("Area")
      .renderMode("compute")
      .config(areaConfig)
      .data(values as DataPoint[]);
    area.config(bandConfig);
    if (nested) area.config({fillOpacity: opacities[k]});
    area.render();
    out.push(...collectComputed(area));
  });
  return out;
}
