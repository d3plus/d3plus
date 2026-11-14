/**
    BubbleMatrix's default colorScale: linear and diverging around zero over
    a domain symmetric about it, so values of equal magnitude take equal
    color strength on either side (a correlation of -0.8 as strong as 0.8).
*/
import type {DataPoint} from "@d3plus/data";

import {isSetEntry} from "../../fluent.js";
import type {VizInstance} from "../viz/vizTypes.js";

/**
    The domain symmetric around zero that spans `values`: `[-m, m]`, where
    `m` is the largest absolute value. Null when no value is a finite,
    nonzero number.
    @param values The colorScale values.
*/
export function symmetricColorDomain(
  values: unknown[],
): [number, number] | null {
  let m = 0;
  for (const v of values)
    if (typeof v === "number" && Number.isFinite(v))
      m = Math.max(m, Math.abs(v));
  return m > 0 ? [-m, m] : null;
}

/**
    Sets the colorScale's domain for this draw to the one symmetric around
    zero that spans the drawn rows' colorScale values (see
    `symmetricColorDomain`). A `colorScaleConfig.domain` or `scale` the user
    sets is left to stand, and a domain set on an earlier draw is taken back
    off when there are no values to span.
    @param viz The chart.
*/
export function applySymmetricColorDomain(viz: VizInstance): void {
  const accessor = viz.schema.colorScale as
    ((d: DataPoint, i: number) => unknown) | undefined;
  const userDomain = isSetEntry(viz, "colorScaleConfig", "domain");
  const user = userDomain || isSetEntry(viz, "colorScaleConfig", "scale");
  const domain =
    typeof accessor === "function" && !user
      ? symmetricColorDomain((viz._filteredData ?? []).map(accessor))
      : null;
  const config = (viz.schema.colorScaleConfig ?? {}) as Record<string, unknown>;
  if (domain) {
    viz.schema.colorScaleConfig = {...config, domain};
    viz.ctx.symmetricColorDomain = true;
  } else if (viz.ctx.symmetricColorDomain) {
    if (!userDomain) {
      const rest = {...config};
      delete rest.domain;
      viz.schema.colorScaleConfig = rest;
    }
    viz.ctx.symmetricColorDomain = false;
  }
}
