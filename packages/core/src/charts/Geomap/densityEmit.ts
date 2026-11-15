/**
    The scene nodes of a Geomap's `dotDensity` dots and `hexbin` bins.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import {colorScaleColor} from "../features/colorScaleValue.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {dotsPathD} from "./dotDensity.js";
import type {DotDensityLayout, DotGroup} from "./dotDensityLayout.js";
import {geoBinMeta, geoBinTitle} from "./geoHexbin.js";

/**
    The color of a group of dots: `dotDensity.fill`, else, with categories,
    the color the chart gives their row (as its legend shows), else the
    chart's text color.
    @param viz The Geomap.
    @param layout The dots.
    @param group The group.
*/
export function dotFill(
  viz: VizInstance,
  layout: DotDensityLayout,
  group: Pick<DotGroup, "row" | "index">,
): string {
  const {fill} = layout.settings;
  const own = resolveAccessor<unknown>(fill, group.row, group.index);
  if (typeof own === "string" && own) return own;
  if (layout.categories) {
    const paint = paintFromShapeConfig(
      shapeConfigFor(viz, "Circle"),
      group.row,
      group.index,
    );
    if (paint.fill) return paint.fill;
  }
  return backgroundInk(viz);
}

/** Each group's dots, as one path of circles. */
export function emitDots(
  viz: VizInstance,
  layout: DotDensityLayout | null | undefined,
): SceneNode[] {
  if (!layout) return [];
  const {r, fillOpacity} = layout.settings;
  const t = (s: string) => viz.schema.translate(s) as string;
  const out: SceneNode[] = [];
  for (const group of layout.groups) {
    if (!group.points.length) continue;
    const label = viz._drawLabel(group.row, group.index, 0);
    out.push({
      type: "path",
      key: `geomap-dots-${group.key}`,
      d: dotsPathD(group.points, r),
      datum: group.row,
      index: group.index,
      paint: {
        fill: dotFill(viz, layout, group),
        fillOpacity,
        stroke: "none",
        strokeWidth: 0,
      },
      aria: {
        label: `${label}, ${formatAbbreviate(group.points.length, viz.schema.locale)} ${t("Dots").toLowerCase()}.`,
      },
    } as SceneNode);
  }
  return out;
}

/** The bins, each a hexagon filled by its measure on the colorScale. */
export function emitBins(
  viz: VizInstance,
  bins: DataPoint[] | null | undefined,
): SceneNode[] {
  if (!bins || !bins.length) return [];
  const stroke = chartBackground(viz);
  const out: SceneNode[] = [];
  bins.forEach((row, index) => {
    const meta = geoBinMeta(row)!;
    out.push({
      type: "path",
      key: `geomap-bin-${row.id}`,
      d: meta.path,
      datum: row,
      index,
      paint: {
        fill: colorScaleColor(viz, meta.value) as string,
        stroke,
        strokeWidth: 0.5,
        vectorEffect: "non-scaling-stroke",
      },
      aria: {label: `${geoBinTitle(viz, row)}.`},
    } as SceneNode);
  });
  return out;
}
