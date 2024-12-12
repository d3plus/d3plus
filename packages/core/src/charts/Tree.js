import {extent, min, max} from "d3-array";
import {hierarchy, tree} from "d3-hierarchy";
import {scaleLinear} from "d3-scale";

import {assign, elem} from "../dom/index.js";
import {merge, nest} from "../data/index.js";
import {configPrep, constant} from "../utils/index.js";
import {Circle, Path} from "../shape/index.js";

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

    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d, i) =>  this._treeData ? `${this._treeData[i].depth}. ${this._drawLabel(d, i)}.` : "",
      labelConfig: {
        fontColor: "#444"
      },
      Path: {
        fill: "none",
        stroke: "#ccc",
        strokeWidth: 1
      },
      r: constant(5),
      width: constant(10),
      height: constant(10)
    });

    this._tree = tree();

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    super._draw(callback);

    const height = this._orient === "vertical"
            ? this._height - this._margin.top - this._margin.bottom
            : this._width - this._margin.left - this._margin.right,
          left = this._orient === "vertical" ? "left" : "top",
          that = this,
          transform = `translate(${this._margin.left}, ${this._margin.top})`,
          width = this._orient === "horizontal"
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
      this._orient === "vertical" ? 50 : 100,
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
      if (this._orient === "horizontal") {
        d.y = d.x;
        d.x = val;
      }
      else d.y = val;
    });

    const elemObject = {parent: this._select, enter: {transform}, update: {transform}};

    this._shapes.push(new Path()
      .data(treeData.filter(d => d.depth > 1))
      .select(elem("g.d3plus-Tree-Links", elemObject).node())
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Path"))
      .config({
        d: d => {

          let r = this._shapeConfig.r;

          if (typeof r === "function") r = r(d.data, d.i);

          const px = d.parent.x - d.x + (this._orient === "vertical" ? 0 : r),
                py = d.parent.y - d.y + (this._orient === "vertical" ? r : 0),
                x = this._orient === "vertical" ? 0 : -r,
                y = this._orient === "vertical" ? -r : 0;

          return this._orient === "vertical"
            ? `M${x},${y}C${x},${(y + py) / 2} ${px},${(y + py) / 2} ${px},${py}`
            : `M${x},${y}C${(x + px) / 2},${y} ${(x + px) / 2},${py} ${px},${py}`;

        },
        id: (d, i) => this._ids(d, i).join("-")
      })
      .render());

    this._shapes.push(new Circle()
      .data(treeData)
      .select(elem("g.d3plus-Tree-Shapes", elemObject).node())
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Circle"))
      .config({
        id: (d, i) => this._ids(d, i).join("-"),
        label: (d, i) => {
          if (this._label) return this._label(d.data, i);
          const ids = this._ids(d, i).slice(0, d.depth);
          return ids[ids.length - 1];
        },
        labelConfig: {
          textAnchor: d => this._orient === "vertical" ? "middle"
          : d.data.children && d.data.depth !== this._groupBy.length ? "end" : "start",
          verticalAlign: d => this._orient === "vertical" ? d.data.depth === 1 ? "bottom" : "top" : "middle"
        },
        hitArea: (d, i, s) => {

          const h = this._labelHeight,
                w = this._labelWidths[d.depth - 1];

          return {
            width: this._orient === "vertical" ? w : s.r * 2 + w,
            height: this._orient === "horizontal" ? h : s.r * 2 + h,
            x: this._orient === "vertical" ? -w / 2 : d.children && d.depth !== this._groupBy.length ? -(s.r + w) : -s.r,
            y: this._orient === "horizontal" ? -h / 2 : d.children && d.depth !== this._groupBy.length ? -(s.r + this._labelHeight) : -s.r
          };

        },
        labelBounds: (d, i, s) => {

          const h = this._labelHeight,
                height = this._orient === "vertical" ? "height" : "width",
                w = this._labelWidths[d.depth - 1],
                width = this._orient === "vertical" ? "width" : "height",
                x = this._orient === "vertical" ? "x" : "y",
                y = this._orient === "vertical" ? "y" : "x";

          return {
            [width]: w,
            [height]: h,
            [x]: -w / 2,
            [y]: d.children && d.depth !== this._groupBy.length ? -(s.r + h) : s.r
          };

        }
      })
      .render());

    return this;

  }

  /**
      @memberof Tree
      @desc If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.
      @param {String} [*value* = "vertical"] Accepts either "vertical" or "horizontal".
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
