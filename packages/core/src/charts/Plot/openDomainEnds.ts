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
import {roundedDomain} from "../../components/Axis/axisRounding.js";
import {isOneSided} from "./baselineDomain.js";
import type {PlotOpenEnd, TransformStage} from "../pipeline/stages.js";
import type {VizInstance} from "../viz/vizTypes.js";

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
  const reference = end ? [+open.auto[0], domain[1]] : [domain[0], +open.auto[1]];
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
  ((viz[`_${axis}Config`] as {rounding?: string} | undefined)?.rounding) ??
  (viz._plotAxisDefaults?.[axis]?.rounding as string | undefined) ??
  "outside";

/**
    `roundPlotOpenEnds` — runs after `extendPlotOppScales`. Rounds the open
    end of each x/y user domain that sets one end (see `computePlotScales`'s
    `plotOpenEnds`), so the axis is handed the domain as final (Plot sets the
    axis's `rounding` to "none" for a user domain).
*/
export const roundPlotOpenEnds: TransformStage = ({viz, plotScales, plotConfigScales, plotOpenEnds}) => {
  if (!plotScales || !plotConfigScales || !plotOpenEnds) return {};
  const scales = {...plotScales};
  for (const axis of ["x", "y"] as const) {
    const open = plotOpenEnds[axis];
    const scale = plotConfigScales[`${axis}ConfigScale`];
    const rounding = axisRounding(viz, axis);
    if (!open || !["linear", "log"].includes(scale) || rounding === "none") continue;
    const current = scales[axis];
    // The y scale runs high to low.
    const flip = (d: number[]) => (axis === "y" ? d.slice().reverse() : d);
    const domain = flip((current.domain() as number[]).map(Number));
    const rounded = roundOpenEnd(domain, open, rounding, scale);
    if (rounded) scales[axis] = current.copy().domain(flip(rounded));
  }
  return {plotScales: scales};
};
