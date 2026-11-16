/**
    Rows a chart's hover adds to its tooltip's `tbody` around the rows the
    tooltip already lists (a colorScale value, a point's confidence bounds,
    a threshold bucket's members). The tooltip's `tbody` is wrapped once,
    holding each kind of row under its own key, and each kind resolves
    against the row the tooltip renders, so a hover never stacks rows onto
    a `tbody` an earlier hover left, nor shows another mark's rows.
*/
import type {DataPoint} from "@d3plus/data";

/** A tooltip whose `tbody` can be read and replaced. */
export interface TbodyHost {
  tbody(): unknown;
  tbody(_: unknown): unknown;
}

/** One kind of row: the rows it adds for the row the tooltip renders. */
export type TooltipRowSource = (d: DataPoint, i: number) => unknown[];

/**
    Where each kind of row sits: a negative rank leads the tooltip's own
    rows, the rest follow them in rank order.
*/
export const TOOLTIP_ROW_RANK = {
  colorScale: -1,
  confidence: 1,
  outlier: 2,
  threshold: 3,
} as const;

interface Entry {
  rank: number;
  rows: TooltipRowSource;
}

interface Rows {
  base: unknown;
  entries: Map<string, Entry>;
}

/** What each wrapped `tbody` holds. */
const wrapped = new WeakMap<object, Rows>();

/** The rows a `tbody` (an array, or a function of the row) resolves to for `d`. */
function resolve(tbody: unknown, d: DataPoint, i: number): unknown[] {
  const own =
    typeof tbody === "function"
      ? (tbody as (d: DataPoint, i: number) => unknown)(d, i)
      : tbody;
  return Array.isArray(own) ? own : [];
}

/**
    A `tbody` without the rows `addTooltipRows` adds: the one the tooltip
    was given.
    @param tbody A tooltip's `tbody`.
*/
export function ownTbody(tbody: unknown): unknown {
  const state = typeof tbody === "function" ? wrapped.get(tbody) : undefined;
  return state ? state.base : tbody;
}

/**
    Whether `addTooltipRows` lists `key`'s rows in a tooltip.
    @param tooltip The tooltip.
    @param key The kind of row.
*/
export function hasTooltipRows(tooltip: TbodyHost, key: string): boolean {
  const tbody = tooltip.tbody();
  return typeof tbody === "function" && !!wrapped.get(tbody)?.entries.has(key);
}

/**
    Lists `rows` in `tooltip` under `key`, replacing what `key` listed
    before. Kinds with a negative `rank` lead the tooltip's own rows and the
    rest follow them, lowest rank first. The first call wraps the tooltip's
    `tbody`; later ones, from this or any later hover, reuse that wrapper
    until the tooltip is given a new `tbody`.
    @param tooltip The tooltip.
    @param key The kind of row.
    @param rows The rows it adds for each row the tooltip renders.
    @param rank Where they sit.
*/
export function addTooltipRows<T extends TbodyHost>(
  tooltip: T,
  key: string,
  rows: TooltipRowSource,
  rank: number,
): T {
  const tbody = tooltip.tbody();
  let state = typeof tbody === "function" ? wrapped.get(tbody) : undefined;
  if (!state) {
    const next: Rows = {base: tbody, entries: new Map()};
    const all = (d: DataPoint, i: number): unknown[] => {
      const entries = [...next.entries.values()].sort(
        (a, b) => a.rank - b.rank,
      );
      const of = (list: Entry[]) => list.flatMap(e => e.rows(d, i));
      return [
        ...of(entries.filter(e => e.rank < 0)),
        ...resolve(next.base, d, i),
        ...of(entries.filter(e => e.rank >= 0)),
      ];
    };
    wrapped.set(all, next);
    tooltip.tbody(all);
    state = next;
  }
  state.entries.set(key, {rank, rows});
  return tooltip;
}
