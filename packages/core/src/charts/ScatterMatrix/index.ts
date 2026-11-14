/**
    ScatterMatrix — a scatter plot for every pair of `dimensions`, on a
    square grid of small multiples, with each dimension's histogram on the
    diagonal.
*/

import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {warnConfigOnce} from "../../utils/configWarnings.js";
import {resolveAlluvialDimensions} from "../Alluvial/dimensions.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import {makeChart} from "../definition/makeChart.js";
import {detectDimensions} from "../ParallelCoordinates/dimensions.js";
import {drawnRawRows} from "../pipeline/preDrawData.js";
import Scatter from "../Scatter/index.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {MATRIX_BIN, matrixBinEmit} from "./binEmit.js";
import {
  cellIndex,
  MATRIX_ID,
  matrixBins,
  matrixDomains,
  matrixMeta,
  matrixPoints,
  type RowFn,
} from "./matrixData.js";
import {matrixFacetHooks, type MatrixAxes} from "./matrixFacet.js";
import {matrixHoverFilter} from "./matrixHover.js";
import {
  matrixTooltipRows,
  matrixTooltipTitle,
  type MatrixTooltipContext,
} from "./matrixTooltip.js";

/** What a ScatterMatrix keeps between its data prep and its draw. */
export interface MatrixState {
  /** The user's observations. */
  raw: DataPoint[];
  /** The panel rows last written to `viz._data`. */
  rows: DataPoint[];
  /** The bin rows among `rows`, binned from observations that passed `filter`. */
  binned: Set<DataPoint>;
  /** The user's `groupBy` levels, without the observation level the chart adds. */
  groupBy: RowFn[];
  /** Whether the user's `groupBy` sorts the observations into groups. */
  grouped: boolean;
  /** Each observation's (or bin row's) own `groupBy` level. */
  observation: RowFn;
  /** Each row's group key: its values on the user's `groupBy` levels. */
  group: (d: DataPoint, i: number) => string;
  /** The dimensions drawn, in matrix order. */
  dims: {accessor: RowFn; title: string}[];
  axes: MatrixAxes;
}

/** The chart's matrix state. */
export const matrixState = (viz: VizInstance) =>
  viz.ctx.scatterMatrix as MatrixState;

/**
    The dimensions to draw: `dimensions` when set (keys, accessors, or
    `{value, title}` objects), else every numeric key in the data except
    the `groupBy` keys and `id`.
*/
export function matrixDimensions(
  viz: VizInstance,
  raw: DataPoint[],
): {accessor: RowFn; title: string}[] {
  const set = viz.schema.dimensions;
  if (Array.isArray(set))
    return resolveAlluvialDimensions(set).map(d => ({
      accessor: d.accessor as RowFn,
      title: d.title,
    }));
  const rawGroupBy = (viz as VizInstance & {_groupByRaw?: unknown})._groupByRaw;
  const keys = (Array.isArray(rawGroupBy) ? rawGroupBy : [rawGroupBy]).filter(
    (k): k is string => typeof k === "string",
  );
  return detectDimensions(raw, ["id", ...keys]).map(key => ({
    accessor: (d: DataPoint) => d[key],
    title: key,
  }));
}

