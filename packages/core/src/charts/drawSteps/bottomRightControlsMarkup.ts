/**
    Layout for the bottom-right corner panel — the bottom-corner counterpart
    of the top-right zoom-control panel. Its items (the size legend, today)
    are scene nodes rather than HTML, so the panel exports with the chart.

    The panel is measured before the chart lays out (`reserveBottomRight`,
    called from `vizDrawPure`), and the result is stored on
    `viz._bottomRightBox` so content sharing the bottom band (a bottom
    legend or colorScale) can inset around it via `bottomRightControlsInset`,
    and content in the right column can stop short of it via
    `bottomRightControlsDrop`. It paints after the chart lays out
    (`bottomRightControlsFeature`), from each item's final state.

    Kept separate from `bottomRightControls.ts` (the `FeatureModule` + the
    contributor list) so the legend/colorScale features can import the inset
    helpers without depending on the contributors.

    @module
*/

import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    One item's contribution to the bottom-right panel: its size as reserved
    before layout, and a `paint` that builds its scene after layout (its
    top-left at the origin) along with the size it actually drew at, which
    must not exceed the reservation. `zoom` is the scale the chart's picture
    is currently zoomed by (1 unzoomed; charts that zoom by rescaling axes,
    like Plot, always paint at 1).
*/
export interface BottomRightContribution {
  key: string;
  width: number;
  height: number;
  paint: (zoom: number) => {node: SceneNode; width: number; height: number} | null;
}

/** The measured panel, as stored on `viz._bottomRightBox`. */
export interface BottomRightBox {
  width: number;
  height: number;
  /** Offset of the panel's bottom edge from the chart's bottom edge (the timeline sits below it). */
  bottom: number;
  /**
      The margin the panel claims: `"right"` widens the right margin so the
      chart body ends left of it (it shares the right column, below any
      right legend/colorScale); `"bottom"` deepens the bottom margin so the
      body ends above it (bottom legends/colorScales sit beside it).
  */
  side: "right" | "bottom";
  items: BottomRightContribution[];
}

/** Horizontal gap between items, and between the panel and content inset around it. */
export const BOTTOM_RIGHT_GAP = 6;

/** Lays contributions out in a row, right to left: the panel's total width and height. */
export function measureBottomRight(items: BottomRightContribution[]): {width: number; height: number} {
  const width = items.reduce((w, item, i) => w + item.width + (i ? BOTTOM_RIGHT_GAP : 0), 0);
  const height = Math.max(0, ...items.map(item => item.height));
  return {width, height};
}

/** The panel reserved for this draw, or null when nothing is showing there. */
export function bottomRightControlsBox(viz: VizInstance): BottomRightBox | null {
  const box = viz._bottomRightBox;
  return box && box.width && box.height ? box : null;
}

/**
    How far content in the bottom band must pull in its right edge to clear
    the panel: content whose bottom edge sits `bottom` px above the chart's
    bottom edge and whose right edge sits `right` px in from the chart's
    right edge. Zero when nothing is showing or the content starts above the
    panel.
*/
export function bottomRightControlsInset(viz: VizInstance, bottom: number, right: number): number {
  const box = bottomRightControlsBox(viz);
  // A right-side panel already widened the right margin bottom content lays out against.
  if (!box || box.side === "right" || bottom >= box.bottom + box.height) return 0;
  const inset = box.width - right;
  return inset > 0 ? inset + BOTTOM_RIGHT_GAP : 0;
}

/**
    How much content in the right column, whose bottom edge sits `bottom` px
    above the chart's bottom edge, must shorten to end above the panel. Zero
    when nothing is showing.
*/
export function bottomRightControlsDrop(viz: VizInstance, bottom: number): number {
  const box = bottomRightControlsBox(viz);
  if (!box) return 0;
  return Math.max(0, box.bottom + box.height - bottom);
}

/**
    How a legend or colorScale at `position` clears the panel: a bottom one
    pulls its right edge in by `inset`, a left/right one shortens by `drop`.
    `bottom`/`right` are its edges' distances from the chart's bottom/right.
*/
export function bottomRightClearance(
  viz: VizInstance,
  position: string | false,
  bottom: number,
  right: number,
): {inset: number; drop: number} {
  return {
    inset: position === "bottom" ? bottomRightControlsInset(viz, bottom, right) : 0,
    drop: position === "left" || position === "right" ? bottomRightControlsDrop(viz, bottom) : 0,
  };
}

/**
    How much taller the bottom margin must grow so the chart body, ending
    `bottom` px above the chart's bottom edge, stays clear of a bottom-side
    panel. Zero for a right-side panel.
*/
export function bottomRightControlsShortfall(viz: VizInstance, bottom: number): number {
  const box = bottomRightControlsBox(viz);
  return box && box.side === "bottom" ? Math.max(0, box.bottom + box.height - bottom) : 0;
}

/**
    How much wider the right margin must grow so the chart body, ending
    `right` px in from the chart's right edge, stays clear of a right-side
    panel. Zero for a bottom-side panel.
*/
export function bottomRightControlsRightShortfall(viz: VizInstance, right: number): number {
  const box = bottomRightControlsBox(viz);
  return box && box.side === "right" ? Math.max(0, box.width + BOTTOM_RIGHT_GAP - right) : 0;
}

/**
    The panel's scene: each item painted from its final state, bottom-right
    aligned in the slot it reserved. Null when nothing paints.
*/
export function buildBottomRightPanel(viz: VizInstance, box: BottomRightBox): SceneNode | null {
  const zoom = viz._zoomTransform?.scale ?? 1;
  const children: SceneNode[] = [];
  let right = viz.schema.width;
  const baseline = viz.schema.height - box.bottom;
  box.items.forEach(item => {
    const painted = item.paint(zoom);
    if (painted) {
      children.push({
        type: "group",
        key: item.key,
        transform: {x: right - painted.width, y: baseline - painted.height},
        children: [painted.node],
      });
    }
    right -= item.width + BOTTOM_RIGHT_GAP;
  });
  if (!children.length) return null;
  return {type: "group", key: "viz-bottomRight", children};
}

/**
    Repaints the panel in place for the current zoom — called on every zoom
    event, which repaints the scene without re-running the pipeline.
*/
export function refreshBottomRightPanel(viz: VizInstance): void {
  const box = bottomRightControlsBox(viz);
  if (!box || !viz._featurePanels) return;
  const panels = viz._featurePanels.filter(p => p.key !== "viz-bottomRight");
  const panel = buildBottomRightPanel(viz, box);
  viz._featurePanels = panel ? [...panels, panel] : panels;
}
