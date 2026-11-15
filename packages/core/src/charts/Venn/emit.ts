/**
    `vennEmit` — one path per region, painted from `shapeConfig` (single
    sets first, so each overlap draws over the circles it lies in), then
    each region's label: a set's name and count, or an overlap's count,
    centered on the spot deepest inside the part of the region no smaller
    region covers.
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {VennRegion} from "./applyLayout.js";

/** Labels go only in regions with at least this much room around their spot. */
export const MIN_LABEL_ROOM = 8;
/** The largest label font size. */
export const LABEL_FONT_MAX = 18;
/** Line height as a multiple of the font size. */
const LINE_HEIGHT = 1.2;

/** A box in chart-area coordinates. */
export interface LabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    A region's label lines: a set's name above its count, or an overlap's
    count (named for the set it covers, when that set lies inside another). The count is the region's exclusive count, or its row's size
    when `labelCounts` is `"inclusive"`; a region without one shows only
    its name, and an overlap without one shows nothing.
*/
export function regionLines(viz: VizInstance, region: VennRegion): string[] {
  const format = viz.schema.valueFormat as (v: number, d: DataPoint) => string;
  const count =
    viz.schema.labelCounts === "inclusive" ? region.value : region.exclusive;
  const named =
    region.named ??
    (region.sets.length === 1 ? {data: region.data, i: region.i} : undefined);
  const lines = named ? [viz._drawLabel(named.data, named.i)] : [];
  if (Number.isFinite(count)) lines.push(`${format(count, region.data)}`);
  return lines;
}

/**
    One box per line, stacked in the middle of the circle of radius `room`
    around (`x`, `y`): together as tall as the lines need at the largest
    font size, or less where the circle is too small, and as wide as the
    circle allows at that height.
*/
export function regionLineBoxes(
  x: number,
  y: number,
  room: number,
  lines: number,
  fontMax: number = LABEL_FONT_MAX,
): LabelBox[] {
  if (!lines || room <= 0) return [];
  const height = Math.min(room * 1.2, lines * fontMax * LINE_HEIGHT);
  const width = 2 * Math.sqrt(Math.max(0, room * room - (height / 2) ** 2));
  const line = height / lines;
  return Array.from({length: lines}, (_, k) => ({
    x: x - width / 2,
    y: y - height / 2 + k * line,
    width,
    height: line,
  }));
}

/** The labels of the regions with room for one. */
function vennLabels(
  viz: VizInstance,
  regions: VennRegion[],
  fills: Map<VennRegion, unknown>,
): SceneNode[] {
  const placed = new Map<DataPoint, {lines: string[]; boxes: LabelBox[]}>();
  const byRow = new Map<DataPoint, VennRegion>();
  for (const r of regions) {
    if (r.covered || r.label.margin < MIN_LABEL_ROOM) continue;
    const lines = regionLines(viz, r);
    const boxes = regionLineBoxes(
      r.label.x,
      r.label.y,
      r.label.margin,
      lines.length,
    );
    if (!boxes.length) continue;
    placed.set(r.data, {lines, boxes});
    byRow.set(r.data, r);
  }
  if (!placed.size) return [];
  const rowOf = (d: DataPoint): DataPoint =>
    ((d && (d.data as DataPoint)) ?? d) as DataPoint;
  return emitLabels({
    data: [...placed.keys()],
    datum: d => d,
    label: d => placed.get(d)?.lines ?? false,
    // Each line's box gets a pixel of slack above and below, since TextBox
    // drops a line exactly as tall as its box.
    labelBounds: d =>
      placed
        .get(d)
        ?.boxes.map(b => ({...b, y: b.y - 1, height: b.height + 2})) ?? false,
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: d => `venn-label-${byRow.get(d)?.key ?? ""}`,
    labelConfig: {
      fontMax: LABEL_FONT_MAX,
      fontMin: 8,
      fontResize: true,
      padding: 0,
      textAnchor: "middle",
      verticalAlign: "middle",
      fontWeight: (d: DataPoint) => {
        const lines = placed.get(rowOf(d))?.lines ?? [];
        return lines.length > 1 && d && d.l === 0 ? 600 : 400;
      },
      fontColor: (d: DataPoint) => {
        const region = byRow.get(rowOf(d));
        const fill = region ? fills.get(region) : undefined;
        return typeof fill === "string"
          ? colorContrast(fill, viz.schema.colorDefaults)
          : backgroundInk(viz);
      },
      ...userLabelConfig(viz, "Path"),
    },
  });
}

export const vennEmit: ChartEmit = ({viz, shapeData}) => {
  const regions = (shapeData ?? []) as unknown as VennRegion[];
  if (!regions.length) return [];
  const sc = shapeConfigFor(viz, "Path");
  const fills = new Map<VennRegion, unknown>();
  const paths: SceneNode[] = regions.map(r => {
    const paint = paintFromShapeConfig(sc, r.data, r.i);
    fills.set(r, resolveAccessor<unknown>(sc.fill, r.data, r.i));
    const fillOpacity = resolveAccessor<number>(sc.fillOpacity, r.data, r.i);
    const label = viz._drawLabel(r.data, r.i);
    const value = Number.isFinite(r.value)
      ? `, ${(viz.schema.valueFormat as (v: number, d: DataPoint) => string)(r.value, r.data)}`
      : "";
    return {
      type: "path",
      key: `venn-${r.key}`,
      d: r.d,
      datum: r.data,
      index: r.i,
      shapeType: "Path",
      paint: {
        ...paint,
        ...(typeof fillOpacity === "number" ? {fillOpacity} : {}),
      },
      aria: {label: `${label}${value}.`},
    } as SceneNode;
  });
  const userShape = (viz.schema.shapeConfig ?? {}) as {label?: unknown};
  const labels =
    userShape.label === false ? [] : vennLabels(viz, regions, fills);
  return [...paths, ...labels];
};
