/**
    `computePlotScales` — fourth stage of Plot's pipeline: turns the initial
    domains into the four configured d3 scales, with the user's domains, log
    zero handling, and the `baseline` applied.
*/
import {date} from "@d3plus/dom";
import * as scales from "d3-scale";
import {deviation, max, mean, min, range} from "d3-array";

import {userDomainBreaksBaseline} from "./baselineBreak.js";
import {configOpenDomain, userAxisDomain} from "./baselineDomain.js";
import {openEnd} from "./openDomainEnds.js";
import {isSpanAxis} from "./discreteSpan.js";
import {widenReferenceDomains} from "./referenceDomains.js";
import type {TransformStage} from "../pipeline/stages.js";
import type {D3Scale} from "../../utils/index.js";

/** d3-scale's scale constructors, indexed by the dynamic `scale<Type>` name. */
export const scaleConstructors = scales as unknown as Record<
  string,
  () => D3Scale
>;

/** A domain value for any of the four axes. */
export type DomainValue = number | string | Date;

/** The viz a Plot pipeline stage reads. */
type PlotViz = Parameters<TransformStage>[0]["viz"];

/**
    A copy of a user `<axis>Domain`. On a time axis its set ends are parsed
    into Dates the way the axis's data is (Dates, timestamps, years or date
    strings), so they compare with the data; an undefined end stays undefined
    for `computePlotScales` to fill from the data.
*/
function userDomain(
  domain: DomainValue[],
  time: boolean | undefined,
): DomainValue[] {
  return time
    ? domain.map(d =>
        d === undefined ? d : (date(d as string | number) as Date),
      )
    : domain.slice();
}

/**
    Settles the opposite (value) axes' domains: an axis `domain` from
    `xConfig`/`yConfig` wins outright; otherwise the domain stretches to reach
    the `baseline`, unless a user domain deliberately stops short of it on a
    breaking axis (see `baselineBreak`). Mutates `domains`.
*/
function applyOppDomains(
  viz: PlotViz,
  domains: Record<string, DomainValue[]>,
  opps: string[],
  configScales: {x: string; y: string},
  user: Record<string, DomainValue[] | undefined>,
): void {
  opps.forEach(o => {
    if (viz[`_${o}Config`].domain && !configOpenDomain(viz, o)) {
      // `.slice()` first so we never mutate the user's config array in
      // place — on the next render the (already-reversed) array would
      // reverse back, alternating chart correctness across renders.
      const d = (viz[`_${o}Config`].domain as DomainValue[]).slice();
      if (viz.schema.discrete === "x") d.reverse();
      domains[o] = d;
    } else if (
      o &&
      viz.schema.baseline !== void 0 &&
      !userDomainBreaksBaseline(
        viz,
        o,
        o.startsWith("x") ? configScales.x : configScales.y,
        user[o],
      )
    ) {
      const b = viz.schema.baseline;
      if (domains[o] && domains[o][0] > b) domains[o][0] = b;
      else if (domains[o] && domains[o][1] < b) domains[o][1] = b;
    }
  });
}

/**
    An axis and its secondary axis's scale type and domain: the user's domain
    (with any open end filled from the data's) when set, else the data's.
*/
function domainScaleSetup(
  viz: PlotViz,
  axis: string,
  user: Record<string, DomainValue[] | undefined>,
  domains: Record<string, DomainValue[]>,
) {
  const scale = viz[`_${axis}Time`]
    ? "Time"
    : (!isSpanAxis(viz, axis) &&
          (viz.schema.discrete === axis || viz.schema[`${axis}Sort`])) ||
        viz._swarm?.cross === axis
      ? "Point"
      : "Linear";
  const domain = user[axis]
      ? userDomain(user[axis]!, viz[`_${axis}Time`])
      : domains[axis],
    domain2 = viz.schema[`${axis}2Domain`]
      ? userDomain(viz.schema[`${axis}2Domain`], viz[`_${axis}2Time`])
      : domains[`${axis}2`];
  if (scale !== "Point") {
    if (domain && domain[0] === void 0) domain[0] = domains[axis][0];
    if (domain && domain[1] === void 0) domain[1] = domains[axis][1];
    if (domain2 && domain2[0] === void 0) domain2[0] = domains[`${axis}2`][0];
    if (domain2 && domain2[1] === void 0) domain2[1] = domains[`${axis}2`][1];
  }
  return [domain, scale, domain2, scale] as const;
}

/**
    An axis config's `scale`, with `"auto"` resolved to "log" when the
    values' spread is over three times their mean (else "linear").
*/
function autoScale(
  viz: PlotViz,
  axisData: Record<string, unknown>[],
  axis: string,
  fallback: string,
): string {
  const userScale = viz[`_${axis}Config`].scale;
  if (userScale === "auto") {
    if (viz.schema.discrete === axis) return fallback;
    const values = axisData.map(
      (d: Record<string, unknown>) => d[axis],
    ) as number[];
    return deviation(values)! / mean(values)! > 3 ? "log" : "linear";
  }
  return userScale || fallback;
}

/** An axis's plottable values (those not `NaN`, `undefined` or `false`). */
const definedValues = (rows: Record<string, unknown>[], axis: string) =>
  rows
    .map((d: Record<string, unknown>) => d[axis])
    .filter(
      (d: unknown) => ![NaN, undefined, false].includes(d as never),
    ) as number[];

