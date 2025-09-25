import {extent, min, max} from "d3-array";
import {hierarchy, tree} from "d3-hierarchy";
import {scaleLinear} from "d3-scale";

import {colorDefaults} from "@d3plus/color";
import {assign, elem} from "@d3plus/dom";
import {merge, nest} from "@d3plus/data";
import {configPrep, constant} from "../utils/index.js";
import * as shapes from "../shapes/index.js";
import {legendLabel} from "./drawSteps/drawLegend.js";

import Viz from "./Viz.js";

/**
    @class Tree
    @extends Viz
    @desc Uses d3's [tree layout](https://github.com/d3/d3-hierarchy#tree) to create a tidy tree chart based on an array of data.
*/
export default class Tree extends Viz {

  /**
      @memberof Tree
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._orient = "vertical";
    this._separation = (a, b) => a.parent === b.parent ? 1 : 2;

    this._legendTooltip = assign(this._legendTooltip, {
      title: legendLabel.bind(this)
    });
    this._previousShapes = [];

    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d, i) =>  this._treeData ? `${this._treeData[i].depth}. ${this._drawLabel(d, i)}.` : "",
      labelConfig: {
        fontColor: colorDefaults.dark
      },
      Path: {
        fill: "none",
        stroke: colorDefaults.missing,
        strokeWidth: 2
      },
      r: constant(7),
      width: constant(12),
      height: constant(12)
    });

    this._tooltipConfig = assign(this._tooltipConfig, {
      title: (d, i, x) => (this._drawLabel(d, i, x.depth - 1))
    });

    this._tree = tree();

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    super._draw(callback);

    const isVertical = this._orient === "vertical";
    const isHorizontal = this._orient === "horizontal";

    const height = isVertical
            ? this._height - this._margin.top - this._margin.bottom
            : this._width - this._margin.left - this._margin.right,
          left = isVertical ? "left" : "top",
          that = this,
          transform = `translate(${this._margin.left}, ${this._margin.top})`,
          width = isHorizontal
            ? this._height - this._margin.top - this._margin.bottom
            : this._width - this._margin.left - this._margin.right;

    const treeData = this._treeData = this._tree
      .separation(this._separation)
      .size([width, height])(
        hierarchy({
          key: "root",
          values: nest(this._filteredData, this._groupBy.slice(0, this._drawDepth + 1))
        }, d => d.key && d.values ? d.values : null).sort(this._sort)
      )
      .descendants()
      .filter(d => d.depth <= this._groupBy.length && d.parent);

    /**
        Merges the values of a given nest branch.
        @private
    */
    function flattenBranchData(branch) {
      return merge(branch.values.map(l => l.key && l.values ? flattenBranchData(l) : l), that._aggs);
    }

    treeData.forEach((d, i) => {
      if (d.data.key && d.data.values) d.data = flattenBranchData(d.data);
      d.__d3plus__ = true;
      d.i = i;
    });

    let r = this._shapeConfig.r;
    if (typeof r !== "function") r = constant(r);
    const rBufferRoot = max(treeData, d => d.depth === 1 ? r(d.data, d.i) : 0);
    const rBufferEnd = max(treeData, d => d.children ? 0 : r(d.data, d.i));

    const yExtent = extent(treeData, d => d.y);
    this._labelHeight = min([
      isVertical ? 50 : 100,
      (yExtent[1] - rBufferRoot - rBufferEnd) / (this._groupBy.length + 1)
    ]);

    this._labelWidths = nest(treeData, d => d.depth)
      .map(d => d.values.reduce((num, v, i) => {
        const next = i < d.values.length - 1 ? d.values[i + 1].x : width + this._margin[left],
              prev = i ? d.values[i - 1].x : this._margin[left];
        return min([num, next - v.x, v.x - prev]);
      }, width));

    const yScale = scaleLinear()
      .domain(yExtent)
      .range([rBufferRoot + this._labelHeight, height - rBufferEnd - this._labelHeight]);

    treeData.forEach(d => {
      const val = yScale(d.y);
      if (isHorizontal) {
        d.y = d.x;
        d.x = val;
      }
      else d.y = val;
    });

    const elemObject = {parent: this._select, enter: {transform}, update: {transform}};
    
