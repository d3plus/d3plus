/**
    Plot's chart-specific pipeline stages + the `plotDef` value.

    Each `formatPlotData` / `computePlotAxisValues` / `extendPlotOppScales`
    / `preparePlotAxisLayout` / `measurePlotLineLabels` /
    `computePlotInitialDomains` / `computePlotScales` is a pure-ish
    `TransformStage` that the Plot class threads through `runStages`. The
    `plotDef` at the bottom is the ChartDefinition value Plot's subclasses
    (BarChart / AreaPlot / LinePlot / etc.) inherit defaults + features
    from.
*/
import {date} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import {merge as d3plusMerge, unique} from "@d3plus/data";
import {extent, groups, min, rollups} from "d3-array";

import discreteBufferFn from "../plotBuffers/discreteBuffer.js";
import {applyBarWidths, shareAxis} from "./barWidth.js";
import {discreteDomainCategories} from "./discreteDomain.js";
import {extraBandValues} from "./confidenceBands.js";
import {applySwarmLanes, resolveSwarm} from "./swarm.js";
import {applyPaddedDomains} from "./facetScales.js";
import {dropHiddenRows} from "./plotRangeBreaks.js";
import {scaleConstructors} from "./pipelineScales.js";
import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../definition/ChartDefinition.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {D3Scale} from "../../utils/index.js";
import type {SizeLegendScale} from "../../components/SizeLegend/sizeLegendLayout.js";

export {computePlotInitialDomains} from "./pipelineDomains.js";
export {measurePlotLineLabels} from "./pipelineLineLabels.js";
export {computePlotScales} from "./pipelineScales.js";
export {preparePlotAxisLayout} from "./pipelineAxisLayout.js";

/** The viz a Plot pipeline stage reads. */
type PlotViz = Parameters<TransformStage>[0]["viz"];

/**
    A plotted axis value that can't be turned into a pixel coordinate: a
    non-finite number (`NaN`/`±Infinity`), `null`, or the empty-array sentinel
    `merge` yields when a numeric column aggregates to no usable value. Any of
    these poisons the shape's transform or path `d` downstream — e.g.
    `translate(NaN,…)` or `…L268.75,NaN` — which the browser rejects. A bare
    `undefined` is NOT bad: it's how an unused secondary axis (x2/y2) reports
    "no value on this row".
*/
const isBadAxisValue = (v: unknown): boolean =>
  v === null ||
  (typeof v === "number" && !Number.isFinite(v)) ||
  (Array.isArray(v) && v.length === 0);

/**
    A formatted row is plottable when its x/y — and any *defined* x2/y2 — are
    real coordinates. Rows failing this are dropped in `formatPlotData` before
    domains, stacking, and paint ever read `_formattedData`, so a NaN measure
    no longer widens a domain, stacks as 0, or emits a broken coordinate.
    Resolves d3plus/d3plus#776.
*/
const isPlottableRow = (d: Record<string, unknown>): boolean =>
  !isBadAxisValue(d.x) &&
  !isBadAxisValue(d.y) &&
  (d.x2 === undefined || !isBadAxisValue(d.x2)) &&
  (d.y2 === undefined || !isBadAxisValue(d.y2));

/**
    The Line rows `formatPlotData` drops for a value it can't plot, at a
    discrete-axis position it can: the gaps `connectGaps` breaks lines at.
*/
function missingLineRows(
  viz: PlotViz,
  rows: Record<string, unknown>[],
  categories: Set<unknown> | null,
): Record<string, unknown>[] {
  const discrete = viz.schema.discrete === "y" ? "y" : "x";
  return rows.filter(
    d =>
      d.shape === "Line" &&
      !isPlottableRow(d) &&
      d[discrete] !== undefined &&
      !isBadAxisValue(d[discrete]) &&
      (!categories || categories.has(d[viz.schema.discrete])),
  );
}

