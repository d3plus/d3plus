/**
    Labels drawn along a line with a TextBox `textPath`: in their line's
    color, legible on the chart's background, over a halo of that background,
    and inert (no hover, click, or keyboard stop). A label given its mark's
    datum dims and highlights with that mark.
*/
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import TextBox from "../../components/TextBox.js";
import {legibleOn} from "../../utils/themeInk.js";
import {chartBackground} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {textHalo} from "./textHalo.js";

/** One label along a path. */
export interface PathLabel {
  /** The label's scene key. */
  key: string;
  text: string;
  /** The path's `d`, in the plot's coordinates. */
  d: string;
  /** The line's color, made legible on the chart's background. */
  color: string;
  /** Where along the path the text sits: `"start"`, `"middle"`, or `"end"`. */
  anchor: "start" | "middle" | "end";
  /** The datum of the mark the label names, so hover dims them together. */
  datum?: DataPoint;
  /** That mark's index. */
  index?: number;
}

/** Options for `pathLabelNodes`. */
export interface PathLabelOptions {
  /** Whether a halo of the chart's background clears the marks around the text. Defaults to `true`. */
  halo?: boolean;
}

/** The label font size when a config sets none. */
export const PATH_LABEL_FONT_SIZE = 11;

/**
    The scene nodes for labels along paths, each cut short with an ellipsis
    when its path is too short for it.
    @param viz The chart, for its theme, background, and locale.
    @param labels The labels.
    @param config TextBox config laid over the defaults.
    @param options Whether the text takes a halo.
*/
export function pathLabelNodes(
  viz: VizInstance,
  labels: PathLabel[],
  config: Record<string, unknown> = {},
  options: PathLabelOptions = {},
): SceneNode[] {
  if (!labels.length) return [];
  const dark = Boolean(viz._theme?.dark);
  const box = new TextBox()
    .renderMode("compute")
    .locale(viz.schema.locale)
    .data(labels.map(l => ({...l, id: l.key})))
    .config({
      fontSize: PATH_LABEL_FONT_SIZE,
      fontWeight: 600,
      fontColor: (d: PathLabel) => legibleOn(d.color, dark),
      text: (d: PathLabel) => d.text,
      textAnchor: (d: PathLabel) => d.anchor,
      textPath: (d: PathLabel) => d.d,
      truncateWord: true,
      x: 0,
      y: 0,
      ...config,
    });
  const scene = box.toScene().children;
  const nodes: SceneNode[] =
    options.halo === false ? scene : textHalo(scene, chartBackground(viz), 3);
  return nodes.map(node => {
    const label = node.datum as PathLabel | undefined;
    return {
      ...node,
      interactive: false,
      datum: label?.datum,
      index: label?.index ?? node.index,
      aria: {hidden: true},
    };
  });
}