    this._shapes.push(new shapes.Path()
      .data(treeData.filter(d => d.depth > 1).map(d => assign({}, d)))
      .select(elem("g.d3plus-Tree-Links", elemObject).node())
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Path"))
      .config({
        d: d => {

          let r = this._shapeConfig.r;

          if (typeof r === "function") r = r(d.data, d.i);

          const px = d.parent.x - d.x + (isVertical ? 0 : r),
                py = d.parent.y - d.y + (isVertical ? r : 0),
                x = isVertical ? 0 : -r,
                y = isVertical ? -r : 0;

          return isVertical
            ? `M${x},${y}C${x},${(y + py) / 2} ${px},${(y + py) / 2} ${px},${py}`
            : `M${x},${y}C${(x + px) / 2},${y} ${(x + px) / 2},${py} ${px},${py}`;

        },
        id: (d, i) => this._ids(d, i)[d.depth - 1]
      })
      .render());

    const shapeConfig = {
      id: (d, i) => this._ids(d, i)[d.depth - 1],
      label: (d, i) => {
        if (this._label) return this._label(d.data, i);
        const ids = this._ids(d, i).slice(0, d.depth);
        return ids[ids.length - 1];
      },
      labelConfig: {
        textAnchor: (d, i, x) => isVertical ? "middle" : x.children && x.depth !== this._drawDepth + 1 ? "end" : "start",
        verticalAlign: (d, i, x) => isVertical ? x.depth === 1 ? "bottom" : "top" : "middle"
      },
      hitArea: (d, i, s) => {

        const h = this._labelHeight,
              offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2,
              w = this._labelWidths[d.depth - 1];
              
        return {
          width: isVertical ? w : offset * 2 + w,
          height: isHorizontal ? h : offset * 2 + h,
          x: isVertical ? -w / 2 : d.children && d.depth !== this._groupBy.length ? -(offset + w) : -offset,
          y: isHorizontal ? -h / 2 : d.children && d.depth !== this._groupBy.length ? -(offset + this._labelHeight) : -offset
        };

      },
      labelBounds: (d, i, s) => {

        const h = this._labelHeight,
              height = isVertical ? "height" : "width",
              offset = s.r ? s.r : isVertical ? s.height / 2 : s.width / 2,
              w = this._labelWidths[d.depth - 1],
              width = isVertical ? "width" : "height",
              x = isVertical ? "x" : "y",
              y = isVertical ? "y" : "x";

        return {
          [width]: w,
          [height]: h,
          [x]: -w / 2,
          [y]: d.children && d.depth !== this._groupBy.length ? -(offset + h) : offset
        };

      }
    };

    const shapeData = nest(treeData, d => this._shape(d.data));
    const dataShapes = shapeData.map(d => d.key);
    const exitShapes = this._previousShapes.filter(d => !dataShapes.includes(d));

    (shapeData.concat(exitShapes.map(key => ({key, values: []})))).forEach(({key, values}) => {
      this._shapes.push(new shapes[key]()
        .data(values)
        .select(elem(`g.d3plus-Tree-${key}`, elemObject).node())
        .config(configPrep.bind(this)(this._shapeConfig, "shape", key))
        .config(shapeConfig)
        .render());
    });
    
    this._previousShapes = dataShapes;

    return this;

  }

  /**
      @memberof Tree
      @desc Changes the orientation of the entire Tree, either "vertical" (top to bottom) or "horizontal" (left to right).
      @param {'vertical'|'horizontal'} [*value* = "vertical"] Accepts either "vertical" or "horizontal".
  */
  orient(_) {
    return arguments.length ? (this._orient = _, this) : this._orient;
  }

  /**
      @memberof Tree
      @desc If *value* is specified, sets the separation accessor to the specified function. If *value* is not specified, returns the current separation accessor.

From the [d3-hierarchy documentation](https://github.com/d3/d3-hierarchy#tree_separation):
> The separation accessor is used to separate neighboring nodes. The separation function is passed two nodes a and b, and must return the desired separation. The nodes are typically siblings, though the nodes may be more distantly related if the layout decides to place such nodes adjacent.
      @param {Function} [*value*]
      @example
function separation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}
  */
  separation(_) {
    return arguments.length ? (this._separation = _, this) : this._separation;
  }

}
