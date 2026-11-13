/**
    Pareto's order: the category axis's sort, largest first, and the
    `threshold` bucket that folds the smallest categories into one bar.

    @module
*/
import type {DataPoint} from "@d3plus/data";

import {
  foldStackRows,
  stackThresholdBucket,
  type StackThresholdInputs,
} from "../Plot/stackThreshold.js";
import {
  facetActive,
  facetScalesShared,
  resolveFacetConfig,
  type FacetConfig,
} from "../facet/facetConfig.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {categoryKey, paretoComparator} from "./paretoSteps.js";
import {
  categoryAxis,
  categoryOf,
  stepsFor,
  valueOf,
  type ParetoState,
} from "./state.js";

/**
    Installs the Pareto order as the category axis's sort (`xSort` or
    `ySort`), or removes the one it installed earlier. A sort the user set
    on that axis wins, and the line accumulates in its order instead.
*/
export function syncSort(viz: VizInstance, state: ParetoState): void {
  const prior = state.sort;
  if (prior && viz.schema[`${prior.axis}Sort`] === prior.compare)
    viz.schema[`${prior.axis}Sort`] = undefined;
  state.sort = undefined;
  const axis = categoryAxis(viz);
  if (viz.schema[`${axis}Sort`]) return;
  // A vertical category axis lists its first category at the bottom.
  const compare = paretoComparator(
    () => state.pooled ?? stepsFor(viz, viz._filteredData),
    d => categoryOf(viz, d, 0),
    axis === "y",
  );
  viz.schema[`${axis}Sort`] = compare;
  state.sort = {axis, compare};
}

/**
    Records the order small-multiples panels share when they share scales
    (every panel's categories, largest total first), given every panel's
    rows; clears it otherwise. Each panel's bars and line then follow it, so
    a category sits in the same place in every panel.
    @param viz The Pareto.
    @param state Its state.
    @param rows Every panel's rows, or undefined when not drawing panels.
*/
export function syncPooledOrder(
  viz: VizInstance,
  state: ParetoState,
  rows: DataPoint[] | undefined,
): void {
  state.pooled = undefined;
  state.steps = new WeakMap();
  if (!rows || !facetActive(viz)) return;
  const config = resolveFacetConfig(
    viz.schema.facetConfig as FacetConfig | undefined,
  );
  if (!facetScalesShared(config, viz._facetHooks ? viz._facetHooks() : {}))
    return;
  state.pooled = stepsFor(viz, rows);
  state.steps = new WeakMap();
}

/**
    `threshold` folds the categories whose totals fall under it into one
    bucket bar, which sorts last.
*/
export function paretoThreshold(
  viz: VizInstance,
  data: DataPoint[],
  all: DataPoint[] = data,
): DataPoint[] {
  const value = (d: DataPoint, i: number) => valueOf(viz, d, i);
  const inputs: StackThresholdInputs = {
    aggs: viz.schema.aggs,
    id: (d, i) => categoryKey(categoryOf(viz, d, i)),
    label: viz._drawLabel,
    measure: value,
    position: [],
    threshold: viz.schema.threshold,
    value: viz.schema.thresholdKey ?? value,
  };
  const bucket = stackThresholdBucket(all, inputs);
  return bucket ? foldStackRows(data, bucket, inputs) : data;
}
