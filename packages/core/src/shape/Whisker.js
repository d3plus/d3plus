import {nest} from "d3-collection";
import {select} from "d3-selection";

import {assign, elem} from "../dom/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";

import Circle from "./Circle.js";
import Line from "./Line.js";
import Rect from "./Rect.js";

const shapes = {Circle, Rect};

/**
    @class Whisker
    @extends BaseClass
    @desc Creates SVG whisker based on an array of data.
*/
export default class Whisker extends BaseClass {

  /**
      @memberof Whisker
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from BaseClass.
      @private
  */
  constructor() {

    super();

    this._endpoint = accessor("endpoint", "Rect");
    this._endpointConfig = {
      Circle: {
        r: accessor("r", 5)
      }
    };
    this._length = accessor("length", 25);
    this._lineConfig = {};
    this._orient = accessor("orient", "top");
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);

  }

  /**
      @memberof Whisker
      @desc Draws the whisker.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    if (this._select === void 0) {
      this.select(select("body").append("svg")
        .style("width", `${window.innerWidth}px`)
        .style("height", `${window.innerHeight}px`)
        .style("display", "block").node());
    }

    const lineData = [];
    this._data.forEach((d, i) => {

      const orient = this._orient(d, i);
      const x = this._x(d, i);
      const y = this._y(d, i);

      let endpointX = x;
      if (orient === "left") endpointX -= this._length(d, i);
      else if (orient === "right") endpointX += this._length(d, i);

      let endpointY = y;
      if (orient === "top") endpointY -= this._length(d, i);
      else if (orient === "bottom") endpointY += this._length(d, i);

      lineData.push({__d3plus__: true, data: d, i, id: i, x, y});
      lineData.push({__d3plus__: true, data: d, i, id: i, x: endpointX, y: endpointY});
    });

    // Draw whisker line.
    this._line = new Line()
      .data(lineData)
      .select(elem("g.d3plus-Whisker", {parent: this._select}).node())
      .config(configPrep.bind(this)(this._lineConfig, "shape"))
      .render(callback);

    const whiskerData = this._data.map((d, i) => {

      const dataObj = {};
      dataObj.__d3plus__ = true;
      dataObj.data = d;
      dataObj.i = i;
      dataObj.endpoint = this._endpoint(d, i);
      dataObj.length = this._length(d, i);
      dataObj.orient = this._orient(d, i);

      let endpointX = this._x(d, i);
      if (dataObj.orient === "left") endpointX -= dataObj.length;
      else if (dataObj.orient === "right") endpointX += dataObj.length;

      let endpointY = this._y(d, i);
      if (dataObj.orient === "top") endpointY -= dataObj.length;
      else if (dataObj.orient === "bottom") endpointY += dataObj.length;

      dataObj.x = endpointX;
      dataObj.y = endpointY;

      return dataObj;

    });

    // Draw whisker endpoint.
    this._whiskerEndpoint = [];
    nest()
      .key(d => d.endpoint)
      .entries(whiskerData)
      .forEach(shapeData => {
        const shapeName = shapeData.key;
        this._whiskerEndpoint.push(new shapes[shapeName]()
          .data(shapeData.values)
          .select(elem(`g.d3plus-Whisker-Endpoint-${shapeName}`, {parent: this._select}).node())
          .config({
            height: d => d.orient === "top" || d.orient === "bottom" ? 5 : 20,
            width: d => d.orient === "top" || d.orient === "bottom" ? 20 : 5
          })
          .config(configPrep.bind(this)(this._endpointConfig, "shape", shapeName))
          .render());
      });

    return this;

  }

  /**
      @memberof Whisker
      @desc Sets the highlight accessor to the Shape class's active function.
      @param {Function} [*value*]
      @chainable
  */
  active(_) {
    if (this._line) this._line.active(_);
    if (this._whiskerEndpoint) this._whiskerEndpoint.forEach(endPoint => endPoint.active(_));
  }

  /**
      @memberof Whisker
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the endpoint accessor to the specified function or string and returns the current class instance.
      @param {Function|String}
      @chainable
  */
  endpoint(_) {
    return arguments.length ? (this._endpoint = typeof _ === "function" ? _ : constant(_), this) : this._endpoint;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the config method for each endpoint and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  endpointConfig(_) {
    return arguments.length ? (this._endpointConfig = assign(this._endpointConfig, _), this) : this._endpointConfig;
  }

  /**
      @memberof Whisker
      @desc Sets the highlight accessor to the Shape class's hover function.
      @param {Function} [*value*]
      @chainable
  */
  hover(_) {
    if (this._line) this._line.hover(_);
    if (this._whiskerEndpoint) this._whiskerEndpoint.forEach(endPoint => endPoint.hover(_));
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the length accessor for whisker and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  length(_) {
    return arguments.length ? (this._length = typeof _ === "function" ? _ : constant(_), this) : this._length;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the config method for line shape and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  lineConfig(_) {
    return arguments.length ? (this._lineConfig = assign(this._lineConfig, _), this) : this._lineConfig;
  }
  
  /**
      @memberof Whisker
      @desc If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.
      @param {Function|String} [*value* = "top"] Accepts "top", "right", "bottom" or "left"
      @chainable
  */
  orient(_) {
    return arguments.length ? (this._orient = typeof _ === "function" ? _ : constant(_), this) : this._orient;
  }

  /**
      @memberof Whisker
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
    @memberof Whisker
    @desc If *value* is specified, sets the x axis to the specified function or number and returns the current class instance.
    @param {Function|Number} [*value*]
    @chainable
    @example
function(d) {
  return d.x;
}
  */
  x(_) {
    return arguments.length ? (this._x = typeof _ === "function" ? _ : constant(_), this) : this._x;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the y axis to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.y;
}
  */
  y(_) {
    return arguments.length ? (this._y = typeof _ === "function" ? _ : constant(_), this) : this._y;
  }

}
