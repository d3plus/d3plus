/**
    `pieEmit` — Path SceneNodes (one per slice) + label TextNodes.
*/

import type {PieArcDatum} from "d3-shape";
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
    // Place the label at the slice's centroid via labelBounds; emitLabels
    // expects x/y to be the anchor and labelBounds returns relative box.
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (_d, i) => `pie-label-${i}`,
    labelBounds: (_d, i) => {
      const slice = slices[i];
      const [cx, cy] = arcMakerCentroid(arcMaker, slice);
      const w = 80;
      const h = 20;
      return {x: cx - w / 2, y: cy - h / 2, width: w, height: h};
    },
    labelConfig: {fontResize: true},
  });

  return [...pathNodes, ...labelNodes];
};

// d3-shape's arc generator exposes `.centroid(d)`. The compute mode of
// emitLabels needs the per-slice centroid for positioning each label.
function arcMakerCentroid(arc: unknown, d: Slice): [number, number] {
  return (arc as {centroid(d: Slice): [number, number]}).centroid(d);
}
