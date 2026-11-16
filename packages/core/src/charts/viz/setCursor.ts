/**
    The cursor a chart shows over its shapes and legend entries (the hand
    over one a click acts on). It is set on the element under the pointer:
    the chart's root `<svg>` or, with the Canvas renderer, its `<canvas>`
    (the root svg sits above the canvas and passes pointer events through,
    so its own cursor never shows).
*/

import type {VizInstance} from "./vizTypes.js";

/**
    The parts of a chart `setCursor` reads. (`schema` is not read: it ties
    the type to a chart, every other part being optional.)
*/
export type CursorHost = Pick<VizInstance, "schema"> &
  Partial<Pick<VizInstance, "_renderer" | "_sceneRenderer" | "_select">>;

/** The canvas the chart's renderer draws on, if it draws on one. */
function canvasOf(viz: CursorHost): HTMLCanvasElement | undefined {
  const elements: Element[] = viz._sceneRenderer?.elements?.() ?? [];
  return elements.find(el => el.localName === "canvas") as
    HTMLCanvasElement | undefined;
}

/**
    Sets the cursor shown over the chart's drawing surface.
    @param viz The chart.
    @param cursor A CSS cursor.
*/
export function setCursor(viz: CursorHost, cursor: string): void {
  const canvas = viz._renderer === "canvas" ? canvasOf(viz) : undefined;
  if (canvas) canvas.style.cursor = cursor;
  else viz._select?.style("cursor", cursor);
}

/** The parts of a chart `setMarkCursor` reads. */
export type MarkCursorHost = CursorHost &
  Partial<Pick<VizInstance, "_keyboardNav">>;

/**
    Sets the cursor for a hovered shape or legend entry: the hand on one a
    click acts on (a bar's slot and a point's `hoverDistance` reach count as
    the mark, taking its click), the default cursor anywhere else. A keyboard
    move, which replays pointer events wherever the pointer rests, leaves the
    cursor as it is.
    @param viz The chart.
    @param clickable Whether a click on the hovered mark does something.
*/
export function setMarkCursor(viz: MarkCursorHost, clickable: boolean): void {
  if (viz._keyboardNav?.replaying) return;
  setCursor(viz, clickable ? "pointer" : "auto");
}

/**
    Returns both of the chart's drawing surfaces to the default cursor. Run
    before the renderer is swapped for another: the pointer may rest on a
    clickable shape, and the outgoing surface would keep its hand cursor.
    @param viz The chart, still holding the outgoing renderer.
*/
export function resetCursor(viz: CursorHost): void {
  const canvas = canvasOf(viz);
  if (canvas) canvas.style.cursor = "auto";
  viz._select?.style("cursor", "auto");
}
