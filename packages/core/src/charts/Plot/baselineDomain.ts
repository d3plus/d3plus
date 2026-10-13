/**
    A `baseline` set on a Plot is shorthand for one end of the value axis's
    domain: `baseline(n)` renders exactly like `yDomain([n])` (or
    `xDomain([n])` for horizontal charts). It's kept apart from the chart's
    own baseline (`schema.baseline`, BarChart's `0`), which still marks where
    bars and areas start and where a `baselineBreak` returns to.

    @module
*/
import RESET from "../../utils/RESET.js";
import {valueAxis} from "./baselineBreak.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A domain value for any of the four axes. */
type DomainValue = number | string | Date;

/** `Plot.baseline()`: the user's baseline, or the chart's own when none is set. */
export function baselineValue(viz: VizInstance): number | undefined {
  return viz._userBaseline ?? viz.schema.baseline;
}

/** `Plot.baseline(_)`: stores the user's baseline; `RESET` and `undefined` clear it. */
export function setBaseline(viz: VizInstance, value: unknown): void {
  viz._userBaseline = value === RESET || value === undefined ? undefined : (value as number);
}

/**
    The value axis a set `baseline` bounds, or undefined when no baseline was
    set or that axis isn't a continuous number axis (time, sorted, or a log
    scale that can't reach the baseline).
*/
export function baselineDomainAxis(viz: VizInstance): "x" | "y" | undefined {
  const baseline = viz._userBaseline;
  if (typeof baseline !== "number" || !Number.isFinite(baseline)) return undefined;
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
  const baseline = viz._userBaseline as number;
  const hi = dataDomain?.[1];
  const end = typeof hi === "number" && hi <= baseline ? 1 : 0;
  const out = domain ?? [];
  if (out[end] === undefined) out[end] = baseline;
  return out;
}
