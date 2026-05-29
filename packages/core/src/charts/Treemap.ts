import {group, sum} from "d3-array";
import type {DataPoint} from "@d3plus/data";
import {
  treemapBinary,
  treemapDice,
  treemapSlice,
  treemapSliceDice,
  treemapSquarify,
  treemapResquarify,
} from "d3-hierarchy";
const tileMethods = {
  treemapBinary,
  treemapDice,
  treemapSlice,
  treemapSliceDice,
  treemapSquarify,
  treemapResquarify,
};

import {merge} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import {accessor} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import {applyTreemapLayout, treemapDef} from "./ChartDefinition.js";
import {runChartDraw} from "./runChartDraw.js";
import Viz from "./Viz.js";

// Treemap's accessor schema lives next to its definition. `installFluent`
// mixes these onto the instance, replacing two of the four hand-written
// `arguments.length`-overloaded accessors. `sum`/`tile` retain hand-written
// setters because they have chart-specific coercion logic (`sum` mirrors
// `_thresholdKey`; `tile` string→method lookup).
const treemapSchema = [
  {key: "layoutPadding", coerce: "identity" as const},
  {key: "sort", coerce: "identity" as const},
];

/**
    Uses the [d3 treemap layout](https://github.com/mbostock/d3/wiki/Treemap-Layout) to creates SVG rectangles based on an array of data. See [this example](https://d3plus.org/examples/d3plus-hierarchy/getting-started/) for help getting started using the treemap generator.
*/
export default class Treemap extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
    Invoked when creating a new class instance, and sets any default parameters.
    @private
*/
  constructor() {
    super();

    // E3+E4: scalar defaults sourced from treemapDef; accessor methods
    // (layoutPadding/sort) mixed in via `installFluent` instead of hand-written
    // `arguments.length` overloads. `sum`/`tile` retain hand-written setters
    // (see below) — chart-specific coercion (sum: also writes _thresholdKey;
    // tile: string→d3-hierarchy-tile-method lookup). `_treemap` is internal.
    installFluent(this as any, treemapSchema, {
      layoutPadding: treemapDef.defaults.layoutPadding,
      // `sort` default is wrapped (see below) so aggregated leaves sort last;
      // installFluent only seeds when unset, so the wrapper applied later wins.
    });
    this._sum = treemapDef.defaults.sum as any;
    this._thresholdKey = this._sum;
    this._tile = treemapDef.defaults.tile as any;
    this._treemap = treemapDef.defaults.treemap as any;

    const defaultLegend = this._legend;
    this._legend = (config: any, arr: any) => {
      if (arr.length === this._filteredData.length) return false;
      return defaultLegend.bind(this)(config, arr);
    };
    this._legendSort = (a: any, b: any) => this._sum(b) - this._sum(a);
    this._legendTooltip = assign({}, this._legendTooltip, {
      tbody: [],
    });
    this._shapeConfig = assign({}, this._shapeConfig, {
      ariaLabel: (d: any, i: any) => {
        const rank = this._rankData ? `${this._rankData.indexOf(d) + 1}. ` : "";
        return `${rank}${this._drawLabel(d, i)}, ${this._sum(d, i)}.`;
      },
      labelConfig: {
        fontMax: 32,
        fontMin: 8,
        fontResize: true,
        padding: 5,
      },
    });
    // Sort takes the aggregation hint into account; reach for the default
    // but wrap so aggregated leaves sort last.
    const baseSort = treemapDef.defaults.sort as (a: any, b: any) => number;
    this._sort = (a: any, b: any) => {
      const aggA = isAggregated(a);
      const aggB = isAggregated(b);
      return aggA && !aggB ? 1 : !aggA && aggB ? -1 : baseSort(a, b);
    };
    this._tooltipConfig = assign({}, this._tooltipConfig, {
      tbody: [
        [
          () => this._translate("Share"),
          (d: any, i: any, x: any) => `${formatAbbreviate(x.share * 100, this._locale)}%`,
        ],
      ],
    });

    const isAggregated = (leaf: any) =>
      leaf.children &&
      leaf.children.length === 1 &&
      leaf.children[0].data._isAggregation;
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    (super._draw as (...args: unknown[]) => unknown)(callback);
    runChartDraw(this, treemapDef, applyTreemapLayout);
    return this;
  }

  /**
   * Applies the threshold algorithm for Treemaps.
   * @param {Array} data The data to process.
   * @private
*/
  _thresholdFunction(data: any) {
    const aggs = this._aggs;
    const drawDepth = this._drawDepth;
    const groupBy = this._groupBy;
    const threshold = this._threshold;
    const thresholdKey = this._thresholdKey;

    const totalSum = sum(data, thresholdKey);

    if (threshold && thresholdKey) {
      return thresholdByDepth(data, 0);
    }

    /**
        Explores the data tree recursively and merges elements under the indicated threshold.
        @param branchData The current subset of the dataset to work on.
        @param depth The depth of the current branch.
        @private
*/
    function thresholdByDepth(branchData: any[], depth: number): any[] | null {
      if (depth < drawDepth) {
        return [...group(branchData, groupBy[depth])].reduce(
          (bulk: any[], [, values]): any[] => {
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

        // Build the kept array and removed bucket in a single pass.
        // The previous indexOf+splice-in-loop was O(N²) — for an 8k
        // leaf Treemap with a 0.5% threshold the indexOf scans cost
        // ~18M comparisons, ~400 ms per render. Single-pass is O(N).
        const removedItems: any[] = [];
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

    return data;
  }

  /**
      The sum accessor used for sizing each rectangle in the treemap.
      Kept hand-written because the setter must also update `_thresholdKey`
      (the threshold filter reads `_thresholdKey` directly).

@example
function sum(d) {
  return d.sum;
}
*/
  sum(_: any) {
    if (arguments.length) {
      this._sum = typeof _ === "function" ? _ : accessor(_);
      this._thresholdKey = this._sum;
      return this;
    } else return this._sum;
  }

  /**
      The tiling method used when calculating the size and position of the rectangles.
      Kept hand-written because the setter coerces `"dice"` etc. to the
      corresponding d3-hierarchy tile method (`treemapDice`).

Can either be a string referring to a d3-hierarchy [tiling method](https://github.com/d3/d3-hierarchy#treemap-tiling), or a custom function in the same format.
*/
  tile(_: any) {
    return arguments.length
      ? ((this._tile =
          typeof _ === "string"
            ? (tileMethods as any)[`treemap${_.charAt(0).toUpperCase()}${_.slice(1)}`] ||
              treemapSquarify
            : _),
        this)
      : this._tile;
  }
}
