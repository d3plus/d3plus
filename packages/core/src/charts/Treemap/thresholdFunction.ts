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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aggs: any;
  /** The drill-down depth at which the threshold filter applies. */
  drawDepth: number;
  /** GroupBy accessors used to walk down the tree to `drawDepth`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupBy: ((d: any) => any)[];
  /** Threshold accessor — returns a 0..1 percentage given the branch data. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  threshold: (branchData: any[]) => number;
  /** Per-datum value accessor compared against `threshold * totalSum`. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thresholdKey: (d: any) => number;
}

/**
    Walks `data` to `drawDepth` and merges entries whose `thresholdKey`
    value falls below `threshold(branchData) * totalSum` into a single
    aggregated row at that depth. Returns the kept set; original `data`
    is not mutated.
*/
export function thresholdFunction(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  inputs: ThresholdInputs,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): any[] {
  const {aggs, drawDepth, groupBy, threshold, thresholdKey} = inputs;
  const totalSum = sum(data, thresholdKey);

  if (!threshold || !thresholdKey) return data;

  /**
      Explores the data tree recursively and merges elements under
      the indicated threshold.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function thresholdByDepth(branchData: any[], depth: number): any[] | null {
    if (depth < drawDepth) {
      return [...group(branchData, groupBy[depth])].reduce(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (bulk: any[], [, values]): any[] => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subBranchData: any[] = thresholdByDepth(values, depth + 1) ?? [];
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const removedItems: any[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const kept: any[] = [];
      const thresholdValue = thresholdPercent * totalSum;
      for (let i = 0; i < branchData.length; i++) {
        const datum = branchData[i];
        if (thresholdKey(datum) < thresholdValue) removedItems.push(datum);
        else kept.push(datum);
      }

      if (removedItems.length > 0) {
        const mergedItem = merge(removedItems as DataPoint[], aggs);
        mergedItem._isAggregation = true;
        mergedItem._threshold = thresholdPercent;
        kept.push(mergedItem);
      }

      return kept;
    }

    throw new Error("Depth is higher than the amount of grouping levels.");
  }

  return thresholdByDepth(data, 0) ?? data;
}
