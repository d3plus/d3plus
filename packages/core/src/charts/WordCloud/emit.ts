/**
    `wordCloudEmit` — each placed word as a text node, over a transparent
    rect covering its text box that takes the pointer, keyboard focus, and
    selection for it (text isn't a data mark on its own).
*/

import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {WordCloudWord} from "./applyLayout.js";

/** The shape class words fire `"<event>.Text"` handlers and read `shapeConfig.Text` as. */
export const WORD_SHAPE = "Text";

/**
    The rect a word's pointer events, focus, and selection land on: its
    unrotated text box around its anchor.
    @param word The placed word.
*/
export function wordBox(word: Pick<WordCloudWord, "metrics">): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  const {width, ascent, descent} = word.metrics;
  return {x: -width / 2, y: -ascent, width, height: ascent + descent};
}

/**
    A word's accessible name: its text and its value.
    @param word The placed word.
    @param locale The chart's locale, for the value.
*/
export function wordAriaLabel(
  word: Pick<WordCloudWord, "text" | "value">,
  locale: string,
): string {
  return `${word.text}, ${formatAbbreviate(word.value, locale)}`;
}

export const wordCloudEmit: ChartEmit = ({viz, shapeData}) => {
  const words = (shapeData ?? []) as unknown as WordCloudWord[];
  if (!words.length) return [];
  const sc = shapeConfigFor(viz, WORD_SHAPE);
  const locale = viz.schema.locale as string;

  return words.flatMap(word => {
    const {data: d, i} = word;
    const key = `wordcloud-${word.id}`;
    const transform = {
      x: word.x,
      y: word.y,
      ...(word.rotate ? {rotate: word.rotate} : {}),
    };
    const fill = resolveAccessor<unknown>(sc.fill, d, i);
    const opacity = resolveAccessor<number>(sc.opacity, d, i);
    const box: SceneNode = {
      type: "rect",
      ...wordBox(word),
      key,
      index: i,
      datum: d,
      shapeType: WORD_SHAPE,
      transform,
      paint: {fill: "transparent"},
      aria: {label: wordAriaLabel(word, locale)},
    };
    const text: SceneNode = {
      type: "text",
      key: `${key}-text`,
      index: i,
      datum: d,
      interactive: false,
      x: 0,
      y: 0,
      transform,
      lines: [{text: word.text, x: 0, y: 0, width: word.metrics.width}],
      font: {
        family: word.family,
        size: word.size,
        weight: word.weight,
        anchor: "middle",
      },
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        opacity,
      },
      aria: {hidden: true},
    };
    return [box, text];
  });
};
