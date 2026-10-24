import {broadcastLink} from "./linkGroup.js";
import type {VizInstance} from "./vizTypes.js";

/**
    The `hover` setter of charts whose marks dim through the scene alone
    (Chord, Network, Rings, Sankey): stores the predicate, hands it to the
    legend, schedules a repaint so the scene's interaction-opacity pass
    re-reads it, and broadcasts it to linked charts.
    With no argument, returns the current predicate.
    @param _ The hover predicate, or `false` to clear it.
*/
export function simpleHover(this: VizInstance, _?: unknown): unknown {
  if (!arguments.length) return this._hover;
  this._hover = _ as VizInstance["_hover"];
  if (this.schema.legend && this._legendClass) this._legendClass.hover(_);
  if (this._sceneRenderer) this._scheduleSceneRepaint();
  broadcastLink(this, "hover", _);
  return this;
}
