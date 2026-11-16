/**
    A user domain on a discrete axis. The axis is a point scale, so its
    domain is the list of categories it shows, in order: `xDomain([2016,
    2019])` shows those two categories. Rows whose category isn't listed
    have no position on that axis, so `formatPlotData` drops them. An axis
    config `scale` that draws a continuous range (`xConfig.scale("linear")`)
    makes the domain `[min, max]`, as on any continuous axis: every row
    stays, and the marks past it are clipped (see `domainClip.ts`).
*/
import {InternSet} from "d3-array";

import {isSpanAxis} from "./discreteSpan.js";
import {levelDomain} from "./plotLevels.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";

/** The axis config scales that place categories rather than values. */
const CATEGORY_SCALES = ["auto", "band", "ordinal", "point"];

/**
    Whether an axis config's `scale` draws a continuous range of values
    (`"linear"`, `"log"`, `"time"`, …) rather than leaving a discrete axis
    its categories (unset, `"auto"`, `"band"`, `"ordinal"` or `"point"`).
    @param scale The axis config's `scale`.
*/
export function isContinuousScale(scale: unknown): boolean {
  return typeof scale === "string" && !CATEGORY_SCALES.includes(scale);
}

/**
    The categories a user domain (`<axis>Config.domain`, else `<axis>Domain`)
    lists for the discrete axis, or `null` when that axis has no user domain
    or isn't a point scale (a time or span axis, or one whose axis config
    `scale` draws a continuous range).
*/
export function discreteDomainCategories(
  viz: VizInstance,
): InternSet<unknown> | null {
  const axis = vizDiscrete(viz) as "x" | "y" | undefined;
  if (!axis || isSpanAxis(viz, axis)) return null;
  if (axis === "x" ? viz._xTime : viz._yTime) return null;
  const config = axis === "x" ? viz._xConfig : viz._yConfig;
  if (isContinuousScale(config?.scale)) return null;
  const configDomain = config?.domain;
  const domain = Array.isArray(configDomain)
    ? configDomain
    : viz.schema[`${axis}Domain`];
  return Array.isArray(domain) && domain.length
    ? new InternSet(levelDomain(viz, axis, domain))
    : null;
}
