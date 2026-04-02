import {groups} from "d3-array";
import {select} from "d3-selection";

import type {DataPoint} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Circle from "./Circle.js";
import Line from "./Line.js";
import Rect from "./Rect.js";

const shapes: Record<string, typeof Circle | typeof Rect> = {Circle, Rect};

/**
    @class Whisker
    @extends BaseClass
    @desc Creates SVG whisker based on an array of data.
*/
export default class Whisker extends BaseClass {
  _endpoint: AccessorFn;
  _endpointConfig: Record<string, unknown>;
  _length: AccessorFn;
  _lineConfig: Record<string, unknown>;
  _orient: AccessorFn;
  _x: AccessorFn;
  _y: AccessorFn;
  _data!: DataPoint[];
  _select: D3Selection;
  _line: Line;
  _whiskerEndpoint: (Circle | Rect)[];

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
        r: accessor("r", 5),
      },
    };
    this._length = accessor("length", 25);
    this._lineConfig = {};
    this._orient = accessor("orient", "top");
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
    this._whiskerEndpoint = [];
  }

  /**
      @memberof Whisker
      @desc Draws the whisker.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback?: () => void): this {
    if (this._select === void 0) {
      this.select(
        select("body")
          .append("svg")
          .style("width", `${window.innerWidth}px`)
          .style("height", `${window.innerHeight}px`)
          .style("display", "block")
          .node(),
      );
    }

    const lineData: DataPoint[] = [];
    this._data.forEach((d: DataPoint, i: number) => {
      const orient = this._orient(d, i) as string;
      const x = this._x(d, i) as number;
      const y = this._y(d, i) as number;

      let endpointX = x;
      if (orient === "left") endpointX -= this._length(d, i) as number;
      else if (orient === "right") endpointX += this._length(d, i) as number;

      let endpointY = y;
      if (orient === "top") endpointY -= this._length(d, i) as number;
      else if (orient === "bottom") endpointY += this._length(d, i) as number;

      lineData.push({
        __d3plus__: true,
        data: d,
        i,
        id: i,
        x,
        y,
      } as unknown as DataPoint);
      lineData.push({
        __d3plus__: true,
        data: d,
        i,
        id: i,
        x: endpointX,
        y: endpointY,
      } as unknown as DataPoint);
    });

    // Draw whisker line.
    this._line = new Line()
      .data(lineData)
      .select(elem("g.d3plus-Whisker", {parent: this._select}).node())
      .config(configPrep.bind(this)(this._lineConfig, "shape"))
      .render(callback);

    const whiskerData = this._data.map((d: DataPoint, i: number) => {
      const dataObj: DataPoint = {} as DataPoint;
      (dataObj as Record<string, unknown>).__d3plus__ = true;
      (dataObj as Record<string, unknown>).data = d;
      (dataObj as Record<string, unknown>).i = i;
      (dataObj as Record<string, unknown>).endpoint = this._endpoint(d, i);
      (dataObj as Record<string, unknown>).length = this._length(d, i);
      (dataObj as Record<string, unknown>).orient = this._orient(d, i);

      let endpointX = this._x(d, i) as number;
      if (dataObj.orient === "left") endpointX -= dataObj.length as number;
      else if (dataObj.orient === "right")
        endpointX += dataObj.length as number;

      let endpointY = this._y(d, i) as number;
      if (dataObj.orient === "top") endpointY -= dataObj.length as number;
      else if (dataObj.orient === "bottom")
        endpointY += dataObj.length as number;

      (dataObj as Record<string, unknown>).x = endpointX;
      (dataObj as Record<string, unknown>).y = endpointY;

      return dataObj;
    });

    // Draw whisker endpoint.
    this._whiskerEndpoint = [];
    groups(whiskerData, (d: DataPoint) => d.endpoint).forEach(
      ([shapeName, values]: [DataPoint[keyof DataPoint], DataPoint[]]) => {
        this._whiskerEndpoint.push(
          new shapes[shapeName as string]()
            .data(values)
            .select(
              elem(`g.d3plus-Whisker-Endpoint-${shapeName}`, {
                parent: this._select,
              }).node(),
            )
            .config({
              height: (d: DataPoint) =>
                d.orient === "top" || d.orient === "bottom" ? 5 : 20,
              width: (d: DataPoint) =>
                d.orient === "top" || d.orient === "bottom" ? 20 : 5,
            })
            .config(
              configPrep.bind(this)(
                this._endpointConfig,
                "shape",
                shapeName as string,
              ),
            )
            .render(),
        );
      },
    );

    return this;
  }

  /**
      @memberof Whisker
      @desc Sets the highlight accessor to the Shape class's active function.
      @param {Function} [*value*]
      @chainable
  */
  active(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._line) this._line.active(_);
    if (this._whiskerEndpoint)
      this._whiskerEndpoint.forEach((endPoint: Circle | Rect) =>
        endPoint.active(_),
      );
  }

  /**
      @memberof Whisker
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the endpoint accessor to the specified function or string and returns the current class instance.
      @param {Function|String}
      @chainable
  */
  endpoint(): AccessorFn;
  endpoint(_: AccessorFn | string): this;
  endpoint(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._endpoint = typeof _ === "function" ? _ : constant(_)), this)
      : this._endpoint;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the config method for each endpoint and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  endpointConfig(): Record<string, unknown>;
  endpointConfig(_: Record<string, unknown>): this;
  endpointConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._endpointConfig = assign(this._endpointConfig, _)), this)
      : this._endpointConfig;
  }

  /**
      @memberof Whisker
      @desc Sets the highlight accessor to the Shape class's hover function.
      @param {Function} [*value*]
      @chainable
  */
  hover(_: ((d: DataPoint, i: number) => boolean) | null): void {
    if (this._line) this._line.hover(_);
    if (this._whiskerEndpoint)
      this._whiskerEndpoint.forEach((endPoint: Circle | Rect) =>
        endPoint.hover(_),
      );
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the length accessor for whisker and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
  */
  length(): AccessorFn;
  length(_: AccessorFn | number): this;
  length(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._length = typeof _ === "function" ? _ : constant(_)), this)
      : this._length;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the config method for line shape and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  lineConfig(): Record<string, unknown>;
  lineConfig(_: Record<string, unknown>): this;
  lineConfig(_?: Record<string, unknown>): Record<string, unknown> | this {
    return arguments.length
      ? ((this._lineConfig = assign(this._lineConfig, _)), this)
      : this._lineConfig;
  }

  /**
      @memberof Whisker
      @desc If *value* is specified, sets the orientation to the specified value. If *value* is not specified, returns the current orientation.
      @param {Function|String} [*value* = "top"] Accepts "top", "right", "bottom" or "left"
      @chainable
  */
  orient(): AccessorFn;
  orient(_: AccessorFn | string): this;
  orient(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._orient = typeof _ === "function" ? _ : constant(_)), this)
      : this._orient;
  }

  /**
      @memberof Whisker
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(): D3Selection;
  select(_: string | HTMLElement | SVGElement | null): this;
  select(_?: string | HTMLElement | SVGElement | null): D3Selection | this {
    return arguments.length
      ? ((this._select = select(_ as string) as unknown as D3Selection), this)
      : this._select;
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
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._x = typeof _ === "function" ? _ : constant(_)), this)
      : this._x;
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
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._y = typeof _ === "function" ? _ : constant(_)), this)
      : this._y;
  }
}
