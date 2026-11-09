/**
    Shape labels that stand in for the legend: when every Circle, Rect, or
    Bar in a Plot draws its whole label, and that label reads exactly as its
    legend entry would, the color legend repeats what the labels already
    say, so the default legend hides (see `alongLegend.ts`, which runs the
    draw and counts these alongside the along labels).
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";

/** The shapes whose own labels can name their legend entries. */
export const LEGEND_LABEL_SHAPES = ["Bar", "Circle", "Rect"];

type ShapeConfig = Record<string, unknown> & {label?: unknown};

/**
    Whether a Plot's shape labels could name every legend entry: it draws
    only Circles, Rects, and Bars, none of them with `label: false`.
    @param viz The chart.
*/
export function shapeLabelsPossible(viz: VizInstance): boolean {
  const rows = (viz._filteredData ?? []) as DataPoint[];
  if (!rows.length) return false;
  const shape = viz.schema.shape as unknown;
  const config = (viz.schema.shapeConfig ?? {}) as ShapeConfig;
  if (config.label === false) return false;
  const drawn = new Set(
    rows.map((d, i) => (typeof shape === "function" ? shape(d, i) : shape)),
  );
  return [...drawn].every(
    s =>
      LEGEND_LABEL_SHAPES.includes(s as string) &&
      (config[s as string] as ShapeConfig | undefined)?.label !== false,
  );
}

/** A label's text, its lines joined and its whitespace collapsed. */
const textOf = (lines: {text: string}[]): string =>
  lines
    .map(l => l.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

/**
    Counts a Plot's labelable shapes and the ones whose drawn label matches
    their legend entry's into `viz._alongStats`, when every shape could be
    named that way (see `shapeLabelsPossible`). A label cut short, or a
    legend entry named by its color category, doesn't match.
    @param viz The chart.
    @param nodes The plot's shapes and their labels.
*/
export function countShapeLabels(viz: VizInstance, nodes: SceneNode[]): void {
  const stats = viz._alongStats;
  if (!stats || !shapeLabelsPossible(viz)) return;
  const shapes: SceneNode[] = [];
  // A shape's label carries the shape's datum as its own datum's `data`.
  const labels = new Map<unknown, string[]>();
  const walk = (list: SceneNode[]) => {
    for (const n of list) {
      if (n.type === "text") {
        const owner = (n.datum as {data?: unknown} | undefined)?.data;
        if (owner)
          labels.set(owner, [...(labels.get(owner) ?? []), textOf(n.lines)]);
      } else if (
        n.datum &&
        LEGEND_LABEL_SHAPES.includes(n.shapeType as string) &&
        !`${n.key}`.endsWith("::hit")
      )
        shapes.push(n);
      if (n.type === "group") walk(n.children);
    }
  };
  walk(nodes);
  const named = shapes.filter(n => {
    if (viz._legendCategories) return false;
    const d = n.datum as DataPoint;
    const want = textOf([
      {text: viz._drawLabel(d, Number(d.i) || 0, viz._legendDepth)},
    ]);
    return !!want && (labels.get(d) ?? []).includes(want);
  });
  stats.series += shapes.length;
  stats.requested += named.length;
  stats.placed += named.length;
}
