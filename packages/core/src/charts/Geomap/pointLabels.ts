/**
    Labels of a Geomap's coordinate points: each sits inside its point when it
    fits there, else beside it where there's room, else hides (see
    `labelPosition`).

    @module
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels, shapeLabelDefaults} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {chartBounds} from "../features/chartGeometry.js";
import {
  emitOutsideLabels,
  insideFontMin,
  layoutCircleLabels,
  outsideLabels,
} from "../features/circleLabels.js";
import type {CircleLabelItem} from "../features/circleLabels.js";
import {resolveAccessor, userLabelConfig} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A Geomap's projected points (see `geomapCtx`). */
export interface GeomapPoints {
  points: DataPoint[];
  pointR: (d: DataPoint, i: number) => number;
  pointX: (d: DataPoint, i: number) => number;
  pointY: (d: DataPoint, i: number) => number;
}

/**
    The label text of a point: the Circle shapeConfig's `label` (`false`
    turns point labels off), else the chart's label for the row.
*/
function pointLabel(
  viz: VizInstance,
  circleConfig: Record<string, unknown>,
  d: DataPoint,
  i: number,
): unknown {
  const label = circleConfig.label;
  if (label === false) return undefined;
  if (label !== undefined) return resolveAccessor(label, d, i);
  return viz._drawLabel(d, i);
}

/**
    The scene nodes of a Geomap's point labels, painted above the points.
    @param viz The Geomap.
    @param c The projected points, in the order they're drawn.
    @param circleConfig The merged Circle shapeConfig.
*/
export function geomapPointLabels(
  viz: VizInstance,
  c: GeomapPoints,
  circleConfig: Record<string, unknown>,
): SceneNode[] {
  const labelConfig = {
    ...((circleConfig.labelConfig as Record<string, unknown>) ?? {}),
    ...userLabelConfig(viz, "Circle"),
  };
  const items: CircleLabelItem<DataPoint>[] = c.points.map((d, i) => {
    const r = c.pointR(d, i);
    return {
      key: d,
      datum: d,
      index: i,
      x: c.pointX(d, i),
      y: c.pointY(d, i),
      r,
      text: pointLabel(viz, circleConfig, d, i),
      inside: {
        width: r * 2,
        height: r * 2,
        shape: "circle",
        padding: (resolveAccessor<number | string>(labelConfig.padding, d, i) ??
          shapeLabelDefaults.padding) as number | string,
        font: {
          family: resolveAccessor<string | string[]>(
            labelConfig.fontFamily,
            d,
            i,
          ),
          weight: resolveAccessor<string | number>(
            labelConfig.fontWeight,
            d,
            i,
          ),
        },
      },
    };
  });
  const {width, height} = chartBounds(viz);
  const layout = layoutCircleLabels(viz, items, {x: 0, y: 0, width, height});
  if (!layout.size) return [];

  const index = new Map(c.points.map((d, i) => [d, i]));
  const id = (d: DataPoint): string =>
    `geomap-label-${viz._id(d, index.get(d) ?? 0)}`;
  const inside = emitLabels({
    data: c.points,
    label: d =>
      layout.get(d)?.position === "inside" ? layout.get(d)!.text : false,
    x: (d, i) => c.pointX(d, i),
    y: (d, i) => c.pointY(d, i),
    aes: (d, i) => ({r: c.pointR(d, i)}),
    rotate: constant(0),
    id,
    labelBounds: (_d, _i, aes) => {
      const r = (aes as {r: number}).r;
      return {width: r * 2, height: r * 2, x: -r, y: -r, shape: "circle"};
    },
    labelConfig: {
      fontColor: (rec: DataPoint) => {
        const d = rec.data as DataPoint;
        const fill = resolveAccessor<string>(
          circleConfig.fill,
          d,
          index.get(d) ?? 0,
        );
        return colorContrast(
          typeof fill === "string" ? fill : "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      textAnchor: "middle",
      verticalAlign: "middle",
      ...labelConfig,
      fontMin: (rec: DataPoint, i: number) =>
        insideFontMin(
          viz,
          layout.get(rec.data as DataPoint),
          resolveAccessor<number>(labelConfig.fontMin, rec, i) ??
            shapeLabelDefaults.fontMin,
        ),
    },
  });
  const beside = outsideLabels(layout, d => ({id: id(d), datum: d}));
  return [...inside, ...emitOutsideLabels(viz, beside)];
}
