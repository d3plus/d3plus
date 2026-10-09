/**
    Linked charts: every chart sharing a `link` group mirrors the others'
    hover, active, highlight, and legend hide/solo state.

    Charts are matched by data value, not by predicate: a predicate closes over
    its own chart's ids and aggregated rows, so it means nothing to another
    chart. The source chart evaluates its predicate over its painted marks and
    collects each match's `by` value; every other chart in the group then
    receives a predicate matching its own rows that carry one of those values.
    `by` is per chart (default: the chart's own id), so two charts can link
    on differently-named fields, and a coarse chart (regions) can drive a fine
    one (countries) when the fine rows carry the coarse field.

    @module
*/
import {scaleOrdinal} from "d3-scale";

import type {ColorDefaults} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";

import {accessor} from "../../utils/index.js";
import {forEachSceneRow} from "./sceneRows.js";
import type {VizInstance} from "./vizTypes.js";

type Predicate = (d: DataPoint, i: number) => boolean;

/** The interaction states a link group mirrors through a predicate. */
export type LinkKind = "hover" | "active" | "highlight";

/** The object form of the `link` config: a group name plus the key and interactions to mirror. */
export interface LinkConfig {
  /** Charts that share a group name are linked. */
  group: string;
  /** The value two charts' rows match on. A string is a data key. Defaults to the chart's own id. */
  by?: string | ((d: DataPoint, i: number) => unknown);
  /** Mirror hover. Defaults to `true`. */
  hover?: boolean;
  /** Mirror `active`. Defaults to `true`. */
  active?: boolean;
  /** Mirror `highlight` (including the search box). Defaults to `true`. */
  highlight?: boolean;
  /** Mirror legend hide/solo clicks. Defaults to `true`. */
  legend?: boolean;
  /** Share categorical color assignments, so a value gets the same color in every linked chart. Defaults to `true`; a chart that sets its own `colorDefaults.scale` keeps it. */
  color?: boolean;
}

/** `link` as a group name, the full object form, or `false` for unlinked. */
export type LinkOption = string | false | LinkConfig;

/** A chart's `link` config with defaults filled in and `by` resolved to a function. */
export interface ResolvedLink {
  group: string;
  by: (d: DataPoint, i: number) => unknown;
  hover: boolean;
  active: boolean;
  highlight: boolean;
  legend: boolean;
  color: boolean;
}

const groups = new Map<string, Set<VizInstance>>();
const groupColorScales = new Map<string, ColorDefaults["scale"]>();
const dispatching = new Set<string>();
const linkAsPredicates = new WeakMap<VizInstance, Predicate>();

/** The parts of a chart `resolveLink` and `linkedColorDefaults` read. */
type LinkTarget = Pick<VizInstance, "schema"> &
  Partial<Pick<VizInstance, "_id" | "_linkGroup" | "_autoColorScale">>;

/** Normalizes a chart's `link` config, or returns null when it isn't linked. */
export function resolveLink(viz: LinkTarget): ResolvedLink | null {
  const raw = viz.schema.link as LinkOption | undefined;
  if (!raw) return null;
  const cfg: LinkConfig = typeof raw === "string" ? {group: raw} : raw;
  if (!cfg.group) return null;
  const by =
    typeof cfg.by === "function"
      ? cfg.by
      : typeof cfg.by === "string"
        ? (accessor(cfg.by) as (d: DataPoint, i: number) => unknown)
        : (d: DataPoint, i: number) => viz._id?.(d, i);
  return {
    group: cfg.group,
    by,
    hover: cfg.hover !== false,
    active: cfg.active !== false,
    highlight: cfg.highlight !== false,
    legend: cfg.legend !== false,
    color: cfg.color !== false,
  };
}

/** Adds the chart to its `link` group, leaving any group it was in before. */
export function registerLink(viz: VizInstance): void {
  unregisterLink(viz);
  const link = resolveLink(viz);
  if (!link) return;
  let members = groups.get(link.group);
  if (!members) groups.set(link.group, (members = new Set()));
  members.add(viz);
  viz._linkGroup = link.group;
}

/** Removes the chart from its `link` group, if any. */
export function unregisterLink(viz: VizInstance): void {
  const group = viz._linkGroup;
  if (group === undefined) return;
  const members = groups.get(group);
  if (members) {
    members.delete(viz);
    if (!members.size) {
      groups.delete(group);
      groupColorScales.delete(group);
    }
  }
  viz._linkGroup = undefined;
}

/** The charts currently registered under a group name. */
export function linkMembers(group: string): VizInstance[] {
  return Array.from(groups.get(group) ?? []);
}

/**
    The color defaults `viz` assigns categorical colors from. A linked chart
    still on its own default scale (`viz._autoColorScale`) shares one scale
    with the rest of its group, so each value takes the same color in every
    chart however the charts order their data; the first chart to join seeds
    the group's palette. A chart given its own `colorDefaults.scale`, or linked
    with `color: false`, keeps its own.
*/
export function linkedColorDefaults(viz: LinkTarget): ColorDefaults {
  const defaults = viz.schema.colorDefaults as ColorDefaults;
  const group = viz._linkGroup;
  if (group === undefined || defaults.scale !== viz._autoColorScale) return defaults;
  if (!resolveLink(viz)?.color) return defaults;
  let scale = groupColorScales.get(group);
  if (!scale) {
    scale = scaleOrdinal<string>().range(defaults.scale.range()) as ColorDefaults["scale"];
    groupColorScales.set(group, scale);
  }
  return {...defaults, scale};
}