/**
    Spreads the observations into panel rows before Plot's pre-draw: a
    point in every off-diagonal panel, and the diagonal's histogram bins
    (binned from the rows in the selected period that pass `filter`). Adds
    the observation level to `groupBy`, points `facet` at each row's panel,
    and sizes the grid to the dimensions.
*/
export function prepareMatrix(viz: VizInstance): void {
  const state = matrixState(viz);
  if (viz._data !== state.rows) state.raw = viz._data;
  viz._sourceData = state.raw;
  const groupBy = viz.schema.groupBy as RowFn[];
  if (groupBy[groupBy.length - 1] !== state.observation)
    state.groupBy = groupBy;
  state.grouped = state.groupBy.some(g =>
    state.raw.some((d, k) => g(d, k) !== undefined),
  );
  viz.schema.groupBy = [...state.groupBy, state.observation];

  const dims = matrixDimensions(viz, state.raw);
  if (dims.length < 2)
    warnConfigOnce(
      viz,
      "scatterMatrixDimensions",
      `ScatterMatrix needs at least two numeric dimensions, but has ${dims.length}. Set \`dimensions\` to the data keys to compare.`,
    );
  state.dims = dims;
  const accessors = dims.map(d => d.accessor);
  const {drawn} = drawnRawRows(viz, state.raw);
  const row = viz.schema.translate("Row");
  const idOf = (k: number) => `${row} ${k + 1}`;
  const index = new Map(state.raw.map((d, k) => [d, k]));
  // The histograms count the observations legend clicks leave shown.
  const shown = (d: DataPoint) => {
    const id = idOf(index.get(d) ?? -1);
    return (
      !viz._hidden.includes(id) && (!viz._solo.length || viz._solo.includes(id))
    );
  };
  const bins = matrixBins(
    drawn,
    accessors,
    state.group,
    viz.schema.binThresholds as number | number[] | undefined,
    shown,
  );
  state.binned = new Set(bins);
  state.rows = viz._data = [
    ...matrixPoints(state.raw, accessors, idOf),
    ...bins,
  ];
  state.axes = {
    titles: dims.map(d => d.title),
    domains: matrixDomains(drawn, accessors),
  };

  const n = dims.length;
  viz.schema.facet = (d: DataPoint) => {
    const meta = matrixMeta(d);
    return meta ? cellIndex(meta.i, meta.j, n) : undefined;
  };
  viz.schema.facetConfig = {
    ...(viz.schema.facetConfig ?? {}),
    columns: n,
    rows: n,
  };
}

/** What the tooltips read from the chart. */
export function matrixTooltipContext(viz: VizInstance): MatrixTooltipContext {
  const state = matrixState(viz);
  return {
    dims: state.dims,
    groupDepth: state.grouped ? state.groupBy.length : 0,
  };
}

/**
    The chart's `color`: by the user's `groupBy` when the data has groups,
    else the first color of the chart's categorical palette for every mark.
*/
export function matrixColor(
  viz: VizInstance,
  base: RowFn,
): (d: DataPoint, i: number) => unknown {
  return (d, i) =>
    matrixState(viz)?.grouped
      ? base(d, i)
      : (viz.schema.colorDefaults as ColorDefaults).scale.range()[0];
}

/** A panel row's own `groupBy` value: its observation's id ("Row 4"), or its bin's. */
export const matrixObservation: RowFn = d => d[MATRIX_ID];