/**
    Moves a log axis's domain off `0`: to the data's max when the domain runs
    negative, else to the data's min. Mutates `domains`.
*/
function avoidLogZero(
  viz: PlotViz,
  domains: Record<string, DomainValue[]>,
  data: Record<string, unknown>[],
  axisData: Record<string, unknown>[],
): void {
  Object.keys(domains).forEach(axis => {
    if (viz[`_${axis}ConfigScale`] === "log" && domains[axis].includes(0)) {
      if ((min(domains[axis] as number[]) as unknown as number) < 0)
        domains[axis][1] = max(definedValues(data, axis)) as number;
      else domains[axis][0] = min(definedValues(axisData, axis)) as number;
    }
  });
}

/**
    `computePlotScales` — fourth stage of Plot's pipeline. Takes the per-axis
    values + the chart's raw `domains` object (computed by the inline
    stacking/non-stacking branch) and produces the four configured d3 scale
    instances (`x`/`x2`/`y`/`y2`), the resolved scale-type strings
    (`xConfigScale` etc., returned in `plotConfigScales`), and the final
    `domains` after log/baseline adjustments.

    The "initial domains" computation (stacked vs non-stacked branch that
    fills `domains.x`, `domains.y`, etc. from data) is inline in
    `Plot._draw` — extracting that requires untangling array sorts that
    mutate `axisData` in place, which is the natural next step.
*/
export const computePlotScales: TransformStage = ({
  viz,
  plotFormattedData,
  plotAxisData,
  plotInitialDomains,
}) => {
  const data = plotFormattedData || [];
  const axisData = plotAxisData || [];
  let domains = plotInitialDomains as Record<string, DomainValue[]>;
  const width = viz.schema.width - viz._margin.left - viz._margin.right;
  const height = viz.schema.height - viz._margin.top - viz._margin.bottom;
  const opp = viz.schema.discrete
    ? viz.schema.discrete === "x"
      ? "y"
      : "x"
    : undefined;
  const opp2 = viz.schema.discrete
    ? viz.schema.discrete === "x"
      ? "y2"
      : "x2"
    : undefined;
  const opps = [opp, opp2].filter(d => d) as string[];
  // The user's value domains, with a set `baseline` filling the end it bounds.
  const user: Record<string, DomainValue[] | undefined> = {
    x: userAxisDomain(viz, "x", domains.x),
    y: userAxisDomain(viz, "y", domains.y),
  };
  // A user domain that leaves an end open, and the domain the axis would have without it.
  const openEnds = {
    x: openEnd(
      user.x,
      domains.x,
      opps.includes("x") ? viz.schema.baseline : undefined,
    ),
    y: openEnd(
      user.y,
      domains.y,
      opps.includes("y") ? viz.schema.baseline : undefined,
    ),
  };

  const [xAutoDomain, xScale, x2AutoDomain, x2Scale] = domainScaleSetup(
    viz,
    "x",
    user,
    domains,
  );
  const [yAutoDomain, yScale, y2AutoDomain, y2Scale] = domainScaleSetup(
    viz,
    "y",
    user,
    domains,
  );

  const yConfigScale = autoScale(viz, axisData, "y", yScale).toLowerCase();
  const y2ConfigScale = autoScale(viz, axisData, "y2", y2Scale).toLowerCase();
  const xConfigScale = autoScale(viz, axisData, "x", xScale).toLowerCase();
  const x2ConfigScale = autoScale(viz, axisData, "x2", x2Scale).toLowerCase();

  const widened = widenReferenceDomains(
    viz,
    {x: xAutoDomain, y: yAutoDomain, x2: x2AutoDomain, y2: y2AutoDomain},
    {
      x: {type: xScale, config: xConfigScale},
      y: {type: yScale, config: yConfigScale},
      x2: {type: x2Scale, config: x2ConfigScale},
      y2: {type: y2Scale, config: y2ConfigScale},
    },
    user,
  );

  // `.slice()` the fallback so domains.x2 isn't ALIASED to domains.x
  // (and same for y2 ↔ y). Without the slice, later in this function
  // the baseline-extension loop does `domains[o][0] = b` — when `o`
  // is 'y2' aliased to y, that mutation hits domains.y too, silently
  // clobbering the y-axis bottom. Sibling of the d.reverse() fix.
  domains = {
    x: widened.x!,
    x2: widened.x2 || widened.x!.slice(),
    y: widened.y!,
    y2: widened.y2 || widened.y!.slice(),
  };
  avoidLogZero(viz, domains, data, axisData);

  applyOppDomains(viz, domains, opps, {x: xConfigScale, y: yConfigScale}, user);

  const x = scaleConstructors[`scale${xScale}`]()
    .domain(domains.x)
    .range(range(0, width + 1, width / (domains.x.length - 1)));
  const x2 = scaleConstructors[`scale${x2Scale}`]()
    .domain(domains.x2)
    .range(range(0, width + 1, width / (domains.x2.length - 1)));
  // `.slice().reverse()` so the domain object isn't mutated under us if
  // it came from user config (covered by the slice above) OR from
  // domains.y being aliased into the user config via the slice above.
  const y = scaleConstructors[`scale${yScale}`]()
    .domain(domains.y.slice().reverse())
    .range(range(0, height + 1, height / (domains.y.length - 1)));
  const y2 = scaleConstructors[`scale${y2Scale}`]()
    .domain(domains.y2.slice().reverse())
    .range(range(0, height + 1, height / (domains.y2.length - 1)));

  return {
    plotDomains: domains,
    plotScales: {x, y, x2, y2, xScale, yScale, x2Scale, y2Scale},
    plotConfigScales: {
      xConfigScale,
      yConfigScale,
      x2ConfigScale,
      y2ConfigScale,
    },
    plotOpps: {opp, opp2, opps},
    plotOpenEnds: openEnds,
  };
};
