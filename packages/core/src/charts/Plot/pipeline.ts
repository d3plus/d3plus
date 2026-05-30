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
import * as d3Shape from "d3-shape";
import {deviation, extent, groups, max, mean, min, range, rollups, sum} from "d3-array";
import {textWidth as d3plusTextWidth} from "@d3plus/dom";

import discreteBufferFn from "../plotBuffers/discreteBuffer.js";
import constant from "../../utils/constant.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import {shapeConfigFor} from "../emitHelpers.js";
import {backFeature, subtitleFeature, titleFeature, totalFeature} from "../features.js";
import {vizPreDrawStages} from "../stages.js";
import type {TransformStage} from "../stages.js";

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

    The legacy `getAxisValues(axis)` closure inside Plot._draw is now this
    standalone function — it takes the axis name + the two data sources +
    the viz state and returns the sorted/unique values for that axis.
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
    `measurePlotLineLabels` — measures label widths for Line shapes so the
    chart's x-axis range can leave space for in-line labels (a common Plot
    feature). Reads pre-measured test-axis state (`xTest._d3Scale`, etc.)
    through the context. Pure compute + textWidth — no DOM.

    Returns `{labelWidths, largestLabel, xRangeMax}` for the paint phase.
    The test axes themselves come via `plotTestAxes` ctx field (Plot._draw
    measures them then injects).
