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
import {unique} from "@d3plus/data";

import {withAxisInk} from "./axisInk.js";
import {baselineBreakAxisConfig} from "./baselineBreak.js";
import {
  hasUserDomain,
  plotAxisRounding,
  secondaryAxisRounding,
} from "./baselineDomain.js";
import {isSpanAxis, spanEdges} from "./discreteSpan.js";
import {swarmHidesAxis} from "./swarm.js";
import type {DomainValue} from "./pipelineScales.js";
import {shapeConfigFor} from "../features/emitHelpers.js";
import {xAxisRounding} from "../features/xAxisConfig.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {D3Scale} from "../../utils/index.js";

/** The viz a Plot pipeline stage reads. */
type PlotViz = Parameters<TransformStage>[0]["viz"];

/** Whether the x and y axes show, by the chart's size against their cutoffs. */
function plotAxisVisibility(viz: PlotViz): {showX: boolean; showY: boolean} {
  const showX =
    viz.schema.discrete === "x"
      ? viz.schema.width > viz._discreteCutoff &&
        viz.schema.width > viz.schema.xCutoff
      : viz.schema.width > viz.schema.xCutoff && !swarmHidesAxis(viz, "x");
  const showY =
    viz.schema.discrete === "y"
      ? viz.schema.height > viz._discreteCutoff &&
        viz.schema.height > viz.schema.yCutoff
      : viz.schema.height > viz.schema.yCutoff && !swarmHidesAxis(viz, "y");
  return {showX, showY};
}

/**
    The base y-axis config. Without an x axis (and no swarm), the y axis drops
    its bar and ticks and spreads its two labels down the chart's halves.
*/
function plotYAxisConfig(
  viz: PlotViz,
  y: D3Scale,
  yData: unknown[] | undefined,
  yRounding: string,
  visible: {showX: boolean; showY: boolean},
): Record<string, unknown> {
  const yC: Record<string, unknown> = {
    data: yData,
    locale: viz.schema.locale,
    rounding: plotAxisRounding(viz, "y", yRounding),
    scalePadding: y.padding ? y.padding() : 0,
    scaleAlign: y.align ? y.align() : 0.5,
    ...baselineBreakAxisConfig(viz, "y"),
  };
  if (!visible.showX && visible.showY && !viz._swarm) {
    yC.barConfig = {stroke: "transparent"};
    yC.tickSize = 0;
    yC.shapeConfig = {
      labelBounds: (
        d: {labelBounds: {width: number; y: number}},
        i: number,
      ) => {
        const {width: w, y: yy} = d.labelBounds;
        const h = viz.schema.height / 2;
        const xx = i ? -h : 0;
        return {x: xx, y: yy, width: w, height: h};
      },
      labelConfig: {padding: 0, rotate: 0},
      labelRotation: false,
    };
  }
  return yC;
}

/** The Bar labels drawn for the rows, as strings — used to suppress redundant axis ticks. */
function plotBarLabels(
  viz: PlotViz,
  axisData: Record<string, unknown>[],
): string[] {
  const barConfig = shapeConfigFor(viz, "Bar");
  const barLabelFunction =
    barConfig.label !== undefined
      ? typeof barConfig.label === "function"
        ? barConfig.label
        : () => barConfig.label
      : viz._drawLabel;
  // A Box draws no label, so its rows never make a tick redundant.
  return axisData
    .filter((d: Record<string, unknown>) => d.shape !== "Box")
    .map((d: Record<string, unknown>) => barLabelFunction(d.data, d.i))
    .filter((d: unknown) => typeof d === "number" || d)
    .map(String);
}

export const preparePlotAxisLayout: TransformStage = ({
  viz,
  plotAxisData,
  plotScales,
  x2Exists,
  y2Exists,
  x2Data,
  y2Data,
  yData,
}) => {
  const axisData = plotAxisData || [];
  const {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale} = plotScales!;
  const xDomain = x.domain() as DomainValue[];
  const x2Domain = x2.domain() as DomainValue[];
  const yDomain = y.domain() as DomainValue[];
  const y2Domain = y2.domain() as DomainValue[];

  const defaultConfig = {
    barConfig: {"stroke-width": 0},
    gridSize: 0,
    labels: [],
    title: false,
    tickSize: 0,
  };
  // An axis config's full `domain` is drawn as given (see `plotAxisRounding`).
  const yRounding =
    hasUserDomain(viz, "y") || isSpanAxis(viz, "y") ? "none" : "outside";
  const defaultX2Config = {
    ...(x2Exists ? {data: x2Data} : defaultConfig),
    baselineBreak: false,
    rounding: secondaryAxisRounding(viz, "x2", xAxisRounding(viz)),
  };
  const defaultY2Config = {
    ...(y2Exists ? {data: y2Data} : defaultConfig),
    baselineBreak: false,
    rounding: secondaryAxisRounding(viz, "y2", yRounding),
  };
  const {showX, showY} = plotAxisVisibility(viz);

  const yC = plotYAxisConfig(viz, y, yData, yRounding, {showX, showY});

  const barLabels = plotBarLabels(viz, axisData);

  const tickFor = (axis: string, axisScale: string) => {
    if (isSpanAxis(viz, axis)) return spanEdges(viz, axisData);
    const ticks = unique(axisData.map((d: Record<string, unknown>) => d[axis]));
    return axisScale === "Point" && ticks.every(t => barLabels.includes(`${t}`))
      ? []
      : null;
  };

  return {
    plotDefaultConfig: defaultConfig,
    plotDefaultX2Config: withAxisInk(viz, defaultX2Config),
    plotDefaultY2Config: withAxisInk(viz, defaultY2Config),
    plotShowX: showX,
    plotShowY: showY,
    plotYC: withAxisInk(viz, yC),
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
