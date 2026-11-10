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

/**
    Sets the cursor shown over the chart's drawing surface.
    @param viz The chart.
    @param cursor A CSS cursor.
*/
export function setCursor(viz: CursorHost, cursor: string): void {
  const elements: Element[] =
    viz._renderer === "canvas" ? (viz._sceneRenderer?.elements?.() ?? []) : [];
  const canvas = elements.find(el => el.localName === "canvas");
  if (canvas) (canvas as HTMLCanvasElement).style.cursor = cursor;
  else viz._select?.style("cursor", cursor);
}
