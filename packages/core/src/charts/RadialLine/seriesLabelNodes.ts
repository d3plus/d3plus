/**
    The text nodes for RadialLine and RadialArea's series labels
    (`lineLabels`, on by default), placed by `radialSeriesLabels`, clear of
    the ring value labels: outside each line in a
    legible shade of its color over a halo, or inside each stacked band in
    the color that contrasts with its fill. Labels follow their series'
    hover but never take the pointer.
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import type {SceneNode} from "@d3plus/render";

import {legibleOn} from "../../utils/themeInk.js";
import {resolveAccessor, userLabelConfig} from "../features/emitHelpers.js";
import {textHalo} from "../features/textHalo.js";
import {labelFont} from "../Radar/axisDecorations.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

import {radialIsArea, radialIsStacked} from "./applyLayout.js";
import type {RadialFrame, RadialSeriesDatum} from "./applyLayout.js";
import {radialSeriesLabels} from "./seriesLabels.js";

/** Whether `lineLabels` labels a series: truthy, or a function truthy for its row. */
export function radialLabelsSeries(
  setting: unknown,
  d: DataPoint,
  i: number,
): boolean {
  const v =
    typeof setting === "function"
      ? (setting as (d: DataPoint, i: number) => unknown)(d, i)
      : setting;
  return Boolean(v) && v !== "false";
}

/**
    Whether `lineLabels` may name every series, so the default legend can
    stand aside for the labels (see `alongLegend.ts`).
*/
export function radialLabelsPossible(viz: VizInstance): boolean {
  const setting = viz.schema.lineLabels as unknown;
  return Boolean(setting) && setting !== "false";
}

/**
    The series label nodes, in a non-interactive group (none without
    `lineLabels`). Counts the series and their labels into
    `viz._alongStats`, so labels that name every series hide the default
    legend.
*/
export function radialLabelNodes(
  viz: VizInstance,
  series: RadialSeriesDatum[],
  sc: Record<string, unknown>,
): SceneNode[] {
  const setting = viz.schema.lineLabels;
  const labeled = series.filter(s => radialLabelsSeries(setting, s.data, s.i));
  const stats = viz._alongStats;
  if (stats) {
    stats.series += series.length;
    stats.requested += labeled.length;
  }
  if (!labeled.length) return [];
  const frame = viz.ctx.radial as RadialFrame | undefined;
  const inside = radialIsStacked(viz);
  const shape = radialIsArea(viz) ? "Area" : "Line";
  const labelConfig = userLabelConfig(viz, shape);
  const texts = labeled.map(s => `${viz._drawLabel(s.data, s.i)}`);
  const fonts = labeled.map((s, k) =>
    labelFont(viz, texts[k], s.data, s.i, labelConfig),
  );
  const boxes = radialSeriesLabels(
    labeled.map((s, k) => ({
      points: s.points,
      width: textWidth(texts[k], {
        "font-family": fonts[k].fontFamily,
        "font-size": fonts[k].fontSize,
        "font-weight": fonts[k].fontWeight,
      }) as number,
      height: fonts[k].lineHeight,
    })),
    inside,
    {
      limit: frame?.outer,
      avoid: frame?.levelBoxes,
      obstacles: series.flatMap(s =>
        s.dots.map(d => [d.x, d.y] as [number, number]),
      ),
    },
  );
  if (stats) stats.placed += boxes.filter(Boolean).length;
  const dark = Boolean(viz._theme?.dark);
  const children: SceneNode[] = [];
  labeled.forEach((s, k) => {
    const box = boxes[k];
    if (!box) return;
    const font = fonts[k];
    const color = `${resolveAccessor<string>(inside ? sc.fill : sc.stroke, s.data, s.i) ?? ""}`;
    children.push({
      type: "text",
      key: `radial-series-label-${s.id}`,
      interactive: false,
      datum: s.data,
      index: s.i,
      x: 0,
      y: 0,
      transform: {x: box.x + box.width / 2, y: box.y + box.height / 2},
      lines: [
        {text: texts[k], x: 0, y: font.fontSize * 0.35, width: box.width},
      ],
      font: {
        family: font.fontFamily,
        size: font.fontSize,
        weight: font.fontWeight,
        anchor: "middle",
        baseline: "alphabetic",
      },
      paint: {
        fill: inside ? colorContrast(color) : legibleOn(color, dark),
      },
    } as SceneNode);
  });
  if (!children.length) return [];
  const group: SceneNode = {
    type: "group",
    key: "radial-series-labels",
    interactive: false,
    children,
  };
  return inside ? [group] : textHalo([group], chartBackground(viz), 3);
}
