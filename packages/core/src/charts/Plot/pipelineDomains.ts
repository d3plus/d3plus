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
import {extent, groups, max, min, sum} from "d3-array";
import * as d3Shape from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import type {TransformStage, VizContext} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A formatted Plot data row (the PlotDatum shape produced by `formatPlotData`). */
type Row = Record<string, unknown>;
/** A domain value for any of the four axes. */
type DomainValue = number | string | Date;

interface StackedCtx {
  data: Row[];
  axisData: Row[];
  xData: unknown[];
  yData: unknown[];
  opp: string | undefined;
  stackGroup: (d: DataPoint, i: number) => string;
}

/**
    Pushes zero-value filler points for any Area series missing from a discrete
    group, so the d3-stack has a complete grid. Mutates `data` in place.
*/
function fillMissingAreaPoints(
  viz: VizInstance,
  ctx: {
    axisData: Row[];
    data: Row[];
    stackData: Row[][];
    stackKeys: unknown[];
    stackGroup: (d: DataPoint, i: number) => string;
    opp: string | undefined;
  },
): void {
  const {axisData, data, stackData, stackKeys, stackGroup, opp} = ctx;
  stackData.forEach((g: Row[]) => {
    const ids = Array.from(new Set(g.map((d: Row) => d.id)));
    if (ids.length < stackKeys.length) {
      stackKeys.forEach((k: unknown) => {
        if (!ids.includes(k)) {
          const d = axisData.filter((d: Row) => d.id === k)[0];
          const shape = d.shape as string;
          if (shape === "Area") {
            const group = stackGroup(d.data as DataPoint, d.i as number);
            const fillerPoint: Row = {
              __d3plus__: true,
              data: d.data,
              discrete:
                (d.shape as string) === "Bar"
                  ? `${g[0][viz.schema.discrete]}_${group}`
                  : `${g[0][viz.schema.discrete]}`,
              group,
              id: d.id,
              ids: k,
              shape,
              [viz.schema.discrete]: g[0][viz.schema.discrete],
              [opp as string]: 0,
            };
            data.push(fillerPoint);
          }
        }
      });
    }
  });
}

/** Stacked branch: d3-stack + extent-derived domains. */
function computeStackedDomains(viz: VizInstance, ctx: StackedCtx): Partial<VizContext> {
  const {data, axisData, xData, yData, opp, stackGroup} = ctx;

  const stackedData = axisData.filter((d: Row) =>
    ["Area", "Bar"].includes(d.shape as string),
  );

  const groupValues = groups(
    stackedData,
    (d: Row) => d.group as string,
  ).reduce((obj: Record<string, number>, [key, values]) => {
    if (!obj[key]) obj[key] = 0;
    obj[key] += sum(values as Row[], (dd: Row) => dd[opp as string] as number);
    return obj;
  }, {});

  axisData.sort((a: Row, b: Row) => {
    if (viz.schema[`${viz.schema.discrete}Sort`])
      return viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data);
    const a1 = a[viz.schema.discrete] as number,
      b1 = b[viz.schema.discrete] as number;
    if (a1 - b1 !== 0) return a1 - b1;
    if (a.group !== b.group)
      return groupValues[b.group as string] - groupValues[a.group as string];
    return (b[opp as string] as number) - (a[opp as string] as number);
  });

  const discreteKeys = Array.from(new Set(axisData.map((d: Row) => d.discrete)));
  const stackKeys = Array.from(new Set(axisData.map((d: Row) => d.id)));

  const stackGroupsData: Row[][] = groups(
    axisData,
    (d: Row) => d.discrete,
  ).map(([, values]) => values);

  fillMissingAreaPoints(viz, {axisData, data, stackData: stackGroupsData, stackKeys, stackGroup, opp});

  if (viz.schema[`${viz.schema.discrete}Sort`]) {
    data.sort((a: Row, b: Row) => viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data));
  } else {
    data.sort(
      (a: Row, b: Row) =>
        (a[viz.schema.discrete] as number) - (b[viz.schema.discrete] as number),
    );
  }

  const order = viz._stackOrder;

  if (Array.isArray(order))
    stackKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
  else if ((order as unknown) === d3Shape.stackOrderNone)
    stackKeys.sort((a, b) => `${a}`.localeCompare(`${b}`));

  // d3-stack's generics don't model d3plus's dynamically-keyed rows; the
  // order/offset/value accessors are cast (`as never`) at the boundary, and
  // the configured stack is invoked as a `Row[][] -> number[][][]` function.
  const stackData = (d3Shape
    .stack()
    .keys(stackKeys as string[])
    .offset(viz._stackOffset as never)
    .order((Array.isArray(order) ? d3Shape.stackOrderNone : order) as never)
    .value(((group: Row[], key: string) => {
      const d = group.filter((g: Row) => g.id === key);
      return d.length ? (d[0][opp as string] as number) : 0;
    }) as never) as unknown as (data: Row[][]) => number[][][])(stackGroupsData);

  const discreteData = (viz.schema.discrete === "x" ? xData : yData) as DomainValue[];
  const discreteTime = viz.schema.discrete === "x" ? viz._xTime : viz._yTime;

  const domains: Record<string, DomainValue[]> = {
    [viz.schema.discrete]: (discreteTime
      ? extent(discreteData as (number | Date)[])
      : discreteData) as DomainValue[],
    [opp as string]: [
      min(stackData.map((g: number[][]) => min(g.map((p: number[]) => p[0])) as number)) as number,
      max(stackData.map((g: number[][]) => max(g.map((p: number[]) => p[1])) as number)) as number,
    ],
  };

  return {
    plotInitialDomains: domains,
    plotDiscreteKeys: discreteKeys,
    plotStackData: stackData,
    plotStackKeys: stackKeys,
  };
}

