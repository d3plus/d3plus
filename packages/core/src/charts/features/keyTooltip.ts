/**
    Where a key entry's tooltip opens (a colorScale swatch or bivariate cell,
    or a legend entry): beside the key, on the side facing the chart, so it
    covers none of the key's other entries, with its arrow meeting the
    hovered entry.
*/
import type {VirtualElement} from "@floating-ui/dom";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import type {TooltipPlacement} from "../../components/tooltipDom.js";
import {clientAnchor, surfaceOrigin} from "../viz/pointTooltipAnchor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {colorScaleBucketOf} from "./colorScaleBucket.js";
import {keyEntries, keyOf} from "./keyHold.js";
import type {KeyName} from "./keyHold.js";

type Wrapped = {__d3plus__?: boolean; data?: unknown};

/** A datum unwrapped to the row it wraps. */
function unwrap(d: unknown): unknown {
  let row = d as Wrapped | undefined;
  while (row && row.__d3plus__ && row.data) row = row.data as Wrapped;
  return row;
}

/** The key a hovered node is an entry of, or labels an entry of. */
function hoveredKey(node: SceneNode): KeyName | null {
  if (node.type !== "text") return keyOf(node);
  if (node.datum === undefined) return null;
  if (colorScaleBucketOf(node.datum)) return "colorScale";
  const group = (node as {interactionGroup?: string}).interactionGroup;
  return group === "legend" ? "legend" : null;
}

/** The box around a set of points. */
function boundsOf(points: [number, number][]): Bounds {
  const xs = points.map(p => p[0]);
  const ys = points.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return {x, y, width: Math.max(...xs) - x, height: Math.max(...ys) - y};
}

/**
    The side of a key its entries' tooltips open on: beside a key drawn
    down a side of the chart, above or below one drawn along its top or
    bottom, whichever faces the middle of the chart.
    @param key The key's box.
    @param surface The chart's size.
    @param vertical Whether the key runs down a side: a colorScale with
    `orient` left or right, or a legend whose `direction` is a column.
*/
export function keyTooltipPlacement(
  key: Bounds,
  surface: {width: number; height: number},
  vertical: boolean,
): TooltipPlacement {
  if (vertical)
    return key.x + key.width / 2 > surface.width / 2 ? "left" : "right";
  return key.y + key.height / 2 > surface.height / 2 ? "top" : "bottom";
}

/**
    The box a key entry's tooltip points at: the whole key across the side
    it opens on, and the hovered entry along it, so the tooltip clears the
    key while its arrow meets the entry.
    @param key The key's box.
    @param entry The hovered entry's box.
    @param placement The side the tooltip opens on.
*/
export function keyTooltipBox(
  key: Bounds,
  entry: Bounds,
  placement: TooltipPlacement,
): Bounds {
  return placement === "left" || placement === "right"
    ? {x: key.x, y: entry.y, width: key.width, height: entry.height}
    : {x: entry.x, y: key.y, width: entry.width, height: key.height};
}

/**
    The tooltip anchor, in client coordinates, for a hovered key entry (a
    colorScale swatch or bivariate cell, or a legend entry) or its label:
    beside its key (see `keyTooltipPlacement` and `keyTooltipBox`).
    Undefined for any other node, for the tooltip to follow the pointer.
    @param viz The chart.
    @param node The hovered scene node.
*/
export function keyTooltipAnchor(
  viz: VizInstance,
  node: SceneNode | null | undefined,
): (VirtualElement & {placement: TooltipPlacement}) | undefined {
  const scene = viz._paintedScene;
  const key = node && hoveredKey(node);
  if (!node || !scene || !key) return undefined;
  const entries = keyEntries(scene.root, key);
  const row = unwrap(node.datum);
  const own =
    entries.find(e => e.node === node) ??
    entries.find(e => e.node.key === node.key) ??
    entries.find(e => row !== undefined && unwrap(e.node.datum) === row);
  if (!own) return undefined;
  const box = boundsOf(entries.flatMap(e => e.points));
  const vertical =
    key === "colorScale"
      ? ["left", "right"].includes(viz._colorScaleClass?.schema?.orient)
      : viz._legendClass?.schema?.direction === "column";
  const placement = keyTooltipPlacement(box, scene, vertical);
  const anchor = keyTooltipBox(box, boundsOf(own.points), placement);
  return {...clientAnchor(anchor, surfaceOrigin(viz)), placement};
}
