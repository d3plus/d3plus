/**
    d3-stack ordering + offset helpers used by Plot's `stackOrder` /
    `stackOffset` accessors and their constructor defaults.

    `resolveStackOrder` / `resolveStackOffset` normalize the many shapes a
    user can pass (named string, data key, value accessor, `{value, order}`
    config, explicit key array, or raw comparator) into the single value the
    pipeline applies: a tagged comparator or an array of series keys.
*/
import * as d3Shape from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import accessor from "../../utils/accessor.js";

type Series = d3Shape.Series<Record<string, unknown>, string>;

/** A resolved d3-stack order comparator. Tagged with `__d3plusStackOrder` so
    the `stackOrder` setter can tell an already-resolved order (e.g. the
    constructor default, or a value round-tripped by `config()` reset) from a
    raw user value accessor that still needs wrapping. */
export type StackOrderFn = ((series: Series[]) => number[]) & {
  __d3plusStackOrder?: true;
};

/** Per-datum value accessor accepted for field-based ordering. */
type ValueAccessor = (d: DataPoint, i?: number) => unknown;

/** `{value, order}` config for ordering series by an arbitrary data field. */
export interface StackOrderFieldConfig {
  /** Data key or accessor whose aggregated value ranks each series. */
  value: string | ValueAccessor;
  /** Sort direction of the aggregate (default `"descending"`). */
  order?: "ascending" | "descending";
}

/** Every shape `Plot.stackOrder` accepts. */
export type StackOrderInput =
  | string
  | string[]
  | StackOrderFieldConfig
  | ValueAccessor
  | StackOrderFn;

/** A single formatted Plot row, as carried on each stacked point's `.data`. */
type Row = {id?: unknown; data?: DataPoint; [key: string]: unknown};

/** Marks a comparator as an already-resolved d3plus stack order. */
function tagOrder(fn: (series: Series[]) => number[]): StackOrderFn {
  (fn as StackOrderFn).__d3plusStackOrder = true;
  return fn as StackOrderFn;
}

// @types/d3-shape types the order accessors' param as a single `Series`,
// though d3 passes the full stack array; this cast satisfies the signature.
const asStack = (series: Series[]) => series as unknown as Series;

/**
    Sums a single stack series, ignoring non-numeric segments.
*/
export function stackSum(series: Series): number {
  let i = -1,
    s = 0,
    v;
  const n = series.length;
  while (++i < n) if ((v = +series[i][1])) s += v;
  return s;
}

/**
    Stack order: series with the smallest summed value on the bottom of the
    stack (matches d3's `stackOrderAscending`).
*/
export const stackOrderTotalAscending = tagOrder((series: Series[]) =>
  d3Shape.stackOrderAscending(asStack(series)),
);

/**
    Stack order: series with the largest summed value on the bottom of the
    stack (matches d3's `stackOrderDescending`). Plot's default.
*/
export const stackOrderTotalDescending = tagOrder((series: Series[]) =>
  d3Shape.stackOrderDescending(asStack(series)),
);

/**
    Stack order: ascending by series key (A→Z from the bottom), tie-broken by
    ascending summed value.
*/
export const stackOrderKey = tagOrder((series: Series[]) => {
  const sums = series.map(stackSum);
  const keys = series.map((d: Series) => d.key.split("_")[0]);
  return d3Shape
    .stackOrderNone(asStack(series))
    .sort((a: number, b: number) => keys[a].localeCompare(keys[b]) || sums[a] - sums[b]);
});

/**
    Stack order: the reverse of {@link stackOrderKey} (Z→A from the bottom).
*/
export const stackOrderKeyReverse = tagOrder((series: Series[]) =>
  stackOrderKey(series).reverse(),
);

/**
    Builds a stack order that ranks each series by an aggregate (sum) of a
    data field, letting users order stacks by any value in their data rather
    than only the plotted one. `value` receives each series' original datum.
*/
export function stackOrderField(
  value: ValueAccessor,
  order: "ascending" | "descending" = "descending",
): StackOrderFn {
  return tagOrder((series: Series[]) => {
    const totals = series.map((s: Series) => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        // Each stacked point carries `.data` = the discrete group's rows;
        // pick the row for this series and read the field off its datum.
        const group = ((s[i] as unknown as {data?: Row[]}).data || []) as Row[];
        const row = group.find((g: Row) => g.id === s.key);
        if (row && row.data) {
          const v = +(value(row.data) as number);
          if (!isNaN(v)) total += v;
        }
      }
      return total;
    });
    return d3Shape
      .stackOrderNone(asStack(series))
      .sort((a: number, b: number) =>
        order === "ascending" ? totals[a] - totals[b] : totals[b] - totals[a],
      );
  });
}

