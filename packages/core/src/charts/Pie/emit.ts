/**
    `pieEmit` — Path SceneNodes (one per slice) + label TextNodes.
*/

import type {PieArcDatum} from "d3-shape";
import {colorContrast} from "@d3plus/color";
import {largestRect, path2polygon} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartDefinition} from "../ChartDefinition.js";

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

type Slice = PieArcDatum<DataPoint> & {__d3plus__?: true; i?: number};

export const pieEmit: ChartDefinition["emit"] = ({viz, shapeData}) => {
  const slices = (shapeData ?? []) as Slice[];
  if (!slices.length) return [];

  const arcMaker = viz.ctx.arcData as (d: Slice) => string;
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;

  const pathNodes: SceneNode[] = slices.map(d => {
    const fill = resolveAccessor<string>(sc.fill, d.data as DataPoint, d.i ?? 0);
    const stroke = resolveAccessor<string>(sc.stroke, d.data as DataPoint, d.i ?? 0);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d.data as DataPoint, d.i ?? 0);
    return {
      type: "path",
      key: `pie-${viz._ids(d.data as DataPoint, d.i ?? 0).join("-")}`,
      d: arcMaker(d),
      datum: d.data,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        strokeWidth,
      },
    } as SceneNode;
  });

  const labelNodes = emitLabels({
    data: slices as unknown as DataPoint[],
    label: (_d, i) => viz._drawLabel((slices[i].data as DataPoint), slices[i].i ?? i),
    // The largest inscribed rectangle is in chart-centered path coordinates,
    // so the anchor is the origin and labelBounds carries the absolute box.
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (_d, i) => `pie-label-${i}`,
    labelBounds: (_d, i) => {
      const r = largestRect(path2polygon(arcMaker(slices[i])), {angle: 0});
      if (!r) return false;
      return {
        angle: r.angle,
        width: r.width,
        height: r.height,
        x: r.cx - r.width / 2,
        y: r.cy - r.height / 2,
      };
    },
    labelConfig: {
      fontColor: (d: {data?: Slice}) => {
        const slice = (d.data ?? d) as Slice;
        const fill = resolveAccessor<string>(
          sc.fill,
          slice.data as DataPoint,
          slice.i ?? 0,
        );
        return colorContrast(typeof fill === "string" ? fill : "rgb(255, 255, 255)");
      },
      fontResize: true,
      textAnchor: "middle",
      verticalAlign: "middle",
    },
  });

  return [...pathNodes, ...labelNodes];
};
