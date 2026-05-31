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
/* eslint-disable @typescript-eslint/no-explicit-any */

import {extent, groups, max, min, sum} from "d3-array";
import * as d3Shape from "d3-shape";

import type {TransformStage, VizContext} from "../pipeline/stages.js";

interface StackedCtx {
  data: any[];
  axisData: any[];
  xData: any;
  yData: any;
  opp: string | undefined;
  stackGroup: (d: any, i: number) => string;
}

/**
    Pushes zero-value filler points for any Area series missing from a discrete
    group, so the d3-stack has a complete grid. Mutates `data` in place.
*/
function fillMissingAreaPoints(
  viz: any,
  ctx: {axisData: any[]; data: any[]; stackData: any[]; stackKeys: any[]; stackGroup: (d: any, i: number) => string; opp: string | undefined},
): void {
  const {axisData, data, stackData, stackKeys, stackGroup, opp} = ctx;
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
}

/** Stacked branch: d3-stack + extent-derived domains. */
function computeStackedDomains(viz: any, ctx: StackedCtx): Partial<VizContext> {
  const {data, axisData, xData, yData, opp, stackGroup} = ctx;

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

  const discreteKeys = Array.from(new Set(axisData.map((d: any) => d.discrete)));
  const stackKeys = Array.from(new Set(axisData.map((d: any) => d.id)));

  let stackData: any[] = groups(
    axisData,
    (d: Record<string, unknown>) => d.discrete,
  ).map(([, values]) => values);

  fillMissingAreaPoints(viz, {axisData, data, stackData, stackKeys, stackGroup, opp});

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

  const domains: any = {
    [viz.schema.discrete]: viz[`_${viz.schema.discrete}Time`]
      ? extent(discreteData as any[])
      : discreteData,
    [opp as string]: [
      min(stackData.map((g: any) => min(g.map((p: any) => p[0])) as unknown as number)),
      max(stackData.map((g: any) => max(g.map((p: any) => p[1])) as unknown as number)),
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
  viz: any,
  ctx: {axisData: any[]; xData: any; x2Data: any; yData: any; y2Data: any},
): Partial<VizContext> {
  const {axisData, xData, x2Data, yData, y2Data} = ctx;
  const xTime = viz._xTime, x2Time = viz._x2Time, yTime = viz._yTime, y2Time = viz._y2Time;
  const discrete = viz.schema.discrete || "x";

  if (viz.schema[`${viz.schema.discrete}Sort`]) {
    axisData.sort((a: any, b: any) => viz.schema[`${viz.schema.discrete}Sort`](a.data, b.data));
  } else {
    axisData.sort((a: any, b: any) => a[discrete] - b[discrete]);
  }

  const domains: any = {
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
  const stackGroup = plotStackGroup as (d: any, i: number) => string;
  const opp = viz.schema.discrete ? (viz.schema.discrete === "x" ? "y" : "x") : undefined;

  return viz.schema.stacked
    ? computeStackedDomains(viz, {data, axisData, xData, yData, opp, stackGroup})
    : computeNonStackedDomains(viz, {axisData, xData, x2Data, yData, y2Data});
};
