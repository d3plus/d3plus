/**
    The region a Plot offers for drawing a legend inside its empty space
    (see `legendInset`): the plot area, with the plotted marks as obstacles.
    @module
*/
import {sceneInsetRegion} from "../pipeline/insetPlacement.js";
import type {InsetRegion} from "../features/insetState.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** Axis groups carry tick data, but aren't marks to keep clear of. */
const AXIS_KEY = /^plot-(x|x2|y|y2)-axis$/;

/** The plot area in surface coordinates, with its marks (not its axes) as obstacles; null before layout. */
export function plotInsetRegion(viz: VizInstance): InsetRegion | null {
  const area = viz._plotArea, t = viz._chartTransform;
  if (!area || !t) return null;
  return sceneInsetRegion(viz, {
    x: area.x + (t.x ?? 0),
    y: area.y + (t.y ?? 0),
    width: area.width,
    height: area.height,
  }, node => AXIS_KEY.test(String(node.key)));
}
