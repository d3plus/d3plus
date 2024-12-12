import {min} from "d3-array";
import {arc} from "d3-shape";

import {assign, elem} from "../dom/index.js";
import {Path} from "../shape/index.js";
import {TextBox} from "../text/index.js";
import {accessor, configPrep, constant, getProp} from "../utils/index.js";

import Viz from "./Viz.js";
import prepData from "./helpers/matrixData.js";

const tau = Math.PI * 2;

/**
    @class RadialMatrix
    @extends Viz
    @desc Creates a radial layout of a rows/columns Matrix of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/radial-matrix/) for help getting started using the Matrix class.
*/
export default class RadialMatrix extends Viz {

  /**
    @memberof RadialMatrix
    @desc Invoked when creating a new class instance, and sets any default parameters.
    @private
  */
  constructor() {

    super();

    this._cellPadding = 2;

    this._column = accessor("column");
    this._columnConfig = {
      shapeConfig: {
        labelConfig: {
          fontColor: "#000",
          padding: 5,
          textAnchor: d => [0, 180].includes(d.angle) ? "middle" : [2, 3].includes(d.quadrant) ? "end" : "start",
          verticalAlign: d => [90, 270].includes(d.angle) ? "middle" : [2, 1].includes(d.quadrant) ? "bottom" : "top"
        }
      }
    };
    this._columnSort = (a, b) => `${a}`.localeCompare(`${b}`);
    this._innerRadius = radius => radius / 5;

    this._label = (d, i) => `${getProp.bind(this)("row", d, i)} / ${getProp.bind(this)("column", d, i)}`;

    const defaultMouseMoveShape = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d, i, x, event) => {
      defaultMouseMoveShape(d, i, x, event);
      const row = getProp.bind(this)("row", d, i);
      const column = getProp.bind(this)("column", d, i);
      this.hover((h, ii) => getProp.bind(this)("row", h, ii) === row || getProp.bind(this)("column", h, ii) === column);
    };

    this._row = accessor("row");
    this._rowSort = (a, b) => `${a}`.localeCompare(`${b}`);