export const scatterMatrixDef: ChartDefinition = {
  name: "ScatterMatrix",
  paintDriven: true,
  facet: matrixFacetHooks,
  tableData: viz => matrixState(viz).raw,

  setup: viz => {
    const state: MatrixState = {
      raw: [],
      rows: [],
      binned: new Set(),
      groupBy: viz.schema.groupBy as RowFn[],
      grouped: false,
      observation: matrixObservation,
      group: (d, k) => state.groupBy.map(g => `${g(d, k)}`).join("_"),
      dims: [],
      axes: {titles: [], domains: []},
    };
    viz.ctx.scatterMatrix = state;
    // `filter` selects observations before they're binned, so the
    // pipeline doesn't run it on the bins.
    viz._filterApplied = d => state.binned.has(d);
    viz._plotShapeEmitters = {[MATRIX_BIN]: matrixBinEmit};
    viz._x = d => matrixMeta(d)?.x ?? NaN;
    viz._y = d => matrixMeta(d)?.y ?? NaN;
    // The tooltip lists the observation's values on every dimension.
    viz._tooltipAxisRows = false;
    viz.schema.color = matrixColor(viz, viz.schema.color);
    // Each axis spans its dimension's values, not rounded out to its ticks.
    viz._xConfig = {...viz._xConfig, rounding: "none"};
    viz._yConfig = {...viz._yConfig, rounding: "none"};
    // Each panel is named by its axes' titles, not a panel title.
    viz.schema.facetConfig = {padding: 10, title: false};
    // Hovering a point highlights its observation in every panel; hovering
    // a bar, the observations in its bin.
    const baseMouseMove = viz.schema.on["mousemove.shape"];
    viz.schema.on["mousemove.shape"] = (
      d: DataPoint,
      i: number,
      x: unknown,
      event: unknown,
    ) => {
      baseMouseMove(d, i, x, event);
      if (viz.schema.shapeConfig.hoverOpacity === 1) return;
      const filter = matrixHoverFilter(
        d,
        state.dims.map(dim => dim.accessor),
        state.group,
      );
      if (filter)
        (viz as VizInstance & {hover: (fn: typeof filter) => unknown}).hover(
          filter,
        );
    };
    const preDraw = viz._preDraw.bind(viz);
    viz._preDraw = () => {
      prepareMatrix(viz);
      preDraw();
    };
  },

  ctx: {},

  fields: [
    /** ScatterMatrix draws no axis hover badges: a point's tooltip lists its value on every dimension. */
    {key: "axisHover", default: false},
    /**
        The diagonal histograms' bin edges: a bin count, or an array of
        interior edges. Defaults to Sturges' rule.
        @type {number | number[]}
    */
    {key: "binThresholds"},
    /**
        Above this many observations, hovering stops dimming the other
        marks and redraws skip their transitions. Raised from the usual 100,
        since following one observation across the panels is what hovering
        is for.
    */
    {key: "dataCutoff", default: 2000},
    /**
        The data keys to compare, in order: a key, an accessor, or a
        `{value, title}` object for each. Defaults to every numeric key in
        the data except the `groupBy` keys and `id`.
        @type {Array<string | function | {value: string | function, title?: string}>}
    */
    {key: "dimensions"},
    {
      key: "legend",
      coerce: "const",
      factory: (viz: VizInstance) => {
        const base = viz.schema.legend as (
          config: VizInstance,
          arr: DataPoint[],
        ) => unknown;
        // The legend lists the groups, and there's none without them.
        return (config: VizInstance, arr: DataPoint[]) =>
          matrixState(viz)?.grouped ? base.call(viz, config, arr) : false;
      },
    },
    {
      key: "shape",
      default: (d: DataPoint) =>
        matrixMeta(d)?.kind === "bin" ? MATRIX_BIN : "Circle",
      coerce: "const",
    },
    /**
        ScatterMatrix's points are 3 pixels in radius, so a panel's points
        stay apart, and carry no labels (the tooltip names them).
    */
    {
      key: "shapeConfig",
      merge: true,
      default: {Circle: {label: false, r: 3}},
    },
    {
      key: "tooltipConfig",
      merge: true,
      factory: (viz: VizInstance) => ({
        title: (d: DataPoint, i: number) =>
          matrixTooltipTitle(viz, matrixTooltipContext(viz), d, i),
        tbody: (d: DataPoint, i: number) =>
          matrixTooltipRows(viz, matrixTooltipContext(viz), d, i),
      }),
    },
  ],
};

/**
    Creates a scatter plot matrix from an array of data: a square grid of
    small multiples with a scatter plot for every pair of `dimensions`
    (each row of data a point in every panel), and each dimension's
    histogram on the diagonal. Every panel in a row shares its y axis, and
    every panel in a column its x axis, labeled and titled along the grid's
    left and bottom edges. `groupBy` colors the observations and stacks the
    histograms by group, with a legend; hovering a point highlights its
    observation in every panel, and its tooltip lists the observation's
    value on every dimension. `dimensions` defaults to every numeric key in
    the data.
*/
export default makeChart(scatterMatrixDef, Scatter);
