/**
    What a selection holds: a predicate over rows, the way `hover`, `active`,
    and `highlight` are, so it lights marks through the same
    interaction-opacity pass and outlives the redraws that replace the rows
    it was made from.

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {MARK_TYPES} from "../viz/sceneRows.js";
import {sourceRow} from "./selectRegion.js";

/** A selection: whether a row (and its index) is selected. */
export type SelectPredicate = (d: DataPoint, i?: number) => boolean;

const signatures = new WeakMap<object, string>();

/**
    A row's content signature: its own fields that hold a string, number,
    boolean, or Date, sorted by name. Fields starting with an underscore
    (the chart's own bookkeeping) are left out. Two rows with the same values
    share a signature, so a selection still finds its rows once a redraw
    rebuilds them.
    @param row The row.
*/
export function rowKey(row: DataPoint): string {
  if (!row || typeof row !== "object") return String(row);
  const cached = signatures.get(row);
  if (cached !== undefined) return cached;
  const parts: string[] = [];
  for (const name of Object.keys(row).sort()) {
    if (name.startsWith("_")) continue;
    const value = (row as Record<string, unknown>)[name];
    const kind = typeof value;
    if (value instanceof Date) parts.push(`${name}:d${value.getTime()}`);
    else if (kind === "string" || kind === "number" || kind === "boolean")
      parts.push(`${name}:${kind[0]}${String(value)}`);
  }
  const key = parts.join("|");
  signatures.set(row, key);
  return key;
}

/**
    A predicate matching `rows`: the same objects, or rows with the same
    content (see `rowKey`).
    @param rows The rows to match.
*/
export function rowMatcher(rows: DataPoint[]): SelectPredicate {
  const own = new Set<unknown>(rows);
  const keys = new Set(rows.map(rowKey));
  return d => own.has(d) || keys.has(rowKey(d));
}

/** Calls `fn` for each data mark in `nodes`, chrome and `::hit` copies skipped. */
function forEachMark(nodes: SceneNode[], fn: (node: SceneNode) => void): void {
  const walk = (node: SceneNode): void => {
    const group = node.interactionGroup;
    if (group === "axis" || group === "timeline" || group === "trend") return;
    if (String(node.key).endsWith("::hit")) return;
    if (MARK_TYPES.has(node.type)) fn(node);
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(walk);
  };
  nodes.forEach(walk);
}

/** The index a predicate sees for a row: the node's, else the row's own `i`. */
function indexOf(row: DataPoint, fallback: number | undefined): number {
  if (typeof fallback === "number") return fallback;
  const i = (row as {i?: unknown}).i;
  return typeof i === "number" ? i : 0;
}

/**
    The rows a selection holds among a chart's marks, in drawing order:
    each mark's row, or for a Line or Area, each of its points' rows.
    @param nodes The chart's scene (`viz._chartScene`).
    @param predicate The selection.
*/
export function selectedRows(
  nodes: SceneNode[],
  predicate: SelectPredicate,
): DataPoint[] {
  const out: DataPoint[] = [];
  const seen = new Set<unknown>();
  const add = (row: DataPoint | undefined, i: number | undefined): void => {
    if (!row || seen.has(row)) return;
    seen.add(row);
    if (predicate(row, indexOf(row, i))) out.push(row);
  };
  forEachMark(nodes, node => {
    const points = node.interactionPoints;
    if (points && points.length)
      points.forEach(p => add(sourceRow(p.datum), p.index));
    else if (node.datum !== undefined) add(sourceRow(node.datum), node.index);
  });
  return out;
}

/**
    The rows of the Lines and Areas (marks drawn through several points)
    that hold any of `rows`, so a series stays lit while any of its points is
    selected.
    @param nodes The chart's scene (`viz._chartScene`).
    @param rows The selected rows.
*/
export function seriesRows(nodes: SceneNode[], rows: DataPoint[]): DataPoint[] {
  const match = rowMatcher(rows);
  const out: DataPoint[] = [];
  forEachMark(nodes, node => {
    const series = sourceRow(node.datum);
    const points = node.interactionPoints;
    if (!series || !points || !points.length) return;
    if (points.some(p => match(sourceRow(p.datum) as DataPoint)))
      out.push(series);
  });
  return out;
}

/**
    The rows a selection holds after a gesture: `hits` alone, `hits` added
    to `current`, or `current` with `hits` toggled (each hit removed when
    already selected, else added).
    @param current The rows selected before.
    @param hits The rows the gesture picked.
    @param mode How the gesture combines with the selection.
*/
export function combineRows(
  current: DataPoint[],
  hits: DataPoint[],
  mode: "replace" | "add" | "toggle",
): DataPoint[] {
  if (mode === "replace") return [...new Set(hits)];
  const inCurrent = rowMatcher(current);
  if (mode === "add")
    return [...current, ...new Set(hits.filter(d => !inCurrent(d)))];
  const inHits = rowMatcher(hits);
  const kept = current.filter(d => !inHits(d));
  return [...kept, ...new Set(hits.filter(d => !inCurrent(d)))];
}
