/**
    `packEmit` — Circle SceneNodes for each visible node in the pack +
    label TextNodes (leaves only).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartDefinition} from "../ChartDefinition.js";
import type {PackLeaf} from "./applyLayout.js";

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

export const packEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  const nodes = (shapeData ?? []) as PackLeaf[];
  if (!nodes.length) return [];

  const sc = (viz._shapeConfig ?? {}) as Record<string, unknown>;
  // Pack's per-shape config is nested under `Circle`.
  const circleConfig = (sc.Circle ?? {}) as Record<string, unknown>;
  const labelFn = circleConfig.label as ((d: DataPoint, i: number) => unknown) | undefined;

  const circleNodes: SceneNode[] = nodes.map((d, i) => {
    const datum = d.data as DataPoint & {__d3plusOpacity__?: number};
    const fill = resolveAccessor<string>(sc.fill, datum, i);
    const stroke = resolveAccessor<string>(sc.stroke, datum, i);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, datum, i);
    return {
      type: "circle",
      key: `pack-${d.id}-${d.i}`,
      cx: d.x,
      cy: d.y,
      r: d.r,
      datum,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        opacity: datum.__d3plusOpacity__,
        strokeWidth,
      },
    } as SceneNode;
  });

  const labelNodes = emitLabels({
    data: nodes as unknown as DataPoint[],
    label: (d, i) => {
      const node = d as unknown as PackLeaf;
      if (node.children) return false;
      if (labelFn) return labelFn(node.data as DataPoint, i);
      return node.parent ? (node.data as DataPoint).id ?? false : false;
    },
    x: d => (d as unknown as PackLeaf).x,
    y: d => (d as unknown as PackLeaf).y,
    aes: d => {
      const r = (d as unknown as PackLeaf).r;
      return {r, width: 2 * r, height: 2 * r};
    },
    rotate: constant(0),
    id: d => (d as unknown as PackLeaf).id,
    labelBounds: (_d, _i, aes) => {
      const r = (aes as {r: number}).r;
      return {width: r * 1.6, height: r * 0.8, x: -r * 0.8, y: -r * 0.4};
    },
    labelConfig: {fontResize: true},
  });

  return [...circleNodes, ...labelNodes];
};
