
import {min, max, sum} from "d3-array";
import {nest} from "d3-collection";
import {pointer} from "d3-selection";

import {merge} from "@d3plus/data";
import {assign, elem} from "@d3plus/dom";
import {accessor, configPrep, constant} from "../utils/index.js";
import {Circle, Path, Rect} from "../shapes/index.js";
import Viz from "./Viz.js";

const tau = Math.PI * 2;

/**
    @class Radar
    @extends Viz
    @desc Creates a radar visualization based on an array of data.
*/
export default class Radar extends Viz {

  /**
      @memberof Radar
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Viz.
      @private
  */
  constructor() {
    super();

    this._axisConfig = {
      shapeConfig: {
        fill: constant("none"),
        labelConfig: {
          fontColor: "#999",
          padding: 0,
          textAnchor: (d, i, x) => x.textAnchor,
          verticalAlign: "middle"
        },
        stroke: "#eee",
        strokeWidth: constant(1)
      }
    };
    this._discrete = "metric";
    this._levels = 6;
    this._metric = accessor("metric");
    this._outerPadding = 100;
    this._shape = constant("Path");
    this._value = accessor("value");
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {
    super._draw(callback);
    const height = this._height - this._margin.top - this._margin.bottom,
          width = this._width - this._margin.left - this._margin.right;

    const radius = min([height, width]) / 2 - this._outerPadding,
          transform = `translate(${width / 2}, ${height / 2})`;

    const nestedAxisData = nest()
        .key(this._metric)
        .entries(this._filteredData),
          nestedGroupData = nest()
        .key(this._id)
        .key(this._metric)
        .entries(this._filteredData);

    const maxValue = max(nestedGroupData.map(h => h.values.map(d => sum(d.values, (x, i) => this._value(x, i)))).flat());

    const circularAxis = Array.from(Array(this._levels).keys()).map(d => ({
      id: d,
      r: radius * ((d + 1) / this._levels)
    }));

    const circleConfig = configPrep.bind(this)(this._axisConfig.shapeConfig, "shape", "Circle");
    delete circleConfig.label;

    new Circle()
      .data(circularAxis)
      .select(
        elem("g.d3plus-Radar-radial-circles", {
          parent: this._select,
          enter: {transform},
          update: {transform}
        }).node()
      )
      .config(circleConfig)
      .render();

    const totalAxis = nestedAxisData.length;
    const polarAxis = nestedAxisData
      .map((d, i) => {
        const width = this._outerPadding;
        const fontSize =
          this._shapeConfig.labelConfig.fontSize &&
            this._shapeConfig.labelConfig.fontSize(d, i) ||
          11;

        const lineHeight = fontSize * 1.4;
        const height = lineHeight * 2;
        const padding = 10,
              quadrant = parseInt(360 - 360 / totalAxis * i / 90, 10) % 4 + 1,
              radians = tau / totalAxis * i;

        let angle = 360 / totalAxis * i;

        let textAnchor = "start";
        let x = padding;

        if (quadrant === 2 || quadrant === 3) {
          x = -width - padding;
          textAnchor = "end";
          angle += 180;
        }

        const labelBounds = {
          x,
          y: -height / 2,
          width,
          height
        };

        return {
          __d3plus__: true,
          data: merge(d.values, this._aggs),
          i,
          id: d.key,
          angle,
          textAnchor,
          labelBounds,
          rotateAnchor: [-x, height / 2],
          x: radius * Math.cos(radians),
          y: radius * Math.sin(radians)
        };
      })
      .sort((a, b) => a.key - b.key);

    new Rect()
      .data(polarAxis)
      .rotate(d => d.angle || 0)
      .width(0)
      .height(0)
      .x(d => d.x)
      .y(d => d.y)
      .label(d => d.id)
      .labelBounds(d => d.labelBounds)
      .labelConfig(this._axisConfig.shapeConfig.labelConfig)
      .select(
        elem("g.d3plus-Radar-text", {
          parent: this._select,
          enter: {transform},
          update: {transform}
        }).node()
      )
      .render();

    new Path()
      .data(polarAxis)
      .d(d => `M${0},${0} ${-d.x},${-d.y}`)
      .select(
        elem("g.d3plus-Radar-axis", {
          parent: this._select,
          enter: {transform},
          update: {transform}
        }).node()
      )
      .config(configPrep.bind(this)(this._axisConfig.shapeConfig, "shape", "Path"))
      .render();

    const groupData = nestedGroupData.map(h => {

      const q = h.values.map((d, i) => {
        const value = sum(d.values, (x, i) => this._value(x, i));
        const r = value / maxValue * radius,
              radians = tau / totalAxis * i;
        return {
          x: r * Math.cos(radians),
          y: r * Math.sin(radians)
        };
      });

      const d = `M ${q[0].x} ${q[0].y} ${q
        .map(l => `L ${l.x} ${l.y}`)
        .join(" ")} L ${q[0].x} ${q[0].y}`;

      return {
        arr: h.values.map(d => merge(d.values, this._aggs)),
        id: h.key,
        points: q,
        d,
        __d3plus__: true,
        data: merge(h.values.map(d => merge(d.values, this._aggs)), this._aggs)
      };

    });

    const pathConfig = configPrep.bind(this)(this._shapeConfig, "shape", "Path");
    const events = Object.keys(pathConfig.on);
    pathConfig.on = {};
    for (let e = 0; e < events.length; e++) {
      const event = events[e];
      pathConfig.on[event] = (d, i, s, e) => {
        const x = d.points.map(p => p.x + width / 2);
        const y = d.points.map(p => p.y + height / 2);
        const cursor = pointer(e, this._select.node());
        const xDist = x.map(p => Math.abs(p - cursor[0]));
        const yDist = y.map(p => Math.abs(p - cursor[1]));
        const dists = xDist.map((d, i) => d + yDist[i]);
        this._on[event].bind(this)(d.arr[dists.indexOf(min(dists))], i, s, e);
      };
    }

    this._shapes.push(
      new Path()
        .data(groupData)
        .d(d => d.d)
        .select(
          elem("g.d3plus-Radar-items", {
            parent: this._select,
            enter: {transform},
            update: {transform}
          }).node()
        )
        .config(pathConfig)
        .render()
    );

    return this;
  }

  /**
      @memberof Radar
      @desc Sets the config method used for the radial spokes, circles, and labels.
      @param {Object} *value*
      @chainable
  */
  axisConfig(_) {
    return arguments.length ? (this._axisConfig = assign(this._axisConfig, _), this) : this._axisConfig;
  }

  /**
      @memberof Radar
      @desc Defines the value used as axis. If *value* is specified, sets the accessor to the specified metric function. If *value* is not specified, returns the current metric accessor.
      @param {Function|String} *value*
      @chainable
  */
  metric(_) {
    return arguments.length ? (this._metric = typeof _ === "function" ? _ : accessor(_), this) : this._metric;
  }

  /**
      @memberof Radar
      @desc Determines how much pixel spaces to give the outer labels.
      @param {Number} [*value* = 100]
      @chainable
  */
  outerPadding(_) {
    return arguments.length ? (this._outerPadding = _, this) : this._outerPadding;
  }

  /**
      @memberof Radar
      @desc If *value* is specified, sets the value accessor to the specified function or number and returns the current class instance. If *value* is not specified, returns the current value accessor.
      @param {Function|String} *value*
      @example
function value(d) {
  return d.value;
}
  */
  value(_) {
    return arguments.length ? (this._value = typeof _ === "function" ? _ : accessor(_), this) : this._value;
  }

}
