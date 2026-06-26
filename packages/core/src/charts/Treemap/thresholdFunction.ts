/**
    Treemap threshold-merge algorithm — pure: takes its inputs explicitly,
    returns a new array. `treemapDef.thresholdFunction` binds the inputs
    from the viz.
*/

import {group, sum} from "d3-array";
import {merge} from "@d3plus/data";
import type {DataPoint} from "@d3plus/data";

export interface ThresholdInputs {
  /** Per-key aggregation overrides used by `merge` to bucket removed items. */
  aggs: Record<string, (leaves: DataPoint[]) => unknown>;
  /** The drill-down depth at which the threshold filter applies. */
  drawDepth: number;
  /** GroupBy accessors used to walk down the tree to `drawDepth`. */
  groupBy: ((d: DataPoint) => DataPoint[keyof DataPoint])[];
  /** Threshold accessor — returns a 0..1 percentage given the branch data. */
  threshold: (branchData: DataPoint[]) => number;
  /** Per-datum value accessor compared against `threshold * totalSum`. */
  thresholdKey: (d: DataPoint) => number;
}

/**
    Walks `data` to `drawDepth` and merges entries whose `thresholdKey`
    value falls below `threshold(branchData) * totalSum` into a single
    aggregated row at that depth. Returns the kept set; original `data`
    is not mutated.
*/
export function thresholdFunction(
  data: DataPoint[],
  inputs: ThresholdInputs,
): DataPoint[] {
  const {aggs, drawDepth, groupBy, threshold, thresholdKey} = inputs;
  const totalSum = sum(data, thresholdKey);

  if (!threshold || !thresholdKey) return data;

  /**
      Explores the data tree recursively and merges elements under
      the indicated threshold.
  */
  function thresholdByDepth(
    branchData: DataPoint[],
    depth: number,
  ): DataPoint[] | null {
    if (depth < drawDepth) {
      return [...group(branchData, groupBy[depth])].reduce(
        (bulk: DataPoint[], [, values]): DataPoint[] => {
          const subBranchData: DataPoint[] =
            thresholdByDepth(values, depth + 1) ?? [];
          return bulk.concat(subBranchData);
        },
        [],
      );
    }

    if (depth === drawDepth) {
      const thresholdPercent = Math.min(
        1,
        Math.max(0, threshold(branchData)),
      );

      if (!isFinite(thresholdPercent) || isNaN(thresholdPercent)) return null;

      // Single-pass O(N) partition into kept + removed bucket.
      const removedItems: DataPoint[] = [];
      const kept: DataPoint[] = [];
      const thresholdValue = thresholdPercent * totalSum;
      for (let i = 0; i < branchData.length; i++) {
        const datum = branchData[i];
        if (thresholdKey(datum) < thresholdValue) removedItems.push(datum);
        else kept.push(datum);
      }

      if (removedItems.length > 0) {
        const mergedItem = merge(
          removedItems,
          aggs as unknown as Parameters<typeof merge>[1],
        );
        mergedItem._isAggregation = true;
        mergedItem._threshold = thresholdPercent;
        kept.push(mergedItem as unknown as DataPoint);
      }

      return kept;
    }

    throw new Error("Depth is higher than the amount of grouping levels.");
  }

  return thresholdByDepth(data, 0) ?? data;
}
