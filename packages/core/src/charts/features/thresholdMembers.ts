/**
    The items a `threshold` bucket holds, listed in its tooltips. The bucket
    row carries them under `MEMBERS_KEY`, largest first; a tooltip shows up
    to `MEMBER_LIMIT` of them, then how many more it holds.
*/
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";

import {INTERNAL_KEY_PREFIX} from "./shareKey.js";
import type {VizInstance} from "../viz/vizTypes.js";

/** The row key a threshold bucket lists its members under. */
export const MEMBERS_KEY = `${INTERNAL_KEY_PREFIX}Members`;

/** How many members a tooltip lists before summing up the rest as "+N more". */
export const MEMBER_LIMIT = 10;

/** One item in a threshold bucket: its label and its value. */
export interface ThresholdMember {
  label: string;
  value: number;
}

type Accessor<T> = (d: DataPoint, i: number) => T;

/**
    The members `rows` make up: one per `key`, labelled by its first row and
    valued by the sum of its rows' `value`, largest first.
*/
export function thresholdMemberList(
  rows: DataPoint[],
  key: Accessor<unknown>,
  label: Accessor<unknown>,
  value: Accessor<unknown>,
): ThresholdMember[] {
  const members = new Map<string, ThresholdMember>();
  rows.forEach((d, i) => {
    const k = `${key(d, i)}`;
    const v = +(value(d, i) as number) || 0;
    const member = members.get(k);
    if (member) member.value += v;
    else members.set(k, {label: `${label(d, i)}`, value: v});
  });
  return Array.from(members.values()).sort((a, b) => b.value - a.value);
}

/** The members a bucket row (or a wrapper around one) lists, or none. */
export function thresholdMembers(d: unknown): ThresholdMember[] {
  let row = d as (DataPoint & {__d3plus__?: boolean; data?: unknown}) | null;
  while (row && row.__d3plus__ && row.data) row = row.data as typeof row;
  const members = row ? row[MEMBERS_KEY] : undefined;
  if (!members) return [];
  // A merge of one bucket row unwraps a one-item list.
  return (Array.isArray(members) ? members : [members]) as ThresholdMember[];
}

/** A member's name, indented under the bucket it belongs to. */
export const memberName = (label: string): string =>
  `<span class="d3plus-tooltip-member" style="padding-left: 12px">${label}</span>`;

/**
    Tooltip rows for a bucket's members: `[name, value]` for up to `limit`
    of them, largest first, then a "+N more" row for the rest. Empty for a
    row that isn't a bucket.
*/
export function thresholdMemberRows(
  viz: VizInstance,
  d: unknown,
  limit: number = MEMBER_LIMIT,
): string[][] {
  const members = thresholdMembers(d);
  if (!members.length) return [];
  const format =
    viz._thresholdMemberFormat ??
    ((v: number) => formatAbbreviate(v, viz.schema.locale));
  const rows = members
    .slice(0, limit)
    .map(m => [memberName(m.label), format(m.value)]);
  const rest = members.length - limit;
  if (rest > 0)
    rows.push([
      memberName(
        `+${formatAbbreviate(rest, viz.schema.locale)} ${viz.schema.translate("more")}`,
      ),
      "",
    ]);
  return rows;
}

/** A tooltip whose `tbody` can be read and replaced. */
interface TbodyHost {
  tbody(): unknown;
  tbody(_: unknown): unknown;
}

/**
    Appends a bucket's member rows to `tooltip`'s `tbody`, after the rows it
    already has. Does nothing for a row that isn't a bucket.
*/
export function appendThresholdMembers<T extends TbodyHost>(
  tooltip: T,
  viz: VizInstance,
  d: unknown,
): T {
  const rows = thresholdMemberRows(viz, d);
  if (!rows.length) return tooltip;
  const base = tooltip.tbody();
  tooltip.tbody((dd: DataPoint, ii: number) => {
    const own =
      typeof base === "function"
        ? (base as (d: DataPoint, i: number) => unknown)(dd, ii)
        : base;
    return [...(Array.isArray(own) ? own : []), ...rows];
  });
  return tooltip;
}
