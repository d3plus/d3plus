/**
    A `baseline` set on a Plot is the value axis's starting value: it fills
    the end of the user's value domain (`yDomain`, or `xDomain` for
    horizontal charts) that the user left open, exactly as if that end had
    been given there. A chart's built-in baseline (BarChart's `0`) only marks
    where bars and areas start.

    @module
*/
import {valueAxis} from "./baselineBreak.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A domain value for any of the four axes. */
type DomainValue = number | string | Date;

/**
    The value axis a set `baseline` bounds, or undefined when no baseline was
    set or that axis isn't a continuous number axis (time, sorted, or a log
    scale that can't reach the baseline).
*/
export function baselineDomainAxis(viz: VizInstance): "x" | "y" | undefined {
  const {baseline} = viz.schema;
  if (!viz._baselineSet || typeof baseline !== "number" || !Number.isFinite(baseline)) return undefined;
  const axis = valueAxis(viz);
  if (viz[`_${axis}Time`] || viz.schema[`${axis}Sort`]) return undefined;
  const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
  if (config?.scale === "log" && baseline <= 0) return undefined;
  return axis;
}

/** Whether an axis's domain comes from the user: an `xDomain`/`yDomain`, or a set `baseline`. */
export function hasUserDomain(viz: VizInstance, axis: "x" | "y"): boolean {
  return Boolean(viz.schema[`${axis}Domain`]) || baselineDomainAxis(viz) === axis;
}

/**
    The user's domain for `axis` (a copy), with a set `baseline` filling the
    end it bounds: the maximum when every value in `dataDomain` sits at or
    below the baseline, otherwise the minimum. A bound the user gave wins.
    Undefined when neither applies.
*/
export function userAxisDomain(
  viz: VizInstance,
  axis: string,
  dataDomain: DomainValue[] | undefined,
): DomainValue[] | undefined {
  const user = viz.schema[`${axis}Domain`] as DomainValue[] | undefined;
  const domain = user ? user.slice() : undefined;
  if (baselineDomainAxis(viz) !== axis) return domain;
  const baseline = viz.schema.baseline as number;
  const hi = dataDomain?.[1];
  const end = typeof hi === "number" && hi <= baseline ? 1 : 0;
  const out = domain ?? [];
  if (out[end] === undefined) out[end] = baseline;
  return out;
}
