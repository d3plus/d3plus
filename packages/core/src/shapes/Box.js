import {max, min, quantile} from "d3-array";
import {nest} from "d3-collection";
import {select} from "d3-selection";

import {merge} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";

import Circle from "./Circle.js";
import Rect from "./Rect.js";
import Whisker from "./Whisker.js";

const shapes = {Circle, Rect};

/**
    @class Box
    @extends BaseClass
    @desc Creates SVG box based on an array of data.
*/
export default class Box extends BaseClass {

  /**
      @memberof Box
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from BaseClass.
      @private
  */
  constructor() {

    super();

    this._medianConfig = {
      fill: constant("black")
    };
    this._orient = accessor("orient", "vertical");
    this._outlier = accessor("outlier", "Circle");
    this._outlierConfig = {
      Circle: {
        r: accessor("r", 5)
      },
      Rect: {
        height: (d, i) => this._orient(d, i) === "vertical" ? 5 : 20,
        width: (d, i) => this._orient(d, i) === "vertical" ? 20 : 5
      }
    };
    this._rectConfig = {
      fill: constant("white"),
      stroke: constant("black"),
      strokeWidth: constant(1)
    };
    this._rectWidth = constant(50);
    this._whiskerConfig = {};
    this._whiskerMode = ["tukey", "tukey"];
    this._x = accessor("x", 250);
    this._y = accessor("y", 250);

  }

  /**
      @memberof Box
      @desc Draws the Box.
      @param {Function} [*callback*]
      @chainable
  */
  render() {

    if (this._select === void 0) {
      this.select(select("body").append("svg")
        .style("width", `${window.innerWidth}px`)
        .style("height", `${window.innerHeight}px`)
        .style("display", "block").node());
    }

    const outlierData = [];

    const filteredData = nest()
      .key((d, i) => this._orient(d, i) === "vertical" ? this._x(d, i) : this._y(d, i))
      .entries(this._data)
      .map(d => {
        d.data = merge(d.values);
        d.i = this._data.indexOf(d.values[0]);
        d.orient = this._orient(d.data, d.i);
        const values = d.values.map(d.orient === "vertical" ? this._y : this._x);
        values.sort((a, b) => a - b);

        d.first = quantile(values, 0.25);
        d.median = quantile(values, 0.50);
        d.third = quantile(values, 0.75);

        const mode = this._whiskerMode;

        if (mode[0] === "tukey") {
          d.lowerLimit = d.first - (d.third - d.first) * 1.5;
          if (d.lowerLimit < min(values)) d.lowerLimit = min(values);
        }
        else if (mode[0] === "extent") d.lowerLimit = min(values);
        else if (typeof mode[0] === "number") d.lowerLimit = quantile(values, mode[0]);

        if (mode[1] === "tukey") {
          d.upperLimit = d.third + (d.third - d.first) * 1.5;
          if (d.upperLimit > max(values)) d.upperLimit = max(values);
        }
        else if (mode[1] === "extent") d.upperLimit = max(values);
        else if (typeof mode[1] === "number") d.upperLimit = quantile(values, mode[1]);

        const rectLength = d.third - d.first;

        // Compute values for vertical orientation.
        if (d.orient === "vertical") {
          d.height = rectLength;
          d.width = this._rectWidth(d.data, d.i);
          d.x = this._x(d.data, d.i);
          d.y = d.first + rectLength / 2;
        }
        else if (d.orient === "horizontal") {
        // Compute values for horizontal orientation.
          d.height = this._rectWidth(d.data, d.i);
          d.width = rectLength;
          d.x = d.first + rectLength / 2;
          d.y = this._y(d.data, d.i);
        }

        // Compute data for outliers.
        d.values.forEach((eachValue, index) => {
          const value = d.orient === "vertical" ? this._y(eachValue, index) : this._x(eachValue, index);

          if (value < d.lowerLimit || value > d.upperLimit) {
            const dataObj = {};
            dataObj.__d3plus__ = true;
            dataObj.data = eachValue;
            dataObj.i = index;
            dataObj.outlier = this._outlier(eachValue, index);

            if (d.orient === "vertical") {
              dataObj.x = d.x;
              dataObj.y = value;
              outlierData.push(dataObj);
            }
            else if (d.orient === "horizontal") {
              dataObj.y = d.y;
              dataObj.x = value;
              outlierData.push(dataObj);
            }
          }

        });

        d.__d3plus__ = true;

        return d;
      });

    // Draw box.
    this._box = new Rect()
      .data(filteredData)
      .x(d => d.x)
      .y(d => d.y)
      .select(elem("g.d3plus-Box", {parent: this._select}).node())
      .config(configPrep.bind(this)(this._rectConfig, "shape"))
      .render();

    // Draw median.
    this._median = new Rect()
      .data(filteredData)
      .x(d => d.orient === "vertical" ? d.x : d.median)
      .y(d => d.orient === "vertical" ? d.median : d.y)
      .height(d => d.orient === "vertical" ? 1 : d.height)
      .width(d => d.orient === "vertical" ? d.width : 1)
      .select(elem("g.d3plus-Box-Median", {parent: this._select}).node())
      .config(configPrep.bind(this)(this._medianConfig, "shape"))
      .render();

    // Draw 2 lines using Whisker class.
    // Construct coordinates for whisker startpoints and push it to the whiskerData.
    const whiskerData = [];
    filteredData.forEach((d, i) => {
      const x = d.x;
      const y = d.y;
      const topLength = d.first - d.lowerLimit;
      const bottomLength = d.upperLimit - d.third;

      if (d.orient === "vertical") {
        const topY = y - d.height / 2;
        const bottomY = y + d.height / 2;
        whiskerData.push(
          {__d3plus__: true, data: d, i, x, y: topY, length: topLength, orient: "top"},
          {__d3plus__: true, data: d, i, x, y: bottomY, length: bottomLength, orient: "bottom"}
        );
      }
      else if (d.orient === "horizontal") {
        const topX = x + d.width / 2;
        const bottomX = x - d.width / 2;
        whiskerData.push(
          {__d3plus__: true, data: d, i, x: topX, y, length: bottomLength, orient: "right"},
          {__d3plus__: true, data: d, i, x: bottomX, y, length: topLength, orient: "left"}
        );
      }

    });

    // Draw whiskers.
    this._whisker = new Whisker()
      .data(whiskerData)
      .select(elem("g.d3plus-Box-Whisker", {parent: this._select}).node())
      .config(configPrep.bind(this)(this._whiskerConfig, "shape"))
      .render();

    // Draw outliers.
    this._whiskerEndpoint = [];
    nest()
      .key(d => d.outlier)
      .entries(outlierData)
      .forEach(shapeData => {
        const shapeName = shapeData.key;
        this._whiskerEndpoint.push(new shapes[shapeName]()
          .data(shapeData.values)
          .select(elem(`g.d3plus-Box-Outlier-${shapeName}`, {parent: this._select}).node())
          .config(configPrep.bind(this)(this._outlierConfig, "shape", shapeName))
          .render());
      });

    return this;
  }

