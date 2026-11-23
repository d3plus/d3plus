/**
    A Plot's `lineMarkerConfig`, as its markers read it: every accessor, at
    any depth (a nested `labelConfig` included), gets the marker's source
    row and that row's index, as every other Plot shape's accessors and
    handlers do, rather than the Plot record wrapping the row and the
    marker's place among the markers.

    @module
*/

import configPrep from "../../utils/configPrep.js";
import type {ConfigPrepHost} from "../../utils/configPrep.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The chart's `lineMarkerConfig`, its accessors reading source rows. */
export function lineMarkerAccessors(
  viz: Pick<VizInstance, "_lineMarkerConfig">,
): Record<string, unknown> {
  const config = (viz._lineMarkerConfig ?? {}) as Record<string, unknown>;
  const out = configPrep.bind(viz as unknown as ConfigPrepHost)(
    config as Parameters<typeof configPrep>[0],
  ) as Record<string, unknown>;
  // `configPrep` also adds the chart's duration and event handlers, which
  // the markers take from the chart's own shape config.
  for (const key of ["duration", "on"]) if (!(key in config)) delete out[key];
  return out;
}