/**
    The bubble radius scale: `sizeScale` over the extent of `sizes`, ranging
    from `sizeMin` (capped at half of `sizeMax`) to `sizeMax`. A single-value
    extent maps everything to `sizeMax`. With `sizeZero`, the smallest value's
    radius is where a scale anchored at zero puts it instead (see
    `zeroAnchoredRadius`).
*/
export function plotSizeScale(
  viz: Parameters<TransformStage>[0]["viz"],
  sizes: number[],
): D3Scale {
  const rExtent = extent(sizes) as unknown as [number, number];
  const {sizeMax, sizeMin, sizeScale, sizeZero} = viz.schema;
  const make =
    scaleConstructors[
      `scale${sizeScale.charAt(0).toUpperCase()}${sizeScale.slice(1)}`
    ];
  const anchored = sizeZero ? zeroAnchoredRadius(make, rExtent, sizeMax) : NaN;
  return make()
    .domain(rExtent)
    .range([
      rExtent[0] === rExtent[1]
        ? sizeMax
        : Number.isFinite(anchored)
          ? anchored
          : min([sizeMax / 2, sizeMin]),
      sizeMax,
    ]);
}

/**
    The radius a size scale anchored at zero (domain `[0, max]`, range
    `[0, sizeMax]`) gives the smallest of `[min, max]`. A scale over
    `[min, max]` starting at this radius draws every value where the anchored
    one does: with a `"sqrt"` scale, each mark's area is proportional to its
    value; with `"linear"`, its radius. NaN when the extent can't be anchored
    at zero (a negative or non-positive extent, or a log scale).
    @param make The size scale's constructor.
    @param extent The size values' `[min, max]`.
    @param sizeMax The largest radius.
*/
export function zeroAnchoredRadius(
  make: () => D3Scale,
  [lo, hi]: [number, number],
  sizeMax: number,
): number {
  if (!(lo >= 0 && hi > 0)) return NaN;
  const r = make().domain([0, hi]).range([0, sizeMax])(lo) as number;
  return Number.isFinite(r) ? r : NaN;
}

/**
    Whether rows of `shape` draw as circles sized by `size`, so the size
    legend keys them: `"Circle"` rows, or the shapes a chart names in
    `viz._plotCircleShapes`.
*/
const drawsSizedCircle = (
  viz: Parameters<TransformStage>[0]["viz"],
  shape: unknown,
): boolean => (viz._plotCircleShapes ?? ["Circle"]).includes(shape as string);

/**
    Plot's size-legend scale, available before layout: the same scale
    `formatPlotData` builds, over the plottable rows. Null when there's no
    `size` accessor or none of those rows draws as a sized circle.
*/
export function plotSizeLegendScale(
  viz: Parameters<TransformStage>[0]["viz"],
): SizeLegendScale | null {
  if (!viz._size) return null;
  const rows: DataPoint[] = viz._axisPersist
    ? viz._data
    : viz._filteredData || [];
  const sizes: number[] = [];
  let circles = false;
  rows.forEach((d, i) => {
    if (isBadAxisValue(viz._x!(d, i)) || isBadAxisValue(viz._y!(d, i))) return;
    sizes.push(viz._size!(d, i));
    if (drawsSizedCircle(viz, viz.schema.shape(d, i))) circles = true;
  });
  return circles
    ? (plotSizeScale(viz, sizes) as unknown as SizeLegendScale)
    : null;
}

/**
    Detects which axes plot the chart's `time` values (the first row's time
    equals that axis's value) and stores the flags on `viz` as
    `_x2Time`/`_xTime`/`_y2Time`/`_yTime`.
*/
function detectTimeAxes(viz: PlotViz) {
  const firstElemTime = viz.schema.time
    ? viz.schema.time(viz._filteredData[0], 0)
    : false;
  const x2Time = (viz._x2Time =
    firstElemTime && viz._x2(viz._filteredData[0], 0) === firstElemTime);
  const xTime = (viz._xTime =
    firstElemTime && viz._x(viz._filteredData[0], 0) === firstElemTime);
  const y2Time = (viz._y2Time =
    firstElemTime && viz._y2(viz._filteredData[0], 0) === firstElemTime);
  const yTime = (viz._yTime =
    firstElemTime && viz._y(viz._filteredData[0], 0) === firstElemTime);

  return {xTime, x2Time, yTime, y2Time};
}