  /**
      @memberof Box
      @desc Sets the highlight accessor to the Shape class's active function.
      @param {Function} [*value*]
      @chainable
  */
  active(_) {
    if (this._box) this._box.active(_);
    if (this._median) this._median.active(_);
    if (this._whisker) this._whisker.active(_);
    if (this._whiskerEndpoint) this._whiskerEndpoint.forEach(endPoint => endPoint.active(_));
  }

  /**
      @memberof Box
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof Box
      @desc Sets the highlight accessor to the Shape class's hover function.
      @param {Function} [*value*]
      @chainable
  */
  hover(_) {
    if (this._box) this._box.hover(_);
    if (this._median) this._median.hover(_);
    if (this._whisker) this._whisker.hover(_);
    if (this._whiskerEndpoint) this._whiskerEndpoint.forEach(endPoint => endPoint.hover(_));
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the config method for median and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  medianConfig(_) {
    return arguments.length ? (this._medianConfig = assign(this._medianConfig, _), this) : this._medianConfig;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.
      @param {Function|String} [*value* = "vertical"] Accepts "vertical" or "horizontal"
      @chainable
  */
  orient(_) {
    return arguments.length ? (this._orient = typeof _ === "function" ? _ : constant(_), this) : this._orient;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the outlier accessor to the specified function or string and returns the current class instance.
      @param {Function|String}
      @chainable
  */
  outlier(_) {
    return arguments.length ? (this._outlier = typeof _ === "function" ? _ : constant(_), this) : this._outlier;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the config method for each outlier point and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  outlierConfig(_) {
    return arguments.length ? (this._outlierConfig = assign(this._outlierConfig, _), this) : this._outlierConfig;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the config method for rect shape and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  rectConfig(_) {
    return arguments.length ? (this._rectConfig = assign(this._rectConfig, _), this) : this._rectConfig;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.width;
}
  */
  rectWidth(_) {
    return arguments.length ? (this._rectWidth = typeof _ === "function" ? _ : constant(_), this) : this._rectWidth;
  }

  /**
      @memberof Box
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the config method for whisker and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  whiskerConfig(_) {
    return arguments.length ? (this._whiskerConfig = assign(this._whiskerConfig, _), this) : this._whiskerConfig;
  }

  /**
      @memberof Box
      @desc Determines the value used for each whisker. Can be passed a single value to apply for both whiskers, or an Array of 2 values for the lower and upper whiskers (in that order). Accepted values are `"tukey"`, `"extent"`, or a Number representing a quantile.
      @param {String|Number|String[]|Number[]} [*value* = "tukey"]
      @chainable
  */
  whiskerMode(_) {
    return arguments.length ? (this._whiskerMode = _ instanceof Array ? _ : [_, _], this) : this._whiskerMode;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the x axis to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.x;
}
  */
  x(_) {
    return arguments.length ? (this._x = typeof _ === "function" ? _ : accessor(_), this) : this._x;
  }

  /**
      @memberof Box
      @desc If *value* is specified, sets the y axis to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.y;
}
  */
  y(_) {
    return arguments.length ? (this._y = typeof _ === "function" ? _ : accessor(_), this) : this._y;
  }

}
