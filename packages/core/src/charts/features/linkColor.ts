/**
    `linkColor` on the node-link charts (Network, Rings, Sankey, ArcDiagram):
    each link's stroke, from one of its end nodes or from a value on the
    link. Arrowheads take their link's stroke.
*/

import {colorAssign} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {color} from "d3-color";

import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {linkedColorDefaults} from "../viz/linkGroup.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {
  colorScaleColor,
  isScaleValue,
  noteLinkValue,
} from "./colorScaleValue.js";
import {resolveAccessor, shapeConfigFor} from "./emitHelpers.js";
import {linkMeta} from "./linkInteraction.js";

/** How links are colored: theme gray, an end node's color, or a value on each link. */
export type LinkColorSetting =
  false | "source" | "target" | ((d: DataPoint, i: number) => unknown);

/** A drawn link's end node, as a layout hands it to its emitter. */
export interface DrawnLinkEnd {
  /** The node's shape kind (`"Circle"` when it has none). */
  shape?: unknown;
}

/** A drawn link: its two end nodes. */
export interface LinkEnds {
  source?: DrawnLinkEnd;
  target?: DrawnLinkEnd;
}

/**
    Stores a `linkColor` value: `"source"` and `"target"` as given, a falsy
    value as `false`, a function as given, and any other string as a key
    read from each link.
*/
export function coerceLinkColor(value: unknown): unknown {
  if (!value) return false;
  if (value === "source" || value === "target" || typeof value === "function")
    return value;
  return fieldAccessor(value as string);
}

/**
    The datum a drawn link carries (see `makeLinkDatum`), or the link itself
    when it has none, and the link's index in `links` (else `i`).
*/
export function linkRow(
  link: object,
  i: number,
): {row: DataPoint; index: number} {
  const row = ((link as {datum?: DataPoint}).datum ?? link) as DataPoint;
  return {row, index: linkMeta(row)?.index ?? i};
}

/**
    The color a link's value gives it: a number through the chart's
    colorScale, a string as a literal color when it parses as one or as a
    category in the chart's categorical palette (the way `color` colors
    nodes), and nothing for any other value.
*/
export function linkValueColor(
  viz: VizInstance,
  value: unknown,
): string | undefined {
  if (isScaleValue(value)) {
    const c = colorScaleColor(viz, value);
    return typeof c === "string" ? c : undefined;
  }
  if (typeof value !== "string" || value === "") return undefined;
  if (color(value)) return value;
  return colorAssign(value, linkedColorDefaults(viz)) as string;
}

/**
    Builds the chart's link stroke resolver for one draw: given a link's
    datum (and its drawn ends, for their shape kinds), the stroke
    `linkColor` gives it, or undefined to keep the link's
    `shapeConfig.Path` stroke. Links colored by number are noted for the
    colorScale.
*/
export function linkColorResolver(
  viz: VizInstance,
): (datum: DataPoint, drawn?: LinkEnds) => string | undefined {
  const setting = viz.schema.linkColor as LinkColorSetting | undefined;
  if (!setting) return () => undefined;
  if (setting === "source" || setting === "target") {
    const configs = new Map<string, Record<string, unknown>>();
    return (datum, drawn) => {
      const end = linkMeta(datum)?.[setting];
      if (!end) return undefined;
      const kind = drawn?.[setting]?.shape;
      const shape = typeof kind === "string" ? kind : "Circle";
      if (!configs.has(shape)) configs.set(shape, shapeConfigFor(viz, shape));
      const fill = resolveAccessor<unknown>(
        configs.get(shape)!.fill,
        end.data,
        end.i,
      );
      return typeof fill === "string" ? fill : undefined;
    };
  }
  if (typeof setting !== "function") return () => undefined;
  return datum => {
    const value = setting(datum, linkMeta(datum)?.index ?? 0);
    if (isScaleValue(value)) noteLinkValue(viz, datum, value);
    return linkValueColor(viz, value);
  };
}
