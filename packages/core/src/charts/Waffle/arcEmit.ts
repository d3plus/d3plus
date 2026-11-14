/**
    The chrome Waffle's `layout: "arc"` draws around its cells: the
    `majority` line across the rings with its label, and the `centerLabel`
    in the hole.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode, TextNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {centerLabelNodes} from "../features/centerLabel.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {MAJORITY_LABEL_ROOM, type WaffleArc} from "./arcStage.js";

/** The scene key of the majority line, and of its label. */
export const MAJORITY_KEY = "waffle-majority";

/** How far the majority line reaches past the outer ring, in pixels. */
const MAJORITY_OVERHANG = 4;

/**
    The majority line's ends, in pixels: from the inner radius to a little
    past the outer ring, at the majority's angle. Null without one.
*/
export function majorityLinePoints(
  arc: WaffleArc,
): [[number, number], [number, number]] | null {
  const angle = arc.majorityAngle;
  if (angle === null) return null;
  const at = (r: number): [number, number] => [
    arc.cx + r * Math.sin(angle),
    arc.cy - r * Math.cos(angle),
  ];
  return [at(arc.inner), at(arc.radius + MAJORITY_OVERHANG)];
}

/** The majority label's box and alignment. */
export interface MajorityLabelBox {
  x: number;
  y: number;
  width: number;
  height: number;
  anchor: "start" | "middle" | "end";
  align: "top" | "middle" | "bottom";
}

/** The majority label's width, in pixels. */
const LABEL_WIDTH = 160;

/**
    Where the majority label goes past the line's outer end `end`, by the
    line's angle: centered above (or below) a line near the vertical, else
    beside it, reading away from the arc.
    @param end The line's outer end.
    @param angle The line's angle (0 at 12 o'clock, clockwise).
*/
export function majorityLabelBox(
  end: [number, number],
  angle: number,
): MajorityLabelBox {
  const height = MAJORITY_LABEL_ROOM - MAJORITY_OVERHANG;
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const gap = 2;
  if (Math.abs(sin) < 0.35) {
    const up = cos >= 0;
    return {
      x: end[0] - LABEL_WIDTH / 2,
      y: up ? end[1] - height : end[1],
      width: LABEL_WIDTH,
      height,
      anchor: "middle",
      align: up ? "bottom" : "top",
    };
  }
  const right = sin > 0;
  const align = cos > 0.35 ? "bottom" : cos < -0.35 ? "top" : "middle";
  return {
    x: right ? end[0] + gap : end[0] - gap - LABEL_WIDTH,
    y:
      align === "bottom"
        ? end[1] - height
        : align === "top"
          ? end[1]
          : end[1] - height / 2,
    width: LABEL_WIDTH,
    height,
    anchor: right ? "start" : "end",
    align,
  };
}

/**
    The majority line and its label ("Majority: 226") past its outer end,
    both inert chrome in the chart's text color.
*/
function majorityNodes(viz: VizInstance, arc: WaffleArc): SceneNode[] {
  const points = majorityLinePoints(arc);
  if (!points) return [];
  const ink = backgroundInk(viz);
  const text = viz.schema.translate(
    "Majority: {0}",
    undefined,
    formatAbbreviate(arc.majority, viz.schema.locale),
  ) as string;
  const box = majorityLabelBox(points[1], arc.majorityAngle ?? 0);
  const labels = emitLabels({
    data: [{text}],
    label: () => text,
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: () => `${MAJORITY_KEY}-label`,
    labelBounds: () => ({
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
    }),
    labelConfig: {
      fontColor: ink,
      fontSize: 12,
      fontResize: false,
      padding: 0,
      textAnchor: box.anchor,
      verticalAlign: box.align,
      pointerEvents: "none",
    },
  })
    .filter((n): n is TextNode => n.type === "text")
    .map(n => ({
      ...n,
      datum: undefined,
      index: undefined,
      interactive: false,
    }));
  return [
    {
      type: "line",
      key: MAJORITY_KEY,
      points,
      interactive: false,
      paint: {stroke: ink, strokeWidth: 1.5, strokeDasharray: [4, 3]},
      aria: {hidden: true},
    } as SceneNode,
    ...labels,
  ];
}

/**
    The arc's chrome: the majority line and label (with `majority`), then
    the center label in the hole (with `centerLabel`), placed at the arc's
    center.
    @param viz The chart.
    @param arc The fitted arc.
*/
export function waffleArcDecor(viz: VizInstance, arc: WaffleArc): SceneNode[] {
  const sum = viz.schema.sum as (d: DataPoint, i: number) => unknown;
  const center = centerLabelNodes(
    viz,
    {
      radius: arc.inner,
      startAngle: arc.start,
      endAngle: arc.end,
    },
    sum,
  ).map(n => ({...n, transform: {x: arc.cx, y: arc.cy}}));
  return [...majorityNodes(viz, arc), ...center];
}
