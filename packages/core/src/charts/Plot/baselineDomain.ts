/**
    A `baseline` set on a Plot is shorthand for one end of the value axis's
    domain: `baseline(n)` renders exactly like `yDomain([n])` (or
    `xDomain([n])` for horizontal charts). It's kept apart from the chart's
    own baseline (`schema.baseline`, BarChart's `0`), which still marks where
    bars and areas start and where a `baselineBreak` returns to.

    It also reads which domain the user gave an axis (an `xDomain`/`yDomain`
    or a one-sided axis-config `domain`) and whether that domain leaves an end
    open for Plot to fill from the data and round (see `openDomainEnds.ts`).

    @module
*/
import RESET from "../../utils/RESET.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** A domain value for any of the four axes. */
type DomainValue = number | string | Date;

/** The value (non-discrete) axis of a Plot; a swarm's own value axis when swarming. */
export const valueAxis = (viz: VizInstance): "x" | "y" =>
  viz._swarm ? viz._swarm.axis : viz.schema.discrete === "y" ? "x" : "y";

/** Whether a domain sets exactly one end (`[n]`, `[undefined, n]`), leaving the other to the data. */
export function isOneSided(domain: unknown): domain is DomainValue[] {
  if (!Array.isArray(domain) || domain.length > 2) return false;
  return (
    (domain[0] === undefined || domain[0] === null) !==
    (domain[1] === undefined || domain[1] === null)
  );
}

/** Whether an axis is a continuous extent, rather than a list of categories. */
const continuousAxis = (viz: VizInstance, axis: string): boolean =>
  viz.schema.discrete !== axis &&
  !viz.schema[`${axis}Sort`] &&
  viz._swarm?.cross !== axis;

/**
    A one-sided `domain` in an axis config (`yConfig({domain: [n]})`) on a
    continuous axis, low end first; undefined otherwise. Plot reads it as the
    user's domain, exactly like `yDomain([n])`. (`yConfig` stores its domain
    reversed, so a set maximum comes back second.)
*/
export function configOpenDomain(
  viz: VizInstance,
  axis: string,
): DomainValue[] | undefined {
  if (axis !== "x" && axis !== "y") return undefined;
  const domain = (viz[`_${axis}Config`] as {domain?: unknown} | undefined)
    ?.domain;
  if (!isOneSided(domain) || !continuousAxis(viz, axis)) return undefined;
  const out = domain.slice();
  return axis === "y" && out.length === 2 ? out.reverse() : out;
}

/** The domain the user gave an axis: a one-sided axis-config `domain`, else the `xDomain`/`yDomain`. */
const givenDomain = (
  viz: VizInstance,
  axis: string,
): DomainValue[] | undefined =>
  configOpenDomain(viz, axis) ??
  (viz.schema[`${axis}Domain`] as DomainValue[] | undefined);

/** `Plot.baseline()`: the user's baseline, or the chart's own when none is set. */
export function baselineValue(viz: VizInstance): number | undefined {
  return viz._userBaseline ?? viz.schema.baseline;
}

/** `Plot.baseline(_)`: stores the user's baseline; `RESET` and `undefined` clear it. */
export function setBaseline(viz: VizInstance, value: unknown): void {
  viz._userBaseline =
    value === RESET || value === undefined ? undefined : (value as number);
}

/**
    The value axis a set `baseline` bounds, or undefined when no baseline was
    set or that axis isn't a continuous number axis (time, sorted, or a log
    scale that can't reach the baseline).
*/
export function baselineDomainAxis(viz: VizInstance): "x" | "y" | undefined {
  const baseline = viz._userBaseline;
  if (typeof baseline !== "number" || !Number.isFinite(baseline))
    return undefined;
  const axis = valueAxis(viz);
  if (viz[`_${axis}Time`] || viz.schema[`${axis}Sort`]) return undefined;
  const config = viz[`_${axis}Config`] as Record<string, unknown> | undefined;
  if (config?.scale === "log" && baseline <= 0) return undefined;
  return axis;
}

