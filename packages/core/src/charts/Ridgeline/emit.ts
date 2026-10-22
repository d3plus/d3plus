/**
    Ridgeline's Area emitter: each summary row's density curve rising from
    its category's baseline, upper ridges drawn first so lower ones overlap
    them.
*/
import type {DataPoint} from "@d3plus/data";

import {densityMeta, densityShapeId} from "../helpers/densityChart.js";
import {growFromLine} from "../helpers/densityEnter.js";
import {genericEmit, type ShapeEmitter} from "../features/shapeEmit.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {categoryStep} from "../Violin/violinLayout.js";

/** A curve point: the ridge's row plus its pixel position, baseline, and top. */
interface RidgeDatum extends DataPoint {
  __pos: number;
  __base: number;
  __top: number;
}

/** The `overlap` setting as a non-negative number of category steps. */
export function ridgeOverlap(viz: VizInstance): number {
  const overlap = Number(viz.schema.overlap);
  return Number.isFinite(overlap) && overlap > 0 ? overlap : 0;
}

/**
    The category axis's point-scale padding and alignment: room for the top
    ridge's full height above the first baseline, none below the last.
    @param overlap How many category steps the tallest ridge rises.
*/
export function ridgelinePadding(overlap: number): [number, number] {
  return overlap > 0 ? [overlap / 2, 1] : [0, 0.5];
}

export const ridgelineEmit: ShapeEmitter = (ctx, key) => {
  const {viz, values, x, y, yRange, yDomain} = ctx;
  const overlap = ridgeOverlap(viz);
  const domain = yDomain as unknown[];
  const positions = domain.map(c => y(c, "y")).sort((a, b) => a - b);
  let step = categoryStep(
    yRange[yRange.length - 1] - yRange[0],
    domain.length,
    ridgelinePadding(overlap)[0],
  );
  for (let i = 1; i < positions.length; i++)
    step = Math.min(step, positions[i] - positions[i - 1]);
  const height = overlap * step;

  const rows = values
    .filter(d => densityMeta(d))
    .map(row => ({row, base: y(row.y, "y")}))
    .sort((a, b) => a.base - b.base);

  const outline: RidgeDatum[] = [];
  rows.forEach(({row, base}) => {
    const meta = densityMeta(row)!;
    meta.summary.curve.forEach(([v, density]) => {
      outline.push({
        ...row,
        id: densityShapeId(row),
        __pos: x(v),
        __base: base,
        __top: base - density * meta.scale * height,
      });
    });
  });

  const pos = (d: RidgeDatum) => d.__pos;
  const base = (d: RidgeDatum) => d.__base;
  const top = (d: RidgeDatum) => d.__top;
  const geometry = {x: pos, x0: pos, x1: null, y: base, y0: base, y1: top};
  const nodes = genericEmit(
    {...ctx, values: outline, shapeConfig: {...ctx.shapeConfig, ...geometry}},
    key,
  );
  growFromLine(
    nodes,
    "y",
    new Map(rows.map(({row, base}) => [densityShapeId(row), base])),
  );
  return nodes;
};
