/**
    Dashboard: shared axes (`layoutConfig.shareX` / `shareY`). Charts with
    axes stacked in the same column share one x domain, labeled only on the
    lowest of them; charts side by side in the same row share one y domain,
    labeled only on the leftmost.

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
    The domain a chart drew `axis` with, and its kind, or undefined for a
    chart that can't share it: one outside the Plot family, faceted, with a
    domain of its own, or not drawn yet.
*/
export function readAxis(
  viz: VizInstance,
  axis: ShareAxis,
): AxisReading | undefined {
  const drawn = viz._plotAxisDomains?.[axis] as DomainValue[] | undefined;
  const scaleAxis = viz[`_${axis}Axis`] as Axis | undefined;
  if (!drawn || !drawn.length || !scaleAxis) return undefined;
  if (viz._facetPanels?.length || ownDomain(viz, axis)) return undefined;
  const kind = listAxis(viz, axis)
    ? "list"
    : drawn[0] instanceof Date
      ? "time"
      : `${scaleAxis.scale?.() ?? "linear"}`;
  return {kind, domain: drawn.slice(), data: viz._userData};
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

/**
    What each chart shares (see `ChartShare`): for each axis in `axes`,
    charts in the same column (x) or row (y), span included, whose readings
    are of the same kind share their merged domain, and all but the lowest
    (x) or leftmost (y) leave their labels to it. A group whose charts read
    different kinds (categories beside numbers, dates beside numbers, log
    beside linear) doesn't share. A chart without a reading is left out.
*/
export function planShares(
  slots: DashboardSlot[],
  readings: Partial<Record<ShareAxis, AxisReading>>[],
  axes: Partial<Record<ShareAxis, boolean>>,
): (ChartShare | undefined)[] {
  const out: (ChartShare | undefined)[] = slots.map(() => undefined);
  for (const axis of SHARE_AXES) {
    if (!axes[axis]) continue;
    const groups = new Map<string, number[]>();
    slots.forEach((s, i) => {
      if (!readings[i]?.[axis]) return;
      const key =
        axis === "x" ? `${s.column}/${s.columnSpan}` : `${s.row}/${s.rowSpan}`;
      groups.set(key, [...(groups.get(key) ?? []), i]);
    });
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      const kinds = new Set(members.map(i => readings[i][axis]!.kind));
      if (kinds.size > 1) continue;
      const kind = readings[members[0]][axis]!.kind;
      const domain = mergeDomains(
        kind,
        members.map(i => readings[i][axis]!.domain),
      );
      if (!domain) continue;
      // The lowest chart labels a shared x axis, the leftmost a shared y.
      const edge = (i: number): number =>
        axis === "x" ? slots[i].row + slots[i].rowSpan : -slots[i].column;
      const labeled = members.reduce((a, b) => (edge(b) > edge(a) ? b : a));
      for (const i of members) {
        const share = (out[i] ??= {domains: {}, hidden: {}});
        share.domains[axis] = domain;
        if (i !== labeled) share.hidden[axis] = true;
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
