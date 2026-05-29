/**
    `treeEmit` — Path (links) + per-shape-type nodes, stashed by the layout
    stage on `viz.ctx`. Emits flat SceneNodes directly (no transient Shape
    compute pass).
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../emitHelpers.js";
import type {ChartDefinition} from "../ChartDefinition.js";

interface ShapeGroup {
  key: string;
  values: DataPoint[];
}

type TreeShapeConfig = {
  id: (d: DataPoint, i: number) => string;
  label: (d: DataPoint, i: number) => unknown;
  labelConfig: Record<string, unknown>;
  labelBounds: (
    d: DataPoint,
    i: number,
    s: Record<string, number>,
  ) => Record<string, number>;
};

/**
    Geometry per shape kind: returns the SceneNode fields that vary by
    kind (`type`, geometry coords) plus an `aes` record used by
    labelBounds. The position of the shape is taken from the node datum's
    `x` and `y` (Tree layout sets these on every TreeNode).
*/
function geometryFor(
  shapeKind: string,
  d: DataPoint & {x?: number; y?: number; data?: DataPoint; i?: number},
  config: Record<string, unknown>,
): {geom: Record<string, unknown>; aes: Record<string, number>} | null {
  const dataD = (d.data ?? d) as DataPoint;
  const i = (d.i ?? 0) as number;
  const x = (d.x ?? 0) as number;
  const y = (d.y ?? 0) as number;
  switch (shapeKind) {
    case "Circle": {
      const r = Number(resolveAccessor<number>(config.r, dataD, i) ?? 0);
      return {
        geom: {type: "circle", cx: x, cy: y, r},
        aes: {r},
      };
    }
    case "Rect": {
      const w = Number(resolveAccessor<number>(config.width, dataD, i) ?? 0);
      const h = Number(resolveAccessor<number>(config.height, dataD, i) ?? 0);
      return {
        geom: {type: "rect", x: x - w / 2, y: y - h / 2, width: w, height: h},
        aes: {width: w, height: h},
      };
    }
    case "Path": {
      const dStr = String(resolveAccessor<string>(config.d, dataD, i) ?? "");
      return {
        geom: {type: "path", d: dStr},
        aes: {},
      };
    }
    default:
      return null;
  }
}

export const treeEmit: ChartDefinition["emit"] = ({viz}) => {
  const linksData = viz.ctx.linksData as
    | (DataPoint & {depth?: number; i?: number})[]
    | undefined;
  const linkD = viz.ctx.linkD as ((d: DataPoint) => string) | undefined;
  const shapeGroups = viz.ctx.shapeGroups as ShapeGroup[] | undefined;
  const chartShapeConfig = viz.ctx.shapeConfig as TreeShapeConfig | undefined;
  if (!shapeGroups || !chartShapeConfig) return [];

  const out: SceneNode[] = [];

  // Links (Path nodes between parent and child).
  if (linksData && linksData.length && linkD) {
    const pathConfig = shapeConfigFor(viz, "Path");
    for (let i = 0; i < linksData.length; i++) {
      const d = linksData[i];
      const datum = (d.data ?? d) as DataPoint;
      const paint = paintFromShapeConfig(pathConfig, datum, i);
      // Link id: id at the source's depth (d.depth-1), matching the
      // layout's `id` config in `shapeConfig`.
      const id = (viz._ids(datum, i) as string[])[(d.depth ?? 1) - 1];
      // Translate the path's local coords (relative to the source's
      // position) by the node's x/y.
      const tx = d.x ?? 0;
      const ty = d.y ?? 0;
      out.push({
        type: "path",
        key: `tree-link-${id}`,
        d: linkD(d),
        datum,
        paint,
        transform: {x: tx, y: ty},
      } as SceneNode);
    }
  }

  // Per-shape-kind node groups.
  for (const {key: shapeKind, values} of shapeGroups) {
    if (!values.length) continue;
    const vizShapeConfig = shapeConfigFor(viz, shapeKind);
    // Chart-specific shapeConfig overrides (label, labelBounds, etc.).
    const merged = {...vizShapeConfig, ...chartShapeConfig};

    type Node = DataPoint & {x?: number; y?: number; data?: DataPoint; i?: number; depth?: number};
    const nodes: Node[] = values as unknown as Node[];

    for (let i = 0; i < nodes.length; i++) {
      const d = nodes[i];
      const datum = (d.data ?? d) as DataPoint;
      const g = geometryFor(shapeKind, d, merged);
      if (!g) continue;
      const id = chartShapeConfig.id(d, i);
      const paint = paintFromShapeConfig(merged, datum, i);
      out.push({
        ...g.geom,
        key: `tree-${shapeKind}-${id}`,
        datum,
        paint,
      } as SceneNode);
    }

    // Labels via the chart-specific labelBounds/label/labelConfig.
    const labelNodes = emitLabels({
      data: nodes as DataPoint[],
      label: (d, i) => chartShapeConfig.label(d, i),
      x: d => ((d as Node).x ?? 0),
      y: d => ((d as Node).y ?? 0),
      aes: d => geometryFor(shapeKind, d as Node, merged)?.aes ?? {},
      rotate: constant(0),
      id: (d, i) => chartShapeConfig.id(d, i),
      labelBounds: (d, i, aes) =>
        chartShapeConfig.labelBounds(d, i, aes as Record<string, number>),
      labelConfig: chartShapeConfig.labelConfig,
    });
    out.push(...labelNodes);
  }

  return out;
};