/**
    Flattens a `by` value into comparable string keys: arrays (from
    aggregated rows whose members disagree) contribute every entry, Dates
    compare by time, and null/undefined contribute nothing.
*/
export function linkKeys(value: unknown): string[] {
  const values = Array.isArray(value) ? value : [value];
  const keys: string[] = [];
  for (const v of values) {
    if (v === null || v === undefined) continue;
    keys.push(v instanceof Date ? `${+v}` : `${v}`);
  }
  return keys;
}

/**
    The `by` keys of every row in `viz` that `predicate` matches. Evaluates
    over the painted marks (`_chartScene`), which are the rows the predicate
    was written against; before a first paint it falls back to the filtered
    data.
*/
export function linkValues(
  viz: VizInstance,
  by: (d: DataPoint, i: number) => unknown,
  predicate: Predicate,
): Set<string> {
  const values = new Set<string>();
  const visit = (row: DataPoint, i: number): void => {
    if (predicate(row, i)) for (const k of linkKeys(by(row, i))) values.add(k);
  };
  const scene = viz._chartScene;
  if (scene && scene.length) forEachSceneRow(scene, visit);
  else (viz._filteredData ?? []).forEach(visit);
  return values;
}

/**
    A predicate matching the rows whose `by` keys include one of `values`. An
    empty set matches nothing, so a chart without the linked value dims
    entirely.
*/
export function linkPredicate(link: ResolvedLink, values: Set<string>): Predicate {
  return (d: DataPoint, i: number) => linkKeys(link.by(d, i)).some(k => values.has(k));
}

/**
    Overrides which rows the next broadcast from `viz` treats as matched,
    for an interaction whose own predicate also matches marks it doesn't
    mean to emphasize (Plot's stacked column hover keeps non-bar marks
    bright). Consumed by the next `broadcastLink` call.
*/
export function linkAs(viz: VizInstance, predicate: Predicate): void {
  linkAsPredicates.set(viz, predicate);
}

/** Runs `fn` for each other linked member of `viz`'s group, with echoes suppressed. */
function dispatch(
  viz: VizInstance,
  link: ResolvedLink,
  fn: (target: VizInstance, targetLink: ResolvedLink) => void,
): void {
  if (dispatching.has(link.group)) return;
  const members = groups.get(link.group);
  if (!members || members.size < 2) return;
  dispatching.add(link.group);
  try {
    for (const target of members) {
      if (target === viz) continue;
      const targetLink = resolveLink(target);
      if (targetLink) fn(target, targetLink);
    }
  }
  finally {
    dispatching.delete(link.group);
  }
}

/**
    Mirrors `viz`'s new hover/active/highlight state onto the rest of its link
    group. A predicate becomes a match on its rows' `by` values; `false`
    clears the same state everywhere.
*/
export function broadcastLink(viz: VizInstance, kind: LinkKind, predicate: unknown): void {
  const override = linkAsPredicates.get(viz);
  linkAsPredicates.delete(viz);
  if (predicate === undefined) return;
  const link = resolveLink(viz);
  if (!link || !link[kind]) return;
  const source = typeof predicate === "function" ? override ?? (predicate as Predicate) : null;
  let values: Set<string> | null = null;
  dispatch(viz, link, (target, targetLink) => {
    if (!targetLink[kind]) return;
    const setter = target[kind] as ((_: Predicate | false) => unknown) | undefined;
    if (!setter) return;
    if (source && !values) values = linkValues(viz, link.by, source);
    setter.call(target, values ? linkPredicate(targetLink, values) : false);
  });
}

/** The raw legend ids of a legend row, as `_hidden`/`_solo` store them. */
function legendIds(viz: VizInstance, d: DataPoint, i: number): (string | number)[] {
  const id = viz._id(d, i) as string | number | (string | number)[];
  return Array.isArray(id) ? id : [id];
}

/** The `by` keys of the legend rows whose ids appear in `ids`. */
function legendKeys(viz: VizInstance, link: ResolvedLink, ids: (string | number)[]): Set<string> {
  const keys = new Set<string>();
  if (!ids.length) return keys;
  (viz._legendData ?? []).forEach((d, i) => {
    if (legendIds(viz, d, i).some(id => ids.includes(id)))
      for (const k of linkKeys(link.by(d, i))) keys.add(k);
  });
  return keys;
}

/**
    Mirrors `viz`'s legend hide/solo state onto the rest of its link group,
    then re-renders each chart that changed. Matching goes through `by`, so
    charts with different legend groupings still line up: a target legend item
    is solo'd when any of its keys is solo'd in the source, and hidden when all
    of its keys are hidden there. A target that hasn't drawn its legend yet is
    skipped.
*/
export function broadcastLegend(viz: VizInstance): void {
  const link = resolveLink(viz);
  if (!link || !link.legend) return;
  const hiddenKeys = legendKeys(viz, link, viz._hidden);
  const soloKeys = legendKeys(viz, link, viz._solo);
  dispatch(viz, link, (target, targetLink) => {
    if (!targetLink.legend || !target._legendData?.length) return;
    const hidden: (string | number)[] = [];
    const solo: (string | number)[] = [];
    target._legendData.forEach((d, i) => {
      const keys = linkKeys(targetLink.by(d, i));
      const ids = legendIds(target, d, i);
      const add = (list: (string | number)[]): void => {
        for (const id of ids) if (!list.includes(id)) list.push(id);
      };
      if (soloKeys.size && keys.some(k => soloKeys.has(k))) add(solo);
      else if (hiddenKeys.size && keys.length && keys.every(k => hiddenKeys.has(k))) add(hidden);
    });
    const same = (a: unknown[], b: unknown[]): boolean =>
      a.length === b.length && a.every(v => b.includes(v));
    if (same(hidden, target._hidden) && same(solo, target._solo)) return;
    target._hidden = solo.length ? [] : hidden;
    target._solo = solo;
    target.render?.();
  });
}
