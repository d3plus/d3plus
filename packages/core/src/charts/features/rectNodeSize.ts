/**
    The box a Rect node of a node-link chart draws as: `shapeConfig`'s Rect
    `width` and `height` for the node's row, else a square 2r across.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {resolveAccessor, shapeConfigFor} from "./emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A node that may draw as a Rect. */
export interface RectSizedNode {
  shape?: string;
  r?: number;
  width?: number;
  height?: number;
  /** The node's data row. */
  data?: DataPoint;
  /** The node's index in the chart's data. */
  i?: number;
}

/** A Rect's `width`/`height` config: a number or an accessor of the row. */
export interface RectSizeConfig {
  width?: unknown;
  height?: unknown;
}

/**
    A Rect node's width and height: `config`'s `width` and `height` for the
    node's row, each falling back to `2r` (a square around the node's circle)
    when unset or not a size.
    @param config The Rect shape config.
    @param node The node.
    @param r The node's radius.
    @param index The node's index, when the node has none of its own.
*/
export function rectNodeSize(
  config: RectSizeConfig,
  node: RectSizedNode,
  r: number,
  index = 0,
): [number, number] {
  const datum = (node.data ?? node) as DataPoint;
  const i = node.i ?? index;
  const side = r * 2;
  const read = (value: unknown): number => {
    const v = Number(resolveAccessor<unknown>(value, datum, i) ?? NaN);
    return Number.isFinite(v) && v >= 0 ? v : side;
  };
  return [read(config.width), read(config.height)];
}

/**
    Sizes every Rect node's box (see `rectNodeSize`) from the chart's
    `shapeConfig`, in place, so its links, loops, and label meet the box it
    draws as.
    @param viz The chart.
    @param nodes The laid-out nodes, each with its final radius.
*/
export function sizeRectNodes(viz: VizInstance, nodes: RectSizedNode[]): void {
  const rects = nodes.filter(n => n.shape === "Rect");
  if (!rects.length) return;
  const config = shapeConfigFor(viz, "Rect") as RectSizeConfig;
  rects.forEach((n, index) => {
    [n.width, n.height] = rectNodeSize(config, n, n.r ?? 0, index);
  });
}
