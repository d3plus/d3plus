/**
    Lays a colorScale at the top of a chart out clear of the corner control
    panels (the top-left controls and the zoom controls), as a top legend is:
    beside them when it draws there as well as across the whole width, and
    below them when it doesn't.
*/
import type {GroupNode, SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";
import {cornerPlacements} from "./features.js";
import {drawsSwatches} from "./colorScaleLimit.js";

/** The part of a colorScale's frame a top placement moves. */
interface TopFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** What a laid-out colorScale shows: the room it claims across it and its text. */
interface ScaleShown {
  claim: number;
  labels: string[];
}

/** The text of every label (and title) in a scene. */
function sceneLabels(node: SceneNode, out: string[] = []): string[] {
  if (node.type === "text")
    out.push(node.lines.map((line: {text: string}) => line.text).join(" "));
  else if (node.type === "group")
    (node as GroupNode).children.forEach(child => sceneLabels(child, out));
  return out;
}

/** What the chart's colorScale shows after its last layout. */
function scaleShown(viz: VizInstance): ScaleShown {
  const cs = viz._colorScaleClass!;
  const {height} = cs.outerBounds();
  return {
    claim: height ? height + cs.padding() * 2 : 0,
    labels: height ? sceneLabels(cs.toScene()) : [],
  };
}

/** The labels cut short in `labels`. */
const cut = (labels: string[]): number =>
  labels.filter(label => label.endsWith("...")).length;

/**
    Whether a colorScale laid out beside the corner panels draws as well as
    it does across the whole width (`whole`): no taller, its swatches with
    every label they had, or its bar, shorter, with at least half as many
    labels and no more of them cut short.
*/
export function drawsAsWell(
  swatches: boolean,
  beside: ScaleShown,
  whole: ScaleShown,
): boolean {
  if (!beside.claim || beside.claim > whole.claim) return false;
  if (swatches) return beside.labels.join("\n") === whole.labels.join("\n");
  return (
    beside.labels.length >= Math.ceil(whole.labels.length / 2) &&
    cut(beside.labels) <= cut(whole.labels)
  );
}

/**
    Paints a colorScale at the top of the chart with `paint`, into the first
    of `cornerPlacements` it draws as well in as across all of `frame` (see
    `drawsAsWell`): between the corner panels, then inset from each by its
    own amount, and last across the whole width below them. `room` is the
    height the chart has below `frame.y`. Returns how far the scale dropped
    below `frame.y`.
*/
export function paintTopColorScale<T extends TopFrame>(
  viz: VizInstance,
  frame: T,
  room: number,
  paint: (frame: T) => void,
): number {
  const right = viz.schema.width - frame.x - frame.width;
  const placements = cornerPlacements(viz, frame.y, frame.x, right, true);
  if (placements.length === 1 && !placements[0].drop) {
    paint(frame);
    return 0;
  }
  paint(frame);
  const whole = scaleShown(viz);
  const swatches = drawsSwatches(viz._colorScaleClass!);
  for (const [i, {left, right: r, drop}] of placements.entries()) {
    const last = i === placements.length - 1;
    paint({
      ...frame,
      x: frame.x + left,
      y: frame.y + drop,
      width: frame.width - left - r,
      height: Math.max(0, Math.min(frame.height, room - drop)),
    });
    if (last || drawsAsWell(swatches, scaleShown(viz), whole)) return drop;
  }
  return 0;
}
