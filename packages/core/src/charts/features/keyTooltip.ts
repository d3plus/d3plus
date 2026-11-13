/**
    Where a colorScale swatch's (or bivariate cell's) tooltip opens: beside
    the key, on the side away from it, so it covers none of the key's other
    entries, with its arrow meeting the hovered entry.
*/
import type {VirtualElement} from "@floating-ui/dom";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import type {TooltipPlacement} from "../../components/tooltipDom.js";
import {clientAnchor, surfaceOrigin} from "../viz/pointTooltipAnchor.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {keyEntries, keyOf} from "./keyHold.js";

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
    @param vertical Whether the key runs down a side (`orient` left or right).
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
    The tooltip anchor, in client coordinates, for a hovered colorScale
    swatch or bivariate cell: beside the colorScale (see
    `keyTooltipPlacement` and `keyTooltipBox`). Undefined for any other
    node, for the tooltip to follow the pointer.
    @param viz The chart.
    @param node The hovered scene node.
*/
export function keyTooltipAnchor(
  viz: VizInstance,
  node: SceneNode | null | undefined,
): (VirtualElement & {placement: TooltipPlacement}) | undefined {
  const scene = viz._paintedScene;
  if (!node || !scene || keyOf(node) !== "colorScale") return undefined;
  const entries = keyEntries(scene.root, "colorScale");
  const own =
    entries.find(e => e.node === node) ??
    entries.find(e => e.node.key === node.key);
  if (!own) return undefined;
  const key = boundsOf(entries.flatMap(e => e.points));
  const orient = viz._colorScaleClass?.schema?.orient;
  const placement = keyTooltipPlacement(
    key,
    scene,
    orient === "left" || orient === "right",
  );
  const box = keyTooltipBox(key, boundsOf(own.points), placement);
  return {...clientAnchor(box, surfaceOrigin(viz)), placement};
}
