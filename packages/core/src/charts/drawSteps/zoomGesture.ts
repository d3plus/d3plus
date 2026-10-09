/**
    Which presses on the zoom surface belong to something other than d3-zoom.

    @module
*/

/** The groups inside the zoom surface that hold a d3-brush: the timeline's and the zoom brush. */
export const BRUSH_GROUPS = "g.d3plus-viz-timeline, g.d3plus-zoom-brush";

/**
    Whether a press starts on a brush inside the zoom surface (a timeline
    click or drag). d3-brush stops the press's mouseup / touchend from
    reaching any other listener, so a zoom gesture started by the same press
    would never end: every later mousemove would keep "panning" the chart,
    repainting it instantly and cutting short the transition the timeline
    just started.
    @param event The pointer event d3-zoom is filtering.
*/
export function startsOnBrush(event: Pick<Event, "target">): boolean {
  const target = event.target as Partial<Element> | null;
  return Boolean(target && typeof target.closest === "function" && target.closest(BRUSH_GROUPS));
}
