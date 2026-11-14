/**
    The text nodes for RadialLine and RadialArea's series labels
    (`lineLabels`), placed by `radialSeriesLabels`: outside each line in a
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

/** The series label nodes, in a non-interactive group (none without `lineLabels`). */
export function radialLabelNodes(
  viz: VizInstance,
  series: RadialSeriesDatum[],
  sc: Record<string, unknown>,
): SceneNode[] {
  const setting = viz.schema.lineLabels;
  const labeled = series.filter(s => radialLabelsSeries(setting, s.data, s.i));
  if (!labeled.length) return [];
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
      limit: (viz.ctx.radial as RadialFrame | undefined)?.outer,
      obstacles: series.flatMap(s =>
        s.dots.map(d => [d.x, d.y] as [number, number]),
      ),
    },
  );
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
