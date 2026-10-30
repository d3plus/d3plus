/**
    Hexbin — a Plot of 2D binned density: raw observations on two continuous
    axes, grouped into hexagons (or squares) of a fixed pixel size and
    colored by how many each holds, with optional density contours.
*/

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import {chartBackground} from "../viz/backgroundInk.js";
import {optionalAccessor} from "../viz/vizFields.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {hexbinBuffer} from "./buffer.js";
import {hexbinEmit} from "./emit.js";
import {
  colorScaleRows,
  hexbinState,
  isNumeric,
  noteDrawRows,
  type HexbinState,
} from "./layers.js";
import {
  BIN_SIZE,
  CONTOUR_DEFAULTS,
  HEXBIN_SHAPE,
  POINT_DEFAULTS,
  hexbinMeta,
  hexbinValue,
  unwrapHexbinRow,
} from "./settings.js";
import {hexbinTooltipRows, hexbinTooltipTitle} from "./tooltip.js";

type HoverHandler = (d: DataPoint, i: number, ...rest: unknown[]) => void;

/**
    Keeps the rows with numeric x and y as the chart's data; the rest are
    skipped. The user's rows stay the chart's source data.
*/
export function keepNumericRows(viz: VizInstance): void {
  const state = hexbinState(viz);
  if (viz._data !== state.rows) state.raw = viz._data;
  viz._sourceData = state.raw;
  const valid = state.raw.filter(
    (d, i) => isNumeric(viz._x!(d, i)) && isNumeric(viz._y!(d, i)),
  );
  state.rows = viz._data =
    valid.length === state.raw.length ? state.raw : valid;
}

/** Hovering a bin or contour highlights just that mark. */
function installHover(viz: VizInstance): void {
  const base = viz.schema.on.mouseenter as HoverHandler;
  viz.schema.on.mouseenter = (d: DataPoint, i: number, ...rest: unknown[]) => {
    if (!hexbinMeta(d) || viz.schema.shapeConfig.hoverOpacity === 1)
      return base(d, i, ...rest);
    const target = unwrapHexbinRow(d);
    viz._hoverBucket = false;
    viz.hover!((h: DataPoint) => unwrapHexbinRow(h) === target);
  };
}

export const hexbinDef: ChartDefinition = {
  name: "Hexbin",
  paintDriven: true,

  setup: viz => {
    viz.ctx.hexbin = {raw: [], rows: []} satisfies HexbinState;
    viz._buffer = {...viz._buffer, [HEXBIN_SHAPE]: hexbinBuffer};
    viz._plotShapeEmitters = {[HEXBIN_SHAPE]: hexbinEmit};
    // Every observation is binned on its own, whatever its groupBy id.
    viz._unmergedShapes = [HEXBIN_SHAPE];
    // The colorScale reads the bins, which are measured in the plot area.
    viz._colorScaleRows = () => colorScaleRows(viz);
    // The tooltip's own rows give a bin's ranges.
    viz._tooltipAxisRows = false;
    // A bin has no single point to snap a tooltip to.
    (viz as VizInstance & {_sharedHover: () => void})._sharedHover = () =>
      undefined;
    installHover(viz);
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      keepNumericRows(viz);
      preDraw();
    };
    const draw = viz._draw.bind(viz);
    viz._draw = (callback?: () => void) => {
      // Small-multiples panels share the grid anchor and colorScale noted
      // from every panel's rows.
      if (viz._facetStep !== "panel") noteDrawRows(viz);
      return draw(callback);
    };
  },

  ctx: {},

  fields: [
    /**
        The bin shape: `"hex"` (default) for hexagons, `"square"` for
        squares, or `false` to draw no bins (for contours alone).
        @type {"hex" | "square" | false}
    */
    {key: "binShape", default: "hex"},
    /**
        The bin size in pixels: a hexagon's radius, or a square's side.
        Bins keep this size at any zoom, and the observations are binned
        again for each view. Defaults to 12.
    */
    {key: "binSize", default: BIN_SIZE},
    /**
        What each bin measures, which its color shows: `"count"` (default),
        the number of observations in the bin; or `{value, agg, label}`,
        the `"sum"` (default) or `"mean"` of `value` (a data key or
        accessor) over the bin's observations, named `label` in the
        tooltip.
        @type {"count" | {value: string | function, agg?: "sum" | "mean", label?: string}}
    */
    {key: "binValue", default: "count"},
    /**
        Draws density contours: `"lines"` (or `true`) outlines each density
        level in its color, and `"filled"` fills each level with an opacity
        ramp. Levels are in observations per bin (the count a bin would hold
        there), so contours share the bins' colorScale. Contours over bins
        are drawn in the chart's text color and don't take hover. Defaults to
        `false`.
        @type {boolean | "lines" | "filled"}
    */
    {key: "contours", default: false},
    /**
        Contour options: `bandwidth`, the density kernel's standard deviation
        in pixels (default 20); `thresholds`, about how many levels to draw
        (default 8, rounded to nice values) or the levels themselves;
        `strokeWidth`, the outline width of `"lines"` (default 1.5); and
        `fillOpacity`, the opacity of the highest `"filled"` level (default
        0.8).
        @type {{bandwidth?: number, thresholds?: number | number[], strokeWidth?: number, fillOpacity?: number}}
    */
    {key: "contourConfig", merge: true, default: CONTOUR_DEFAULTS},
    /** Draws the raw observations as small dots beneath the bins and contours. Defaults to `false`. */
    {key: "points", default: false},
    /**
        The raw observations' style: `r`, the dot radius in pixels (default
        1.5); `fill` (defaults to the chart's text color); and `fillOpacity`
        (default 0.35).
        @type {{r?: number, fill?: string, fillOpacity?: number}}
    */
    {key: "pointConfig", merge: true, default: POINT_DEFAULTS},
    {key: "colorScale", coerce: optionalAccessor, default: hexbinValue},
    {key: "legend", default: false, coerce: "const"},
    {key: "shape", default: constant(HEXBIN_SHAPE), coerce: "const"},
    /**
        Bins are outlined in the chart's background color, so neighbors stay
        distinct.
    */
    {
      key: "shapeConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        [HEXBIN_SHAPE]: {
          stroke: () => chartBackground(viz),
          strokeWidth: constant(0.5),
        },
      }),
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint) => hexbinTooltipTitle(viz, d),
        tbody: (d: DataPoint) => hexbinTooltipRows(viz, d),
      }),
    },
  ],
};

/**
    Creates a 2D binned density chart from raw observations: each row is a
    point at its `x` and `y` values (rows without numeric values are
    skipped), and the points are grouped into hexagons (`binShape`) of
    `binSize` pixels, colored on the colorScale by how many each holds (or by
    `binValue`). Empty bins aren't drawn. `contours` adds density contours,
    and `points` draws the observations beneath. `groupBy` names the
    observations for `filter` and the legend (off by default), and `facet`
    bins each panel on its own, on one shared colorScale.
*/
export default makeChart(hexbinDef, Plot);
