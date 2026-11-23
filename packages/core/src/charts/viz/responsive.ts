import {isPlainObject, RESOLVES_RESET} from "../../fluent.js";
import type {
  D3plusConfig,
  ResponsiveBreakpoint,
} from "../../utils/D3plusConfig.js";
import {warnConfig} from "../../utils/configWarnings.js";
import type Viz from "./Viz.js";

/**
    Config keys a breakpoint cannot set: the chart's data and container, the
    size its breakpoints are matched against, and the breakpoints themselves.
*/
const FIXED_KEYS = new Set(["data", "height", "responsive", "select", "width"]);

type Setter = ((...args: unknown[]) => unknown) & {[RESOLVES_RESET]?: boolean};
type Bag = Record<string, unknown>;

/** One entry a breakpoint changed: what it held before and after. */
interface Change {
  had: boolean;
  before: unknown;
  has: boolean;
  after: unknown;
}

/** A chart's applied breakpoints. */
interface ResponsiveState {
  /** The `responsive` list `active` indexes into. */
  breakpoints?: unknown;
  /** The indices of the breakpoints in range. */
  active: number[];
  /** Their configs, in the order they merge. */
  configs: D3plusConfig[];
  /** Every entry they changed, per object (the chart and its `schema`). */
  changes: Map<Bag, Map<string, Change>>;
  /** Set while breakpoints apply, so the setters they call pass through. */
  applying: boolean;
  /** The setters already watched for the user's own calls. */
  wrapped: Set<string>;
}

const states = new WeakMap<Viz, ResponsiveState>();

/**
    The indices of the `responsive` breakpoints a chart `width` pixels wide is
    in, in list order: each entry's `minWidth` and `maxWidth` are inclusive,
    and one it leaves out is unbounded on that side. Entries that are not
    objects never match.
    @param breakpoints The chart's `responsive` list.
    @param width The chart's width, in pixels.
*/
export function matchBreakpoints(
  breakpoints: unknown,
  width: number,
): number[] {
  if (!Array.isArray(breakpoints) || !(width > 0)) return [];
  const out: number[] = [];
  breakpoints.forEach((entry: unknown, i: number) => {
    if (!isPlainObject(entry)) return;
    const {minWidth, maxWidth} = entry as Partial<ResponsiveBreakpoint>;
    if (typeof minWidth === "number" && width < minWidth) return;
    if (typeof maxWidth === "number" && width > maxWidth) return;
    out.push(i);
  });
  return out;
}

function snapshot(obj: Bag): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const key of Object.keys(obj)) out.set(key, obj[key]);
  return out;
}

/** Records the entries of `obj` that differ from `before`, keeping the first `before` of each. */
function record(
  state: ResponsiveState,
  obj: Bag,
  before: Map<string, unknown>,
): void {
  let changes = state.changes.get(obj);
  for (const key of new Set([...before.keys(), ...Object.keys(obj)])) {
    const had = before.has(key);
    const has = Object.prototype.hasOwnProperty.call(obj, key);
    if (had === has && Object.is(before.get(key), obj[key])) continue;
    if (!changes) state.changes.set(obj, (changes = new Map()));
    const change = changes.get(key);
    if (change) {
      change.has = has;
      change.after = obj[key];
    } else
      changes.set(key, {had, before: before.get(key), has, after: obj[key]});
  }
}

/**
    Takes the applied breakpoints back off: each entry they changed returns to
    what it held before, unless something else has changed it since.
*/
function unapply(state: ResponsiveState): void {
  for (const [obj, changes] of state.changes) {
    for (const [key, change] of changes) {
      const has = Object.prototype.hasOwnProperty.call(obj, key);
      if (has !== change.has || !Object.is(obj[key], change.after)) continue;
      if (change.had) obj[key] = change.before;
      else delete obj[key];
    }
  }
  state.changes = new Map();
}

/**
    Watches the setter for `key` on this chart, so a value the user sets while
    a breakpoint holds the key becomes the one restored when the breakpoint
    leaves: the call lands on the chart's own config, with the breakpoints
    taken off, and they go back on after it.
*/
function watchSetter(viz: Viz, state: ResponsiveState, key: string): void {
  if (state.wrapped.has(key)) return;
  const host = viz as unknown as Record<string, unknown>;
  const setter = host[key];
  if (typeof setter !== "function") return;
  state.wrapped.add(key);
  const own = setter as Setter;
  const watched: Setter = function (this: unknown, ...args: unknown[]) {
    if (!args.length || state.applying || !state.configs.length)
      return own.apply(this, args);
    unapply(state);
    const out = own.apply(this, args);
    apply(viz, state);
    return out;
  };
  if (own[RESOLVES_RESET]) watched[RESOLVES_RESET] = true;
  host[key] = watched;
}

/** Merges the active breakpoints' configs over the chart's, recording what they change. */
function apply(viz: Viz, state: ResponsiveState): void {
  const targets = [viz as unknown as Bag, viz.schema as Bag];
  state.applying = true;
  try {
    for (const config of state.configs) {
      for (const key of Object.keys(config)) {
        if (FIXED_KEYS.has(key)) {
          warnConfig(`responsive: a breakpoint cannot set "${key}".`);
          continue;
        }
        watchSetter(viz, state, key);
        const before = targets.map(snapshot);
        viz.config({[key]: (config as Bag)[key]});
        targets.forEach((obj, i) => record(state, obj, before[i]!));
      }
    }
  } finally {
    state.applying = false;
  }
}

/**
    Applies the chart's `responsive` breakpoints for its current width: when
    the breakpoints in range differ from the ones applied (or the list itself
    changed), takes the applied ones off and merges the new ones over the
    chart's config. Does nothing until the chart's width is known.
    @returns Whether the applied breakpoints changed.
    @private
*/
export function applyResponsive(viz: Viz): boolean {
  const width = viz.schema.width;
  const breakpoints: unknown = viz.schema.responsive;
  let state = states.get(viz);
  if (!state && !Array.isArray(breakpoints)) return false;
  if (typeof width !== "number" || !(width > 0)) return false;
  const active = matchBreakpoints(breakpoints, width);
  if (
    state &&
    state.breakpoints === breakpoints &&
    state.active.length === active.length &&
    state.active.every((d, i) => d === active[i])
  )
    return false;
  if (!state) {
    state = {
      active: [],
      applying: false,
      changes: new Map(),
      configs: [],
      wrapped: new Set(),
    };
    states.set(viz, state);
  }
  // Taken now, so the snapshot RESET restores from is never a breakpoint's.
  viz._defaultConfig();
  unapply(state);
  state.breakpoints = breakpoints;
  state.active = active;
  state.configs = active
    .map(i => (breakpoints as ResponsiveBreakpoint[])[i]!.config)
    .filter(isPlainObject);
  apply(viz, state);
  return true;
}
