import type {SceneEvent} from "@d3plus/render";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    Whether a routed "mouseleave" leaves the whole chart: one the pointer
    makes off the drawing surface, or the one a moving zoom gesture sends
    (see `gestureHover.ts`), as opposed to the leave that crossing from one
    node to the next fires ahead of its move.
    @param viz The chart.
    @param event The routed scene event.
*/
export function leavesSurface(
  viz: Pick<VizInstance, "_gestureHover">,
  event: SceneEvent,
): boolean {
  if (event.type !== "mouseleave") return false;
  const native = event.nativeEvent as Event | undefined;
  return !native || native.type === "mouseleave" || !!viz._gestureHover?.moving;
}