    this._columnLabels = new TextBox();

  }

  /**
      @memberof RadialMatrix
      @desc Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    const {rowValues, columnValues, shapeData} = prepData.bind(this)(this._filteredData);

    if (!rowValues.length || !columnValues.length) return this;

    super._draw(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
          parent = this._select,
          transition = this._transition,
          width = this._width - this._margin.left - this._margin.right;

    const labelHeight = 50, labelWidth = 100;
    const radius = min([height - labelHeight * 2, width - labelWidth * 2]) / 2,
          transform = `translate(${width / 2 + this._margin.left}, ${height / 2 + this._margin.top})`;


    const flippedColumns = columnValues.slice().reverse();
    flippedColumns.unshift(flippedColumns.pop());
    const total = flippedColumns.length;

    const labelData = flippedColumns
      .map((key, i) => {

        const radians = i / total * tau;
        const angle = Math.round(radians * 180 / Math.PI);
        const quadrant = Math.floor((angle + 90) / 90 % 4 + 1);

        const xMod = [0, 180].includes(angle) ? -labelWidth / 2 : [2, 3].includes(quadrant) ? -labelWidth : 0;
        const yMod = [90, 270].includes(angle) ? -labelHeight / 2 : [2, 1].includes(quadrant) ? -labelHeight : 0;

        return {
          key, angle, quadrant, radians,
          x: radius * Math.sin(radians + Math.PI) + xMod,
          y: radius * Math.cos(radians + Math.PI) + yMod
        };
      });

    /**
     * Extracts the axis config "labels" Array, if it exists, it filters
     * the column labels by the values included in the Array.
     */
    const displayLabels = this._columnConfig.labels instanceof Array
      ? labelData.filter(d => this._columnConfig.labels.includes(d.key))
      : labelData;

    this._columnLabels
      .data(displayLabels)
      .x(d => d.x)
      .y(d => d.y)
      .text(d => d.key)
      .width(labelWidth)
      .height(labelHeight)
      .config(this._columnConfig.shapeConfig.labelConfig)
      .select(
        elem("g.d3plus-RadialMatrix-columns", {
          parent, transition,
          enter: {transform},
          update: {transform}
        }).node()
      )
      .render();


    const innerRadius = this._innerRadius(radius);
    const rowHeight = (radius - innerRadius) / rowValues.length;
    const columnWidth = labelData.length > 1 ? labelData[1].radians - labelData[0].radians : tau;
    const flippedRows = rowValues.slice().reverse();

    const arcData = arc()
      .padAngle(this._cellPadding / radius)
      .innerRadius(d => innerRadius + flippedRows.indexOf(d.row) * rowHeight + this._cellPadding / 2)
      .outerRadius(d => innerRadius + (flippedRows.indexOf(d.row) + 1) * rowHeight - this._cellPadding / 2)
      .startAngle(d => labelData[columnValues.indexOf(d.column)].radians - columnWidth / 2)
      .endAngle(d => labelData[columnValues.indexOf(d.column)].radians + columnWidth / 2);

    this._shapes.push(new Path()
      .data(shapeData)
      .d(arcData)
      .select(elem("g.d3plus-RadialMatrix-arcs", {
        parent, transition,
        enter: {transform},
        update: {transform}
      }).node())
      .config({
        id: d => this._ids(d).join("-"),
        x: 0,
        y: 0
      })
      .config(configPrep.bind(this)(this._shapeConfig, "shape", "Path"))
      .render());

    return this;

  }

  /**
      @memberof RadialMatrix
      @desc The pixel padding in between each cell.
      @param {Number} [*value* = 2]
  */
  cellPadding(_) {
    return arguments.length ? (this._cellPadding = _, this) : this._cellPadding;
  }

  /**
      @memberof RadialMatrix
      @desc Determines which key in your data should be used for each column in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's column value.
      @param {String|Function} [*value*]
      @example
function column(d) {
  return d.name;
}
  */
  column(_) {
    return arguments.length ? (this._column = typeof _ === "function" ? _ : accessor(_), this) : this._column;
  }

  /**
      @memberof RadialMatrix
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the column labels.
      @param {Object} *value*
      @chainable
  */
  columnConfig(_) {
    return arguments.length ? (this._columnConfig = assign(this._columnConfig, _), this) : this._columnConfig;
  }

  /**
      @memberof RadialMatrix
      @desc A manual list of IDs to be used for columns.
      @param {Array} [*value*]
  */
  columnList(_) {
    return arguments.length ? (this._columnList = _, this) : this._columnList;
  }

  /**
      @memberof RadialMatrix
      @desc A sort comparator function that is run on the unique set of column values.
      @param {Function} [*value*]
      @example
function column(a, b) {
  return a.localeCompare(b);
}
  */
  columnSort(_) {
    return arguments.length ? (this._columnSort = _, this) : this._columnSort;
  }

  /**
      @memberof RadialMatrix
      @desc The radius (in pixels) for the inner donut hole of the diagram. Can either be a static Number, or an accessor function that receives the outer radius as it's only argument.
      @param {Function|Number} [*value*]
      @example
function(outerRadius) {
  return outerRadius / 5;
}
  */
  innerRadius(_) {
    return arguments.length ? (this._innerRadius = typeof _ === "function" ? _ : constant(_), this) : this._innerRadius;
  }

  /**
      @memberof RadialMatrix
      @desc Determines which key in your data should be used for each row in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's row value.
      @param {String|Function} [*value*]
      @example
function row(d) {
  return d.name;
}
  */
  row(_) {
    return arguments.length ? (this._row = typeof _ === "function" ? _ : accessor(_), this) : this._row;
  }

  /**
      @memberof RadialMatrix
      @desc A manual list of IDs to be used for rows.
      @param {Array} [*value*]
  */
  rowList(_) {
    return arguments.length ? (this._rowList = _, this) : this._rowList;
  }

  /**
      @memberof RadialMatrix
      @desc A sort comparator function that is run on the unique set of row values.
      @param {Function} [*value*]
      @example
function row(a, b) {
  return a.localeCompare(b);
}
  */
  rowSort(_) {
    return arguments.length ? (this._rowSort = _, this) : this._rowSort;
  }

}
