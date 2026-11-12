/**
    Alluvial column titles: each dimension's title above its column, flush
    with the first and last columns' outer edges and centered over the rest.
*/

import type {SceneNode} from "@d3plus/render";

import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {titleHeight, titleNodes} from "../ParallelCoordinates/titles.js";
import type {DimensionTitle} from "../ParallelCoordinates/titles.js";

/** The space between the titles and the nodes below them, in pixels. */
export const TITLE_GAP = 8;

/** A column title's box and how its text aligns in it. */
export interface AlluvialTitle extends DimensionTitle {
  anchor: "start" | "middle" | "end";
}

/**
    Each titled column's title box, in chart coordinates (from y = 0, with no
    height yet): a middle column's spans halfway to each neighbor, the first
    column's runs from its left edge, and the last column's ends at its
    right edge. Columns with an empty title get none.
    @param texts Each column's title.
    @param x Each column's left edge.
    @param nodeWidth The node width.
    @param width The chart width.
*/
export function alluvialTitleBoxes(
  texts: string[],
  x: number[],
  nodeWidth: number,
  width: number,
): AlluvialTitle[] {
  const n = texts.length;
  const step = n > 1 ? x[1] - x[0] : width;
  const gap = 4;
  const half = Math.max(1, step / 2 - gap);
  const titles: AlluvialTitle[] = [];
  texts.forEach((text, k) => {
    if (!text) return;
    const center = x[k] + nodeWidth / 2;
    const base = {key: `${k}`, text, y: 0, height: 0};
    if (n === 1)
      titles.push({...base, x: 0, width: Math.max(1, width), anchor: "middle"});
    else if (k === 0)
      titles.push({
        ...base,
        x: x[k],
        width: half + nodeWidth / 2,
        anchor: "start",
      });
    else if (k === n - 1)
      titles.push({
        ...base,
        x: center - half,
        width: half + nodeWidth / 2,
        anchor: "end",
      });
    else
      titles.push({
        ...base,
        x: center - half,
        width: half * 2,
        anchor: "middle",
      });
  });
  return titles;
}

/** The column titles' `titleTooltip`, from `dimensionTitleConfig`. */
export function alluvialTitleTooltip(viz: VizInstance): unknown {
  return (
    viz.schema.dimensionTitleConfig as Record<string, unknown> | undefined
  )?.titleTooltip;
}

/**
    The column title style: `dimensionTitleConfig` over the chart's background
    ink, without its `titleTooltip` (see `alluvialTitleTooltip`).
*/
export function alluvialTitleStyle(
  viz: VizInstance,
  titles: AlluvialTitle[],
): Record<string, unknown> {
  const style: Record<string, unknown> = {
    fontColor: backgroundInk(viz),
    fontSize: 12,
    fontWeight: 600,
    textAnchor: (_d: unknown, i: number) => titles[i]?.anchor ?? "middle",
    verticalAlign: "bottom",
    ...((viz.schema.dimensionTitleConfig ?? {}) as Record<string, unknown>),
  };
  delete style.titleTooltip;
  return style;
}

/**
    Sizes the title boxes to the tallest wrapped title and returns that
    height (0 with no titles).
*/
export function sizeAlluvialTitles(
  titles: AlluvialTitle[],
  style: Record<string, unknown>,
  locale?: string,
): number {
  const height = titleHeight(titles, style, locale);
  for (const t of titles) t.height = height;
  return height;
}

/**
    The title text nodes, as chrome with no datum: a title takes the pointer
    only when it has a tooltip to show, the option's or, drawn cut short, its
    whole text.
    @param titles The sized title boxes.
    @param style The title style.
    @param locale The chart's locale.
    @param tooltip `dimensionTitleConfig`'s `titleTooltip`.
*/
export function alluvialTitleNodes(
  titles: AlluvialTitle[],
  style: Record<string, unknown>,
  locale?: string,
  tooltip?: unknown,
): SceneNode[] {
  const tooltips = new Map(titles.map(t => [t.key, tooltip]));
  return titleNodes(titles, style, locale, tooltips).map(node => ({
    ...node,
    key: `alluvial-${String(node.key)}`,
  }));
}
