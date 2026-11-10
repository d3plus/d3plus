/**
    ParallelCoordinates dimension titles: measured and drawn with a TextBox,
    centered above each axis (horizontal layout) or right-aligned beside it
    (vertical layout).
*/

import type {SceneNode} from "@d3plus/render";

import {TextBox} from "../../components/index.js";
import {stampTitleTooltip} from "../../components/Axis/axisTooltipTargets.js";

import {chromeNode} from "./chrome.js";

/** A title's text and the box it's drawn in, in chart coordinates. */
export interface DimensionTitle {
  key: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Room assumed for a title's text when measuring its natural (one-line) width. */
const UNWRAPPED = 1e4;

function titleBox(
  titles: DimensionTitle[],
  style: Record<string, unknown>,
  locale?: string,
): TextBox {
  const box = new TextBox()
    .data(titles.map(t => ({id: `pc-title-${t.key}`, text: t.text})))
    .x((_: unknown, i: number) => titles[i].x)
    .y((_: unknown, i: number) => titles[i].y)
    .width((_: unknown, i: number) => titles[i].width)
    .height((_: unknown, i: number) => titles[i].height)
    .config(style);
  if (locale) box.locale(locale);
  return box;
}

/** Each text's width on one line, in the title style. */
export function titleWidths(
  texts: string[],
  style: Record<string, unknown>,
  locale?: string,
): number[] {
  if (!texts.length) return [];
  const titles = texts.map((text, i) => ({
    key: `${i}`,
    text,
    x: 0,
    y: 0,
    width: UNWRAPPED,
    height: UNWRAPPED,
  }));
  return titleBox(titles, {...style, padding: 0}, locale)
    ._textData()
    .map(d => Math.ceil(Math.max(0, ...d.widths)));
}

/** The height of the tallest title once each wraps to its `width` (0 when there are none). */
export function titleHeight(
  titles: DimensionTitle[],
  style: Record<string, unknown>,
  locale?: string,
): number {
  if (!titles.length) return 0;
  const data = titleBox(
    titles.map(t => ({...t, height: UNWRAPPED})),
    {...style, padding: 0},
    locale,
  )._textData();
  return Math.ceil(Math.max(0, ...data.map(d => d.lines.length * d.lH)));
}

/**
    The title text nodes, as chrome (see `chromeNode`). With `tooltips`, each
    dimension's `titleTooltip` by key, a title with a tooltip to show (the
    option's, or its whole text when it is drawn cut short) takes the
    pointer; without it none does.
*/
export function titleNodes(
  titles: DimensionTitle[],
  style: Record<string, unknown>,
  locale?: string,
  tooltips?: Map<string, unknown>,
): SceneNode[] {
  if (!titles.length) return [];
  const byId = new Map(titles.map(t => [`pc-title-${t.key}`, t]));
  return titleBox(titles, {...style, padding: 0}, locale)
    .toScene()
    .children.map(node => {
      const title = byId.get(`${(node.datum as {id?: unknown})?.id}`);
      if (tooltips && title)
        stampTitleTooltip([node], title.text, tooltips.get(title.key));
      return chromeNode(node);
    });
}
