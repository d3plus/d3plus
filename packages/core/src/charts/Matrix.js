import {Axis} from "../components/index.js";
import {assign, elem} from "../dom/index.js";
import {Rect} from "../shape/index.js";
import {accessor, configPrep, getProp} from "../utils/index.js";

import Viz from "./Viz.js";
import prepData from "./helpers/matrixData.js";

const defaultAxisConfig = {
  align: "start",
  barConfig: {
    stroke: 0
  },
  gridSize: 0,
  padding: 5,
  paddingInner: 0,
  paddingOuter: 0,
  scale: "band",
  tickSize: 0
};

/**
    @class Matrix
    @extends Viz
    @desc Creates a simple rows/columns Matrix view of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/getting-started/) for help getting started using the Matrix class.
*/
export default class Matrix extends Viz {

  /**
    @memberof Matrix
    @desc Invoked when creating a new class instance, and sets any default parameters.
    @private
  */
  constructor() {

    super();

    this._cellPadding = 2;

    this._column = accessor("column");
    this._columnAxis = new Axis();
    this._columnConfig = assign({orient: "top"}, defaultAxisConfig);
    this._columnSort = (a, b) => `${a}`.localeCompare(`${b}`);

    this._label = (d, i) => `${getProp.bind(this)("row", d, i)} / ${getProp.bind(this)("column", d, i)}`;

    const defaultMouseMoveShape = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d, i, x, event) => {
      defaultMouseMoveShape(d, i, x, event);
      const row = getProp.bind(this)("row", d, i);
      const column = getProp.bind(this)("column", d, i);
      this.hover((h, ii) => getProp.bind(this)("row", h, ii) === row || getProp.bind(this)("column", h, ii) === column);
    };

    this._row = accessor("row");
    this._rowAxis = new Axis();
    this._rowConfig = assign({orient: "left"}, defaultAxisConfig);
    this._rowSort = (a, b) => `${a}`.localeCompare(`${b}`);

  }

  /**
      @memberof Matrix
      @desc Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    const {rowValues, columnValues, shapeData} = prepData.bind(this)(this._filteredData);

    if (!rowValues.length || !columnValues.length) return this;

    const height = this._height - this._margin.top - this._margin.bottom,
          parent = this._select,
          transition = this._transition,
          width = this._width - this._margin.left - this._margin.right;

    const hidden = {opacity: 0};
    const visible = {opacity: 1};

    const columnRotation = width / columnValues.length < 120;

    const selectElem = (name, opts) => elem(`g.d3plus-Matrix-${name}`, Object.assign({parent, transition}, opts)).node();

    this._rowAxis
      .select(selectElem("row", {enter: hidden, update: hidden}))
      .domain(rowValues)
      .height(height - this._margin.top - this._margin.bottom - this._padding.bottom - this._padding.top)
      .maxSize(width / 4)
      .width(width)
      .config(this._rowConfig)
      .render();

    const rowPadding = this._rowAxis.outerBounds().width;
    this._padding.left += rowPadding;
    let columnTransform = `translate(0, ${this._margin.top})`;
    const hiddenTransform = Object.assign({transform: columnTransform}, hidden);

    this._columnAxis
      .select(selectElem("column", {enter: hiddenTransform, update: hiddenTransform}))
      .domain(columnValues)
      .range([this._margin.left + this._padding.left, width - this._margin.right + this._padding.right])
      .height(height)
      .maxSize(height / 4)
      .width(width)
      .labelRotation(columnRotation)
      .config(this._columnConfig)
      .render();

    const columnPadding = this._columnAxis.outerBounds().height;
    this._padding.top += columnPadding;

    super._draw(callback);

    const rowTransform = `translate(${this._margin.left}, ${this._margin.top})`;
    columnTransform = `translate(0, ${this._margin.top})`;
    const visibleTransform = Object.assign({transform: columnTransform}, visible);

    this._rowAxis
      .select(selectElem("row", {update: Object.assign({transform: rowTransform}, visible)}))
      .height(height - this._margin.top - this._margin.bottom - this._padding.bottom)
      .maxSize(rowPadding)
      .range([columnPadding + this._columnAxis.padding(), undefined])
      .render();

    this._columnAxis
      .select(selectElem("column", {update: visibleTransform}))
      .range([this._margin.left + this._padding.left + this._rowAxis.padding(), width - this._margin.right + this._padding.right])
      .maxSize(columnPadding)
      .render();

    const rowScale = this._rowAxis._getPosition.bind(this._rowAxis);
    const columnScale = this._columnAxis._getPosition.bind(this._columnAxis);
    const cellHeight = rowValues.length > 1
      ? rowScale(rowValues[1]) - rowScale(rowValues[0])
      : this._rowAxis.height();
    const cellWidth = columnValues.length > 1
      ? columnScale(columnValues[1]) - columnScale(columnValues[0])
      : this._columnAxis.width();

    const transform = `translate(0, ${this._margin.top})`;
    const rectConfig = configPrep.bind(this)(this._shapeConfig, "shape", "Rect");

    this._shapes.push(new Rect()
      .data(shapeData)
      .select(elem("g.d3plus-Matrix-cells", {
        parent: this._select,
        enter: {transform},
        update: {transform}
      }).node())
      .config({
        height: cellHeight - this._cellPadding,
        width: cellWidth - this._cellPadding,
        x: d => columnScale(d.column) + cellWidth / 2,
        y: d => rowScale(d.row) + cellHeight / 2
      })
      .config(rectConfig)
      .render());

    return this;

  }

  /**
      @memberof Matrix
      @desc The pixel padding in between each cell.
      @param {Number} [*value* = 2]
  */
  cellPadding(_) {
    return arguments.length ? (this._cellPadding = _, this) : this._cellPadding;
  }

  /**
      @memberof Matrix
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
      @memberof Matrix
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the column labels.
      @param {Object} *value*
      @chainable
  */
  columnConfig(_) {
    return arguments.length ? (this._columnConfig = assign(this._columnConfig, _), this) : this._columnConfig;
  }

  /**
      @memberof Matrix
      @desc A manual list of IDs to be used for columns.
      @param {Array} [*value*]
  */
  columnList(_) {
    return arguments.length ? (this._columnList = _, this) : this._columnList;
  }

  /**
      @memberof Matrix
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
      @memberof Matrix
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
      @memberof Matrix
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the row labels.
      @param {Object} *value*
      @chainable
  */
  rowConfig(_) {
    return arguments.length ? (this._rowConfig = assign(this._rowConfig, _), this) : this._rowConfig;
  }

  /**
      @memberof Matrix
      @desc A manual list of IDs to be used for rows.
      @param {Array} [*value*]
  */
  rowList(_) {
    return arguments.length ? (this._rowList = _, this) : this._rowList;
  }

  /**
      @memberof Matrix
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
