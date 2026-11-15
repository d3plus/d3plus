/**
    DotPlot — a Wilkinson dot plot: a Plot in swarm mode whose circles are
    laid out in stacks along the value axis (see `placements.ts`), one dot
    per row (or per `unit` of `value`).
*/

import type {DataPoint} from "@d3plus/data";

import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {valueField} from "../helpers/valueTitle.js";
import Plot from "../Plot/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {expandUnit} from "./dotLayout.js";
import {settleFacetSize, trackFacetSize} from "./facetSize.js";
import {dotPlacements} from "./placements.js";
import {dotTooltipRows, dotTooltipTitle} from "./tooltip.js";

/** Per-instance state kept on `viz.ctx.dotPlot`. */
interface DotPlotState {
  /** The user's rows. */
  raw: DataPoint[];
  /** The rows last written to `viz._data` (one per dot, with `unit`). */
  rows: DataPoint[];
  /** Each dot row's source row, with `unit`. */
  source: Map<DataPoint, DataPoint>;
}

const positive = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) && v > 0 ? v : undefined;

/** Walks Plot's `__d3plus__` wrappers down to the drawn row. */
function dotRow(d: DataPoint): DataPoint {
  while (d && d.__d3plus__ && d.data) d = d.data as DataPoint;
  return d;
}

/** The row a dot came from: its source row with `unit`, else the row itself. */
export function sourceRow(viz: VizInstance, d: DataPoint): DataPoint {
  const row = dotRow(d);
  const state = viz.ctx.dotPlot as DotPlotState;
  return state.source.get(row) ?? row;
}

/**
    With `unit`, turns each user row into one row per dot before Plot's
    pre-draw; without it, the user's rows draw as they are.
*/
function dotsBeforePreDraw(viz: VizInstance): void {
  const state = viz.ctx.dotPlot as DotPlotState;
  if (viz._data !== state.rows) state.raw = viz._data;
  const unit = positive(viz.schema.unit);
  if (!unit) {
    state.source = new Map();
    state.rows = viz._data = state.raw;
    return;
  }
  viz._sourceData = state.raw;
  const value = viz.schema.value as (d: DataPoint, i: number) => unknown;
  const out = expandUnit(state.raw, value, unit);
  state.source = out.source;
  state.rows = viz._data = out.rows;
}

export const dotPlotDef: ChartDefinition = {
  name: "DotPlot",
  paintDriven: true,

  setup: viz => {
    viz.ctx.dotPlot = {
      raw: [],
      rows: [],
      source: new Map(),
    } satisfies DotPlotState;
    // Ungrouped dots take the first palette color rather than the missing
    // data gray.
    viz.schema.color = (d: DataPoint, i: number) =>
      viz.schema.groupBy[0](d, i) ?? viz.schema.translate("Value");
    // Every row is its own dot, whatever its groupBy id.
    viz._unmergedShapes = ["Circle"];
    viz._swarmPlacements = dotPlacements;
    // Hovering a dot highlights the dots of its row; legend hover still
    // highlights the whole group.
    const baseMouseMoveShape = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (
      d: DataPoint,
      i: number,
      x: unknown,
      event: unknown,
    ) => {
      baseMouseMoveShape(d, i, x, event);
      if (viz.schema.shapeConfig.hoverOpacity === 1) return;
      const target = sourceRow(viz, d);
      type HoverFn = (fn: (h: DataPoint) => boolean) => unknown;
      (viz as VizInstance & {hover: HoverFn}).hover(
        (h: DataPoint) => sourceRow(viz, h) === target,
      );
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      dotsBeforePreDraw(viz);
      preDraw();
    };
    const draw = viz._draw.bind(viz);
    viz._draw = (callback?: () => void) => {
      trackFacetSize(viz);
      return draw(callback);
    };
  },

  // Small multiples share one dot size: the smallest any panel fits.
  facet: {redraw: settleFacetSize},

  ctx: {},

  fields: [
    /**
        Stacks are swept this many data units wide along the value axis.
        Defaults to one dot's diameter, so stacks never overlap their
        neighbors by more than the stacking itself moves them; with a
        `binWidth`, the dots shrink to fit the bins.
        @type {number}
    */
    {key: "binWidth"},
    /**
        A fixed dot radius, in pixels. Defaults to the largest dot (up to 10
        pixels) at which the tallest stack fits its row (or the chart's
        height); larger dots make wider stacks, which hold more dots.
        @type {number}
    */
    {key: "dotRadius"},
    {key: "shape", default: constant("Circle"), coerce: "const"},
    // Dots are too small to carry labels, and restacking moves them short
    // distances that would leave motion trails.
    {
      key: "shapeConfig",
      merge: true,
      default: {Circle: {label: false, trail: false}},
    },
    /**
        Where each stack's dots pile: `"up"` (default) from the baseline of
        its row (or of the chart), away from the value axis, or `"center"`,
        spread evenly on both sides of the row's center.
        @type {"up" | "center"}
    */
    {key: "stackDirection", default: "up"},
    /**
        DotPlot stacks its circles (`true`): along x when its values are
        numeric, else along y.
        @type {boolean | "x" | "y"}
    */
    {key: "swarm", default: true},
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => {
        const row = (d: DataPoint) => sourceRow(viz, d);
        return {
          title: dotTooltipTitle(viz, row),
          tbody: dotTooltipRows(viz, row),
        };
      },
    },
    // A stack holds many dots; each tooltip names one.
    {key: "tooltipShared", default: false},
    /**
        What one dot stands for, in units of `value`: each row draws
        `round(value / unit)` dots instead of one.
        @type {number}
    */
    {key: "unit"},
    /**
        Accessor function or string key for each row's value, which `unit`
        turns into dots.
        @type {string | function}
    */
    valueField(),
  ],
};

/**
    Creates a dot plot from an array of data: each row draws as one dot at its
    value along the `x` axis (or `y`), and the dots are swept into stacks one
    dot wide (Wilkinson's dot-density algorithm), each stack at the mean of
    its values. Set the other axis to a categorical key to stack each
    category on its own row, `groupBy` to color the dots (each stack lists its
    groups in the same order), `stackDirection` to center the stacks, and
    `unit` to draw one dot per `unit` of a `value` column.
*/
export default makeChart(dotPlotDef, Plot);