/** Whether an axis's domain comes from the user: an `xDomain`/`yDomain`, a one-sided axis-config `domain`, or a set `baseline`. */
export function hasUserDomain(viz: VizInstance, axis: "x" | "y"): boolean {
  return Boolean(givenDomain(viz, axis)) || baselineDomainAxis(viz) === axis;
}

/**
    Whether an axis config (`xConfig`, `yConfig`, `x2Config`, `y2Config`)
    sets a full `domain`: both ends, or a list of categories. Like an Axis
    given a domain, Plot draws it as given, rounded only by that axis
    config's own `rounding`.
*/
export function hasFullConfigDomain(
  viz: VizInstance,
  axis: "x" | "y" | "x2" | "y2",
): boolean {
  const domain = (viz[`_${axis}Config`] as {domain?: unknown} | undefined)
    ?.domain;
  return (
    Array.isArray(domain) &&
    domain.some(d => d !== undefined && d !== null) &&
    !isOneSided(domain)
  );
}

/**
    The `rounding` Plot hands an axis: "none" when its axis config sets a
    full `domain`, else `fallback` (Plot's own default for that axis). The
    axis config's own `rounding` is merged over it.
*/
export function plotAxisRounding(
  viz: VizInstance,
  axis: "x" | "y" | "x2" | "y2",
  fallback: string,
): string {
  return hasFullConfigDomain(viz, axis) ? "none" : fallback;
}

/**
    The `rounding` Plot hands a secondary axis (`x2`/`y2`): the user's
    `x2Config`/`y2Config` `rounding`, else "none" for a full `domain` there,
    else the primary axis's default (`fallback`). Set explicitly so a full
    domain on the primary axis doesn't turn rounding off on this one.
*/
export function secondaryAxisRounding(
  viz: VizInstance,
  axis: "x2" | "y2",
  fallback: string,
): string {
  const own = (viz[`_${axis}Config`] as {rounding?: string} | undefined)
    ?.rounding;
  return own ?? plotAxisRounding(viz, axis, fallback);
}

/**
    Whether the user's domain on an axis sets one end and leaves the other to
    the data: a one-sided `xDomain`/`yDomain` or axis-config `domain`, or a set
    `baseline` alone. Plot fills that end and rounds it (see
    `openDomainEnds.ts`). A full axis-config `domain` wins outright.
*/
export function hasOpenUserEnd(viz: VizInstance, axis: "x" | "y"): boolean {
  const config = (viz[`_${axis}Config`] as {domain?: unknown} | undefined)
    ?.domain;
  if (config !== undefined && !configOpenDomain(viz, axis)) return false;
  const given = givenDomain(viz, axis);
  return given ? isOneSided(given) : baselineDomainAxis(viz) === axis;
}

/**
    The user's axis config as Plot hands it to the axis: without its
    `rounding` or one-sided `domain` when the user's domain leaves an end open,
    since Plot fills and rounds that end itself.
*/
export function openEndAxisConfig(
  viz: VizInstance,
  axis: "x" | "y",
): Record<string, unknown> {
  const config = (viz[`_${axis}Config`] ?? {}) as Record<string, unknown>;
  if (!hasOpenUserEnd(viz, axis)) return config;
  const out = {...config};
  delete out.rounding;
  if (configOpenDomain(viz, axis)) delete out.domain;
  return out;
}

/**
    The user's domain for `axis` (a copy; see `givenDomain`), with a set `baseline` filling the
    end it bounds: the maximum when every value in `dataDomain` sits at or
    below the baseline, otherwise the minimum. A bound the user gave wins.
    Undefined when neither applies.
*/
export function userAxisDomain(
  viz: VizInstance,
  axis: string,
  dataDomain: DomainValue[] | undefined,
): DomainValue[] | undefined {
  const user = givenDomain(viz, axis);
  const domain = user ? user.slice() : undefined;
  if (baselineDomainAxis(viz) !== axis) return domain;
  const baseline = viz._userBaseline as number;
  const hi = dataDomain?.[1];
  const end = typeof hi === "number" && hi <= baseline ? 1 : 0;
  const out = domain ?? [];
  if (out[end] === undefined) out[end] = baseline;
  return out;
}
