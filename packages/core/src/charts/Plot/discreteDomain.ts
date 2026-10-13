/**
    A user domain on a discrete axis. The axis is a point scale, so its
    domain is the list of categories it shows, in order: `xDomain([2016,
    2019])` shows those two categories. Rows whose category isn't listed
    have no position on that axis, so `formatPlotData` drops them.
*/
import {InternSet} from "d3-array";

import {isSpanAxis} from "./discreteSpan.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The categories a user domain (`<axis>Config.domain`, else `<axis>Domain`)
    lists for the discrete axis, or `null` when that axis has no user domain
    or isn't a point scale (a time or span axis).
*/
export function discreteDomainCategories(viz: VizInstance): InternSet<unknown> | null {
  const axis = viz.schema.discrete as "x" | "y" | undefined;
  if (!axis || isSpanAxis(viz, axis)) return null;
  if (axis === "x" ? viz._xTime : viz._yTime) return null;
  const configDomain = (axis === "x" ? viz._xConfig : viz._yConfig)?.domain;
  const domain = Array.isArray(configDomain) ? configDomain : viz.schema[`${axis}Domain`];
  return Array.isArray(domain) && domain.length ? new InternSet(domain) : null;
}
