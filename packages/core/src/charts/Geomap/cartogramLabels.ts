/**
    Labels of a Geomap cartogram: each region's label sits inside its circle
    or square, sized to fit, and hides when it can't fit at the smallest
    font size.

    @module
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import constant from "../../utils/constant.js";
import {resolveAccessor, userLabelConfig} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {CartogramRegion, CartogramShape} from "./cartogramLayout.js";
import {rowIndex} from "../features/rowIndex.js";

/** A region drawn in the cartogram, with its row and its index among the regions. */
interface Labeled {
  region: CartogramRegion;
  datum: DataPoint;
  index: number;
  shape: CartogramShape;
}

/**
    The box a label may fill inside a cartogram shape, centered on it: the
    rectangle inscribed in a circle (wider than tall), or the whole square.
    @param shape The circle or square.
*/
export function cartogramLabelBox(shape: {r: number; square: boolean}): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const {r} = shape;
  if (shape.square) return {x: -r, y: -r, width: 2 * r, height: 2 * r};
  return {x: -r * 0.8, y: -r * 0.6, width: r * 1.6, height: r * 1.2};
}

/**
    The scene nodes of a cartogram's labels: the Path shapeConfig's `label`
    (`false` turns them off), else the chart's label for the row.
    @param viz The Geomap.
    @param regions The regions, in the order they're drawn.
    @param shapes Each region's cartogram shape, by region id.
    @param pathConfig The merged Path shapeConfig.
    @param options `all` labels the shapes of regions without data too
    (whose datum is the region), `text` gives a region's label in place of
    the chart's, and `fontMax` caps the font size (24 by default).
*/
export function cartogramLabels(
  viz: VizInstance,
  regions: CartogramRegion[],
  shapes: Map<string | number, CartogramShape>,
  pathConfig: Record<string, unknown>,
  options: {
    all?: boolean;
    text?: (region: CartogramRegion) => unknown;
    fontMax?: number;
  } = {},
): SceneNode[] {
  if (pathConfig.label === false) return [];
  const items: Labeled[] = [];
  regions.forEach(region => {
    const shape = shapes.get(region.id);
    const datum = region.data ?? (options.all ? region : undefined);
    // A distorted region (a contiguous cartogram) keeps the map's own labels: none.
    if (shape && datum && shape.r > 0) {
      // The row's position in the data, as the region's paint reads it.
      const index = rowIndex(viz._filteredData, datum as DataPoint);
      items.push({region, datum: datum as DataPoint, index, shape});
    }
  });
  if (!items.length) return [];
  const rows = items.map(item => item.datum);
  const byRow = new Map(items.map(item => [item.datum, item]));
  const item = (d: DataPoint): Labeled => byRow.get(d)!;
  const fillOf = (d: DataPoint): unknown =>
    resolveAccessor(pathConfig.fill, d, item(d).index);

  const text = (d: DataPoint): unknown => {
    const {index} = item(d);
    if (pathConfig.label !== undefined)
      return resolveAccessor(pathConfig.label, d, index) ?? false;
    if (options.text) return options.text(item(d).region);
    return viz._drawLabel(d, index);
  };
  const nodes = emitLabels({
    data: rows,
    label: text,
    x: d => item(d).shape.x,
    y: d => item(d).shape.y,
    aes: d => item(d).shape,
    rotate: constant(0),
    id: d => `geomap-cartogram-label-${item(d).region.id}`,
    labelBounds: d => cartogramLabelBox(item(d).shape),
    labelConfig: {
      fontColor: (rec: DataPoint) => {
        const fill = fillOf(rec.data as DataPoint);
        return colorContrast(
          typeof fill === "string" ? fill : "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      fontMax: options.fontMax ?? 24,
      fontResize: true,
      padding: 2,
      textAnchor: "middle",
      verticalAlign: "middle",
      ...userLabelConfig(viz, "Path"),
    },
  });
  // A label cut short (ending in an ellipsis) doesn't fit: drop it.
  const cut = new Set<string>();
  for (const node of nodes)
    if (node.type === "text") {
      const row = (node.datum as DataPoint | undefined)?.data as
        DataPoint | undefined;
      if (
        row &&
        !wholeLabel(
          node.lines.map(l => l.text),
          text(row),
        )
      )
        cut.add(String(node.key));
    }
  return nodes.filter(node => !cut.has(String(node.key).replace(/::hit$/, "")));
}

/** The letters and digits of a label, the only characters wrapping keeps. */
function letters(text: string): string {
  return text.replace(/[^\p{L}\p{N}]/gu, "");
}

/**
    Whether wrapped `lines` show all of `label`: every letter and digit, in
    order, so a word hyphenated across lines counts and one cut short with
    an ellipsis doesn't.
    @param lines The text of each wrapped line.
    @param label The label's text.
*/
export function wholeLabel(lines: string[], label: unknown): boolean {
  return letters(lines.join("")) === letters(String(label ?? ""));
}
