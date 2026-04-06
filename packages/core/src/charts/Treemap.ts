import {group, sum} from "d3-array";
import {hierarchy, treemap} from "d3-hierarchy";
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

import {merge, nestGroups} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import {Rect} from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";
import Viz from "./Viz.js";

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

    this._layoutPadding = 1;

    const defaultLegend = this._legend;
    this._legend = (config, arr) => {
      if (arr.length === this._filteredData.length) return false;
      return defaultLegend.bind(this)(config, arr);
    };
    this._legendSort = (a, b) => this._sum(b) - this._sum(a);
    this._legendTooltip = assign({}, this._legendTooltip, {
      tbody: [],
    });
    this._shapeConfig = assign({}, this._shapeConfig, {
      ariaLabel: (d, i) => {
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
    this._sort = (a, b) => {
      const aggA = isAggregated(a);
      const aggB = isAggregated(b);
      return aggA && !aggB ? 1 : !aggA && aggB ? -1 : b.value - a.value;
    };
    this._sum = accessor("value");
    this._thresholdKey = this._sum;
    this._tile = treemapSquarify;
    this._tooltipConfig = assign({}, this._tooltipConfig, {
      tbody: [
        [
          () => this._translate("Share"),
          (d, i, x) => `${formatAbbreviate(x.share * 100, this._locale)}%`,
        ],
      ],
    });
    this._treemap = treemap().round(true);

    const isAggregated = leaf =>
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

    const nestedData = nestGroups(
      this._filteredData,
      this._groupBy.slice(0, this._drawDepth + 1),
    );

    const tmapData = this._treemap
      .padding(this._layoutPadding)
      .size([
        this._width - this._margin.left - this._margin.right,
        this._height - this._margin.top - this._margin.bottom,
      ])
      .tile(this._tile)(
      hierarchy(
        {values: nestedData} as Record<string, unknown>,
        (d: Record<string, unknown>) => d.values as Record<string, unknown>[],
      )
        .sum(this._sum)
        .sort(this._sort),
    );

    const shapeData = [],
      that = this;

    /**
        Flattens and merges treemap data.
        @private
*/
    function extractLayout(children) {
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.depth <= that._drawDepth) extractLayout(node.children);
        else {
          const index =
            node.data.values.length === 1
              ? that._filteredData.indexOf(node.data.values[0])
              : undefined;
          node.__d3plus__ = true;
          node.id = node.data.key;
          node.i = index > -1 ? index : undefined;
          node.data = merge(node.data.values, that._aggs);
          node.x = node.x0 + (node.x1 - node.x0) / 2;
          node.y = node.y0 + (node.y1 - node.y0) / 2;
          shapeData.push(node);
        }
      }
    }
    if (tmapData.children) extractLayout(tmapData.children);

    this._rankData = shapeData.sort(this._sort).map(d => d.data);
    const total = tmapData.value;
    shapeData.forEach(d => {
      d.share = this._sum(d.data, d.i) / total;
    });

    const transform = `translate(${this._margin.left}, ${this._margin.top})`;
    const rectConfig = configPrep.bind(this)(
      this._shapeConfig,
      "shape",
      "Rect",
    );
    const fontMax = rectConfig.labelConfig.fontMax;
    const fontMin = rectConfig.labelConfig.fontMin;
    const padding = rectConfig.labelConfig.padding;

    this._shapes.push(
      new Rect()
        .data(shapeData)
        .label((d => [
          this._drawLabel(d.data, d.i),
          `${formatAbbreviate((d.share as number) * 100, this._locale)}%`,
        ]) as unknown as (d: DataPoint) => DataPoint[keyof DataPoint])
        .select(
          elem("g.d3plus-Treemap", {
            parent: this._select,
            enter: {transform},
            update: {transform},
          }).node(),
        )
        .config({
          height: d => d.y1 - d.y0,
          labelBounds: (d, i, s) => {
            const h = s.height;
            let sh = Math.min(fontMax, (h - padding * 2) * 0.5);
            if (sh < fontMin) sh = 0;
            return [
              {width: s.width, height: h - sh, x: -s.width / 2, y: -h / 2},
              {
                width: s.width,
                height: sh + padding * 2,
                x: -s.width / 2,
                y: h / 2 - sh - padding * 2,
              },
            ];
          },
          labelConfig: {
            textAnchor: (d, i, x) => {
              let line,
                parent = x;
              while (typeof line === "undefined" && parent) {
                if (typeof parent.l !== "undefined") line = parent.l;
                parent = parent.__d3plusParent__;
              }
              return line ? "middle" : "start";
            },
            verticalAlign: (d, i, x) => {
              let line,
                parent = x;
              while (typeof line === "undefined" && parent) {
                if (typeof parent.l !== "undefined") line = parent.l;
                parent = parent.__d3plusParent__;
              }
              return line ? "bottom" : "top";
            },
          },
          width: d => d.x1 - d.x0,
        })
        .config(rectConfig)
        .render(),
    );

    return this;
  }

  /**
   * Applies the threshold algorithm for Treemaps.
   * @param {Array} data The data to process.
   * @private
*/
  _thresholdFunction(data) {
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
    function thresholdByDepth(branchData: object[], depth: number) {
      if (depth < drawDepth) {
        return [...group(branchData, groupBy[depth])].reduce(
          (bulk, [, values]) => {
            const subBranchData = thresholdByDepth(values, depth + 1);
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

        const removedItems = [];
        const branchDataCopy = branchData.slice();
        const thresholdValue = thresholdPercent * totalSum;

        let n = branchDataCopy.length;
        while (n--) {
          const datum = branchDataCopy[n];
          if (thresholdKey(datum) < thresholdValue) {
            const index = branchDataCopy.indexOf(datum);
            branchDataCopy.splice(index, 1);
            removedItems.push(datum);
          }
        }

        if (removedItems.length > 0) {
          const mergedItem = merge(removedItems, aggs);
          mergedItem._isAggregation = true;
          mergedItem._threshold = thresholdPercent;
          branchDataCopy.push(mergedItem);
        }

        return branchDataCopy;
      }

      throw new Error("Depth is higher than the amount of grouping levels.");
    }

    return data;
  }

  /**
      The inner and outer padding.
*/
  layoutPadding(_) {
    return arguments.length
      ? ((this._layoutPadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._layoutPadding;
  }

  /**
      Sort comparator function for the treemap layout. Defaults to descending order by the associated input data's numeric value attribute.

@example
function comparator(a, b) {
  return b.value - a.value;
}
*/
  sort(_) {
    return arguments.length ? ((this._sort = _), this) : this._sort;
  }

  /**
      The sum accessor used for sizing each rectangle in the treemap.

@example
function sum(d) {
  return d.sum;
}
*/
  sum(_) {
    if (arguments.length) {
      this._sum = typeof _ === "function" ? _ : accessor(_);
      this._thresholdKey = this._sum;
      return this;
    } else return this._sum;
  }

  /**
      The tiling method used when calculating the size and position of the rectangles.

Can either be a string referring to a d3-hierarchy [tiling method](https://github.com/d3/d3-hierarchy#treemap-tiling), or a custom function in the same format.
*/
  tile(_) {
    return arguments.length
      ? ((this._tile =
          typeof _ === "string"
            ? tileMethods[`treemap${_.charAt(0).toUpperCase()}${_.slice(1)}`] ||
              treemapSquarify
            : _),
        this)
      : this._tile;
  }
}