/**
    The per-row formatter `formatPlotData` maps rows through: the PlotDatum
    shape (x/y/x2/y2 + id + group + shape + lci/hci + discrete), with time
    axis values parsed into Dates. Also returns the stack-group accessor.
*/
function plotRowPrep(viz: PlotViz, times: ReturnType<typeof detectTimeAxes>) {
  const {xTime, x2Time, yTime, y2Time} = times;
  const timeAxis = xTime || x2Time || yTime || y2Time;

  const stackSeries = (d: DataPoint, i: number) =>
    viz._stackGroup
      ? viz._stackGroup(d, i)
      : viz.schema.groupBy.length > 1
        ? viz._ids(d, i).slice(0, -1).join("_")
        : "group";

  const stackGroup = (d: DataPoint, i: number) =>
    `${!timeAxis && viz.schema.time ? viz.schema.time(d, i) : "time"}_${
      viz.schema.stacked ? stackSeries(d, i) : `${viz._ids(d, i).join("_")}`
    }`;

  const prepData = (d: DataPoint, i: number) => {
    const newD: Record<string, unknown> = {
      __d3plus__: true,
      data: d,
      group: stackGroup(d, i),
      i,
      hci: viz._confidence && viz._confidence[1] && viz._confidence[1](d, i),
      id: viz
        ._ids(d, i)
        .slice(0, viz._drawDepth + 1)
        .join("_"),
      lci: viz._confidence && viz._confidence[0] && viz._confidence[0](d, i),
      shape: viz.schema.shape(d, i),
      x: xTime ? date(viz._x(d, i)) : viz._x(d, i),
      x2: x2Time ? date(viz._x2(d, i)) : viz._x2(d, i),
      y: yTime ? date(viz._y(d, i)) : viz._y(d, i),
      y2: y2Time ? date(viz._y2(d, i)) : viz._y2(d, i),
    };
    newD.discrete =
      newD.shape === "Bar"
        ? `${newD[viz.schema.discrete]}_${newD.group}`
        : `${newD[viz.schema.discrete]}`;
    newD.id =
      newD.shape === "Bar"
        ? `${newD.id}_${newD[viz.schema.discrete]}`
        : newD.id;
    return newD;
  };

  return {prepData, stackGroup};
}

/**
    Builds `viz._sizeScaleD3` (the bubble radius scale, or a constant
    `sizeMin`) and `viz._sizeLegendFinal` (the scale, when any row draws as a
    sized circle).
*/
function applyPlotSizeScale(
  viz: PlotViz,
  axisData: Record<string, unknown>[],
): void {
  viz._sizeScaleD3 = viz._size
    ? (viz._plotFacetScales?.size ??
      plotSizeScale(
        viz,
        axisData.map((d: Record<string, unknown>) =>
          viz._size!(d.data as DataPoint),
        ),
      ))
    : () => viz.schema.sizeMin;
  viz._sizeLegendFinal =
    viz._size &&
    axisData.some((d: Record<string, unknown>) =>
      drawsSizedCircle(viz, d.shape),
    )
      ? (viz._sizeScaleD3 as unknown as SizeLegendScale)
      : null;
}

