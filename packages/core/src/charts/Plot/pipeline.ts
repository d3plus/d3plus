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
/* eslint-disable @typescript-eslint/no-explicit-any */

import {date} from "@d3plus/dom";
import {merge as d3plusMerge, unique} from "@d3plus/data";
import * as scales from "d3-scale";
import {deviation, extent, groups, max, mean, min, range, rollups} from "d3-array";

import discreteBufferFn from "../plotBuffers/discreteBuffer.js";
import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {shapeConfigFor} from "../emitHelpers.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import type {TransformStage} from "../stages.js";

import {computePlotInitialDomains} from "./pipelineDomains.js";

export {computePlotInitialDomains} from "./pipelineDomains.js";
export {measurePlotLineLabels} from "./pipelineLineLabels.js";

const defaultChartFeatures = [
  backFeature,
  titleFeature,
  subtitleFeature,
  totalFeature,
];


/**
    `formatPlotData` — first stage of Plot's chart-specific pipeline. Detects
    time axes (sets viz._xTime / _x2Time / _yTime / _y2Time), maps the
    filtered data through `prepData` to produce the per-row PlotDatum shape
    (x/y/x2/y2 + id + group + shape + lci/hci + discrete), and constructs
    the `_sizeScaleD3` if `_size` is set.

    Pure compute. Returns `{formattedData, axisData, x2Exists, y2Exists}`
    for downstream stages + the paint phase. Side-effects on viz: stores
    `_formattedData`, `_xTime`/`_x2Time`/`_yTime`/`_y2Time`, `_sizeScaleD3`.
*/
export const formatPlotData: TransformStage = ({viz}) => {
  if (!viz._filteredData || !viz._filteredData.length) {
    return {plotFormattedData: [], plotAxisData: [], x2Exists: false, y2Exists: false};
  }

  const firstElemTime = viz.schema.time ? viz.schema.time(viz._filteredData[0], 0) : false;
  const x2Time = (viz._x2Time =
    firstElemTime && viz._x2(viz._filteredData[0], 0) === firstElemTime);
  const xTime = (viz._xTime =
    firstElemTime && viz._x(viz._filteredData[0], 0) === firstElemTime);
  const y2Time = (viz._y2Time =
    firstElemTime && viz._y2(viz._filteredData[0], 0) === firstElemTime);
  const yTime = (viz._yTime =
    firstElemTime && viz._y(viz._filteredData[0], 0) === firstElemTime);

  const timeAxis = xTime || x2Time || yTime || y2Time;

  const stackGroup = (d: any, i: number) =>
    `${!timeAxis && viz.schema.time ? viz.schema.time(d, i) : "time"}_${
      viz.schema.stacked
        ? `${
            viz.schema.groupBy.length > 1
              ? viz._ids(d, i).slice(0, -1).join("_")
              : "group"
          }`
        : `${viz._ids(d, i).join("_")}`
    }`;

  const prepData = (d: any, i: number) => {
    const newD: Record<string, unknown> = {
      __d3plus__: true,
      data: d,
      group: stackGroup(d, i),
      i,
      hci:
        viz._confidence && viz._confidence[1] && viz._confidence[1](d, i),
      id: viz._ids(d, i)
        .slice(0, viz._drawDepth + 1)
        .join("_"),
      lci:
        viz._confidence && viz._confidence[0] && viz._confidence[0](d, i),
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
      newD.shape === "Bar" ? `${newD.id}_${newD[viz.schema.discrete]}` : newD.id;
    return newD;
  };

  const formattedData = (viz._formattedData = viz._filteredData.map(prepData));
  const axisData = viz._axisPersist ? viz._data.map(prepData) : formattedData;

  if (viz._size) {
    const rExtent = extent(axisData, (d: Record<string, unknown>) =>
      viz._size(d.data),
    );
    viz._sizeScaleD3 = (scales as any)[
      `scale${viz.schema.sizeScale.charAt(0).toUpperCase()}${viz.schema.sizeScale.slice(1)}`
    ]()
      .domain(rExtent)
      .range([
        rExtent[0] === rExtent[1]
          ? viz.schema.sizeMax
          : min([viz.schema.sizeMax / 2, viz.schema.sizeMin]),
        viz.schema.sizeMax,
      ]);
  } else {
    viz._sizeScaleD3 = () => viz.schema.sizeMin;
  }

  const x2Exists = axisData.some((d: any) => d.x2 !== undefined);
  const y2Exists = axisData.some((d: any) => d.y2 !== undefined);

  return {
    plotFormattedData: formattedData,
    plotAxisData: axisData,
    x2Exists,
    y2Exists,
    plotStackGroup: stackGroup,
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
export const computePlotAxisValues: TransformStage = ({viz, plotFormattedData, plotAxisData}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];

  function getAxisValues(axis: string) {
    const timeData = viz[`_${axis}Time`];
    const localData = timeData ? data : axisData;

    const filteredData = localData.filter(
      (d: any) => ![NaN, undefined, false].includes(d[axis]),
    );
    if (!filteredData.length) return [];

    const numericValue = typeof filteredData[0][axis] === "number";

    let myData =
      viz.schema.discrete === axis
        ? rollups(
            filteredData,
            (leaves: Record<string, unknown>[]) =>
              leaves.length === 1
                ? leaves[0].data
                : d3plusMerge(
                    leaves.map((d: any) => d.data),
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
              .sort((a: any, b: any) =>
                viz.schema[`${axis}Sort`]
                  ? viz.schema[`${axis}Sort`](a.data, b.data)
                  : a[axis] - b[axis],
              )
              .map((d: any) => d[axis]),
            (d: any) => `${d}`,
          );

    if (viz.schema.discrete !== axis.charAt(0) && viz._confidence) {
      if (viz._confidence[0])
        myData = myData.concat(localData.map((d: any) => d.lci));
      if (viz._confidence[1])
        myData = myData.concat(localData.map((d: any) => d.hci));
    }

    return myData;
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
export const extendPlotOppScales: TransformStage = ({viz, plotFormattedData, plotAxisData, plotScales, plotConfigScales}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let {x, y, x2, y2} = plotScales;
  const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = plotConfigScales;
  const xScale = plotScales.xScale, yScale = plotScales.yScale;

  const oppScale = viz.schema.discrete === "x" ? yScale : xScale;
  if (oppScale !== "Point") {
    const allShapeData = groups(
      axisData,
      (d: Record<string, unknown>) => d.shape as string,
    );
    allShapeData.forEach(([key, values]) => {
      if (["Bar", "Box"].includes(key)) {
        discreteBufferFn(viz.schema.discrete === "x" ? x : y, data, viz.schema.discrete);
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

  return {plotScales: {...plotScales, x, y, x2, y2}};
};

/**
    `preparePlotAxisLayout` — final pre-paint stage. Reads the constructed
    scales and computes the per-axis display config the four axis
    `.measure()` + `.render()` calls in Plot._draw need:
      - `defaultConfig`/`defaultX2Config`/`defaultY2Config`
      - `showX`/`showY` (cutoff predicates)
      - `yC` (base y-axis config, including no-x-axis layout adjustments)
      - `barLabels` (used to suppress redundant ticks)
      - `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks` (null when ticks should display,
        empty array when ticks are redundant with bar labels)

    Pure compute. No DOM, no side effects on viz.
*/
export const preparePlotAxisLayout: TransformStage = ({viz, plotAxisData, plotScales, x2Exists, y2Exists, x2Data, y2Data, yData}) => {
  const axisData = plotAxisData || [];
  const {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale} = plotScales;
  const xDomain = x.domain();
  const x2Domain = x2.domain();
  const yDomain = y.domain();
  const y2Domain = y2.domain();

  const defaultConfig = {
    barConfig: {"stroke-width": 0},
    gridSize: 0,
    labels: [],
    title: false,
    tickSize: 0,
  };
  const defaultX2Config = x2Exists ? {data: x2Data} : defaultConfig;
  const defaultY2Config = y2Exists ? {data: y2Data} : defaultConfig;
  const showX =
    viz.schema.discrete === "x"
      ? viz.schema.width > viz._discreteCutoff && viz.schema.width > viz.schema.xCutoff
      : viz.schema.width > viz.schema.xCutoff;
  const showY =
    viz.schema.discrete === "y"
      ? viz.schema.height > viz._discreteCutoff && viz.schema.height > viz.schema.yCutoff
      : viz.schema.height > viz.schema.yCutoff;

  const yC: Record<string, unknown> = {
    data: yData,
    locale: viz.schema.locale,
    rounding: viz.schema.yDomain ? "none" : "outside",
    scalePadding: y.padding ? y.padding() : 0,
  };
  if (!showX && showY) {
    yC.barConfig = {stroke: "transparent"};
    yC.tickSize = 0;
    yC.shapeConfig = {
      labelBounds: (d: any, i: number) => {
        const {width: w, y: yy} = d.labelBounds;
        const h = viz.schema.height / 2;
        const xx = i ? -h : 0;
        return {x: xx, y: yy, width: w, height: h};
      },
      labelConfig: {padding: 0, rotate: 0},
      labelRotation: false,
    };
  }

  // Bar labels — used to suppress redundant axis ticks.
  const barConfig = shapeConfigFor(viz, "Bar");
  const barLabelFunction =
    barConfig.label !== undefined
      ? typeof barConfig.label === "function"
        ? barConfig.label
        : (() => barConfig.label)
      : viz._drawLabel;
  const barLabels = axisData
    .map((d: any) => barLabelFunction(d.data, d.i))
    .filter((d: any) => typeof d === "number" || d)
    .map(String);

  const tickFor = (axis: string, axisScale: string) => {
    const ticks = unique(axisData.map((d: any) => d[axis]));
    return axisScale === "Point" && ticks.every(t => barLabels.includes(`${t}`))
      ? []
      : null;
  };

  return {
    plotDefaultConfig: defaultConfig,
    plotDefaultX2Config: defaultX2Config,
    plotDefaultY2Config: defaultY2Config,
    plotShowX: showX,
    plotShowY: showY,
    plotYC: yC,
    plotBarLabels: barLabels,
    plotXTicks: tickFor("x", xScale),
    plotX2Ticks: tickFor("x2", x2Scale),
    plotYTicks: tickFor("y", yScale),
    plotY2Ticks: tickFor("y2", y2Scale),
    plotXDomain: xDomain,
    plotX2Domain: x2Domain,
    plotYDomain: yDomain,
    plotY2Domain: y2Domain,
  };
};

/**
    `computePlotScales` — fourth stage of Plot's pipeline. Takes the per-axis
    values + the chart's raw `domains` object (computed by the inline
    stacking/non-stacking branch) and produces the four configured d3 scale
    instances (`x`/`x2`/`y`/`y2`), the resolved scale-type strings
    (`xConfigScale` etc., returned in `plotConfigScales`), and the final
    `domains` after log/baseline adjustments.

    The "initial domains" computation (stacked vs non-stacked branch that
    fills `domains.x`, `domains.y`, etc. from data) is inline in
    `Plot._draw` — extracting that requires untangling array sorts that
    mutate `axisData` in place, which is the natural next step.
*/
export const computePlotScales: TransformStage = ({viz, plotFormattedData, plotAxisData, plotInitialDomains}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let domains = plotInitialDomains as Record<string, any[]>;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;
  const height = viz.schema.height - viz._margin.top - viz._margin.bottom;
  const opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined;
  const opp2 = viz.schema.discrete
    ? viz.schema.discrete === "x" ? "y2" : "x2"
    : undefined;
  const opps = [opp, opp2].filter(d => d) as string[];

  function domainScaleSetup(axis: string) {
    const scale = viz[`_${axis}Time`]
      ? "Time"
      : viz.schema.discrete === axis || viz.schema[`${axis}Sort`]
        ? "Point"
        : "Linear";
    const domain = viz.schema[`${axis}Domain`]
        ? viz.schema[`${axis}Domain`].slice()
        : domains[axis],
      domain2 = viz.schema[`${axis}2Domain`]
        ? viz.schema[`${axis}2Domain`].slice()
        : domains[`${axis}2`];
    if (scale !== "Point") {
      if (domain && domain[0] === void 0) domain[0] = domains[axis][0];
      if (domain && domain[1] === void 0) domain[1] = domains[axis][1];
      if (domain2 && domain2[0] === void 0)
        domain2[0] = domains[`${axis}2`][0];
      if (domain2 && domain2[1] === void 0)
        domain2[1] = domains[`${axis}2`][1];
    }
    return [domain, scale, domain2, scale] as const;
  }

  const [xAutoDomain, xScale, x2AutoDomain, x2Scale] = domainScaleSetup("x");
  const [yAutoDomain, yScale, y2AutoDomain, y2Scale] = domainScaleSetup("y");

  const autoScale = (axis: string, fallback: string) => {
    const userScale = viz[`_${axis}Config`].scale;
    if (userScale === "auto") {
      if (viz.schema.discrete === axis) return fallback;
      const values = axisData.map((d: any) => d[axis]);
      return deviation(values)! / mean(values)! > 3 ? "log" : "linear";
    }
    return userScale || fallback;
  };

  const yConfigScale = autoScale("y", yScale).toLowerCase();
  const y2ConfigScale = autoScale("y2", y2Scale).toLowerCase();
  const xConfigScale = autoScale("x", xScale).toLowerCase();
  const x2ConfigScale = autoScale("x2", x2Scale).toLowerCase();

  // `.slice()` the fallback so domains.x2 isn't ALIASED to domains.x
  // (and same for y2 ↔ y). Without the slice, later in this function
  // the baseline-extension loop does `domains[o][0] = b` — when `o`
  // is 'y2' aliased to y, that mutation hits domains.y too, silently
  // clobbering the y-axis bottom. Sibling of the d.reverse() fix.
  domains = {
    x: xAutoDomain,
    x2: x2AutoDomain || (xAutoDomain as unknown[]).slice(),
    y: yAutoDomain,
    y2: y2AutoDomain || (yAutoDomain as unknown[]).slice(),
  };
  Object.keys(domains).forEach(axis => {
    if (viz[`_${axis}ConfigScale`] === "log" && domains[axis].includes(0)) {
      if ((min(domains[axis]) as unknown as number) < 0)
        domains[axis][1] = max(
          data
            .map((d: any) => d[axis])
            .filter((d: any) => ![NaN, undefined, false].includes(d)),
        );
      else
        domains[axis][0] = min(
          axisData
            .map((d: any) => d[axis])
            .filter((d: any) => ![NaN, undefined, false].includes(d)),
        );
    }
  });

  opps.forEach(o => {
    if (viz[`_${o}Config`].domain) {
      // `.slice()` first so we never mutate the user's config array in
      // place — on the next render the (already-reversed) array would
      // reverse back, alternating chart correctness across renders.
      const d = (viz[`_${o}Config`].domain as unknown[]).slice();
      if (viz.schema.discrete === "x") d.reverse();
      domains[o] = d;
    } else if (o && viz.schema.baseline !== void 0) {
      const b = viz.schema.baseline;
      if (domains[o] && domains[o][0] > b) domains[o][0] = b;
      else if (domains[o] && domains[o][1] < b) domains[o][1] = b;
    }
  });

  const x = (scales as any)[`scale${xScale}`]()
    .domain(domains.x)
    .range(range(0, width + 1, width / (domains.x.length - 1)));
  const x2 = (scales as any)[`scale${x2Scale}`]()
    .domain(domains.x2)
    .range(range(0, width + 1, width / (domains.x2.length - 1)));
  // `.slice().reverse()` so the domain object isn't mutated under us if
  // it came from user config (covered by the slice above) OR from
  // domains.y being aliased into the user config via the slice above.
  const y = (scales as any)[`scale${yScale}`]()
    .domain(domains.y.slice().reverse())
    .range(range(0, height + 1, height / (domains.y.length - 1)));
  const y2 = (scales as any)[`scale${y2Scale}`]()
    .domain(domains.y2.slice().reverse())
    .range(range(0, height + 1, height / (domains.y2.length - 1)));

  return {
    plotDomains: domains,
    plotScales: {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale},
    plotConfigScales: {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale},
    plotOpps: {opp, opp2, opps},
  };
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
  },
  features: defaultChartFeatures,
  // Plot._paint populates `viz._chartScene` imperatively; emit just snapshots it.
  emit: ({viz}: {viz: any}) =>
    Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],
  paintDriven: true,
};
