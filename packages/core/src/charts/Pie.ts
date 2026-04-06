import {min} from "d3-array";
import {arc, pie} from "d3-shape";

import {Path} from "../shapes/index.js";
import {assign, elem} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import {accessor, configPrep} from "../utils/index.js";
import Viz from "./Viz.js";

/**
    Uses the [d3 pie layout](https://github.com/d3/d3-shape#pies) to creates SVG arcs based on an array of data.
*/
export default class Pie extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    const defaultLegend = this._legend;
    this._legend = (config: Record<string, unknown>, arr: DataPoint[]) => {
      if (arr.length === this._filteredData.length) return false;
      return defaultLegend.bind(this)(config, arr);
    };
    this._legendSort = (a: DataPoint, b: DataPoint) =>
      this._value(b) - this._value(a);

    this._shapeConfig = assign(this._shapeConfig, {
      ariaLabel: (d: DataPoint, i: number) =>
        this._pieData
          ? `${++this._pieData[i].index}. ${this._drawLabel(d, i)}, ${this._value(d, i)}.`
          : "",
      Path: {
        labelConfig: {
          fontResize: true,
        },
      },
    });
    this._innerRadius = 0;
    this._legendSort = (a: DataPoint, b: DataPoint) =>
      this._value(b) - this._value(a);
    this._padPixel = 0;
    this._pie = pie();
    this._sort = (a: DataPoint, b: DataPoint) =>
      this._value(b) - this._value(a);
    this._value = accessor("value");
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback?: () => void): this {
    (super._draw as (...args: unknown[]) => unknown)(callback);

    const height = this._height - this._margin.top - this._margin.bottom,
      width = this._width - this._margin.left - this._margin.right;

    const outerRadius = min([width, height])! / 2;

    const pieData = (this._pieData = this._pie
      .padAngle(this._padAngle || this._padPixel / outerRadius)
      .sort(this._sort)
      .value(this._value)(this._filteredData));

    pieData.forEach((d: Record<string, unknown>, i: number) => {
      d.__d3plus__ = true;
      d.i = i;
    });

    const arcData = arc()
      .innerRadius(this._innerRadius)
      .outerRadius(outerRadius);

    const transform = `translate(${width / 2 + this._margin.left}, ${height / 2 + this._margin.top})`;
    this._shapes.push(
      new Path()
        .data(pieData)
        .d(arcData as unknown as (d: DataPoint) => string)
        .select(
          elem("g.d3plus-Pie", {
            parent: this._select,
            enter: {transform},
            update: {transform},
          }).node(),
        )
        .config({
          id: (d: DataPoint) => this._ids(d).join("-"),
          x: 0,
          y: 0,
        })
        .label(this._drawLabel)
        .config(configPrep.bind(this)(this._shapeConfig, "shape", "Path"))
        .render(),
    );

    return this;
  }

  /**
      The pixel value, or function that returns a pixel value, that is used as the inner radius of the Pie (creating a Donut).
*/
  innerRadius(_?: number | (() => number)): this | number | (() => number) {
    return arguments.length
      ? ((this._innerRadius = _), this)
      : this._innerRadius;
  }

  /**
      The padding between each arc, set as a radian value between \`0\` and \`1\`.

If set, this will override any previously set padPixel value.
*/
  padAngle(_?: number): this | number {
    return arguments.length ? ((this._padAngle = _), this) : this._padAngle;
  }

  /**
      The padding between each arc, set as a pixel number value.

By default the value is \`0\`, which shows no padding between each arc.

If \`padAngle\` is defined, the \`padPixel\` value will not be considered.
*/
  padPixel(_?: number): this | number {
    return arguments.length ? ((this._padPixel = _!), this) : this._padPixel;
  }

  /**
      A comparator function that sorts the Pie slices.
*/
  sort(_?: (...args: unknown[]) => unknown): this | ((...args: unknown[]) => unknown) {
    return arguments.length ? ((this._sort = _), this) : this._sort;
  }

  /**
      The accessor key for each data point used to calculate the size of each Pie section.
  */
  value(
    _?: string | ((d: DataPoint, i: number) => number),
  ): this | string | ((d: DataPoint, i: number) => number) {
    return arguments.length
      ? ((this._value = typeof _ === "function" ? _ : accessor(_)), this)
      : this._value;
  }
}
