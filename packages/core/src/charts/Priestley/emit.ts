/**
    `priestleyEmit` — one rect per band + label TextNodes (drawLabel at
    the band center).
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {PriestleyDatum} from "./applyLayout.js";

function resolveAccessor<T>(
  val: unknown,
  d: DataPoint,
  i: number,
): T | undefined {
  if (typeof val === "function") {
    return (val as (d: DataPoint, i: number) => T)(d, i);
  }
  return val as T | undefined;
}

export const priestleyEmit: ChartEmit = ({viz, shapeData}) => {
  const data = (shapeData ?? []) as PriestleyDatum[];
  if (!data.length) return [];
  const xScale = viz.ctx.xScale as (v: number | Date) => number;
  const yScale = viz.ctx.yScale as (k: string) => number;
  const bandWidth = viz.ctx.bandWidth as number;
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;

  const rectNodes: SceneNode[] = data.map((d, i) => {
    const fill = resolveAccessor<string>(sc.fill, d.data, i);
    const stroke = resolveAccessor<string>(sc.stroke, d.data, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d.data, i);
    const w = Math.abs(xScale(d.end) - xScale(d.start));
    const width = w > 2 ? w - 2 : w;
    const x = xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2 - width / 2;
    const y = yScale(String(d.lane));
    return {
      type: "rect",
      key: `priestley-${d.id}-${i}`,
      x,
      y,
      width,
      height: bandWidth,
      datum: d.data,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        strokeWidth,
      },
    } as SceneNode;
  });

  const labelNodes = emitLabels({
    data: data as unknown as DataPoint[],
    label: (_d, i) => viz._drawLabel(data[i].data, i),
    x: (_d, i) => {
      const d = data[i];
      return xScale(d.start) + (xScale(d.end) - xScale(d.start)) / 2;
    },
    y: (_d, i) => (yScale(String(data[i].lane)) ?? 0) + bandWidth / 2,
    aes: (_d, i) => {
      const d = data[i];
      const w = Math.abs(xScale(d.end) - xScale(d.start));
      return {width: w > 2 ? w - 2 : w, height: bandWidth};
    },
    rotate: constant(0),
    id: (_d, i) => `priestley-label-${data[i].id}-${i}`,
    labelBounds: (_d, _i, aes) => {
      const {width, height} = aes as {width: number; height: number};
      return {x: -width / 2, y: -height / 2, width, height};
    },
    labelConfig: {
      fontColor: (d: {data?: PriestleyDatum}) => {
        const pd = (d.data ?? d) as PriestleyDatum;
        const fill = resolveAccessor<string>(sc.fill, pd.data, pd.i);
        return colorContrast(typeof fill === "string" ? fill : "rgb(255, 255, 255)");
      },
      fontResize: false,
      textAnchor: "start",
      verticalAlign: "top",
    },
  });

  return [...rectNodes, ...labelNodes];
};
