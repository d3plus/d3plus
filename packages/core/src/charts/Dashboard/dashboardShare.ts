/**
    Dashboard: shared axes (`layoutConfig.shareX` / `shareY`). Charts with
    axes whose columns overlap share one x domain, labeled only where no
    sharing chart sits below; charts whose rows overlap share one y domain,
    labeled only where no sharing chart sits to the left.

    @module
*/
import type {Axis} from "../../components/index.js";
import {listAxis, unionExtent} from "../Plot/plotFacet.js";
import type {DomainValue, PlotFacetScales} from "../Plot/facetScales.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {DashboardSlot} from "./dashboardGrid.js";

/** An axis a dashboard can share. */
export type ShareAxis = "x" | "y";

/** The two axes a dashboard can share. */
export const SHARE_AXES: ShareAxis[] = ["x", "y"];

/** A chart's own domain on one axis, as it last drew without a shared one. */
export interface AxisReading {
  /** `"list"` for a category axis, `"time"` for dates, else the axis's scale type. */
  kind: string;
  domain: DomainValue[];
  /** The chart's data when it was read, so a change in it is noticed. */
  data: unknown;
  /** Whether the domain is one the chart set itself (`xDomain` / `yDomain`). */
  own?: boolean;
}

/** What one chart takes from the charts it shares axes with. */
export interface ChartShare {
  /** The domain each shared axis draws with. */
  domains: Partial<Record<ShareAxis, DomainValue[]>>;
  /** The shared axes whose labels and title it leaves to another chart. */
  hidden: Partial<Record<ShareAxis, boolean>>;
}

/** Whether a chart set its own domain on `axis` (`xDomain` / `yDomain`). */
export function ownDomain(viz: Pick<VizInstance, "schema">, axis: ShareAxis) {
  const domain = viz.schema[`${axis}Domain`];
  return Array.isArray(domain) && domain.some(v => v !== undefined);
}

/**
    The domain a chart drew `axis` with at its natural scale (the zoom
    base, when it is zoomed), and its kind, or undefined for a chart that
    can't share it: one outside the Plot family, faceted, or not drawn yet.
*/
export function readAxis(
  viz: VizInstance,
  axis: ShareAxis,
): AxisReading | undefined {
  const base = viz._plotZoomBase?.scales?.[axis];
  const drawn = (base?.domain() ?? viz._plotAxisDomains?.[axis]) as
    DomainValue[] | undefined;
  const scaleAxis = viz[`_${axis}Axis`] as Axis | undefined;
  if (!drawn || !drawn.length || !scaleAxis) return undefined;
  if (viz._facetPanels?.length) return undefined;
  const kind = listAxis(viz, axis)
    ? "list"
    : drawn[0] instanceof Date
      ? "time"
      : `${scaleAxis.scale?.() ?? "linear"}`;
  const reading: AxisReading = {
    kind,
    domain: drawn.slice(),
    data: viz._userData,
  };
  if (ownDomain(viz, axis)) reading.own = true;
  return reading;
}