*/
export const measurePlotLineLabels: TransformStage = ({viz, plotFormattedData, plotScales, plotConfigScales, plotTestAxes, plotLineLabelTest, y2Exists}) => {
  const data = plotFormattedData || [];
  if (!viz.schema.lineLabels || y2Exists) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }
  const labelData = data.filter((d: any) => {
    if (d.shape !== "Line") return false;
    return typeof viz.schema.lineLabels === "function"
      ? viz.schema.lineLabels(d.data, d.i)
      : true;
  });
  const lineData = groups(labelData, (d: Record<string, unknown>) => d.id);
  if (!lineData.length) {
    return {plotLabelWidths: [], plotLargestLabel: undefined, plotXRangeMax: undefined};
  }

  const {testLineShape, testTextBox} = plotLineLabelTest as any;
  const {xTest, yTest} = plotTestAxes as any;
  const xDomain = plotScales.x.domain();
  const yDomain = plotScales.y.domain();
  const xConfigScale = plotConfigScales.xConfigScale;
  const yConfigScale = plotConfigScales.yConfigScale;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;

  const userConfig = shapeConfigFor(viz, "Line");
  testLineShape.config(userConfig);
  const lineLabelConfig = testLineShape.labelConfig();
  const fontColorAccessor = lineLabelConfig.fontColor !== undefined ? lineLabelConfig.fontColor : testTextBox.fontColor();
  const fontSizeAccessor = lineLabelConfig.fontSize !== undefined ? lineLabelConfig.fontSize : testTextBox.fontSize();
  const fontWeightAccessor = lineLabelConfig.fontWeight !== undefined ? lineLabelConfig.fontWeight : testTextBox.fontWeight();
  const fontFamilyAccessor = lineLabelConfig.fontFamily !== undefined ? lineLabelConfig.fontFamily : testTextBox.fontFamily();
  const paddingAccessor = lineLabelConfig.padding !== undefined ? lineLabelConfig.padding : testTextBox.padding();
  const labelFunction = userConfig.label || viz._drawLabel;

  const xEstimate = (d: any) => {
    if (xConfigScale === "log" && d === 0)
      d = xDomain[0] < 0 ? xTest._d3Scale.domain()[1] : xTest._d3Scale.domain()[0];
    return xTest._getPosition.bind(xTest)(d);
  };
  const yEstimate = (d: any) => {
    if (yConfigScale === "log" && d === 0)
      d = yDomain[0] < 0 ? yTest._d3Scale.domain()[1] : yTest._d3Scale.domain()[0];
    return yTest._getPosition.bind(yTest)(d);
  };

  const labelWidths = lineData
    .map(([lineKey, lineValues]: [unknown, Record<string, unknown>[]]) => {
      let d = lineValues[lineValues.length - 1] as Record<string, unknown>;
      let i;
      while (d.__d3plus__ && d.data) {
        d = d.data as Record<string, unknown>;
        i = d.i;
      }
      const label = typeof labelFunction === "function" ? labelFunction(d, i) : labelFunction;
      const fontColor = typeof fontColorAccessor === "function" ? fontColorAccessor(d, i) : fontColorAccessor;
      const fontSize = typeof fontSizeAccessor === "function" ? fontSizeAccessor(d, i) : fontSizeAccessor;
      const fontWeight = typeof fontWeightAccessor === "function" ? fontWeightAccessor(d, i) : fontWeightAccessor;
      let fontFamily = typeof fontFamilyAccessor === "function" ? fontFamilyAccessor(d, i) : fontFamilyAccessor;
      if (Array.isArray(fontFamily)) fontFamily = fontFamily.map((f: string) => `'${f}'`).join(", ");
      const labelPadding = typeof paddingAccessor === "function" ? paddingAccessor(d, i) : paddingAccessor;
      const labelWidth = d3plusTextWidth(label, {
        "font-size": fontSize,
        "font-family": fontFamily,
        "font-weight": fontWeight,
      });
      const coords = lineValues.map((d: Record<string, unknown>) => [
        xEstimate(d.x),
        yEstimate(d.y),
      ]);
      const myMaxX = max(
        lineValues.map((d: Record<string, unknown>) => xEstimate(d.x)),
      );
      const labelY = (
        lineValues.find((d: Record<string, unknown>) => xEstimate(d.x) === myMaxX) as Record<string, unknown>
      ).y;
      return {
        id: lineKey,
        labelWidth: labelWidth + labelPadding * 2,
        spaceNeeded: labelWidth + labelPadding * 4,
        value: labelY,
        yEstimate: yEstimate(labelY),
        padding: labelPadding,
        fontSize,
        fontColor,
        maxX: myMaxX,
        xValue: max(lineValues, (d: Record<string, unknown>) => d.x as number),
        coords,
      };
    })
    .sort((a, b) =>
      yDomain[1] > yDomain[0]
        ? (a.value as number) - (b.value as number)
        : (b.value as number) - (a.value as number),
    )
    .filter((d, _i, arr) => {
      const {fontSize, id, labelWidth, maxX, yEstimate} = d;
      const closeLabels = arr.filter(
        l =>
          l.id !== id &&
          l.coords.some(
            (c: any) =>
              (c[0] > maxX || (c[0] === maxX && l.maxX !== maxX)) &&
              c[0] <= (maxX as number) + labelWidth &&
              c[1] <= yEstimate + fontSize * 0.75 &&
              c[1] >= yEstimate - fontSize * 0.75,
          ),
      );
      return closeLabels.length === 0;
    });

  const maxX = max(labelWidths, d => d.maxX);
  const largestLabel = max(labelWidths.map(d => d.labelWidth));
  let xRangeMax: number | undefined;
  const spaceNeeded =
    maxX === xTest._getRange.bind(xTest)()[1]
      ? max(labelWidths.filter(d => d.maxX === maxX), d => d.spaceNeeded)
      : 0;
  if (spaceNeeded) {
    const labelSpace = min([spaceNeeded, width / 4]);
    xRangeMax = width - labelSpace! - viz._margin.right;
  }

  return {plotLabelWidths: labelWidths, plotLargestLabel: largestLabel, plotXRangeMax: xRangeMax};
};

