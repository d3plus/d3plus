/**
    Where reference line and band labels go once the data is drawn: each
    label has a list of spots, its preferred one first, and takes the first
    whose box is clear of the data labels and of the reference labels placed
    before it, inside the plot. A label with no clear spot is hidden.
*/
import type {SceneNode, TextNode} from "@d3plus/render";

import type {PlotRect} from "./annotationFrame.js";
import type {TextAlign, TextBlock} from "./annotationText.js";
import type {Box} from "./calloutLayout.js";

/** A spot a label may take: its text block's top at `y`, lined up against `x` by `align`. */
export interface LabelSpot {
  x: number;
  y: number;
  align: TextAlign;
}

/** Gap between a reference label and its line or band edge, in pixels. */
export const LABEL_PAD = 4;

/** How far apart the spots along a line or band edge are, in pixels. */
const SLIDE_STEP = 6;

/** Each label node's block and spots, for `placeReferenceLabels`. */
const labelSpots = new WeakMap<
  SceneNode,
  {block: TextBlock; spots: LabelSpot[]}
>();

/**
    Records the spots a reference label node may move to (its preferred spot
    first, where it is drawn), for `placeReferenceLabels`.
    @param node The label's text node.
    @param block The wrapped label.
    @param spots Its spots, preferred first.
*/
export function registerLabelSpots(
  node: SceneNode,
  block: TextBlock,
  spots: LabelSpot[],
): void {
  labelSpots.set(node, {block, spots});
}

/**
    The box a label's block covers at a spot.
    @param spot The spot.
    @param block The wrapped label.
*/
export function labelSpotBox(spot: LabelSpot, block: TextBlock): Box {
  const shift =
    spot.align === "end"
      ? block.width
      : spot.align === "middle"
        ? block.width / 2
        : 0;
  return {
    x: spot.x - shift,
    y: spot.y,
    width: block.width,
    height: block.height,
  };
}

/** Whether two boxes overlap by more than a hair. */
const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width - 0.5 &&
  b.x < a.x + a.width - 0.5 &&
  a.y < b.y + b.height - 0.5 &&
  b.y < a.y + a.height - 0.5;

/** Whether a box lies inside the plot, to half a pixel. */
const inside = (b: Box, plot: PlotRect): boolean =>
  b.x >= plot.x0 - 0.5 &&
  b.y >= plot.y0 - 0.5 &&
  b.x + b.width <= plot.x1 + 0.5 &&
  b.y + b.height <= plot.y1 + 0.5;

/**
    The first of `spots` whose box is clear of every obstacle and inside the
    plot (the first spot, the preferred one, need only be clear), or null
    when none is.
    @param spots The spots, preferred first.
    @param block The wrapped label.
    @param obstacles The boxes to stay clear of.
    @param plot The plot area.
*/
export function pickLabelSpot(
  spots: LabelSpot[],
  block: TextBlock,
  obstacles: Box[],
  plot: PlotRect,
): LabelSpot | null {
  return (
    spots.find((spot, i) => {
      const b = labelSpotBox(spot, block);
      return (!i || inside(b, plot)) && !obstacles.some(o => overlaps(b, o));
    }) ?? null
  );
}

/**
    Positions from `from` toward `to`, `SLIDE_STEP` apart, both ends included.
    @param from The first position.
    @param to The last.
*/
export function slideSteps(from: number, to: number): number[] {
  const steps = Math.floor(Math.abs(to - from) / SLIDE_STEP);
  const dir = to < from ? -1 : 1;
  const out = Array.from(
    {length: steps + 1},
    (_, i) => from + dir * i * SLIDE_STEP,
  );
  if (out[out.length - 1] !== to) out.push(to);
  return out;
}

/**
    Moves each registered reference label among `nodes` to its first clear
    spot (see `pickLabelSpot`), in order, each placed label joining the
    obstacles of the ones after it, and drops a label with no clear spot.
    Returns the nodes with the labels moved; unregistered nodes pass through.
    @param nodes Scene nodes holding reference labels, at any depth.
    @param obstacles The boxes to keep clear of, such as the data labels'.
    @param plot The plot area.
*/
export function placeReferenceLabels(
  nodes: SceneNode[],
  obstacles: Box[],
  plot: PlotRect,
): SceneNode[] {
  const taken = [...obstacles];
  const visit = (list: SceneNode[]): SceneNode[] =>
    list.flatMap((node): SceneNode[] => {
      if (node.type === "group")
        return [{...node, children: visit(node.children)}];
      const entry = labelSpots.get(node);
      if (!entry || node.type !== "text") return [node];
      const spot = pickLabelSpot(entry.spots, entry.block, taken, plot);
      if (!spot) return [];
      taken.push(labelSpotBox(spot, entry.block));
      const moved: TextNode = {
        ...node,
        transform: {...node.transform, x: spot.x, y: spot.y},
        font: {...node.font, anchor: spot.align},
      };
      return [moved];
    });
  return visit(nodes);
}
