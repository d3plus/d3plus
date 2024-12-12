import {extent, sum} from "d3-array";
import {nest} from "d3-collection";
import {interpolatePath} from "d3-interpolate-path";
import {select} from "d3-selection";
import * as paths from "d3-shape";

import {merge} from "../data/index.js";
import {constant} from "../utils/index.js";

import Shape from "./Shape.js";

/**
    @class Line
    @extends Shape
    @desc Creates SVG lines based on an array of data.
*/
export default class Line extends Shape {

  /**
      @memberof Line
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
  */
  constructor() {

    super();

    this._curve = constant("linear");
    this._defined = d => d;
    this._fill = constant("none");
    this._hitArea = constant({
      "d": d => this._path(d.values),
      "fill": "none",
      "stroke-width": 10,
      "transform": null
    });
    this._name = "Line";
    this._path = paths.line();
    this._stroke = constant("black");
    this._strokeWidth = constant(1);

  }

  /**
      @memberof Line
      @desc Filters/manipulates the data array before binding each point to an SVG group.
      @param {Array} [*data* = the data array to be filtered]
      @private
  */
  _dataFilter(data) {

    const lines = nest().key(this._id).entries(data).map(d => {

      d.data = merge(d.values);
      d.i = data.indexOf(d.values[0]);

      const x = extent(d.values, this._x);
      d.xR = x;
      d.width = x[1] - x[0];
      d.x = x[0] + d.width / 2;

      const y = extent(d.values, this._y);
      d.yR = y;
      d.height = y[1] - y[0];
      d.y = y[0] + d.height / 2;

      d.nested = true;
      d.translate = [d.x, d.y];
      d.__d3plusShape__ = true;

      return d;
    });

    lines.key = d => d.key;
    return lines;

  }

  /**
      @memberof Line
      @desc Draws the lines.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    super.render(callback);

    const that = this;

    /**
        @desc Calculates the stroke-dasharray used for animations
        @param {Object} *d* data point
        @private
    */
    function calculateStrokeDashArray(d) {

      d.initialLength = this.getTotalLength();

      let strokeArray = that._strokeDasharray(d.values[0], that._data.indexOf(d.values[0]))
        .split(" ").map(Number);

      if (strokeArray.length === 1 && strokeArray[0] === 0) strokeArray = [d.initialLength];
      else if (strokeArray.length === 1) strokeArray.push(strokeArray[0]);
      else if (strokeArray.length % 2) strokeArray = strokeArray.concat(strokeArray);

      const newStrokeArray = [];
      let strokeLength = 0;
      while (strokeLength < d.initialLength) {
        for (let i = 0; i < strokeArray.length; i++) {
          const num = strokeArray[i];
          strokeLength += num;
          newStrokeArray.push(num);
          if (strokeLength >= d.initialLength) break;
        }
      }

      if (newStrokeArray.length > 1 && newStrokeArray.length % 2) newStrokeArray.pop();
      newStrokeArray[newStrokeArray.length - 1] += d.initialLength - sum(newStrokeArray);
      if (newStrokeArray.length % 2 === 0) newStrokeArray.push(0);
      d.initialStrokeArray = newStrokeArray.join(" ");

    }

    const userCurve = this._curve.bind(this)(this.config());
    const curve = paths[`curve${userCurve.charAt(0).toUpperCase()}${userCurve.slice(1)}`];

    this._path
      .curve(curve)
      .defined(this._defined)
      .x(this._x)
      .y(this._y);

    const enter = this._enter.append("path")
      .attr("transform", d => `translate(${-d.xR[0] - d.width / 2}, ${-d.yR[0] - d.height / 2})`)
      .attr("d", d => this._path(d.values))
      .call(this._applyStyle.bind(this));

    let update = this._update.select("path")
      .attr("stroke-dasharray", d => that._strokeDasharray(d.values[0], that._data.indexOf(d.values[0])));

    if (this._duration) {
      enter
        .each(calculateStrokeDashArray)
        .attr("stroke-dasharray", d => `${d.initialStrokeArray} ${d.initialLength}`)
        .attr("stroke-dashoffset", d => d.initialLength)
        .transition(this._transition)
          .attr("stroke-dashoffset", 0);
      update = update.transition(this._transition)
        .attrTween("d", function(d) {
          return interpolatePath(select(this).attr("d"), that._path(d.values));
        });
      this._exit.selectAll("path")
        .each(calculateStrokeDashArray)
        .attr("stroke-dasharray", d => `${d.initialStrokeArray} ${d.initialLength}`)
        .transition(this._transition)
          .attr("stroke-dashoffset", d => -d.initialLength);

    }
    else {
      update = update
        .attr("d", d => that._path(d.values));
    }

    update
      .attr("transform", d => `translate(${-d.xR[0] - d.width / 2}, ${-d.yR[0] - d.height / 2})`)
      .call(this._applyStyle.bind(this));

    return this;

  }

  /**
      @memberof Line
      @desc Given a specific data point and index, returns the aesthetic properties of the shape.
      @param {Object} *data point*
      @param {Number} *index*
      @private
  */
  _aes(d, i) {
    return {points: d.values.map(p => [this._x(p, i), this._y(p, i)])};
  }

  /**
      @memberof Line
      @desc If *value* is specified, sets the area curve to the specified string and returns the current class instance. If *value* is not specified, returns the current area curve.
      @param {Function|String} [*value* = "linear"]
      @chainable
  */
  curve(_) {
    return arguments.length ? (this._curve = typeof _ === "function" ? _ : constant(_), this) : this._curve;
  }

  /**
      @memberof Line
      @desc If *value* is specified, sets the defined accessor to the specified function and returns the current class instance. If *value* is not specified, returns the current defined accessor.
      @param {Function} [*value*]
      @chainable
  */
  defined(_) {
    return arguments.length ? (this._defined = _, this) : this._defined;
  }

}
