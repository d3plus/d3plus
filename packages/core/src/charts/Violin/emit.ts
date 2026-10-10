/**
    Violin's Area emitter: each summary row's density curve drawn as a
    mirrored Area around its category, then the `inner` overlays.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {densityMeta, densityShapeId} from "../helpers/densityChart.js";
import {genericEmit, type ShapeEmitter} from "../features/shapeEmit.js";
import {emitInner, type PlacedViolin} from "./inner.js";
import {categoryStep, violinEdges, violinOutline, violinSlots} from "./violinLayout.js";

/** The category axis's outer padding, in steps. */
export const VIOLIN_PADDING = 0.5;

/** A curve point: the violin's row plus its pixel position and edges. */
interface OutlineDatum extends DataPoint {
  __pos: number;
  __low: number;
  __high: number;
}

export const violinEmit: ShapeEmitter = (ctx, key) => {
  const {viz, values, x, y, xRange, yRange, xDomain, yDomain} = ctx;
  const vertical = viz.schema.discrete !== "y";
  const category = vertical ? x : y;
  const value = vertical ? y : x;
  const axis = vertical ? "x" : "y";
  const range = vertical ? xRange : yRange;
  const domain = (vertical ? xDomain : yDomain) as unknown[];

  const positions = domain.map(c => category(c, axis)).sort((a, b) => a - b);
  let step = categoryStep(range[range.length - 1] - range[0], domain.length, VIOLIN_PADDING);
  for (let i = 1; i < positions.length; i++) step = Math.min(step, positions[i] - positions[i - 1]);

  const rows = values.filter(d => densityMeta(d));
  const slots = violinSlots(rows.map(d => `${d[axis]}`), {
    position: c => category(c, axis),
    step,
    gap: viz._groupPadding ?? 0,
    split: Boolean(viz.schema.split),
  });
  const placed: PlacedViolin[] = rows.map((row, i) => ({row, meta: densityMeta(row)!, slot: slots[i]}));

  const outline: OutlineDatum[] = [];
  placed.forEach(({row, meta, slot}) => {
    violinOutline(meta.summary.curve, meta.scale, slot.half).forEach(p => {
      const [low, high] = violinEdges(slot, p.extent);
      outline.push({...row, id: densityShapeId(row), __pos: value(p.value), __low: low, __high: high});
    });
  });

  const pos = (d: OutlineDatum) => d.__pos;
  const low = (d: OutlineDatum) => d.__low;
  const high = (d: OutlineDatum) => d.__high;
  const geometry = vertical
    ? {x: low, x0: low, x1: high, y: pos, y0: pos, y1: null}
    : {x: pos, x0: pos, x1: null, y: high, y0: high, y1: low};

  const nodes: SceneNode[] = genericEmit({...ctx, values: outline, shapeConfig: {...ctx.shapeConfig, ...geometry}}, key);
  return nodes.concat(emitInner(ctx, placed, {vertical, value: v => value(v)}));
};
