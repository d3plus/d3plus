/**
    Hexbin's Plot shape emitter: the observations binned in pixel space and
    drawn as hexagons or squares, with optional density contours and the raw
    observations beneath. Bins and contours are Paths stamped as `"Hexbin"`
    marks, each carrying a bin or contour row as its datum, so tooltips,
    hover, events and keyboard navigation treat them like any other mark.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {
  collectComputed,
  makeShape,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {PlotDatum} from "../features/plotPaint.js";
import type {ShapeEmitContext, ShapeEmitter} from "../features/shapeEmit.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {binPoints, type PixelPoint} from "./binning.js";
import {
  binRows,
  binsInView,
  contourRows,
  hexbinState,
  plotFrame,
  pointPath,
  refreshColorScale,
  sharedColorRows,
  type PlotFrame,
} from "./layers.js";
import {binAriaLabel, contourAriaLabel} from "./tooltip.js";
import {
  HEXBIN_SHAPE,
  hexbinMeta,
  hexbinSettings,
  type HexbinSettings,
} from "./settings.js";

/** An axis's pixel-to-value function for this paint, or `NaN` without one. */
function pixelInverse(
  viz: VizInstance,
  axis: "x" | "y",
  offset: number,
): (px: number) => number {
  const scale = (axis === "x" ? viz._xAxis : viz._yAxis)?._d3Scale;
  return px =>
    scale && scale.invert ? Number(scale.invert(px + offset)) : NaN;
}

/** The observations of a shape group, placed in pixels. */
export function pixelPoints(
  ctx: Pick<ShapeEmitContext, "x" | "y" | "values">,
  settings: Pick<HexbinSettings, "weight">,
): PixelPoint[] {
  const rows = ctx.values as unknown as PlotDatum[];
  const {weight} = settings;
  return rows.map(d => ({
    x: ctx.x(d.x),
    y: ctx.y(d.y),
    row: d.data,
    weight: weight ? Number(weight(d.data, d.i)) : undefined,
  }));
}

/** The paint a level's contour takes: colored by level, filled with an opacity ramp. */
function contourStyle(
  viz: VizInstance,
  settings: HexbinSettings,
  fill: (d: DataPoint, i: number) => unknown,
): Record<string, unknown> {
  const {strokeWidth, fillOpacity} = settings.contourConfig;
  const overBins = Boolean(settings.shape);
  const ramp = (d: DataPoint) => {
    const meta = hexbinMeta(d);
    return meta && meta.kind === "contour"
      ? (fillOpacity * (meta.index + 1)) / meta.levels
      : fillOpacity;
  };
  if (settings.contours === "filled")
    return {fillOpacity: ramp, stroke: fill, strokeWidth: 0};
  // Lines over bins take the chart's ink, so they show against the bins'
  // colors. The fill stays, invisible, so a region hovers anywhere inside.
  return {
    fillOpacity: 0,
    stroke: overBins ? () => backgroundInk(viz) : fill,
    strokeWidth,
  };
}

/** Draws bin or contour rows as `"Hexbin"` Paths. */
function emitPaths(
  ctx: ShapeEmitContext,
  rows: DataPoint[],
  style: (base: Record<string, unknown>) => Record<string, unknown>,
  interactive: boolean,
): SceneNode[] {
  if (!rows.length) return [];
  const {viz} = ctx;
  const base = shapeConfigFor(viz, HEXBIN_SHAPE);
  const path = makeShape("Path")
    .renderMode("compute")
    .config(base)
    .config(style(base))
    .config({
      ariaLabel: (d: DataPoint) =>
        hexbinMeta(d)?.kind === "contour"
          ? contourAriaLabel(viz, d)
          : binAriaLabel(viz, d),
      d: (d: DataPoint) => hexbinMeta(d)?.path ?? "",
      id: (d: DataPoint) => d.id,
      label: false,
      x: 0,
      y: 0,
    })
    .data(rows);
  if (interactive) viz._wirePlotShapeEvents!(path, HEXBIN_SHAPE, ctx.events);
  return collectComputed(path).map(
    node =>
      ({
        ...node,
        shapeType: HEXBIN_SHAPE,
        ...(interactive ? {} : {interactive: false}),
      }) as SceneNode,
  );
}

/** The observations as one inert path of dots beneath the bins and contours. */
function emitPoints(
  viz: VizInstance,
  points: PixelPoint[],
  settings: HexbinSettings,
): SceneNode[] {
  const d = pointPath(points, settings.pointConfig.r);
  if (!d) return [];
  return [
    {
      type: "path",
      key: "hexbin-points",
      d,
      interactive: false,
      aria: {hidden: true},
      paint: {
        fill: settings.pointConfig.fill ?? backgroundInk(viz),
        fillOpacity: settings.pointConfig.fillOpacity,
      },
    },
  ];
}

/** Where the bin grid is anchored: the smallest observation, so a pan moves the grid with the data. */
function gridOrigin(ctx: ShapeEmitContext, frame: PlotFrame): [number, number] {
  const anchor = hexbinState(ctx.viz).anchor;
  const ox = anchor ? ctx.x(anchor[0]) : NaN;
  const oy = anchor ? ctx.y(anchor[1]) : NaN;
  return [
    Number.isFinite(ox) ? ox : frame.left,
    Number.isFinite(oy) ? oy : frame.top + frame.height,
  ];
}

/**
    Emits a Hexbin's observations: the raw points (`points`), the bins
    (`binShape`), then the density contours (`contours`). Each paint, zoomed
    or not, refits the colorScale to the bins in view (or the contour
    levels), so the fills and the colorScale agree and the densest bin in
    view takes the top color.
*/
export const hexbinEmit: ShapeEmitter = (ctx: ShapeEmitContext) => {
  const {viz} = ctx;
  const settings = hexbinSettings(viz);
  const frame = plotFrame(ctx);
  const points = pixelPoints(ctx, settings);
  const invert = {
    x: pixelInverse(viz, "x", 0),
    y: pixelInverse(viz, "y", ctx.x2Height ?? 0),
  };
  const origin = gridOrigin(ctx, frame);
  const pixelBins = settings.shape
    ? binPoints(points, {shape: settings.shape, size: settings.size, origin})
    : [];
  const bins = binRows(pixelBins, settings, invert);
  const contours = settings.contours
    ? contourRows(points, frame, settings)
    : [];
  const inView = new Set(
    binsInView(pixelBins, frame, settings).map(b => `bin-${b.key}`),
  );
  refreshColorScale(
    viz,
    sharedColorRows(
      ctx,
      settings.shape ? bins.filter(r => inView.has(String(r.id))) : contours,
      frame,
      origin,
      settings,
    ),
  );

  const fillOf = (base: Record<string, unknown>) => {
    const fill = base.fill;
    return (d: DataPoint, i: number) =>
      typeof fill === "function" ? fill(d, i) : fill;
  };
  return [
    ...(settings.points ? emitPoints(viz, points, settings) : []),
    ...emitPaths(ctx, bins, () => ({}), true),
    ...emitPaths(
      ctx,
      contours,
      base => contourStyle(viz, settings, fillOf(base)),
      !settings.shape,
    ),
  ];
};
