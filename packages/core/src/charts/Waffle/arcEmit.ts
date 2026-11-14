/**
    The chrome Waffle's `layout: "arc"` draws around its cells: the
    `majority` line across the rings, and, in the hole, the `centerLabel`
    with the majority's label beneath it.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode, TextNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {
  centerLabelBoxes,
  centerLabelLayout,
  type CenterHole,
} from "../features/centerLabel.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {MAJORITY_OVERHANG, type WaffleArc} from "./arcStage.js";

/** The scene key of the majority line, and of its label. */
export const MAJORITY_KEY = "waffle-majority";

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

/** The height of the majority label's strip in the hole, in pixels. */
export const MAJORITY_LABEL_HEIGHT = 16;

/** A box in the hole, around the arc's center. */
export interface HoleBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
    Where the majority label goes in the hole, around the arc's center:
    the strip under the center label's box, or, with no center label, a
    strip across the middle of the hole's widest box. Null when the hole
    has no room.
    @param hole The hole.
    @param under The center label's box, when it draws.
*/
export function majorityLabelStrip(
  hole: CenterHole,
  under?: HoleBox | null,
): HoleBox | null {
  const h = MAJORITY_LABEL_HEIGHT;
  if (under)
    return {
      x: under.x,
      y: under.y + under.height,
      width: under.width,
      height: h,
    };
  const widest = centerLabelBoxes(hole).reduce<HoleBox | null>(
    (best, b) => (!best || b.width > best.width ? b : best),
    null,
  );
  if (!widest || widest.height < h) return null;
  return {
    x: widest.x,
    y: widest.y + (widest.height - h) / 2,
    width: widest.width,
    height: h,
  };
}

/** The majority label ("Majority: 226") in `strip`, inert chrome in `ink`. */
function majorityLabel(
  viz: VizInstance,
  arc: WaffleArc,
  strip: HoleBox,
  ink: string,
): SceneNode[] {
  const text = viz.schema.translate(
    "Majority: {0}",
    undefined,
    formatAbbreviate(arc.majority, viz.schema.locale),
  ) as string;
  const nodes = emitLabels({
    data: [{text}],
    label: () => text,
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: () => `${MAJORITY_KEY}-label`,
    labelBounds: () => ({...strip}),
    labelConfig: {
      fontColor: ink,
      fontMax: 12,
      fontMin: 7,
      fontResize: true,
      padding: 0,
      textAnchor: "middle",
      verticalAlign: "middle",
      pointerEvents: "none",
    },
  }).filter((n): n is TextNode => n.type === "text");
  if (!nodes.length || nodes.some(n => n.truncated)) return [];
  return [
    {
      type: "group",
      key: `${MAJORITY_KEY}-label`,
      interactive: false,
      transform: {x: arc.cx, y: arc.cy},
      children: nodes.map(n => ({
        ...n,
        datum: undefined,
        index: undefined,
        interactive: false,
      })),
    } as SceneNode,
  ];
}

/** The majority line, inert chrome in `ink`. */
function majorityLine(arc: WaffleArc, ink: string): SceneNode[] {
  const points = majorityLinePoints(arc);
  if (!points) return [];
  return [
    {
      type: "line",
      key: MAJORITY_KEY,
      points,
      interactive: false,
      paint: {stroke: ink, strokeWidth: 1.5, strokeDasharray: [4, 3]},
      aria: {hidden: true},
    } as SceneNode,
  ];
}

/**
    The arc's chrome: the majority line across the rings (with `majority`),
    then, in the hole, the center label (with `centerLabel`) and the
    majority label beneath it, or across the hole's middle without a center
    label.
    @param viz The chart.
    @param arc The fitted arc.
*/
export function waffleArcDecor(viz: VizInstance, arc: WaffleArc): SceneNode[] {
  const sum = viz.schema.sum as (d: DataPoint, i: number) => unknown;
  const hole: CenterHole = {
    radius: arc.inner,
    startAngle: arc.start,
    endAngle: arc.end,
  };
  const majority = arc.majorityAngle !== null;
  const center =
    centerLabelLayout(viz, hole, sum, majority ? MAJORITY_LABEL_HEIGHT : 0) ??
    null;
  const ink = backgroundInk(viz);
  const strip = majority ? majorityLabelStrip(hole, center?.box) : null;
  return [
    ...majorityLine(arc, ink),
    ...(center?.nodes ?? []).map(n => ({
      ...n,
      transform: {x: arc.cx, y: arc.cy},
    })),
    ...(strip ? majorityLabel(viz, arc, strip, ink) : []),
  ];
}
