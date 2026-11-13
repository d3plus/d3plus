/**
    HorizonChart — a Plot of time series in short rows: each series' area is
    cut into equal value bands that fold down onto its row's baseline, each
    band a darker shade, with negative values mirrored upward in a
    contrasting hue. Every row shares one band size, so equal shades mean
    equal values.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneEvent} from "@d3plus/render";

import accessor from "../../utils/accessor.js";
import constant from "../../utils/constant.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import Plot from "../Plot/index.js";
import {sharePlotScales} from "../Plot/plotFacet.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {horizonEmit} from "./emit.js";
import {horizonBandSize} from "./horizonBands.js";
import {horizonPalette, type HorizonColorConfig} from "./horizonColors.js";
import {handleHorizonHover} from "./hover.js";
import {
  bandKeyRows,
  bandLabel,
  bandMeta,
  horizonState,
  rowValue,
  seriesId,
  valueFormat,
  type HorizonState,
  type RowFn,
} from "./state.js";

type Handler = (
  this: unknown,
  d: DataPoint,
  i: number,
  x?: unknown,
  event?: unknown,
) => void;

/** How many bands each sign is cut into. */
export function bandCount(viz: VizInstance): number {
  const n = Math.floor(Number(viz.schema.bands));
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

/**
    Takes over `y`: it reads each row's value (the chart's own `_y` places
    each row on its series' row), and a string names the field.
*/
function interceptY(viz: VizInstance, state: HorizonState): void {
  const host = viz as unknown as Record<string, unknown>;
  host.y = (...args: unknown[]) => {
    if (!args.length) return state.value;
    const [y] = args;
    state.value =
      typeof y === "function" ? (y as RowFn) : fieldAccessor(y as string);
    return viz;
  };
  viz._y = (d: DataPoint, i: number) => seriesId(viz, d, i);
}

/**
    After Plot's pre-draw: each series' order and label, the band size every
    row shares, the band colors, and the band key's rows.
*/
export function measureBands(viz: VizInstance): void {
  const state = horizonState(viz);
  const rows: DataPoint[] = viz._filteredData || [];
  const values: number[] = [];
  state.order = new Map();
  state.labels = new Map();
  let positive = false,
    negative = false;
  rows.forEach((d, i) => {
    const id = seriesId(viz, d, i);
    if (!state.order.has(id)) {
      state.order.set(id, state.order.size);
      state.labels.set(id, `${viz._drawLabel(d, i)}`);
    }
    const v = rowValue(viz, d, i);
    if (!Number.isFinite(v)) return;
    values.push(v);
    if (v > 0) positive = true;
    if (v < 0) negative = true;
  });
  const bands = bandCount(viz);
  state.size =
    Number(viz.schema.bandSize) > 0
      ? Number(viz.schema.bandSize)
      : horizonBandSize(values, bands);
  state.signs = {positive, negative};
  state.palette = horizonPalette(
    viz._theme,
    bands,
    viz.schema.colors as HorizonColorConfig | undefined,
    viz.schema.colorDefaults,
  );
  viz._legendData = bandKeyRows(state, bands);
}

/** Orders the rows as the series first appear in the data, first on top. */
function rowSort(viz: VizInstance) {
  return (a: DataPoint, b: DataPoint) => {
    const order = horizonState(viz).order;
    const at = (d: DataPoint) => order.get(seriesId(viz, d, 0)) ?? 0;
    return at(b) - at(a);
  };
}

/**
    The y axis: no gridlines, a half row of padding at each end so every
    row gets an equal share of the plot, and each tick labeled with its
    series' label.
*/
function configureRows(viz: VizInstance, state: HorizonState): void {
  state.sort = rowSort(viz);
  state.tickFormat = (d: unknown) => state.labels.get(`${d}`) ?? `${d}`;
  viz._yConfig = {
    ...viz._yConfig,
    gridConfig: {stroke: "transparent"},
    scalePadding: 0.5,
    tickFormat: state.tickFormat,
  };
}

/** The band key: one entry per shade, labeled with its range, that highlights its bands. */
function configureLegend(viz: VizInstance): void {
  const format = valueFormat(viz);
  const label = (d: DataPoint, i: number) => {
    const meta = bandMeta(d);
    return meta ? bandLabel(meta, format) : viz._drawLabel(d, i);
  };
  const legendConfig = viz.schema.legendConfig;
  viz.schema.legendConfig = {
    ...legendConfig,
    label,
    shapeConfig: {...(legendConfig.shapeConfig ?? {}), ariaLabel: label},
  };
  viz.schema.legendSort = () => 0;
  const shapeConfig = viz.schema.shapeConfig;
  const area = shapeConfig.Area ?? {};
  const fill = area.fill ?? shapeConfig.fill;
  shapeConfig.Area = {
    ...area,
    fill: (d: DataPoint, i: number) =>
      bandMeta(d)?.color ?? (typeof fill === "function" ? fill(d, i) : fill),
  };
  // Plot hides category ticks that repeat its Bar labels; there are no bars here.
  shapeConfig.Bar = {...(shapeConfig.Bar ?? {}), label: false};
  // A band key entry stands for a shade in every row: it has nothing to hide.
  delete viz.schema.on["click.legend"];
  const enter = viz.schema.on.mouseenter as Handler;
  viz.schema.on.mouseenter = function (
    this: unknown,
    d: DataPoint,
    i: number,
    x?: unknown,
    event?: unknown,
  ) {
    const meta = bandMeta(d);
    if (!meta) return enter.call(this, d, i, x, event);
    if (viz.schema.shapeConfig.hoverOpacity === 1) return;
    viz.hover!((h: DataPoint) => {
      const m = bandMeta(h);
      return !!m && m.sign === meta.sign && m.band === meta.band;
    });
  };
}

/**
    Small multiples' shared scales: the x axis and the band size are shared,
    but each panel draws only its own series' rows.
*/
export function shareHorizonScales(
  viz: VizInstance,
  panels: DataPoint[][],
): ReturnType<typeof sharePlotScales> {
  const shared = sharePlotScales(viz, panels);
  delete shared.domains.y;
  delete shared.padded.y;
  return shared;
}

export const horizonChartDef: ChartDefinition = {
  name: "HorizonChart",
  paintDriven: true,
  // Panels hold different series, so every panel labels its rows.
  facet: {aspect: 2, axes: {y: "all"}, share: shareHorizonScales},

  setup: viz => {
    const state: HorizonState = {
      value: accessor("y"),
      size: 0,
      palette: {positive: [], negative: []},
      signs: {positive: false, negative: false},
      order: new Map(),
      labels: new Map(),
    };
    viz.ctx.horizon = state;
    interceptY(viz, state);
    configureRows(viz, state);
    configureLegend(viz);
    viz._plotShapeEmitters = {...viz._plotShapeEmitters, Area: horizonEmit};
    viz._crosshairFullSpan = true;
    (
      viz as VizInstance & {_sharedHover: (e: SceneEvent) => void}
    )._sharedHover = e => handleHorizonHover(viz, e);
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      if (!viz.schema.ySort || viz.schema.ySort === state.sort)
        viz.schema.ySort = state.sort;
      preDraw();
      measureBands(viz);
    };
  },

  ctx: {},

  fields: [
    /**
        How many bands each sign of a series is cut into. Each band spans
        the same range of values (see `bandSize`) and folds down onto the
        row's baseline, a darker shade than the band below it.
    */
    {key: "bands", default: 3},
    /**
        The range of values each band spans. Defaults to the largest absolute
        value across every row divided by `bands`, so every row shares one
        scale and the tallest value fills the top band; values past the top
        band fill it.
    */
    {key: "bandSize"},
    /**
        The band colors: `positive` and `negative`, each a base color to ramp
        from pale (the band nearest zero) to the base, or a list of colors
        from the band nearest zero up. Defaults to ramps toward the theme's
        colorScale poles: its `max` color for positive values and its `min`
        color for negative values, which are mirrored upward.
        @type {{positive?: string | string[], negative?: string | string[]}}
    */
    {key: "colors"},
    {key: "discrete", default: "x"},
    /** The space between rows, in pixels. */
    {key: "rowGap", default: 1},
    {key: "shape", default: constant("Area"), coerce: "const"},
  ],
};

/**
    Creates a horizon chart from time series rows (the same rows a LinePlot
    takes): each `groupBy` series gets a short row of its own, labeled on
    the y axis, with its `y` values cut into `bands` equal bands folded onto
    the row's baseline and shaded darker the higher they reach. Negative
    values are mirrored upward in a contrasting hue, and every row shares one
    band size. Hovering shows every row's value at the nearest `x`, and the
    legend is a key to the bands' value ranges.
*/
export default makeChart(horizonChartDef, Plot);
