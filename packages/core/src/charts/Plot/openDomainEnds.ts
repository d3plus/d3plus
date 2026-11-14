/**
    A one-sided user domain (`yDomain([n])`, `yDomain([undefined, n])`, a
    one-sided `yConfig.domain`, or a set `baseline`) pins only the end the
    user set. The data fills the other end, which is then rounded exactly
    where the axis would round it with no user domain, honoring the axis's
    `rounding` ("outside" unless the user's axis config, or the chart's own,
    says otherwise; with "none", the end stays at the data). A domain with both ends set isn't
    rounded. Time axes aren't rounded either way.

    @module
*/
import {
  roundedDomain,
  roundingScales,
} from "../../components/Axis/axisRounding.js";
import {isOneSided} from "./baselineDomain.js";
import type {PlotOpenEnd, TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {D3Scale} from "../../utils/index.js";

/** A domain value for any of the four axes. */
type DomainValue = number | string | Date;

/**
    The open end of an axis's user domain, when it leaves one: which end the
    user set, plus the domain the axis would have with no user domain (the
    data's extent, stretched to the chart's `baseline` on a value axis).
*/
export function openEnd(
  user: DomainValue[] | undefined,
  data: DomainValue[] | undefined,
  baseline: number | undefined,
): PlotOpenEnd | undefined {
  if (!isOneSided(user) || !data) return undefined;
  const set = (d: unknown) => d !== undefined && d !== null;
  const auto = data.slice();
  if (typeof baseline === "number") {
    if ((auto[0] as number) > baseline) auto[0] = baseline;
    else if ((auto[1] as number) < baseline) auto[1] = baseline;
  }
  return {pinned: [set(user[0]), set(user[1])], auto};
}

/** Whether a user domain end is set. */
const isSet = (d: unknown): boolean => d !== undefined && d !== null;

/**
    A low-to-high user domain with its open ends filled from the data's
    extent. When the user set one end and every value sits beyond it (a
    minimum above the data, or a maximum below it), the filled end would
    cross the set one and flip the axis; it goes on the far side instead, one
    data span away (a decade on a log axis), so the axis still starts at the
    user's value.
*/
export function fillOpenEnds(
  user: DomainValue[],
  data: DomainValue[],
  log = false,
): DomainValue[] {
  const out = user.slice();
  const pinned = [isSet(user[0]), isSet(user[1])];
  if (!pinned[0]) out[0] = data[0];
  if (!pinned[1]) out[1] = data[1];
  if (pinned[0] === pinned[1] || +out[0] <= +out[1]) return out;
  const end = pinned[0] ? 1 : 0;
  const bound = out[1 - end];
  const span = Math.abs(+data[1] - +data[0]) || Math.abs(+bound) || 1;
  const value = log
    ? end
      ? +bound * 10
      : +bound / 10
    : +bound + (end ? span : -span);
  out[end] = bound instanceof Date ? new Date(value) : value;
  return out;
}

/**
    Which ends (low, high) of an axis's domain the user set: the pinned end
    of a one-sided domain (`open`), else the set ends of its
    `xDomain`/`yDomain`/`x2Domain`/`y2Domain`.
*/
export function userPinnedEnds(
  viz: VizInstance,
  axis: "x" | "y" | "x2" | "y2",
  open: PlotOpenEnd | undefined,
): [boolean, boolean] {
  if (open) return open.pinned;
  const user = viz.schema[`${axis}Domain`] as unknown;
  if (!Array.isArray(user) || user.length > 2) return [false, false];
  return [isSet(user[0]), isSet(user[1])];
}

/**
    `scale` with the user's set ends put back where `before` had them: shape
    padding (see `extendPlotOppScales`) widens an axis to fit its marks, but
    an end the user set stays exactly where they set it, and marks past it
    are clipped. `flip` is true for a y scale, whose domain runs high to low.
    Returns `scale` itself when nothing moved.
*/
export function keepPinnedEnds(
  scale: D3Scale,
  before: DomainValue[],
  pinned: [boolean, boolean],
  flip: boolean,
): D3Scale {
  if (!scale.invert || (!pinned[0] && !pinned[1])) return scale;
  const order = <T>(d: T[]) => (flip ? d.slice().reverse() : d.slice());
  const was = order(before);
  const domain = order(scale.domain() as DomainValue[]);
  let moved = false;
  pinned.forEach((set, i) => {
    if (set && +domain[i] !== +was[i]) {
      domain[i] = was[i];
      moved = true;
    }
  });
  return moved ? scale.copy().domain(order(domain)) : scale;
}

/**
    The low-to-high domain with its open end rounded where the axis would
    round it with no user domain: `auto` with `domain`'s open end (which shape
    padding may have pushed past the data) rounded, keeping `domain`'s pinned
    end exactly. Undefined when nothing changes: no rounding, or a rounded
    end that would cross the pinned one.
*/
export function roundOpenEnd(
  domain: number[],
  open: PlotOpenEnd,
  rounding: string,
  scale: string,
): number[] | undefined {
  const end = open.pinned[0] ? 1 : 0;
  const reference = end
    ? [+open.auto[0], domain[1]]
    : [domain[0], +open.auto[1]];
  const rounded = roundedDomain(reference, rounding, scale);
  if (!rounded) return undefined;
  const value = rounded[end];
  if (end ? value <= domain[0] : value >= domain[1]) return undefined;
  const out = domain.slice();
  out[end] = value;
  return out;
}

/**
    The rounding the axis would apply with no user domain: the user's
    axis-config `rounding`, else the chart's own (`_plotAxisDefaults`, e.g.
    Marimekko's "none" on its 100% axis), else "outside".
*/
const axisRounding = (viz: VizInstance, axis: "x" | "y"): string =>
  (viz[`_${axis}Config`] as {rounding?: string} | undefined)?.rounding ??
  (viz._plotAxisDefaults?.[axis]?.rounding as string | undefined) ??
  "outside";

/**
    `roundPlotOpenEnds` — runs after `extendPlotOppScales`. Rounds the open
    end of each x/y user domain that sets one end (see `computePlotScales`'s
    `plotOpenEnds`), so the axis is handed the domain as final (Plot sets the
    axis's `rounding` to "none" for a user domain).
*/
export const roundPlotOpenEnds: TransformStage = ({
  viz,
  plotScales,
  plotConfigScales,
  plotOpenEnds,
}) => {
  if (!plotScales || !plotConfigScales || !plotOpenEnds) return {};
  const scales = {...plotScales};
  for (const axis of ["x", "y"] as const) {
    const open = plotOpenEnds[axis];
    const scale = plotConfigScales[`${axis}ConfigScale`];
    const rounding = axisRounding(viz, axis);
    if (!open || !roundingScales.includes(scale) || rounding === "none")
      continue;
    const current = scales[axis];
    // The y scale runs high to low.
    const flip = (d: number[]) => (axis === "y" ? d.slice().reverse() : d);
    const domain = flip((current.domain() as number[]).map(Number));
    const rounded = roundOpenEnd(domain, open, rounding, scale);
    if (rounded) scales[axis] = current.copy().domain(flip(rounded));
  }
  return {plotScales: scales};
};
