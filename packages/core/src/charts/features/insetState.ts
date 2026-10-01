/**
    Shared state for drawing chart chrome (the size legend, legend, or
    colorScale) inside the chart's negative space instead of in a margin.
    The placement itself is decided in `pipeline/insetPlacement.ts`; this
    module holds the types and the small queries the features use while they
    lay out, so they don't depend on the placement pipeline.

    @module
*/

import {colorContrast} from "@d3plus/color";
import {backgroundColor} from "@d3plus/dom";
import type {Box} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";

/** The chrome that can be drawn inside the chart, in the order it is tried. */
export type InsetKey = "sizeLegend" | "legend" | "colorScale";
export const INSET_PRIORITY: InsetKey[] = ["sizeLegend", "legend", "colorScale"];

/** How a legend or colorScale is laid out when drawn inside the chart. */
export type InsetOrient = "column" | "row";

/** The region a chart offers for inset chrome, in surface coordinates. */
export interface InsetRegion {
  /** The area chrome may be drawn in (e.g. the plot area). */
  bounds: Box;
  /** The boxes of the chart's marks, which chrome must stay clear of. */
  obstacles: Box[];
}

/** Where the inset chrome landed: its background box, in surface coordinates. */
export interface InsetPlacement extends Box {
  key: InsetKey;
  orient: InsetOrient;
  /** Which side of its open space the box hugs, so content smaller than it can keep to that side. */
  alignX: "left" | "center" | "right";
  alignY: "top" | "middle" | "bottom";
}

/**
    Seeds `legendInset`/`legendInsetConfig`, and remembers the default
    legend/colorScale position accessors so a placement can tell a position
    the user chose (which it leaves alone) from the default. Runs after the
    legend and color defaults are seeded.
*/
export function initInsetDefaults(viz: VizInstance): void {
  viz.schema.legendInset = true;
  viz.schema.legendInsetConfig = {};
  viz._insetAutoPositions = {legend: viz.schema.legendPosition, colorScale: viz.schema.colorScalePosition};
}

/** Resolved `legendInsetConfig`. */
export interface InsetStyle {
  /** Gap kept between the box and the chart's marks and edges. */
  padding: number;
  /** Space between the box's edge and the chrome inside it. */
  margin: number;
  fill?: string;
  fillOpacity: number;
  stroke?: string;
  strokeWidth: number;
  rx: number;
}

/** The resolved background-box style, with the chart's defaults filled in. */
export function insetStyle(viz: VizInstance): InsetStyle {
  const config = (viz.schema.legendInsetConfig || {}) as Partial<InsetStyle>;
  return {
    padding: 10,
    margin: 6,
    fillOpacity: 0.85,
    strokeWidth: 1,
    rx: 4,
    ...config,
  };
}

/** Whether `key` is being laid out for the chart's interior this pass (so it claims no margin). */
export function isInsetPending(viz: VizInstance, key: InsetKey): boolean {
  return Boolean(viz._insetPending && viz._insetPending.has(key));
}

/** The final placement of `key`, or null when it isn't drawn inside the chart. */
export function insetPlacementFor(viz: VizInstance, key: InsetKey): InsetPlacement | null {
  const p = viz._insetPlacement;
  return p && p.key === key ? p : null;
}

/** The orientation `key` is laid out with when inset (column until placement picks one). */
export function insetOrient(viz: VizInstance, key: InsetKey): InsetOrient {
  return insetPlacementFor(viz, key)?.orient ?? "column";
}

/**
    The largest frame a legend or colorScale may lay itself out in when inset,
    for a chart area of `area`: a column takes up to 40% of the width and 60%
    of the height, a row the reverse.
*/
export function insetFrame(
  orient: InsetOrient,
  area: {width: number; height: number},
): {width: number; height: number} {
  return orient === "column"
    ? {width: area.width * 0.4, height: area.height * 0.6}
    : {width: area.width * 0.6, height: area.height * 0.4};
}

/** The chart's background color, as the default fill for the inset box. */
function chartBackground(viz: VizInstance): string {
  const node = viz._select && typeof viz._select.node === "function" ? viz._select.node() : null;
  return node ? backgroundColor(node) : "rgb(255, 255, 255)";
}

/** The semi-transparent box drawn behind inset chrome, so it stays legible over marks panned beneath it. */
export function insetBackground(viz: VizInstance, placement: InsetPlacement): SceneNode {
  const style = insetStyle(viz);
  const fill = style.fill ?? chartBackground(viz);
  return {
    type: "rect",
    key: "viz-inset-background",
    x: placement.x,
    y: placement.y,
    width: placement.width,
    height: placement.height,
    rx: style.rx,
    ry: style.rx,
    paint: {
      fill,
      fillOpacity: style.fillOpacity,
      stroke: style.stroke ?? colorContrast(fill, viz.schema.colorDefaults),
      strokeOpacity: style.stroke ? 1 : 0.15,
      strokeWidth: style.strokeWidth,
    },
  };
}

/**
    The scene children for a legend or colorScale component: just its own
    scene normally, or — when it's drawn inside the chart — its background box
    plus its scene moved into the box. `bounds` is the component's
    `outerBounds()` (its content box within its own frame).
*/
export function insetComponentScene(
  viz: VizInstance,
  key: InsetKey,
  scene: SceneNode,
  bounds: {x?: number; y?: number},
): SceneNode[] {
  const transform = insetComponentOffset(viz, key, bounds);
  if (!transform) return [scene];
  return [insetBackground(viz, insetPlacementFor(viz, key)!), {...scene, transform}];
}

/**
    Where a legend or colorScale component's own frame goes so its content
    (`bounds`, its `outerBounds()`) lands inside its placed box; null when it
    isn't drawn inside the chart.
*/
export function insetComponentOffset(
  viz: VizInstance,
  key: InsetKey,
  bounds: {x?: number; y?: number},
): {x: number; y: number} | null {
  const placed = insetPlacementFor(viz, key);
  if (!placed) return null;
  const {margin} = insetStyle(viz);
  return {x: placed.x + margin - (bounds.x ?? 0), y: placed.y + margin - (bounds.y ?? 0)};
}
