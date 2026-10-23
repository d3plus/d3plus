/**
    Scene nodes for the Treemap's group headers: a strip rect per header and
    its left-aligned, single-line name.
*/

import {color} from "d3-color";
import {interpolateRgb} from "d3-interpolate";

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import {summedShare} from "../features/shareKey.js";
import {backgroundInk, chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import type {GroupLabelStyle, TreemapGroupHeader} from "./groupHeaders.js";

/**
    A header strip's default fill: a darker shade of its group's color, or,
    when a colorScale colors the tiles by value, a neutral tone between the
    chart's background and its ink.
*/
export function defaultGroupFill(
  viz: VizInstance,
  row: DataPoint,
  i: number,
): string {
  const neutral = () =>
    interpolateRgb(chartBackground(viz), backgroundInk(viz))(0.7);
  if (viz.schema.colorScale) return neutral();
  const sc = shapeConfigFor(viz, "Rect");
  const base = color(`${resolveAccessor<string>(sc.fill, row, i)}`);
  return base ? base.darker(0.8).formatHex() : neutral();
}

/** The strip rects and name labels for `headers`. */
export function groupHeaderNodes(
  viz: VizInstance,
  headers: TreemapGroupHeader[],
  style: GroupLabelStyle,
): SceneNode[] {
  if (!headers.length) return [];
  const fills = new Map<TreemapGroupHeader, string>();
  const fillOf = (h: TreemapGroupHeader): string => {
    let fill = fills.get(h);
    if (fill === undefined) {
      fill =
        resolveAccessor<string>(style.fill, h.data, 0) ??
        defaultGroupFill(viz, h.data, 0);
      fills.set(h, fill);
    }
    return fill;
  };
  const sum = viz.schema.sum as (d: DataPoint) => number;
  const name = (h: TreemapGroupHeader) => viz._drawLabel(h.data, 0, h.depth);

  const rects: SceneNode[] = headers.map(h => ({
    type: "rect",
    key: `treemap-group-${h.id}`,
    x: h.x0,
    y: h.y0,
    width: h.x1 - h.x0,
    height: h.y1 - h.y0,
    datum: h.data,
    paint: {fill: fillOf(h)},
    aria: {
      label: `${name(h)}, ${sum(h.data)}, ${formatAbbreviate(
        summedShare(h.data) * 100,
        viz.schema.locale,
      )}%`,
    },
  }));

  const asHeader = (d: DataPoint) => d as unknown as TreemapGroupHeader;
  const byRow = new Map(headers.map(h => [h.data, h]));
  const labels = emitLabels({
    data: headers as unknown as DataPoint[],
    label: d => name(asHeader(d)),
    x: d => asHeader(d).x0,
    y: d => asHeader(d).y0,
    aes: d => {
      const h = asHeader(d);
      return {width: h.x1 - h.x0, height: h.y1 - h.y0};
    },
    rotate: constant(0),
    id: d => `group-${asHeader(d).id}`,
    datum: d => asHeader(d).data,
    labelBounds: (_d, _i, aes) => {
      const {width, height} = aes as {width: number; height: number};
      return {x: 0, y: 0, width, height};
    },
    labelConfig: {
      fontColor: (d: DataPoint) => {
        const h = byRow.get(d.data as DataPoint) ?? headers[0];
        return (
          resolveAccessor<string>(style.fontColor, h.data, 0) ??
          colorContrast(fillOf(h), viz.schema.colorDefaults)
        );
      },
      ...(style.fontFamily ? {fontFamily: style.fontFamily} : {}),
      fontResize: false,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      maxLines: 1,
      padding: style.padding,
      textAnchor: "start",
      verticalAlign: "middle",
    },
  });
  // Moves with its strip in the drill-down morph, like the tile labels.
  for (const n of labels) (n as {shapeType?: string}).shapeType = "Label";

  return [...rects, ...labels];
}
