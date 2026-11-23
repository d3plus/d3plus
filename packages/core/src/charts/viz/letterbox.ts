import {rendererSurfaces} from "../../utils/className.js";
import type Viz from "./Viz.js";

/**
    A chart `sizeRatio` letterboxed: narrowed to keep its ratio inside a
    container whose own height is lower than the ratio asks for, and centered
    in its frame (its container's width, or its explicit `width`).
*/
export interface Letterbox {
  /** The frame's width, in pixels. */
  width: number;
  /** The empty space on each side of the chart, in pixels. */
  offset: number;
  /** The chart's narrowed width, in pixels. */
  drawn: number;
}

/** What the letterbox helpers read from a chart. */
export interface LetterboxHost {
  schema: {width?: number};
  _letterbox?: Letterbox;
}

/**
    The chart's letterbox, while its frame is still the width it was
    measured at (a width set since then ends it until the next render).
    @private
*/
export function activeLetterbox(viz: LetterboxHost): Letterbox | undefined {
  const box = viz._letterbox;
  return box && viz.schema.width === box.width ? box : undefined;
}

/**
    The width the chart draws at: its `width` (set, or measured from its
    container), or the narrower width `sizeRatio` letterboxes it to. The
    `width` config itself always keeps the frame's width, which `responsive`
    breakpoints match; everything that lays out, paints, or measures the
    drawn chart reads this instead.
    @param viz The chart.
*/
export function chartWidth(viz: LetterboxHost): number {
  return activeLetterbox(viz)?.drawn ?? (viz.schema.width as number);
}

/**
    The empty space on each side of a letterboxed chart, in pixels (0 when it
    fills its frame).
    @private
*/
export function letterboxOffset(viz: LetterboxHost): number {
  return activeLetterbox(viz)?.offset ?? 0;
}

/**
    Records the letterbox of a chart drawn `drawn` pixels wide, centered in a
    frame `frame` pixels wide, or clears it when the chart fills the frame.
    @private
*/
export function setLetterbox(
  viz: LetterboxHost,
  drawn: number | undefined,
  frame: number | undefined,
): void {
  viz._letterbox =
    drawn !== undefined && frame !== undefined && frame - drawn > 0.5
      ? {width: frame, offset: (frame - drawn) / 2, drawn}
      : undefined;
}

/**
    Centers a letterboxed chart's `<canvas>`, which sits in its container's
    flow, with equal margins, so it still takes its frame's width there; the
    chart's absolutely positioned `<svg>` takes its offset in `vizRender`.
    @private
*/
export function placeCanvas(viz: Viz): void {
  const offset = letterboxOffset(viz);
  for (const el of rendererSurfaces(viz._sceneRenderer)) {
    if (el.localName !== "canvas") continue;
    const style = (el as HTMLElement).style;
    style.marginLeft = offset ? `${offset}px` : "";
    style.marginRight = offset ? `${offset}px` : "";
  }
}

/**
    Moves the loading or no-data message (and its mask), which span the
    chart's container, over a letterboxed chart instead. A chart that fills
    its frame keeps them where `messageStyle` puts them.
    @private
*/
export function placeMessage(viz: Viz): void {
  const offset = letterboxOffset(viz);
  const svg = viz._select?.node?.() as Element | null | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  const view = parent?.ownerDocument?.defaultView;
  const message = viz._messageClass;
  if (!offset || !parent || !view || !message) return;
  const padding = parseFloat(view.getComputedStyle(parent).paddingLeft) || 0;
  const left = padding + offset;
  const right = Math.max(0, parent.clientWidth - left - chartWidth(viz));
  for (const sel of [message.elem, message.mask]) {
    if (!sel || typeof sel.style !== "function") continue;
    sel.style("left", `${left}px`).style("right", `${right}px`);
  }
}
