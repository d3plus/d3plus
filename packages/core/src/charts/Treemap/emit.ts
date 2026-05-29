/**
    `treemapEmit` — scene nodes for a laid-out Treemap: one rect per cell
    plus the title + share-% text labels for each cell, both as flat data.
*/

import {colorContrast} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import type {TreemapShapeNode} from "./applyLayout.js";

function resolveAccessor<T>(
  val: unknown,
  d: DataPoint,
  i: number | undefined,
): T | undefined {
  if (typeof val === "function") {
    return (val as (d: DataPoint, i: number | undefined) => T)(d, i);
  }
  return val as T | undefined;
}

export const treemapEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  const nodes = (shapeData ?? []) as TreemapShapeNode[];
  if (!nodes.length) return [];

  const locale = viz._locale;
  const drawLabel = viz._drawLabel;
  const sc = (viz._shapeConfig ?? {}) as Record<string, unknown>;

  const rectNodes: SceneNode[] = nodes.map(d => {
    const fill = resolveAccessor<string>(sc.fill, d.data, d.i);
    const stroke = resolveAccessor<string | undefined>(sc.stroke, d.data, d.i);
    const opacity = resolveAccessor<number>(sc.opacity, d.data, d.i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d.data, d.i);
    return {
      type: "rect",
      key: `treemap-${d.id}`,
      x: d.x0,
      y: d.y0,
      width: d.x1 - d.x0,
      height: d.y1 - d.y0,
      datum: d.data,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke:
          typeof stroke === "string" || stroke == null
            ? stroke
            : String(stroke),
        opacity,
        strokeWidth,
      },
      aria: {
        label: `${drawLabel(d.data, d.i ?? 0)}, ${(viz._sum as (d: DataPoint) => number)(d.data)}, ${formatAbbreviate(d.share * 100, locale)}%`,
      },
    } as SceneNode;
  });

  const labelNodes = emitLabels({
    data: nodes as unknown as DataPoint[],
    label: d => {
      const node = d as unknown as TreemapShapeNode;
      return [
        drawLabel(node.data, node.i ?? 0),
        `${formatAbbreviate(node.share * 100, locale)}%`,
      ];
    },
    x: d => {
      const node = d as unknown as TreemapShapeNode;
      return node.x0 + (node.x1 - node.x0) / 2;
    },
    y: d => {
      const node = d as unknown as TreemapShapeNode;
      return node.y0 + (node.y1 - node.y0) / 2;
    },
    aes: d => {
      const node = d as unknown as TreemapShapeNode;
      return {width: node.x1 - node.x0, height: node.y1 - node.y0};
    },
    rotate: constant(0),
    id: d => (d as unknown as TreemapShapeNode).id,
    labelBounds: (_d, _i, aes) => {
      const fontMax = 32;
      const fontMin = 8;
      const padding = 5;
      const {width: w, height: h} = aes as {width: number; height: number};
      let sh = Math.min(fontMax, (h - padding * 2) * 0.5);
      if (sh < fontMin) sh = 0;
      return [
        {width: w, height: h - sh, x: -w / 2, y: -h / 2},
        {width: w, height: sh + padding * 2, x: -w / 2, y: h / 2 - sh - padding * 2},
      ];
    },
    labelConfig: {
      fontMax: 32,
      textAnchor: (d: DataPoint & {l?: number}) =>
        d && d.l === 0 ? "start" : "middle",
      verticalAlign: (d: DataPoint & {l?: number}) =>
        d && d.l === 0 ? "top" : "bottom",
      fontColor: (d: DataPoint & {data?: DataPoint; i?: number}) => {
        const src = (d && d.data ? d.data : d) as DataPoint & {i?: number};
        const fillVal = resolveAccessor<string>(sc.fill, src, src.i);
        return typeof fillVal === "string" ? colorContrast(fillVal) : undefined;
      },
    },
  });

  return [...rectNodes, ...labelNodes];
};
