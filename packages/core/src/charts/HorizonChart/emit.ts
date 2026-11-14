/**
    HorizonChart's emitter: each series in a row of its own, its bands drawn
    as pre-sliced polygons folded onto the row's baseline (so both backends
    draw them without clipping), under a transparent row that carries the
    series' points for hover, keyboard focus, and clicks.
*/
import type {DataPoint} from "@d3plus/data";
import type {InteractionPoint, SceneNode} from "@d3plus/render";

import type {ShapeEmitter} from "../features/shapeEmit.js";
import {growFromLine} from "../helpers/densityEnter.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {categoryStep} from "../Violin/violinLayout.js";
import {horizonSlices, type HorizonSlice} from "./horizonBands.js";
import {
  HORIZON_BAND,
  horizonState,
  rowValue,
  userRow,
  type HorizonBandMeta,
} from "./state.js";

/** The key prefix of each series' transparent row. */
export const HORIZON_ROW = "horizon-row-";

/** A row's vertical extent, in pixels. */
export interface HorizonRowBox {
  top: number;
  bottom: number;
}

/**
    Each row's box: rows share the category axis evenly, `gap` pixels apart
    (never more than half a row).
    @param centers Each row's center.
    @param step The distance between neighboring rows.
    @param gap The space between rows.
*/
export function horizonRowBox(
  center: number,
  step: number,
  gap: number,
): HorizonRowBox {
  const space = Math.min(Math.max(0, gap), step / 2);
  const height = step - space;
  return {top: center - height / 2, bottom: center + height / 2};
}

/** The SVG path of a band's slice in a row: its topline over the row's baseline. */
export function horizonSlicePath(
  slice: HorizonSlice,
  row: HorizonRowBox,
): string {
  const height = row.bottom - row.top;
  const pts = slice.points;
  const r = (n: number) => Math.round(n * 100) / 100;
  const top = pts.map(([x, h]) => `L${r(x)},${r(row.bottom - h * height)}`);
  return `M${r(pts[0][0])},${r(row.bottom)}${top.join("")}L${r(pts[pts.length - 1][0])},${r(row.bottom)}Z`;
}

/** The `rowGap` setting, in pixels. */
function rowGap(viz: VizInstance): number {
  const gap = Number(viz.schema.rowGap);
  return Number.isFinite(gap) && gap > 0 ? gap : 0;
}

export const horizonEmit: ShapeEmitter = ctx => {
  const {viz, values, x, y, yRange, yDomain, xRange} = ctx;
  const state = horizonState(viz);
  const bands = Math.max(1, Math.floor(Number(viz.schema.bands) || 1));
  const categories = yDomain as unknown[];
  const positions = categories.map(c => y(c, "y")).sort((a, b) => a - b);
  let step = categoryStep(
    yRange[yRange.length - 1] - yRange[0],
    categories.length,
    0.5,
  );
  for (let i = 1; i < positions.length; i++)
    step = Math.min(step, positions[i] - positions[i - 1]);
  const gap = rowGap(viz);
  const left = Math.min(...xRange),
    right = Math.max(...xRange);

  const series = new Map<string, DataPoint[]>();
  values.forEach(d => {
    const id = `${d.id}`;
    const list = series.get(id);
    if (list) list.push(d);
    else series.set(id, [d]);
  });

  const rows: SceneNode[] = [];
  const shapes: SceneNode[] = [];
  const baselines = new Map<string, number>();
  series.forEach((points, id) => {
    const box = horizonRowBox(y(points[0].y, "y"), step, gap);
    const center = (box.top + box.bottom) / 2;
    const placed = points
      .map(d => ({d, px: x(d.x), v: rowValue(viz, d, d.i as number)}))
      .sort((a, b) => a.px - b.px);
    const first = userRow(points[0]);
    const interactionPoints: InteractionPoint[] = placed
      .filter(p => Number.isFinite(p.px) && Number.isFinite(p.v))
      .map(p => ({x: p.px, y: center, datum: p.d, index: p.d.i as number}));
    rows.push({
      type: "rect",
      key: `${HORIZON_ROW}${id}`,
      x: left,
      y: box.top,
      width: right - left,
      height: box.bottom - box.top,
      datum: first,
      index: points[0].i as number,
      shapeType: "Area",
      paint: {fill: "transparent", stroke: "none"},
      aria: {label: state.labels.get(id) ?? id},
      ...(interactionPoints.length ? {interactionPoints} : {}),
    } as SceneNode);

    const slices = horizonSlices(
      placed.map(p => [p.px, p.v]),
      bands,
      state.size,
    );
    // Lower bands paint first, so each higher band folds over them.
    slices.sort((a, b) => a.band - b.band || b.sign - a.sign);
    const runs = new Map<string, number>();
    slices.forEach(slice => {
      const band = `${slice.sign > 0 ? "p" : "n"}${slice.band}`;
      const run = runs.get(band) ?? 0;
      runs.set(band, run + 1);
      const colors =
        slice.sign > 0 ? state.palette.positive : state.palette.negative;
      const near = slice.band * state.size,
        far = near + state.size;
      const meta: HorizonBandMeta = {
        band: slice.band,
        sign: slice.sign,
        range: slice.sign > 0 ? [near, far] : [-far, -near],
        color: colors[slice.band],
      };
      const key = `horizon-${id}-${band}${run ? `-${run}` : ""}`;
      baselines.set(key, box.bottom);
      shapes.push({
        type: "path",
        key,
        d: horizonSlicePath(slice, box),
        datum: {...first, [HORIZON_BAND]: meta as never},
        index: points[0].i as number,
        shapeType: "Area",
        interactive: false,
        aria: {hidden: true},
        paint: {fill: meta.color, stroke: "none"},
      } as SceneNode);
    });
  });
  growFromLine(shapes, "y", baselines);
  return [...rows, ...shapes];
};