/** Non-stacked branch: data-values-or-extent domains per axis. */
function computeNonStackedDomains(
  viz: VizInstance,
  ctx: {axisData: Row[]; xData: unknown[]; x2Data: unknown[]; yData: unknown[]; y2Data: unknown[]},
): Partial<VizContext> {
  const {axisData, xData, x2Data, yData, y2Data} = ctx;
  const xTime = viz._xTime, x2Time = viz._x2Time, yTime = viz._yTime, y2Time = viz._y2Time;
  const discrete = viz.schema.discrete || "x";

  if (viz.schema[`${viz.schema.discrete}Sort`]) {
    axisData.sort((a: Row, b: Row) => viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data));
  } else {
    axisData.sort((a: Row, b: Row) => (a[discrete] as number) - (b[discrete] as number));
  }

  const domains: Record<string, DomainValue[]> = {
    x: ((!xTime && viz.schema.discrete === "x") || viz.schema.xSort
      ? xData
      : extent(xData as (number | Date)[])) as DomainValue[],
    x2: ((!x2Time && viz.schema.discrete === "x") || viz.schema.x2Sort
      ? x2Data
      : extent(x2Data as (number | Date)[])) as DomainValue[],
    y: ((!yTime && viz.schema.discrete === "y") || viz.schema.ySort
      ? yData
      : extent(yData as (number | Date)[])) as DomainValue[],
    y2: ((!y2Time && viz.schema.discrete === "y") || viz.schema.y2Sort
      ? y2Data
      : extent(y2Data as (number | Date)[])) as DomainValue[],
  };

  return {
    plotInitialDomains: domains,
    plotDiscreteKeys: [],
    plotStackData: [],
    plotStackKeys: [],
  };
}

export const computePlotInitialDomains: TransformStage = ({viz, plotFormattedData, plotAxisData, xData, x2Data, yData, y2Data, plotStackGroup}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  const stackGroup = plotStackGroup as (d: DataPoint, i: number) => string;
  const opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined;

  return viz.schema.stacked
    ? computeStackedDomains(viz, {
        data,
        axisData,
        xData: xData || [],
        yData: yData || [],
        opp,
        stackGroup,
      })
    : computeNonStackedDomains(viz, {
        axisData,
        xData: xData || [],
        x2Data: x2Data || [],
        yData: yData || [],
        y2Data: y2Data || [],
      });
};