/**
    `computePlotInitialDomains` — third stage of Plot's pipeline. Bridges the
    raw per-axis values (`xData`/`yData`/etc.) into the initial `domains`
    object that `computePlotScales` consumes. Handles both branches:

    - **Stacked** (`viz.schema.stacked`): filters to Area/Bar shapes, computes
      group totals, sorts axisData by discrete-then-group-sum-then-opp,
      builds `discreteKeys`/`stackKeys`/`stackData`, fills in missing Area
      filler points, runs d3-stack with the configured order/offset, then
      derives `domains` from the stack extents.
    - **Non-stacked**: sorts axisData by the discrete accessor; `domains` is
      either the data values (for the discrete axis or user-sorted axes) or
      extent (for continuous).

    Side effects: mutates `axisData` (sort), `data` (sort + filler pushes).
    Mutations are intentional — Plot._draw consumers downstream read these
    arrays in their mutated order.
*/
export const computePlotInitialDomains: TransformStage = ({viz, plotFormattedData, plotAxisData, xData, x2Data, yData, y2Data, plotStackGroup}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  const stackGroup = plotStackGroup as (d: any, i: number) => string;
  const opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined;
  const xTime = viz._xTime, x2Time = viz._x2Time, yTime = viz._yTime, y2Time = viz._y2Time;

  let discreteKeys: any[] = [];
  let domains: any;
  let stackData: any[] = [];
  let stackKeys: any[] = [];

  if (viz.schema.stacked) {
    const stackedData = axisData.filter((d: any) =>
      ["Area", "Bar"].includes(d.shape),
    );

    const groupValues = groups(
      stackedData,
      (d: Record<string, unknown>) => d.group as string,
    ).reduce((obj: Record<string, number>, [key, values]) => {
      if (!obj[key]) obj[key] = 0;
      obj[key] += sum(
        values as Record<string, number>[],
        (dd: Record<string, number>) => dd[opp as string],
      );
      return obj;
    }, {});

    axisData.sort((a: any, b: any) => {
      if (viz.schema[`${viz.schema.discrete}Sort`])
        return viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data);
      const a1 = a[viz.schema.discrete],
        b1 = b[viz.schema.discrete];
      if (a1 - b1 !== 0) return a1 - b1;
      if (a.group !== b.group)
        return groupValues[b.group] - groupValues[a.group];
      return b[opp as string] - a[opp as string];
    });

    discreteKeys = Array.from(new Set(axisData.map((d: any) => d.discrete)));
    stackKeys = Array.from(new Set(axisData.map((d: any) => d.id)));

    stackData = groups(
      axisData,
      (d: Record<string, unknown>) => d.discrete,
    ).map(([, values]) => values);

    stackData.forEach((g: any[]) => {
      const ids = Array.from(new Set(g.map((d: any) => d.id)));
      if (ids.length < stackKeys.length) {
        stackKeys.forEach((k: any) => {
          if (!ids.includes(k)) {
            const d = axisData.filter((d: any) => d.id === k)[0];
            if (d.shape === "Area") {
              const group = stackGroup(d.data, d.i);
              const fillerPoint: Record<string, unknown> = {
                __d3plus__: true,
                data: d.data,
                discrete:
                  d.shape === "Bar"
                    ? `${g[0][viz.schema.discrete]}_${group}`
                    : `${g[0][viz.schema.discrete]}`,
                group,
                id: d.id,
                ids: k,
                shape: d.shape,
                [viz.schema.discrete]: g[0][viz.schema.discrete],
                [opp as string]: 0,
              };
              data.push(fillerPoint);
            }
          }
        });
      }
    });

    if (viz.schema[`${viz.schema.discrete}Sort`]) {
      data.sort((a: any, b: any) => viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data));
    } else {
      data.sort((a: any, b: any) => a[viz.schema.discrete] - b[viz.schema.discrete]);
    }

    const order = viz._stackOrder;

    if (Array.isArray(order))
      stackKeys.sort((a: any, b: any) => order.indexOf(a) - order.indexOf(b));
    else if (order === d3Shape.stackOrderNone)
      stackKeys.sort((a: any, b: any) => a.localeCompare(b));

    stackData = (d3Shape
      .stack()
      .keys(stackKeys)
      .offset(viz._stackOffset)
      .order(Array.isArray(order) ? d3Shape.stackOrderNone : order)
      .value(((group: Record<string, unknown>[], key: string) => {
        const d = (group as any[]).filter((g: any) => g.id === key);
        return d.length ? (d[0] as any)[opp as string] : 0;
      }) as never) as any)(stackData);

    const discreteData = viz.schema.discrete === "x" ? xData : yData;

    domains = {
      [viz.schema.discrete]: viz[`_${viz.schema.discrete}Time`]
        ? extent(discreteData as any[])
        : discreteData,
      [opp as string]: [
        min(stackData.map((g: any) => min(g.map((p: any) => p[0])) as unknown as number)),
        max(stackData.map((g: any) => max(g.map((p: any) => p[1])) as unknown as number)),
      ],
    };
  } else {
    const discrete = viz.schema.discrete || "x";

    if (viz.schema[`${viz.schema.discrete}Sort`]) {
      axisData.sort((a: any, b: any) => viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data));
    } else {
      axisData.sort((a: any, b: any) => a[discrete] - b[discrete]);
    }

    domains = {
      x:
        (!xTime && viz.schema.discrete === "x") || viz.schema.xSort
          ? xData
          : extent(xData as any[]),
      x2:
        (!x2Time && viz.schema.discrete === "x") || viz.schema.x2Sort
          ? x2Data
          : extent(x2Data as any[]),
      y:
        (!yTime && viz.schema.discrete === "y") || viz.schema.ySort
          ? yData
          : extent(yData as any[]),
      y2:
        (!y2Time && viz.schema.discrete === "y") || viz.schema.y2Sort
          ? y2Data
          : extent(y2Data as any[]),
    };
  }

  return {
    plotInitialDomains: domains,
    plotDiscreteKeys: discreteKeys,
    plotStackData: stackData,
    plotStackKeys: stackKeys,
  };
};

