import {extent} from "d3-array";
import {nest} from "d3-collection";
import {interpolatePath} from "d3-interpolate-path";
import {select} from "d3-selection";
import * as paths from "d3-shape";

import {merge} from "../data/index.js";
import {largestRect} from "../math/index.js";
import {accessor, constant} from "../utils/index.js";

import Shape from "./Shape.js";

/**
    @class Area
    @extends Shape
    @desc Creates SVG areas based on an array of data.
*/
export default class Area extends Shape {

  /**
      @memberof Area
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {

    super();

    this._curve = constant("linear");
    this._defined = () => true;
    this._labelBounds = (d, i, aes) => {
      const r = largestRect(aes.points);
      if (!r) return null;
      return {angle: r.angle, width: r.width, height: r.height, x: r.cx - r.width / 2 - this._x(d, i), y: r.cy - r.height / 2 - this._y(d, i)};
    };
    this._labelConfig = Object.assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle"
    });
    this._name = "Area";
    this._x = accessor("x");
    this._x0 = accessor("x");
    this._x1 = null;
    this._y = constant(0);
    this._y0 = constant(0);
    this._y1 = accessor("y");

  }

  /**
      @memberof Area
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes(d) {
    const values = d.values.slice().sort((a, b) => this._y1 ? this._x(a) - this._x(b) : this._y(a) - this._y(b));
    const points1 = values.map((v, z) => [this._x0(v, z), this._y0(v, z)]);
    const points2 = values.reverse().map((v, z) => this._y1 ? [this._x(v, z), this._y1(v, z)] : [this._x1(v, z), this._y(v, z)]);
    let points = points1.concat(points2);
    if (points1[0][1] > points2[0][1]) points = points.reverse();
    points.push(points[0]);
    return {points};
  }

  /**
      @memberof Area
      @desc Filters/manipulates the data array before binding each point to an SVG group.
      @param {Array} [*data* = the data array to be filtered]
      @private
  */
  _dataFilter(data) {

    const areas = nest().key(this._id).entries(data).map(d => {

      d.data = merge(d.values);
      d.i = data.indexOf(d.values[0]);

      const x = extent(d.values.map(this._x)
        .concat(d.values.map(this._x0))
        .concat(this._x1 ? d.values.map(this._x1) : [])
      );
      d.xR = x;
      d.width = x[1] - x[0];
      d.x = x[0] + d.width / 2;

      const y = extent(d.values.map(this._y)
        .concat(d.values.map(this._y0))
        .concat(this._y1 ? d.values.map(this._y1) : [])
      );
      d.yR = y;
      d.height = y[1] - y[0];
      d.y = y[0] + d.height / 2;

      d.nested = true;
      d.translate = [d.x, d.y];
      d.__d3plusShape__ = true;

      return d;
    });

    areas.key = d => d.key;
    return areas;

  }

  /**
      @memberof Area
      @desc Draws the area polygons.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    super.render(callback);

    const userCurve = this._curve.bind(this)(this.config());
    const curve = paths[`curve${userCurve.charAt(0).toUpperCase()}${userCurve.slice(1)}`];

    const path = this._path = paths.area()
      .defined(this._defined)
      .curve(curve)
      .x(this._x).x0(this._x0).x1(this._x1)
      .y(this._y).y0(this._y0).y1(this._y1);

    const exitPath = paths.area()
      .defined(d => d)
      .curve(curve)
      .x(this._x).y(this._y)
      .x0((d, i) => this._x1 ? this._x0(d, i) + (this._x1(d, i) - this._x0(d, i)) / 2 : this._x0(d, i))
      .x1((d, i) => this._x1 ? this._x0(d, i) + (this._x1(d, i) - this._x0(d, i)) / 2 : this._x0(d, i))
      .y0((d, i) => this._y1 ? this._y0(d, i) + (this._y1(d, i) - this._y0(d, i)) / 2 : this._y0(d, i))
      .y1((d, i) => this._y1 ? this._y0(d, i) + (this._y1(d, i) - this._y0(d, i)) / 2 : this._y0(d, i));

    this._enter.append("path")
      .attr("transform", d => `translate(${-d.xR[0] - d.width / 2}, ${-d.yR[0] - d.height / 2})`)
      .attr("d", d => exitPath(d.values))
      .call(this._applyStyle.bind(this))
      .transition(this._transition)
        .attrTween("d", function(d) {
          return interpolatePath(select(this).attr("d"), path(d.values));
        });

    this._update.select("path").transition(this._transition)
      .attr("transform", d => `translate(${-d.xR[0] - d.width / 2}, ${-d.yR[0] - d.height / 2})`)
      .attrTween("d", function(d) {
        return interpolatePath(select(this).attr("d"), path(d.values));
      })
      .call(this._applyStyle.bind(this));

    this._exit.select("path").transition(this._transition)
      .attrTween("d", function(d) {
        return interpolatePath(select(this).attr("d"), exitPath(d.values));
      });

    return this;

  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the area curve to the specified string and returns the current class instance. If *value* is not specified, returns the current area curve.
      @param {Function|String} [*value* = "linear"]
      @chainable
  */
  curve(_) {
    return arguments.length ? (this._curve = typeof _ === "function" ? _ : constant(_), this) : this._curve;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the defined accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current defined accessor.
      @param {Function} [*value*]
      @chainable
  */
  defined(_) {
    return arguments.length ? (this._defined = _, this) : this._defined;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x accessor.
      @param {Function|Number} [*value*]
      @chainable
  */
  x(_) {
    if (!arguments.length) return this._x;
    this._x = typeof _ === "function" ? _ : constant(_);
    this._x0 = this._x;
    return this;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the x0 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x0 accessor.
      @param {Function|Number} [*value*]
      @chainable
  */
  x0(_) {
    if (!arguments.length) return this._x0;
    this._x0 = typeof _ === "function" ? _ : constant(_);
    this._x = this._x0;
    return this;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the x1 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current x1 accessor.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  x1(_) {
    return arguments.length ? (this._x1 = typeof _ === "function" || _ === null ? _ : constant(_), this) : this._x1;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y accessor.
      @param {Function|Number} [*value*]
      @chainable
  */
  y(_) {
    if (!arguments.length) return this._y;
    this._y = typeof _ === "function" ? _ : constant(_);
    this._y0 = this._y;
    return this;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the y0 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y0 accessor.
      @param {Function|Number} [*value*]
      @chainable
  */
  y0(_) {
    if (!arguments.length) return this._y0;
    this._y0 = typeof _ === "function" ? _ : constant(_);
    this._y = this._y0;
    return this;
  }

  /**
      @memberof Area
      @desc If *value* is specified, sets the y1 accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current y1 accessor.
      @param {Function|Number|null} [*value*]
      @chainable
  */
  y1(_) {
    return arguments.length ? (this._y1 = typeof _ === "function" || _ === null ? _ : constant(_), this) : this._y1;
  }

}