/**
    One domain covering `domains` of `kind`: every category in order of
    appearance, or the full extent, running the way the first domain runs
    (a y axis's runs from its top, the high end).
*/
export function mergeDomains(
  kind: string,
  domains: DomainValue[][],
): DomainValue[] | undefined {
  if (kind !== "list") {
    const extent = unionExtent(domains);
    const first = domains[0] ?? [];
    const falls = first.length > 1 && +first[0] > +first[first.length - 1];
    return extent && falls ? extent.reverse() : extent;
  }
  const seen = new Set<string>();
  const out: DomainValue[] = [];
  for (const domain of domains)
    for (const v of domain) {
      const key = v instanceof Date ? `${+v}` : `${v}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
  return out;
}

/** Whether two spans of tracks (`start`, `count`) overlap. */
function overlaps(a: number, an: number, b: number, bn: number): boolean {
  return a < b + bn && b < a + an;
}

/**
    Groups the charts in `members` whose spans along the other axis overlap,
    directly or through other charts (a chart spanning two columns joins
    both columns' charts).
*/
export function overlapGroups(
  slots: DashboardSlot[],
  members: number[],
  axis: ShareAxis,
): number[][] {
  const span = (i: number): [number, number] =>
    axis === "x"
      ? [slots[i].column, slots[i].columnSpan]
      : [slots[i].row, slots[i].rowSpan];
  const groups: number[][] = [];
  for (const i of members) {
    const joined = groups.filter(g =>
      g.some(j => overlaps(...span(i), ...span(j))),
    );
    const merged = [i, ...joined.flat()];
    for (const g of joined) groups.splice(groups.indexOf(g), 1);
    groups.push(merged.sort((a, b) => a - b));
  }
  return groups;
}

/**
    Whether chart `i` leaves a shared axis's labels to another member: on x,
    one starting at or below its bottom in an overlapping column; on y, one
    ending at or left of its left edge in an overlapping row.
*/
function labelsElsewhere(
  slots: DashboardSlot[],
  members: number[],
  i: number,
  axis: ShareAxis,
): boolean {
  const s = slots[i];
  return members.some(j => {
    if (j === i) return false;
    const o = slots[j];
    return axis === "x"
      ? o.row >= s.row + s.rowSpan &&
          overlaps(s.column, s.columnSpan, o.column, o.columnSpan)
      : o.column + o.columnSpan <= s.column &&
          overlaps(s.row, s.rowSpan, o.row, o.rowSpan);
  });
}

/**
    What each chart shares (see `ChartShare`): for each axis in `axes`,
    charts whose columns (x) or rows (y) overlap, and whose readings are of
    the same kind, share one domain: the merged domains the charts set
    themselves (`xDomain` / `yDomain`) when any do, else every chart's
    merged. A chart leaves the shared axis's labels to the members below
    (x) or to its left (y). A group whose charts read different kinds
    (categories beside numbers, dates beside numbers, log beside linear)
    doesn't share. A chart without a reading is left out.
*/
export function planShares(
  slots: DashboardSlot[],
  readings: Partial<Record<ShareAxis, AxisReading>>[],
  axes: Partial<Record<ShareAxis, boolean>>,
): (ChartShare | undefined)[] {
  const out: (ChartShare | undefined)[] = slots.map(() => undefined);
  for (const axis of SHARE_AXES) {
    if (!axes[axis]) continue;
    const read = slots.map((_, i) => i).filter(i => readings[i]?.[axis]);
    for (const members of overlapGroups(slots, read, axis)) {
      if (members.length < 2) continue;
      const of = (i: number) => readings[i][axis]!;
      const kinds = new Set(members.map(i => of(i).kind));
      if (kinds.size > 1) continue;
      const own = members.filter(i => of(i).own);
      const domain = mergeDomains(
        of(members[0]).kind,
        (own.length ? own : members).map(i => of(i).domain),
      );
      if (!domain) continue;
      for (const i of members) {
        const share = (out[i] ??= {domains: {}, hidden: {}});
        share.domains[axis] = domain;
        if (labelsElsewhere(slots, members, i, axis)) share.hidden[axis] = true;
      }
    }
  }
  return out;
}

/** Whether two shares draw the same. */
export function sameShare(
  a: ChartShare | undefined,
  b: ChartShare | undefined,
): boolean {
  if (!a || !b) return a === b;
  return SHARE_AXES.every(axis => {
    const x = a.domains[axis],
      y = b.domains[axis];
    const domains =
      x === y ||
      (!!x &&
        !!y &&
        x.length === y.length &&
        x.every((v, i) => +v === +y[i] || v === y[i]));
    return domains && !!a.hidden[axis] === !!b.hidden[axis];
  });
}

/** The Plot scales a share draws with: its domains, as both the data and the padded domains. */
export function shareScales(share: ChartShare): PlotFacetScales {
  const domains: Record<string, DomainValue[]> = {};
  const padded: Record<string, DomainValue[]> = {};
  for (const axis of SHARE_AXES) {
    const domain = share.domains[axis];
    if (!domain) continue;
    domains[axis] = domain;
    padded[axis] = domain;
  }
  return {domains, padded};
}

/** An axis config with its labels and title hidden, or `config` itself. */
export function hiddenAxisConfig(
  config: Record<string, unknown> | undefined,
  hide: boolean,
): Record<string, unknown> | undefined {
  return hide ? {...config, labels: [], title: false} : config;
}