/**
    `computePlotScales` — fourth stage of Plot's pipeline. Takes the per-axis
    values + the chart's raw `domains` object (computed by the still-inline
    stacking/non-stacking branch) and produces the four configured d3 scale
    instances (`x`/`x2`/`y`/`y2`), the resolved scale-type strings
    (`xConfigScale` etc.), and the final `domains` after log/baseline
    adjustments.

    Side effects on viz: `_xConfigScale`/`_x2ConfigScale`/`_yConfigScale`/
    `_y2ConfigScale` (legacy consumers read them directly).

    The "initial domains" computation (stacked vs non-stacked branch that
    fills `domains.x`, `domains.y`, etc. from data) is **still inline in
    Plot._draw** — extracting that requires untangling array sorts that
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

  const yConfigScale = (viz._yConfigScale = autoScale("y", yScale).toLowerCase());
  const y2ConfigScale = (viz._y2ConfigScale = autoScale("y2", y2Scale).toLowerCase());
  const xConfigScale = (viz._xConfigScale = autoScale("x", xScale).toLowerCase());
  const x2ConfigScale = (viz._x2ConfigScale = autoScale("x2", x2Scale).toLowerCase());

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
  // Plot's pipeline tail: shared viz prep + Plot-specific data format +
  // per-axis values + stacked/non-stacked initial domains + scale construction.
  // Plot._draw runs these via `runStages` and continues with the paint phase
  // (axis rendering, buffer setup, shape emission).
  stages: [
    ...vizPreDrawStages,
    formatPlotData,
    computePlotAxisValues,
    computePlotInitialDomains,
    computePlotScales,
    extendPlotOppScales,
    preparePlotAxisLayout,
    // `measurePlotLineLabels` is invoked from Plot._draw rather than as part of
    // the canonical chain because it depends on test-axis state (xTest/yTest)
    // that's measured imperatively in _draw, not as a stage.
  ],
  // Plot._paint populates `viz._chartScene` imperatively; emit just snapshots it.
  emit: ({viz}: {viz: any}) =>
    Array.isArray(viz._chartScene) ? viz._chartScene.slice() : [],
  paintDriven: true,
};
