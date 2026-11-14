/**
    BubbleMatrix's default colorScale: linear, and when its values cross
    zero, diverging around it over a domain symmetric about it, so values of
    equal magnitude take equal color strength on either side (a correlation
    of -0.8 as strong as 0.8). Values of one sign keep the colorScale's
    sequential ramp across their own range.
*/
import type {DataPoint} from "@d3plus/data";

import {isSetEntry} from "../../fluent.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The colorScale domain for `values`: when they cross zero (some below it,
    some above), the domain symmetric around zero that spans them, `[-m, m]`
    with `m` the largest absolute value. Null when every finite value has the
    same sign (or there are none), leaving the colorScale's own domain, the
    values' extent.
    @param values The colorScale values.
*/
export function bubbleColorDomain(values: unknown[]): [number, number] | null {
  let lo = 0;
  let hi = 0;
  for (const v of values)
    if (typeof v === "number" && Number.isFinite(v)) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
  if (!(lo < 0 && hi > 0)) return null;
  const m = Math.max(-lo, hi);
  return [-m, m];
}

/**
    Sets the colorScale's domain for this draw from the drawn rows'
    colorScale values (see `bubbleColorDomain`): symmetric around zero when
    they cross it, else the colorScale's own. A `colorScaleConfig.domain` or `scale` the user
    sets is left to stand, and a domain set on an earlier draw is taken back
    off when the values no longer cross zero.
    @param viz The chart.
*/
export function applyBubbleColorDefaults(viz: VizInstance): void {
  const accessor = viz.schema.colorScale as
    ((d: DataPoint, i: number) => unknown) | undefined;
  const userDomain = isSetEntry(viz, "colorScaleConfig", "domain");
  const user = userDomain || isSetEntry(viz, "colorScaleConfig", "scale");
  const domain =
    typeof accessor === "function" && !user
      ? bubbleColorDomain((viz._filteredData ?? []).map(accessor))
      : null;
  const config = (viz.schema.colorScaleConfig ?? {}) as Record<string, unknown>;
  if (domain) {
    viz.schema.colorScaleConfig = {...config, domain};
    viz.ctx.bubbleColorDomain = true;
  } else if (viz.ctx.bubbleColorDomain) {
    if (!userDomain) {
      const rest = {...config};
      delete rest.domain;
      viz.schema.colorScaleConfig = rest;
    }
    viz.ctx.bubbleColorDomain = false;
  }
}