/** Named stack orders accepted by `Plot.stackOrder`. */
const NAMED_ORDERS: Record<string, StackOrderFn> = {
  ascending: stackOrderTotalAscending,
  descending: stackOrderTotalDescending,
  key: stackOrderKey,
  keyReverse: stackOrderKeyReverse,
  none: tagOrder((series: Series[]) => d3Shape.stackOrderNone(asStack(series))),
  data: tagOrder((series: Series[]) => d3Shape.stackOrderNone(asStack(series))),
  insideOut: tagOrder((series: Series[]) => d3Shape.stackOrderInsideOut(asStack(series))),
  appearance: tagOrder((series: Series[]) => d3Shape.stackOrderAppearance(asStack(series))),
  reverse: tagOrder((series: Series[]) => d3Shape.stackOrderReverse(asStack(series))),
};

/** The named orders accepted by `Plot.stackOrder`, for docs/validation. */
export const stackOrderNames = Object.keys(NAMED_ORDERS);

/**
    Normalizes any `stackOrder` input into a value Plot's pipeline can apply:
    a tagged comparator, or an explicit array of series keys. Warns and falls
    back to the default on an unrecognized name.
*/
export function resolveStackOrder(input: StackOrderInput): StackOrderFn | string[] {
  if (typeof input === "function") {
    // Already-resolved order (constructor default / config() reset) passes
    // through; a bare user function is treated as a value accessor.
    return (input as StackOrderFn).__d3plusStackOrder
      ? (input as StackOrderFn)
      : stackOrderField(input as ValueAccessor);
  }
  if (Array.isArray(input)) return input;
  if (input && typeof input === "object") {
    const {value, order} = input as StackOrderFieldConfig;
    return stackOrderField(typeof value === "function" ? value : accessor(value), order);
  }
  if (typeof input === "string") {
    if (input in NAMED_ORDERS) return NAMED_ORDERS[input];
    console.warn(
      `[d3plus] Unknown stackOrder "${input}". Expected one of: ${stackOrderNames.join(
        ", ",
      )}; an array of series keys; a value accessor; or a {value, order} config. Falling back to "descending".`,
    );
    return stackOrderTotalDescending;
  }
  return stackOrderTotalDescending;
}

/**
    Diverging stack offset: positive segments stack upward from zero,
    negative segments stack downward.
*/
export function stackOffsetDiverging(series: Series[], order: number[]): void {
  let n;
  if (!((n = series.length) > 0)) return;
  let d, dy, i, yn, yp;
  const m = series[order[0]].length;
  for (let j = 0; j < m; ++j) {
    for (yp = yn = 0, i = 0; i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) >= 0) {
        ((d[0] = yp), (d[1] = yp += dy));
      } else if (dy < 0) {
        ((d[1] = yn), (d[0] = yn += dy));
      } else {
        d[0] = yp;
      }
    }
  }
}

/** A stack offset function, as applied by d3-stack. */
export type StackOffsetFn = (series: number[][][], order: number[]) => void;

/** Named stack offsets accepted by `Plot.stackOffset`. */
const NAMED_OFFSETS: Record<string, StackOffsetFn> = {
  diverging: stackOffsetDiverging as unknown as StackOffsetFn,
  none: d3Shape.stackOffsetNone as unknown as StackOffsetFn,
  expand: d3Shape.stackOffsetExpand as unknown as StackOffsetFn,
  silhouette: d3Shape.stackOffsetSilhouette as unknown as StackOffsetFn,
  wiggle: d3Shape.stackOffsetWiggle as unknown as StackOffsetFn,
};

/** The named offsets accepted by `Plot.stackOffset`, for docs/validation. */
export const stackOffsetNames = Object.keys(NAMED_OFFSETS);

/**
    Normalizes a `stackOffset` input into an offset function. Warns and falls
    back to the diverging default on an unrecognized name.
*/
export function resolveStackOffset(input: string | StackOffsetFn): StackOffsetFn {
  if (typeof input === "function") return input;
  if (typeof input === "string" && input in NAMED_OFFSETS) return NAMED_OFFSETS[input];
  console.warn(
    `[d3plus] Unknown stackOffset "${input}". Expected one of: ${stackOffsetNames.join(
      ", ",
    )}; or an offset function. Falling back to "diverging".`,
  );
  return stackOffsetDiverging as unknown as StackOffsetFn;
}