/**
    `formatPlotData` — first stage of Plot's chart-specific pipeline. Detects
    time axes (sets viz._xTime / _x2Time / _yTime / _y2Time), maps the
    filtered data through `prepData` to produce the per-row PlotDatum shape
    (x/y/x2/y2 + id + group + shape + lci/hci + discrete), drops rows whose
    axis values can't be plotted (`isPlottableRow` — see #776) or whose
    category a discrete axis's user domain leaves out, and constructs
    the `_sizeScaleD3` if `_size` is set.

    Pure compute. Returns `{formattedData, axisData, x2Exists, y2Exists}`
    for downstream stages + the paint phase. Side-effects on viz: stores
    `_formattedData`, `_xTime`/`_x2Time`/`_yTime`/`_y2Time`, `_sizeScaleD3`.
*/
export const formatPlotData: TransformStage = ({viz}) => {
  if (!viz._filteredData || !viz._filteredData.length) {
    viz._sizeLegendFinal = null;
    viz._swarm = null;
    return {
      plotFormattedData: [],
      plotAxisData: [],
      plotMissingRows: [],
      x2Exists: false,
      y2Exists: false,
    };
  }

  const {prepData, stackGroup} = plotRowPrep(viz, detectTimeAxes(viz));

  const categories = discreteDomainCategories(viz);
  const keepRow = (d: Record<string, unknown>) =>
    isPlottableRow(d) &&
    (!categories || categories.has(d[viz.schema.discrete]));
  const prepped = viz._filteredData.map(prepData);
  // Rows a time axis's `rangeBreaks` hide are left out of the drawing.
  const plotted = dropHiddenRows(viz, prepped.filter(keepRow));
  const [formattedData, axisData] = applyBarWidths(
    viz,
    plotted,
    viz._axisPersist
      ? dropHiddenRows(viz, viz._data.map(prepData).filter(keepRow))
      : plotted,
  );
  viz._formattedData = formattedData;

  const swarm = (viz._swarm = resolveSwarm(viz.schema.swarm, axisData));
  if (swarm) {
    applySwarmLanes(formattedData, swarm);
    if (axisData !== formattedData) applySwarmLanes(axisData, swarm);
  }

  applyPlotSizeScale(viz, axisData);

  // The width shares draw on a secondary axis when `barWidthShare` is "opposite".
  const share = shareAxis(viz);
  const x2Exists =
    share === "x2" ||
    axisData.some((d: Record<string, unknown>) => d.x2 !== undefined);
  const y2Exists =
    share === "y2" ||
    axisData.some((d: Record<string, unknown>) => d.y2 !== undefined);

  return {
    plotFormattedData: formattedData,
    plotAxisData: axisData,
    x2Exists,
    y2Exists,
    plotStackGroup: stackGroup,
    plotMissingRows: missingLineRows(viz, prepped, categories),
  };
};

/**
    `computePlotAxisValues` — second stage of Plot's pipeline. Given the
    `plotFormattedData` + `plotAxisData` from `formatPlotData`, computes
    the per-axis values arrays (`xData`/`x2Data`/`yData`/`y2Data`) used by
    the domain/scale construction downstream.

    Takes the axis name + the two data sources + the viz state and returns
    the sorted/unique values for that axis.
*/
export const computePlotAxisValues: TransformStage = ({
  viz,
  plotFormattedData,
  plotAxisData,
}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];

  function getAxisValues(axis: string) {
    const timeData = viz[`_${axis}Time`];
    const rows = timeData ? data : axisData;
    const localData = viz._plotAxisRows ? viz._plotAxisRows(rows, axis) : rows;

    const filteredData = localData.filter(
      (d: Record<string, unknown>) =>
        ![NaN, undefined, false].includes(d[axis] as never),
    );
    const extra = viz._plotAxisValues
      ? viz._plotAxisValues(localData, axis)
      : [];
    if (!filteredData.length) return extra;

    const numericValue = typeof filteredData[0][axis] === "number";

    let myData =
      viz.schema.discrete === axis
        ? rollups(
            filteredData,
            (leaves: Record<string, unknown>[]) =>
              leaves.length === 1
                ? leaves[0].data
                : d3plusMerge(
                    leaves.map(
                      (d: Record<string, unknown>) => d.data,
                    ) as DataPoint[],
                    viz.schema.aggs,
                  ),
            (d: Record<string, unknown>) => d[axis],
          )
            .sort((a: [unknown, unknown], b: [unknown, unknown]) => {
              if (viz.schema[`${axis}Sort`])
                return viz.schema[`${axis}Sort`](a[1], b[1]);
              const aKey =
                timeData || numericValue
                  ? parseFloat(a[0] as string)
                  : (a[0] as number);
              const bKey =
                timeData || numericValue
                  ? parseFloat(b[0] as string)
                  : (b[0] as number);
              return aKey - bKey;
            })
            .map(([key]: [unknown, unknown]) =>
              timeData
                ? date(key as string | number)
                : numericValue
                  ? parseFloat(key as string)
                  : key,
            )
        : unique(
            filteredData
              .sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
                viz.schema[`${axis}Sort`]
                  ? viz.schema[`${axis}Sort`](a.data, b.data)
                  : (a[axis] as number) - (b[axis] as number),
              )
              .map((d: Record<string, unknown>) => d[axis]),
            (d: unknown) => `${d}`,
          );

    if (viz.schema.discrete !== axis.charAt(0) && viz._confidence) {
      if (viz._confidence[0])
        myData = myData.concat(
          localData.map((d: Record<string, unknown>) => d.lci),
        );
      if (viz._confidence[1])
        myData = myData.concat(
          localData.map((d: Record<string, unknown>) => d.hci),
        );
      myData = myData.concat(extraBandValues(viz, localData));
    }

    return extra.length ? myData.concat(extra) : myData;
  }

  return {
    xData: getAxisValues("x"),
    x2Data: getAxisValues("x2"),
    yData: getAxisValues("y"),
    y2Data: getAxisValues("y2"),
  };
};

