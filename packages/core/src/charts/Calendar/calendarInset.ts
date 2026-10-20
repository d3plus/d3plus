/**
    `calendarInsetRegion` — where Calendar lets chrome (its colorScale, or a
    categorical legend) sit inside the chart: the chart area, kept clear of
    everything the calendar draws.
*/

import {chartBounds} from "../features/chartGeometry.js";
import type {InsetRegion} from "../features/insetState.js";
import {markBoxes} from "../features/sceneBounds.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The chart area, with the box of every node in Calendar's scene as an
    obstacle: the days without data, month outlines, and weekday, month, and
    year labels, as well as the data days.
*/
export function calendarInsetRegion(viz: VizInstance): InsetRegion {
  const {width, height} = chartBounds(viz);
  return {
    bounds: {x: viz._margin.left, y: viz._margin.top, width, height},
    obstacles: markBoxes(
      viz._chartScene || [],
      viz._chartTransform,
      undefined,
      true,
    ),
  };
}
