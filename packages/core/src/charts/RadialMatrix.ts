import {min} from "d3-array";
import {arc} from "d3-shape";
import type {DefaultArcObject} from "d3-shape";

import {colorContrast} from "@d3plus/color";
import {assign, backgroundColor, elem} from "@d3plus/dom";

/** Extended arc datum with row/column properties for the radial matrix. */
interface MatrixArcDatum extends DefaultArcObject {
  row: string;
  column: string;
}
import {TextBox} from "../components/index.js";
import {accessor, constant, getProp} from "../utils/index.js";

import {installFluent} from "../fluent.js";
import {radialMatrixDef} from "./ChartDefinition.js";
import Viz from "./Viz.js";
import prepData from "./helpers/matrixData.js";

// E4: RadialMatrix's identity-coerce accessors.
const radialMatrixSchema = [
  {key: "columnList", coerce: "identity" as const},
  {key: "columnSort", coerce: "identity" as const},
  {key: "rowList", coerce: "identity" as const},
  {key: "rowSort", coerce: "identity" as const},
];

const tau = Math.PI * 2;

/**
    Creates a radial layout of a rows/columns Matrix of any dataset. See [this example](https://d3plus.org/examples/d3plus-matrix/radial-matrix/) for help getting started using the Matrix class.
*/
export default class RadialMatrix extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
    Invoked when creating a new class instance, and sets any default parameters.
    @private
  */
  constructor() {
    super();

    // E3: scalar defaults sourced from radialMatrixDef.
    this._cellPadding = radialMatrixDef.defaults.cellPadding as number;

    this._column = radialMatrixDef.defaults.column;
    this._columnConfig = {
      shapeConfig: {
        labelConfig: {
          fontColor: () => {
            const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
            return colorContrast(bg);
          },
          padding: 5,
          textAnchor: (d: any) =>
            [0, 180].includes(d.angle)
              ? "middle"
              : [2, 3].includes(d.quadrant)
                ? "end"
                : "start",
          verticalAlign: (d: any) =>
            [90, 270].includes(d.angle)
              ? "middle"
              : [2, 1].includes(d.quadrant)
                ? "bottom"
                : "top",
        },
      },
    };
    const columnSortDefault = (a: any, b: any) => `${a}`.localeCompare(`${b}`);
    this._innerRadius = (radius: any) => radius / 5;

    this._label = (d: any, i: any) =>
      `${getProp.bind(this)("row", d, i)} / ${getProp.bind(this)("column", d, i)}`;

    const defaultMouseMoveShape = this._on["mousemove.shape"];
    this._on["mousemove.shape"] = (d: any, i: any, x: any, event: any) => {
      defaultMouseMoveShape(d, i, x, event);
      const row = getProp.bind(this)("row", d, i);
      const column = getProp.bind(this)("column", d, i);
      this.hover(
        (h, ii) =>
          getProp.bind(this)("row", h, ii) === row ||
          getProp.bind(this)("column", h, ii) === column,
      );
    };

    this._row = radialMatrixDef.defaults.row;
    const rowSortDefault = (a: any, b: any) => `${a}`.localeCompare(`${b}`);

    this._columnLabels = new TextBox();

    // E4: install RadialMatrix's identity-coerce accessors with localeCompare
    // defaults for the sorts.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, radialMatrixSchema, {
      columnSort: columnSortDefault,
      rowSort: rowSortDefault,
    });
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback?: () => void) {
    const {rowValues, columnValues, shapeData} = prepData.bind(this)(
      this._filteredData,
    );

    if (!rowValues.length || !columnValues.length) return this;

    (super._draw as (...args: unknown[]) => unknown)(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
      parent = this._select,
      transition = this._transition,
      width = this._width - this._margin.left - this._margin.right;

    const labelHeight = 50,
      labelWidth = 100;
    const radius = min([height - labelHeight * 2, width - labelWidth * 2])! / 2,
      transform = `translate(${width / 2 + this._margin.left}, ${height / 2 + this._margin.top})`;

    const flippedColumns = columnValues.slice().reverse();
    flippedColumns.unshift(flippedColumns.pop()!);
    const total = flippedColumns.length;

    const labelData = flippedColumns.map((key, i) => {
      const radians = (i / total) * tau;
      const angle = Math.round((radians * 180) / Math.PI);
      const quadrant = Math.floor((((angle + 90) / 90) % 4) + 1);

      const xMod = [0, 180].includes(angle)
        ? -labelWidth / 2
        : [2, 3].includes(quadrant)
          ? -labelWidth
          : 0;
      const yMod = [90, 270].includes(angle)
        ? -labelHeight / 2
        : [2, 1].includes(quadrant)
          ? -labelHeight
          : 0;

      return {
        key,
        angle,
        quadrant,
        radians,
        x: radius * Math.sin(radians + Math.PI) + xMod,
        y: radius * Math.cos(radians + Math.PI) + yMod,
      };
    });

    /**
     * Extracts the axis config "labels" Array, if it exists, it filters
     * the column labels by the values included in the Array.
     */
    const displayLabels =
      this._columnConfig.labels instanceof Array
        ? labelData.filter(d => this._columnConfig.labels.includes(d.key))
        : labelData;

    this._columnLabels
      .data(displayLabels)
      .x((d: any) => d.x)
      .y((d: any) => d.y)
      .text((d: any) => d.key)
      .width(labelWidth)
      .height(labelHeight)
      .config(this._columnConfig.shapeConfig.labelConfig)
      .select(
        elem("g.d3plus-RadialMatrix-columns", {
          parent,
          transition,
          enter: {transform},
          update: {transform},
        }).node(),
      )
      .render();

    const innerRadius = this._innerRadius(radius);
    const rowHeight = (radius - innerRadius) / rowValues.length;
    const columnWidth =
      labelData.length > 1 ? labelData[1].radians - labelData[0].radians : tau;
    const flippedRows = rowValues.slice().reverse();

    const arcData = arc<MatrixArcDatum>()
      .padAngle(this._cellPadding / radius)
      .innerRadius(
        d =>
          innerRadius +
          flippedRows.indexOf(d.row) * rowHeight +
          this._cellPadding / 2,
      )
      .outerRadius(
        d =>
          innerRadius +
          (flippedRows.indexOf(d.row) + 1) * rowHeight -
          this._cellPadding / 2,
      )
      .startAngle(
        d =>
          labelData[columnValues.indexOf(d.column)].radians - columnWidth / 2,
      )
      .endAngle(
        d =>
          labelData[columnValues.indexOf(d.column)].radians + columnWidth / 2,
      );

    // Scene cells via `radialMatrixDef.emit`.
    this._radialMatrixCtx = {arcData};
    this._chartScene = radialMatrixDef.emit({viz: this, shapeData} as any);
    this._chartTransform = {x: width / 2 + this._margin.left, y: height / 2 + this._margin.top};
    return this;
  }

  /**
      The pixel padding in between each cell.
*/
  cellPadding(_: any) {
    return arguments.length
      ? ((this._cellPadding = _), this)
      : this._cellPadding;
  }

  /**
      Determines which key in your data should be used for each column in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's column value.

@example
function column(d) {
  return d.name;
}
  */
  column(_: any) {
    return arguments.length
      ? ((this._column = typeof _ === "function" ? _ : accessor(_)), this)
      : this._column;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the column labels.
*/
  columnConfig(_: any) {
    return arguments.length
      ? ((this._columnConfig = assign(this._columnConfig, _)), this)
      : this._columnConfig;
  }

  /**
      A manual list of IDs to be used for rows.
*/
  // columnList() generated by installFluent(radialMatrixSchema).

  /**
      A sort comparator function that is run on the unique set of column values.

@example
function column(a, b) {
  return a.localeCompare(b);
}
  */
  // columnSort() generated by installFluent(radialMatrixSchema).

  /**
      The radius (in pixels) for the inner donut hole of the diagram. Can either be a static Number, or an accessor function that receives the outer radius as it's only argument.

@example
function(outerRadius) {
  return outerRadius / 5;
}
  */
  innerRadius(_: any) {
    return arguments.length
      ? ((this._innerRadius = typeof _ === "function" ? _ : constant(_)), this)
      : this._innerRadius;
  }

  /**
      Determines which key in your data should be used for each row in the matrix. Can be either a String that matches a key used in every data point, or an accessor function that receives a data point and it's index in the data array, and is expected to return it's row value.

@example
function row(d) {
  return d.name;
}
  */
  row(_: any) {
    return arguments.length
      ? ((this._row = typeof _ === "function" ? _ : accessor(_)), this)
      : this._row;
  }

  /**
      A manual list of IDs to be used for rows.
*/
  // rowList() generated by installFluent(radialMatrixSchema).

  /**
      A sort comparator function that is run on the unique set of row values.

@example
function row(a, b) {
  return a.localeCompare(b);
}
  */
  // rowSort() generated by installFluent(radialMatrixSchema).
}