/**
    `extendPlotOppScales` — sixth stage. After `computePlotScales` returns the
    initial x/y/x2/y2 scales, the opposite-axis (non-discrete) scales need to
    be extended by each shape type's buffer function (Bar/Box/Circle/Line/
    etc. — `viz._buffer[key]`) to allocate room for the shapes' widths.

    Reads `viz._buffer[shapeKey]({data, x, y, yScale, xScale, config, x2?,
    y2?})` and chains the returned `[x, y]` (or `[x2, y2]`) back into the
    scales. Also calls `discreteBuffer` for Bar/Box to round the discrete
    scale to integer pixels.

    Returns the extended scales. Side-effect-free on viz (only on the scale
    instances, which are passed through the context).
*/
export const extendPlotOppScales: TransformStage = ({
  viz,
  plotFormattedData,
  plotAxisData,
  plotScales,
  plotConfigScales,
}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let {x, y, x2, y2} = plotScales!;
  const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} =
    plotConfigScales!;
  const xScale = plotScales!.xScale,
    yScale = plotScales!.yScale;

  const oppScale =
    viz.schema.discrete === "x" || viz._swarm?.axis === "y" ? yScale : xScale;
  if (oppScale !== "Point") {
    const allShapeData = groups(
      axisData,
      (d: Record<string, unknown>) => d.shape as string,
    );
    allShapeData.forEach(([key, values]) => {
      if (["Bar", "Box"].includes(key) && !viz._discreteExtent) {
        discreteBufferFn(
          viz.schema.discrete === "x" ? x : y,
          data,
          viz.schema.discrete,
        );
      }
      if (viz._buffer[key]) {
        const res = viz._buffer[key].bind(viz)({
          data: values,
          x,
          y,
          yScale: yConfigScale,
          xScale: xConfigScale,
          config: viz.schema.shapeConfig[key],
        });
        x = res[0];
        y = res[1];
        const res2 = viz._buffer[key].bind(viz)({
          data: values,
          x: x2,
          y: y2,
          yScale: y2ConfigScale,
          xScale: x2ConfigScale,
          x2: true,
          y2: true,
          config: viz.schema.shapeConfig[key],
        });
        x2 = res2[0];
        y2 = res2[1];
      }
    });
  }

  // A small-multiples panel with shared scales draws with every panel's padding.
  return {plotScales: applyPaddedDomains(viz, {...plotScales!, x, y, x2, y2})};
};

export const plotDef: ChartDefinition = {
  name: "Plot",
  defaults: {
    annotations: [],
    axisPersist: false,
    barPadding: 0,
    discreteCutoff: 100,
    groupPadding: 5,
    lineMarkers: false,
    shape: constant("Circle"),
    tooltipShared: true,
    trendLine: false,
  },
  // Plot._paint populates `viz._chartScene` from `plotPaint`; no emit step.
  paintDriven: true,
};
