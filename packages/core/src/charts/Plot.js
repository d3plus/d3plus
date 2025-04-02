/* eslint no-cond-assign: 0 */

import {deviation, extent, max, mean, merge, min, range, sum} from "d3-array";
import {nest} from "d3-collection";
import * as scales from "d3-scale";
import * as d3Shape from "d3-shape";
import {theme as openColor} from "open-color/open-color.js";

import {colorAssign, colorContrast, colorDefaults, colorLegible} from "@d3plus/color";
import {merge as d3plusMerge, unique} from "@d3plus/data";
import {assign, date, elem, rtl, textWidth} from "@d3plus/dom";
import {largestRect} from "@d3plus/math";
import {formatAbbreviate} from "@d3plus/format";

import {AxisBottom, AxisLeft, AxisRight, AxisTop, TextBox} from "../components/index.js";
import * as shapes from "../shapes/index.js";
import {accessor, configPrep, constant} from "../utils/index.js";

const testLineShape = new shapes.Line();
const testTextBox = new TextBox();
import Viz from "./Viz.js";

import {default as discreteBuffer} from "./plotBuffers/discreteBuffer.js";
import {default as BarBuffer} from "./plotBuffers/Bar.js";
import {default as BoxBuffer} from "./plotBuffers/Box.js";
import {default as CircleBuffer} from "./plotBuffers/Circle.js";
import {default as LineBuffer} from "./plotBuffers/Line.js";
import {default as RectBuffer} from "./plotBuffers/Rect.js";
const defaultBuffers = {
  Bar: BarBuffer,
  Box: BoxBuffer,
  Circle: CircleBuffer,
  Line: LineBuffer,
  Rect: RectBuffer
};

/**
    @desc Logic for determining default sizes of shapes using the sizeScaleD3 internal function.
    @private
*/
function defaultSize(d) {
  return this._sizeScaleD3(this._size ? this._size(d) : null);
}

/**
    @desc Logic for determining stackOrder ascending using groups.
    @private
*/
function stackOrderAscending(series) {
  const sums = series.map(stackSum);
  const keys = series.map(d => d.key.split("_")[0]);
  return d3Shape.stackOrderNone(series).sort((a, b) => keys[b].localeCompare(keys[a]) || sums[a] - sums[b]);
}

/**
    @desc Logic for determining stackOrder descending using groups.
    @private
*/
function stackOrderDescending(series) {
  return stackOrderAscending(series).reverse();
}

/**
    @desc Logic for determining default sum of shapes using the stackSum function used in d3Shape.
    @private
*/
function stackSum(series) {
  let i = -1, s = 0, v;
  const n = series.length;
  while (++i < n) if (v = +series[i][1]) s += v;
  return s;
}

/**
    @desc Logic for determining default sum of shapes using the stackSum function used in d3Shape.
    @private
*/
function stackOffsetDiverging(series, order) {
  let n;
  if (!((n = series.length) > 0)) return;
  let d, dy, i, yn, yp;
  const m = series[order[0]].length;
  for (let j = 0; j < m; ++j) {
    for (yp = yn = 0, i = 0; i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) >= 0) {
        d[0] = yp, d[1] = yp += dy;
      }
      else if (dy < 0) {
        d[1] = yn, d[0] = yn += dy;
      }
      else {
        d[0] = yp;
      }
    }
  }
}

/**
 * Determines if a Bar label should be placed outside of the Bar.
 * @param {@} d
 * @param {*} i
 * @private
 */
function outside(d, i) {

  // Force all Stacked Bars to use "inside" labels.
  if (this._stacked) return false;

  // Detect user "outside" or "inside" override.
  const labelPosition = this._labelPosition(d, i);
  if (labelPosition === "outside") return true;
  else if (labelPosition === "inside") return false;

  // Run "auto" logic based on available space.
  const other = this._discrete.charAt(0) === "x" ? "y" : "x";
  const nonDiscrete = this._discrete.replace(this._discrete.charAt(0), other);
  const range = this[`_${nonDiscrete}Axis`]._d3Scale.range();
  const value = this[`_${nonDiscrete}`](d, i);
  const negative = value < 0;
  const zero = this[`_${nonDiscrete}Axis`]._getPosition(0);
  const space = nonDiscrete === "y"
    ? negative ? range[1] - zero : zero - range[0]
    : negative ? zero - range[0] : range[1] - zero;
  const pos = this[`_${nonDiscrete}Axis`]._getPosition(value);
  const size = Math.abs(negative ? zero - pos : pos - zero);
  return size < space / 2;

}

/**
    @class Plot
    @extends Viz
    @desc Creates an x/y plot based on an array of data.
*/
export default class Plot extends Viz {

  /**
      @memberof Plot
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();
    this._axisPersist = false;
    this._annotations = [];
    this._backgroundConfig = {
      duration: 0,
      fill: "transparent"
    };
    this._barPadding = 0;
    this._buffer = assign({}, defaultBuffers, {Bar: false, Line: false});
    this._confidenceConfig = {
      fill: (d, i) => {
        const c = typeof this._shapeConfig.Line.stroke === "function"
          ? this._shapeConfig.Line.stroke(d, i)
          : this._shapeConfig.Line.stroke;
        return c;
      },
      fillOpacity: constant(0.5)
    };
    this._discreteCutoff = 100;
    this._groupPadding = 5;
    this._labelConnectorConfig = {
      strokeDasharray: "1 1"
    };
    this._labelPosition = constant("auto");
    this._lineMarkerConfig = {
      fill: (d, i) => colorAssign(this._id(d, i)),
      r: constant(3)
    };
    this._lineMarkers = false;
    this._previousAnnotations = {back: [], front: []};
    this._previousShapes = [];
    this._shape = constant("Circle");
    this._shapeConfig = assign(this._shapeConfig, {
      Area: {
        label: (d, i) => this._stacked ? this._drawLabel(d, i) : false,
        labelBounds: (d, i, aes) => {
          let r = largestRect(aes.points, {angle: range(-20, 20, 5)});
          if (!r || r.height < 20 || r.width < 50) r = largestRect(aes.points, {angle: range(-80, 80, 5)});
          if (!r) return null;
          const x = min(aes.points, d => d[0]);
          const y = max(aes.points.filter(d => d[0] === x), d => d[1]);
          return {
            angle: r.angle,
            width: r.width,
            height: r.height,
            x: r.cx - r.width / 2 - x,
            y: r.cy - r.height / 2 - y
          };
        },
        labelConfig: {
          fontMin: 6,
          fontResize: true,
          padding: 10
        }
      },
      ariaLabel: (d, i) => {
        let ariaLabelStr = "";
        if (d.nested) ariaLabelStr = `${this._drawLabel(d.data, d.i)}`;
        else {
          ariaLabelStr = `${this._drawLabel(d, i)}`;
          if (this._x(d, i) !== undefined) ariaLabelStr += `, x: ${this._x(d, i)}`;
          if (this._y(d, i) !== undefined) ariaLabelStr += `, y: ${this._y(d, i)}`;
          if (this._x2(d, i) !== undefined) ariaLabelStr += `, x2: ${this._x2(d, i)}`;
          if (this._y2(d, i) !== undefined) ariaLabelStr += `, y2: ${this._y2(d, i)}`;
        }
        return `${ariaLabelStr}.`;
      },
      Bar: {
        labelBounds(d, i, s) {

          const padding = 1;

          const width = this._discrete === "y" ? "width" : "height";
          const height = this._discrete === "y" ? "height" : "width";

          const other = this._discrete.charAt(0) === "x" ? "y" : "x";
          const invert = other === "y";
          const nonDiscrete = this._discrete.replace(this._discrete.charAt(0), other);
          const range = this[`_${nonDiscrete}Axis`]._d3Scale.range();
          const space = Math.abs(range[1] - range[0]);
          const negative = this[`_${nonDiscrete}`](d, i) < 0;

          if (outside.bind(this)(d, i)) {
            return {
              [width]: space - s[width],
              [height]: s[height],
              x: invert ? -s.width / 2 : negative ? -space : s.width + padding,
              y: invert ? negative ? s.height + padding : -space : -s.height / 2 + 1
            };
          }
          return {
            [width]: s[width],
            [height]: s[height],
            x: invert ? -s.width / 2 : negative ? this._stacked ? padding - s.width : padding - s.width : -padding,
            y: invert ? negative ? this._stacked ? padding : padding : -s.height + padding : -s.height / 2 + padding
          };

        },
        labelConfig: {
          fontMax: 16,
          fontMin: 6,
          fontResize: true,
          fontColor(d, i) {
            return outside.bind(this)(d, i)
              ? this._backgroundConfig.fill === "transparent"
                ? colorDefaults.dark
                : colorContrast(this._backgroundConfig.fill)
              : colorContrast(typeof this._shapeConfig.fill === "function" ? this._shapeConfig.fill(d, i) : this._shapeConfig.fill);
          },
          fontStroke(d, i) {
            return outside.bind(this)(d, i)
              ? this._backgroundConfig.fill === "transparent"
                ? colorDefaults.dark
                : colorContrast(this._backgroundConfig.fill)
              : "transparent";
          },
          fontStrokeWidth(d, i) {
            return outside.bind(this)(d, i) ? 0.1 : 0;
          },
          padding: 3,
          textAnchor(d, i) {
            const other = this._discrete.charAt(0) === "x" ? "y" : "x";
            const invert = other === "y";
            const nonDiscrete = this._discrete.replace(this._discrete.charAt(0), other);
            const negative = this[`_${nonDiscrete}`](d, i) < 0;
            const anchor = invert
              ? "middle"
              : outside.bind(this)(d, i)
                ? negative ? "end" : "start"
                : negative ? "start" : "end";
            return rtl() ? anchor === "start" ? "end" : anchor === "end" ? "start" : anchor : anchor; 
          },
          verticalAlign(d, i) {
            const other = this._discrete.charAt(0) === "x" ? "y" : "x";
            const invert = other === "y";
            const nonDiscrete = this._discrete.replace(this._discrete.charAt(0), other);
            const negative = this[`_${nonDiscrete}`](d, i) < 0;
            return invert
              ? outside.bind(this)(d, i)
                ? negative ? "top" : "bottom"
                : negative ? "bottom" : "top"
              : "middle";
          }
        }
      },
      Circle: {
        r: defaultSize.bind(this)
      },
      Line: {
        curve: () => this._discrete ? `monotone${this._discrete.charAt(0).toUpperCase()}` : "linear",
        fill: constant("none"),
        labelConfig: {
          fontColor: (d, i) => {
            const c = typeof this._shapeConfig.Line.stroke === "function"
              ? this._shapeConfig.Line.stroke(d, i)
              : this._shapeConfig.Line.stroke;
            return colorLegible(c);
          },
          fontResize: false,
          padding: 5,
          textAnchor: "start",
          verticalAlign: "middle"
        },
        strokeWidth: constant(2)
      },
      Rect: {
        height: d => defaultSize.bind(this)(d) * 2,
        width: d => defaultSize.bind(this)(d) * 2
      }
    });
    this._shapeOrder = ["Area", "Path", "Bar", "Box", "Line", "Rect", "Circle"];
    this._shapeSort = (a, b) => this._shapeOrder.indexOf(a) - this._shapeOrder.indexOf(b);
    this._sizeMax = 20;
    this._sizeMin = 5;
    this._sizeScale = "sqrt";
    this._stackOffset = stackOffsetDiverging;
    this._stackOrder = stackOrderDescending;
    this._timelineConfig = assign(this._timelineConfig, {
      brushing: true,
      brushMin: () => this._xTime || this._yTime || this._x2Time || this._y2Time ? 2 : 1
    });

    this._x = accessor("x");
    this._xAxis = new AxisBottom().align("end");
    this._xTest = new AxisBottom().align("end").gridSize(0);
    this._xConfig = {
      gridConfig: {
        stroke: d => {
          if (this._discrete && this._discrete.charAt(0) === "x") return "transparent";
          const range = this._xAxis.range();
          // hides left-most x gridline so it doesn't overlap with the y axis
          return range[0] === this._xAxis._getPosition.bind(this._xAxis)(d.id) ? "transparent" : openColor.colors.gray[200];
        }
      }
    };
    this._xCutoff = 150;

    this._x2 = accessor("x2");
    this._x2Axis = new AxisTop().align("start");
    this._x2Test = new AxisTop().align("start").gridSize(0);
    this._x2Config = {
      padding: 0
    };

    this._y = accessor("y");
    this._yAxis = new AxisLeft().align("start");
    this._yTest = new AxisLeft().align("start").gridSize(0);
    this._yConfig = {
      gridConfig: {
        stroke: d => {
          if (this._discrete && this._discrete.charAt(0) === "y") return "transparent";
          const range = this._yAxis.range();
          // hides bottom-most y gridline so it doesn't overlap with the x axis
          return range[range.length - 1] === this._yAxis._getPosition.bind(this._yAxis)(d.id) ? "transparent" : openColor.colors.gray[200];
        }
      }
    };
    this._yCutoff = 150;

    this._y2 = accessor("y2");
    this._y2Axis = new AxisRight().align("end");
    this._y2Test = new AxisLeft().align("end").gridSize(0);
    this._y2Config = {};

  }

  /**
      Extends the preDraw behavior of the abstract Viz class.
      @private
  */
  _preDraw() {

    // logic repeated for each axis
    ["x", "y", "x2", "y2"].forEach(k => {

      // if user has supplied a String key as the main method value
      if (this[`_${k}Key`]) {

        const str = this[`_${k}Key`];

        // if axis is discrete and numerical, do not sum values
        if (!this._aggs[str] && this._discrete === k) {
          this._aggs[str] = (a, c) => {
            const v = Array.from(new Set(a.map(c)));
            return v.length === 1 ? v[0] : v;
          };
        }

        // set axis title if not discrete
        if (str !== k && this[`_${k}Title`] === this[`_${k}Config`].title && this._discrete !== k) {
          this[`_${k}Title`] = str;
          this[`_${k}Config`].title = str;
        }

      }

    });

    super._preDraw();

  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
  */
  _draw(callback) {

    if (!this._filteredData.length && !this._annotations.length) return this;
    
    /* Determines whether or not any of the x or y axes are a "time" axis. */
    const firstElemTime = this._time ? this._time(this._filteredData[0], 0) : false;
    const x2Time = this._x2Time = firstElemTime && this._x2(this._filteredData[0], 0) === firstElemTime,
          xTime = this._xTime = firstElemTime && this._x(this._filteredData[0], 0) === firstElemTime,
          y2Time = this._y2Time = firstElemTime && this._y2(this._filteredData[0], 0) === firstElemTime,
          yTime = this._yTime = firstElemTime && this._y(this._filteredData[0], 0) === firstElemTime;

    const timeAxis = (xTime || x2Time || yTime || y2Time);

    const stackGroup = (d, i) => `${!timeAxis && this._time ? this._time(d, i) : "time"}_${this._stacked
      ? `${this._groupBy.length > 1 ? this._ids(d, i).slice(0, -1).join("_") : "group"}`
      : `${this._ids(d, i).join("_")}`}`;

    const prepData = (d, i) => {
      const newD = {
        __d3plus__: true,
        data: d,
        group: stackGroup(d, i),
        i,
        hci: this._confidence && this._confidence[1] && this._confidence[1](d, i),
        id: this._ids(d, i).slice(0, this._drawDepth + 1).join("_"),
        lci: this._confidence && this._confidence[0] && this._confidence[0](d, i),
        shape: this._shape(d, i),
        x: xTime ? date(this._x(d, i)) : this._x(d, i),
        x2: x2Time ? date(this._x2(d, i)) : this._x2(d, i),
        y: yTime ? date(this._y(d, i)) : this._y(d, i),
        y2: y2Time ? date(this._y2(d, i)) : this._y2(d, i)
      };
      newD.discrete = newD.shape === "Bar" ? `${newD[this._discrete]}_${newD.group}` : `${newD[this._discrete]}`;
      newD.id = newD.shape === "Bar" ? `${newD.id}_${newD[this._discrete]}` : newD.id;
      return newD;
    };

    const data = this._formattedData = this._filteredData.map(prepData);
    const axisData = this._axisPersist ? this._data.map(prepData) : data;

    if (this._size) {
      const rExtent = extent(axisData, d => this._size(d.data));
      this._sizeScaleD3 = scales[`scale${this._sizeScale.charAt(0).toUpperCase()}${this._sizeScale.slice(1)}`]()
        .domain(rExtent)
        .range([rExtent[0] === rExtent[1] ? this._sizeMax : min([this._sizeMax / 2, this._sizeMin]), this._sizeMax]);
    }
    else {
      this._sizeScaleD3 = () => this._sizeMin;
    }

    const x2Exists = axisData.some(d => d.x2 !== undefined),
          y2Exists = axisData.some(d => d.y2 !== undefined);

    const height = this._height - this._margin.top - this._margin.bottom,
          opp = this._discrete ? this._discrete === "x" ? "y" : "x" : undefined,
          opp2 = this._discrete ? this._discrete === "x" ? "y2" : "x2" : undefined,
          opps = [opp, opp2].filter(d => d),
          parent = this._select,
          transition = this._transition,
          width = this._width - this._margin.left - this._margin.right;

    /**
     * @desc Returns all unique values for a given axis.
     * @param {String} axis
     * @returns {Array}
     * @private
     */
    function getAxisValues(axis) {
      const timeData = this[`_${axis}Time`];
      const localData = timeData ? data : axisData;

      const filteredData = localData
        .filter(d => ![NaN, undefined, false].includes(d[axis]));

      if (!filteredData.length) return [];

      const numericValue = typeof filteredData[0][axis] === "number";

      let myData = this._discrete === axis
        ? nest()
          .key(d => d[axis])
          .rollup(leaves => leaves.length === 1 ? leaves[0].data : d3plusMerge(leaves.map(d => d.data), this._aggs))
          .entries(filteredData)
          .sort((a, b) => {
            if (this[`_${axis}Sort`]) return this[`_${axis}Sort`](a.value, b.value);
            const aKey = (timeData || numericValue) ? parseFloat(a.key, 10) : a.key; 
            const bKey = (timeData || numericValue) ? parseFloat(b.key, 10) : b.key; 
            return aKey - bKey;
          })
          .map(d => timeData ? date(d.key) : numericValue ? parseFloat(d.key, 10) : d.key)
        : unique(filteredData
            .sort((a, b) => this[`_${axis}Sort`] ? this[`_${axis}Sort`](a.data, b.data) : a[axis] - b[axis])
            .map(d => d[axis]), d => `${d}`);

      if (this._discrete !== axis.charAt(0) && this._confidence) {
        if (this._confidence[0]) myData = myData.concat(localData.map(d => d.lci));
        if (this._confidence[1]) myData = myData.concat(localData.map(d => d.hci));
      }

      return myData;
    }

    const xData = getAxisValues.bind(this)("x");
    const x2Data = getAxisValues.bind(this)("x2");
    const yData = getAxisValues.bind(this)("y");
    const y2Data = getAxisValues.bind(this)("y2");

    let discreteKeys, domains, stackData, stackKeys;
    if (this._stacked) {

      const stackedData = axisData.filter(d => ["Area", "Bar"].includes(d.shape));

      const groupValues = nest()
        .key(d => d.group)
        .entries(stackedData)
        .reduce((obj, d) => {
          if (!obj[d.key]) obj[d.key] = 0;
          obj[d.key] += sum(d.values, dd => dd[opp]);
          return obj;
        }, {});

      axisData.sort((a, b) => {
        if (this[`_${this._discrete}Sort`]) return this[`_${this._discrete}Sort`](a.data, b.data);
        const a1 = a[this._discrete], b1 = b[this._discrete];
        if (a1 - b1 !== 0) return a1 - b1;
        if (a.group !== b.group) return groupValues[b.group] - groupValues[a.group];
        return b[opp] - a[opp];
      });

      discreteKeys = Array.from(new Set(axisData.map(d => d.discrete)));
      stackKeys = Array.from(new Set(axisData.map(d => d.id)));

      stackData = nest()
        .key(d => d.discrete)
        .entries(axisData)
        .map(d => d.values);

      stackData.forEach(g => {
        const ids = Array.from(new Set(g.map(d => d.id)));
        if (ids.length < stackKeys.length) {
          stackKeys.forEach(k => {
            if (!ids.includes(k)) {
              const d = axisData.filter(d => d.id === k)[0];
              if (d.shape === "Area") {
                const group = stackGroup(d.data, d.i);
                const fillerPoint = {
                  __d3plus__: true,
                  data: d.data,
                  discrete: d.shape === "Bar" ? `${g[0][this._discrete]}_${group}` : `${g[0][this._discrete]}`,
                  group,
                  id: d.id,
                  ids: k,
                  shape: d.shape,
                  [this._discrete]: g[0][this._discrete],
                  [opp]: 0
                };
                data.push(fillerPoint);
              }
            }
          });
        }
      });

      if (this[`_${this._discrete}Sort`]) {
        data.sort((a, b) => this[`_${this._discrete}Sort`](a.data, b.data));
      }
      else {
        data.sort((a, b) => a[this._discrete] - b[this._discrete]);
      }

      const order = this._stackOrder;

      if (order instanceof Array) stackKeys.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      else if (order === d3Shape.stackOrderNone) stackKeys.sort((a, b) => a.localeCompare(b));

      stackData = d3Shape.stack()
        .keys(stackKeys)
        .offset(this._stackOffset)
        .order(order instanceof Array ? d3Shape.stackOrderNone : order)
        .value((group, key) => {
          const d = group.filter(g => g.id === key);
          return d.length ? d[0][opp] : 0;
        })(stackData);

      const discreteData = this._discrete === "x" ? xData : yData;

      domains = {
        [this._discrete]: this[`_${this._discrete}Time`] ? extent(discreteData) : discreteData,
        [opp]: [min(stackData.map(g => min(g.map(p => p[0])))), max(stackData.map(g => max(g.map(p => p[1]))))]
      };

    }
    else {

      const discrete = this._discrete || "x";

      if (this[`_${this._discrete}Sort`]) {
        axisData.sort((a, b) => this[`_${this._discrete}Sort`](a.data, b.data));
      }
      else {
        axisData.sort((a, b) => a[discrete] - b[discrete]);
      }

      domains = {
        x: !xTime && this._discrete === "x" || this._xSort ? xData : extent(xData),
        x2: !x2Time && this._discrete === "x" || this._x2Sort ? x2Data : extent(x2Data),
        y: !yTime && this._discrete === "y" || this._ySort ? yData : extent(yData),
        y2: !y2Time && this._discrete === "y" || this._y2Sort ? y2Data : extent(y2Data)
      };
    }

    /**
     * Determins default scale type and domain for a given axis.
     * @param {String} axis
     * @private
     */
    function domainScaleSetup(axis) {

      const scale = this[`_${axis}Time`] ? "Time" : this._discrete === axis || this[`_${axis}Sort`] ? "Point" : "Linear";

      const domain = this[`_${axis}Domain`] ? this[`_${axis}Domain`].slice() : domains[axis],
            domain2 = this[`_${axis}2Domain`] ? this[`_${axis}2Domain`].slice() : domains[`${axis}2`];

      if (scale !== "Point") {
        if (domain && domain[0] === void 0) domain[0] = domains[axis][0];
        if (domain && domain[1] === void 0) domain[1] = domains[axis][1];

        if (domain2 && domain2[0] === void 0) domain2[0] = domains[`${axis}2`][0];
        if (domain2 && domain2[1] === void 0) domain2[1] = domains[`${axis}2`][1];
      }

      return [domain, scale, domain2, scale];

    }

    const [xAutoDomain, xScale, x2AutoDomain, x2Scale] = domainScaleSetup.bind(this)("x");
    const [yAutoDomain, yScale, y2AutoDomain, y2Scale] = domainScaleSetup.bind(this)("y");

    const autoScale = (axis, fallback) => {
      const userScale = this[`_${axis}Config`].scale;
      if (userScale === "auto") {
        if (this._discrete === axis) return fallback;
        const values = axisData.map(d => d[axis]);
        return deviation(values) / mean(values) > 3 ? "log" : "linear";
      }
      return userScale || fallback;
    };

    const yConfigScale = this._yConfigScale = autoScale("y", yScale).toLowerCase();
    const y2ConfigScale = this._y2ConfigScale = autoScale("y2", y2Scale).toLowerCase();
    const xConfigScale = this._xConfigScale = autoScale("x", xScale).toLowerCase();
    const x2ConfigScale = this._x2ConfigScale = autoScale("x2", x2Scale).toLowerCase();

    domains = {x: xAutoDomain, x2: x2AutoDomain || xAutoDomain, y: yAutoDomain, y2: y2AutoDomain || yAutoDomain};
    Object.keys(domains)
      .forEach(axis => {
        if (this[`_${axis}ConfigScale`] === "log" && domains[axis].includes(0)) {
          if (min(domains[axis]) < 0) domains[axis][1] = max(data.map(d => d[axis]).filter(d => ![NaN, undefined, false].includes(d)));
          else domains[axis][0] = min(axisData.map(d => d[axis]).filter(d => ![NaN, undefined, false].includes(d)));
        }
      });

    opps.forEach(opp => {
      if (this[`_${opp}Config`].domain) {
        const d = this[`_${opp}Config`].domain;
        if (this._discrete === "x") d.reverse();
        domains[opp] = d;
      }
      else if (opp && this._baseline !== void 0) {
        const b = this._baseline;
        if (domains[opp] && domains[opp][0] > b) domains[opp][0] = b;
        else if (domains[opp] && domains[opp][1] < b) domains[opp][1] = b;
      }
    });

    let x = scales[`scale${xScale}`]().domain(domains.x).range(range(0, width + 1, width / (domains.x.length - 1))),
        x2 = scales[`scale${x2Scale}`]().domain(domains.x2).range(range(0, width + 1, width / (domains.x2.length - 1))),
        y = scales[`scale${yScale}`]().domain(domains.y.reverse()).range(range(0, height + 1, height / (domains.y.length - 1))),
        y2 = scales[`scale${y2Scale}`]().domain(domains.y2.reverse()).range(range(0, height + 1, height / (domains.y2.length - 1)));

    const shapeData = nest()
      .key(d => d.shape)
      .entries(data)
      .sort((a, b) => this._shapeSort(a.key, b.key));

    const oppScale = this._discrete === "x" ? yScale : xScale;
    if (oppScale !== "Point") {

      const allShapeData = nest()
        .key(d => d.shape)
        .entries(axisData);

      allShapeData.forEach(d => {
        if (["Bar", "Box"].includes(d.key)) {
          discreteBuffer(this._discrete === "x" ? x : y, data, this._discrete);
        }
        if (this._buffer[d.key]) {
          const res = this._buffer[d.key].bind(this)({data: d.values, x, y, yScale: yConfigScale, xScale: xConfigScale, config: this._shapeConfig[d.key]});
          x = res[0];
          y = res[1];
          const res2 = this._buffer[d.key].bind(this)({data: d.values, x: x2, y: y2, yScale: y2ConfigScale, xScale: x2ConfigScale, x2: true, y2: true, config: this._shapeConfig[d.key]});
          x2 = res2[0];
          y2 = res2[1];
        }
      });

    }

    const xDomain = x.domain();
    const x2Domain = x2.domain();
    const yDomain = y.domain();
    const y2Domain = y2.domain();

    const defaultConfig = {
      barConfig: {"stroke-width": 0},
      gridSize: 0,
      labels: [],
      title: false,
      tickSize: 0
    };

    const defaultX2Config = x2Exists ? {data: x2Data} : defaultConfig;
    const defaultY2Config = y2Exists ? {data: y2Data} : defaultConfig;
    const showX = this._discrete === "x" && this._width > this._discreteCutoff || this._width > this._xCutoff;
    const showY = this._discrete === "y" && this._height > this._discreteCutoff || this._height > this._yCutoff;

    const yC = {
      data: yData,
      locale: this._locale,
      rounding: this._yDomain ? "none" : "outside",
      scalePadding: y.padding ? y.padding() : 0
    };
    if (!showX) {
      yC.barConfig = {stroke: "transparent"};
      yC.tickSize = 0;
      yC.shapeConfig = {
        labelBounds: (d, i) => {
          const {width, y} = d.labelBounds;
          const height = this._height / 2;
          const x = i ? -height : 0;
          return {x, y, width, height};
        },
        labelConfig: {
          padding: 0,
          rotate: 0
        },
        labelRotation: false
      };
    }

    const testGroup = elem("g.d3plus-plot-test", {enter: {opacity: 0}, parent: this._select});
        
    /**
     * Hides an axis' ticks and labels if they all exist as labels for the data to be displayed,
     * primarily occuring in simple BarChart visualizations where the both the x-axis ticks and
     * the Bar rectangles would be displaying the same text.
     */

    // generates an Array of String labels using the current label function for Bar shapes
    const barConfig = configPrep.bind(this)(this._shapeConfig, "shape", "Bar");
    const barLabelFunction = barConfig.label !== undefined
      ? typeof barConfig.label === "function" ? barConfig.label : constant(barConfig.label)
      : this._drawLabel;
    const barLabels = axisData.map(d => barLabelFunction(d.data, d.i)).filter(d => typeof d === "number" || d).map(String);

    // sets an axis' ticks to [] if the axis scale is "Point" (discrete) and every tick String
    // is also in the barLabels Array
    let x2Ticks = unique(axisData.map(d => d.x2));
    x2Ticks = x2Scale === "Point" && x2Ticks.every(t => barLabels.includes(`${t}`)) ? [] : null;
    let xTicks = unique(axisData.map(d => d.x));
    xTicks = xScale === "Point" && xTicks.every(t => barLabels.includes(`${t}`)) ? [] : null;
    let y2Ticks = unique(axisData.map(d => d.y2));
    y2Ticks = y2Scale === "Point" && y2Ticks.every(t => barLabels.includes(`${t}`)) ? [] : null;
    let yTicks = unique(axisData.map(d => d.y));
    yTicks = yScale === "Point" && yTicks.every(t => barLabels.includes(`${t}`)) ? [] : null;

    if (showY) {
      this._yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range([undefined, undefined])
        .select(testGroup.node())
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(this._yConfig)
        .scale(yConfigScale)
        .render();
    }

    let yBounds = this._yTest.outerBounds();
    let yWidth = yBounds.width ? yBounds.width + this._yTest.padding() : undefined;

    if (y2Exists) {
      this._y2Test
        .domain(y2Domain)
        .height(height)
        .range([undefined, undefined])
        .select(testGroup.node())
        .ticks(y2Ticks)
        .width(width)
        .config(yC)
        .config(defaultY2Config)
        .config(this._y2Config)
        .scale(y2ConfigScale)
        .render();
    }

    let y2Bounds = this._y2Test.outerBounds();
    let y2Width = y2Bounds.width ? y2Bounds.width + this._y2Test.padding() : undefined;
    const xC = {
      data: xData,
      locale: this._locale,
      rounding: this._xDomain ? "none" : "outside",
      scalePadding: x.padding ? x.padding() : 0
    };
    if (!showY) {
      xC.barConfig = {stroke: "transparent"};
      xC.tickSize = 0;
      xC.shapeConfig = {
        labelBounds: (d, i) => {
          const {height, y} = d.labelBounds;
          const width = this._width / 2;
          const x = i ? -width : 0;
          return {x, y, width, height};
        },
        labelConfig: {
          padding: 0,
          rotate: 0,
          textAnchor: d => d.id === xTicks[0] ? "start" : "end"
        },
        labelRotation: false
      };
    }

    let xRangeMax = undefined;

    if (showX) {
      this._xTest
        .domain(xDomain)
        .height(height)
        .maxSize(height / 2)
        .range([undefined, xRangeMax])
        .select(testGroup.node())
        .ticks(xTicks)
        .width(width)
        .config(xC)
        .config(this._xConfig)
        .scale(xConfigScale)
        .render();
    }

    let largestLabel, labelWidths = [];
    const showLineLabels = this._lineLabels && !y2Exists;
    if (showLineLabels) {

      const labelData = data.filter(d => {
        if (d.shape !== "Line") return false;
        return typeof this._lineLabels === "function" ? this._lineLabels(d.data, d.i) : true;
      });

      const lineData = nest()
        .key(d => d.id)
        .entries(labelData);

      if (lineData.length) {

        const userConfig = configPrep.bind(this)(this._shapeConfig, "shape", "Line");
        testLineShape.config(userConfig);
        const lineLabelConfig = testLineShape.labelConfig();
        const fontColorAccessor = lineLabelConfig.fontColor !== undefined ? lineLabelConfig.fontColor : testTextBox.fontColor();
        const fontSizeAccessor = lineLabelConfig.fontSize !== undefined ? lineLabelConfig.fontSize : testTextBox.fontSize();
        const fontWeightAccessor = lineLabelConfig.fontWeight !== undefined ? lineLabelConfig.fontWeight : testTextBox.fontWeight();
        const fontFamilyAccessor = lineLabelConfig.fontFamily !== undefined ? lineLabelConfig.fontFamily : testTextBox.fontFamily();
        const paddingAccessor = lineLabelConfig.padding !== undefined ? lineLabelConfig.padding : testTextBox.padding();
        const labelFunction = userConfig.label || this._drawLabel;

        const xEstimate = d => {
          if (xConfigScale === "log" && d === 0) d = xDomain[0] < 0 ? this._xTest._d3Scale.domain()[1] : this._xTest._d3Scale.domain()[0];
          return this._xTest._getPosition.bind(this._xTest)(d);
        };

        const yEstimate = d => {
          if (yConfigScale === "log" && d === 0) d = yDomain[0] < 0 ? this._yTest._d3Scale.domain()[1] : this._yTest._d3Scale.domain()[0];
          return this._yTest._getPosition.bind(this._yTest)(d);
        };

        labelWidths = lineData
          .map(group => {

            let d = group.values[group.values.length - 1];
            let i;
            while (d.__d3plus__ && d.data) {
              d = d.data;
              i = d.i;
            }
            const label = typeof labelFunction === "function" ? labelFunction(d, i) : labelFunction;

            const fontColor = typeof fontColorAccessor === "function" ? fontColorAccessor(d, i) : fontColorAccessor;
            const fontSize = typeof fontSizeAccessor === "function" ? fontSizeAccessor(d, i) : fontSizeAccessor;
            const fontWeight = typeof fontWeightAccessor === "function" ? fontWeightAccessor(d, i) : fontWeightAccessor;
            let fontFamily = typeof fontFamilyAccessor === "function" ? fontFamilyAccessor(d, i) : fontFamilyAccessor;
            if (fontFamily instanceof Array) fontFamily = fontFamily.map(f => `'${f}'`).join(", ");
            const labelPadding = typeof paddingAccessor === "function" ? paddingAccessor(d, i) : paddingAccessor;

            const labelWidth = textWidth(label, {
              "font-size": fontSize,
              "font-family": fontFamily,
              "font-weight": fontWeight
            });

            const coords = group.values.map(d => [xEstimate(d.x), yEstimate(d.y)]);
            const myMaxX = max(group.values.map(d => xEstimate(d.x)));
            const labelY = group.values.find(d => xEstimate(d.x) === myMaxX).y;
            return {
              id: group.key,
              labelWidth: labelWidth + labelPadding * 2,
              spaceNeeded: labelWidth + labelPadding * 4,
              value: labelY,
              yEstimate: yEstimate(labelY),
              padding: labelPadding,
              fontSize,
              fontColor,
              maxX: myMaxX,
              xValue: max(group.values, d => d.x),
              coords
            };

          })
          .sort((a, b) => yDomain[1] > yDomain[0] ? a.value - b.value : b.value - a.value)
          .filter((d, i, arr) => {
            const {fontSize, id, labelWidth, maxX, yEstimate} = d;
            const closeLabels = arr
              .filter(l => 
                l.id !== id && l.coords.some(c => 
                  (c[0] > maxX || (c[0] === maxX && l.maxX !== maxX)) && 
                  c[0] <= (maxX + labelWidth) && 
                  c[1] <= (yEstimate + fontSize * 0.75) && 
                  c[1] >= (yEstimate - fontSize * 0.75)
                )
              );
            return closeLabels.length === 0;

          });

          const maxX = max(labelWidths, d => d.maxX);
          largestLabel = max(labelWidths.map(d => d.labelWidth));
          const spaceNeeded = maxX === this._xTest._getRange.bind(this._xTest)()[1] 
            ? max(labelWidths.filter(d => d.maxX === maxX), d => d.spaceNeeded)
            : 0;
          if (spaceNeeded) {
            const labelSpace = min([spaceNeeded, width / 4]);
            xRangeMax = width - labelSpace - this._margin.right;
          }
      }
    }

    if (showX && xRangeMax) {
      this._xTest
        .domain(xDomain)
        .height(height)
        .maxSize(height / 2)
        .range([undefined, xRangeMax])
        .select(testGroup.node())
        .ticks(xTicks)
        .width(width)
        .config(xC)
        .config(this._xConfig)
        .scale(xConfigScale)
        .render();
    }

    if (x2Exists) {
      this._x2Test
        .domain(x2Domain)
        .height(height)
        .range([undefined, xRangeMax])
        .select(testGroup.node())
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .tickSize(0)
        .config(defaultX2Config)
        .config(this._x2Config)
        .scale(x2ConfigScale)
        .render();
    }

    const xTestRange = this._xTest._getRange();
    const x2TestRange = this._x2Test._getRange();

    const x2Bounds = this._x2Test.outerBounds();
    const x2Height = x2Exists ? x2Bounds.height + this._x2Test.padding() : 0;

    let xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (showX) {
      this._xTest
        .range([xOffsetLeft, undefined])
        .render();
    }

    const topOffset = showY ? this._yTest.shapeConfig().labelConfig.fontSize() / 2 : 0;

    let xOffsetRight = max([y2Width, width - xTestRange[1], width - x2TestRange[1]]);
    const xBounds = this._xTest.outerBounds();
    const xHeight = xBounds.height + (showY ? this._xTest.padding() : 0);

    this._padding.left += xOffsetLeft;
    this._padding.right += xOffsetRight;
    this._padding.bottom += xHeight;
    this._padding.top += x2Height + topOffset;

    super._draw(callback);

    const horizontalMargin = this._margin.left + this._margin.right;
    const verticalMargin = this._margin.top + this._margin.bottom;
    let yRange = [x2Height, height - (xHeight + topOffset + verticalMargin)];

    if (showY) {
      this._yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range(yRange)
        .select(testGroup.node())
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(this._yConfig)
        .scale(yConfigScale)
        .render();
    }

    yBounds = this._yTest.outerBounds();
    yWidth = yBounds.width ? yBounds.width + this._yTest.padding() : undefined;
    xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (y2Exists) {
      this._y2Test
        .config(yC)
        .domain(y2Domain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .select(testGroup.node())
        .width(width - max([0, xOffsetRight - y2Width]))
        .title(false)
        .config(this._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .render();
    }

    y2Bounds = this._y2Test.outerBounds();
    y2Width = y2Bounds.width ? y2Bounds.width + this._y2Test.padding() : undefined;
    xOffsetRight = max([0, y2Width, width - xTestRange[1], width - x2TestRange[1]]);
    const xRange = [xOffsetLeft, width - (xOffsetRight + horizontalMargin)];

    const rectGroup = elem("g.d3plus-plot-background", {parent, transition});

    const transform = `translate(${this._margin.left}, ${this._margin.top + x2Height + topOffset})`;
    const x2Transform = `translate(${this._margin.left}, ${this._margin.top + topOffset})`;

    const xGroup = showX && elem("g.d3plus-plot-x-axis", {parent, transition, enter: {transform}, update: {transform}});
    const x2Group = x2Exists && elem("g.d3plus-plot-x2-axis", {parent, transition, enter: {transform: x2Transform}, update: {transform: x2Transform}});

    const xTrans = xOffsetLeft > yWidth ? xOffsetLeft - yWidth : 0;
    const yTransform = `translate(${this._margin.left + xTrans}, ${this._margin.top + topOffset})`;
    const yGroup = showY && elem("g.d3plus-plot-y-axis", {parent, transition, enter: {transform: yTransform}, update: {transform: yTransform}});

    const y2Transform = `translate(-${this._margin.right}, ${this._margin.top + topOffset})`;
    const y2Group = y2Exists && elem("g.d3plus-plot-y2-axis", {parent, transition, enter: {transform: y2Transform}, update: {transform: y2Transform}});
    
    this._xAxis
      .domain(xDomain)
      .height(height - (x2Height + topOffset + verticalMargin))
      .maxSize(height / 2)
      .range(xRange)
      .select(showX ? xGroup.node() : undefined)
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(this._xConfig)
      .scale(xConfigScale)
      .render();

    if (x2Exists) {
      this._x2Axis
        .domain(x2Domain)
        .height(height - (xHeight + topOffset + verticalMargin))
        .range(xRange)
        .select(x2Group.node())
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .config(defaultX2Config)
        .config(this._x2Config)
        .scale(x2ConfigScale)
        .render();
    }

    this._xFunc = x = (d, x) => {
      if (x === "x2") {
        if (x2ConfigScale === "log" && d === 0) d = x2Domain[0] < 0 ? this._x2Axis._d3Scale.domain()[1] : this._x2Axis._d3Scale.domain()[0];
        return this._x2Axis._getPosition.bind(this._x2Axis)(d);
      }
      else {
        if (xConfigScale === "log" && d === 0) d = xDomain[0] < 0 ? this._xAxis._d3Scale.domain()[1] : this._xAxis._d3Scale.domain()[0];
        return this._xAxis._getPosition.bind(this._xAxis)(d);
      }
    };

    yRange = [this._xAxis.outerBounds().y + x2Height, height - (xHeight + topOffset + verticalMargin)];

    this._yAxis
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range(yRange)
      .select(showY ? yGroup.node() : undefined)
      .ticks(yTicks)
      .width(xRange[xRange.length - 1])
      .config(yC)
      .config(this._yConfig)
      .scale(yConfigScale)
      .render();

    if (y2Exists) {
      this._y2Axis
        .config(yC)
        .domain(y2Exists ? y2Domain : yDomain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .select(y2Group.node())
        .width(width - max([0, xOffsetRight - y2Width]))
        .title(false)
        .config(this._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .render();
    }

    let labelPositions = {};
    if (labelWidths) {

      nest()
        .key(d => d.xValue)
        .entries(labelWidths)
        .forEach(({values}) => {

          const minFontSize = max(values.map(d => d.fontSize));
          const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
          const bumpLimit = (yRange[1] - yRange[0]) / 8;
          
          /** */
          function bumpPrevious(d, i, arr) {
            if (!d.defaultY) d.defaultY = this._yAxis._getPosition(d.value);
            if (i) {
              const prev = arr[i - 1];
              const {fontSize, padding} = d;
              const y = d.newY || d.defaultY;
              const prevY = prev.newY || prev.defaultY;
              if (y - fontSize / 2 - padding < prevY) {
                const newY = yBuckets.find(n => n < prevY);
                const change = d.defaultY - newY;
                if (change < bumpLimit) {
                  prev.newY = newY;
                  if (i) bumpPrevious(prev, i - 1, arr);
                }
              }
            }
          }
    
          values.forEach(bumpPrevious.bind(this));

        });

      labelPositions = labelWidths.reduce((obj, d) => {
        if (d.newY) obj[d.id] = d.newY;
        return obj;
      }, {});

    }

    this._yFunc = y = (d, y) => {
      if (y === "y2") {
        if (y2ConfigScale === "log" && d === 0) d = y2Domain[1] < 0 ? this._y2Axis._d3ScaleNegative.domain()[0] : this._y2Axis._d3Scale.domain()[1];
        return this._y2Axis._getPosition.bind(this._y2Axis)(d) - x2Height;
      }
      else {
        if (yConfigScale === "log" && d === 0) d = yDomain[1] < 0 ? this._yAxis._d3ScaleNegative.domain()[0] : this._yAxis._d3Scale.domain()[1];
        return this._yAxis._getPosition.bind(this._yAxis)(d) - x2Height;
      }
    };

    new shapes.Rect()
      .data([{}])
      .select(rectGroup.node())
      .x(xRange[0] + (xRange[1] - xRange[0]) / 2)
      .width(xRange[1] - xRange[0])
      .y(this._margin.top + topOffset + yRange[0] + (yRange[1] - yRange[0]) / 2)
      .height(yRange[1] - yRange[0])
      .config(this._backgroundConfig)
      .render();

    const labelConnectors = labelWidths.filter(d => d.newY !== undefined);
    if (labelConnectors.length) {

      const connectorGroup = elem("g.d3plus-plot-connectors", {parent, transition, enter: {transform}, update: {transform}}).node();
      const data = labelConnectors.map(d => (assign({x: this._xAxis._getPosition.bind(this._xAxis)(d.xValue), y: d.defaultY}, d)))
        .concat(labelConnectors.map(d => (assign({x: this._xAxis._getPosition.bind(this._xAxis)(d.xValue) + d.padding - 1, y: d.newY || d.defaultY}, d))));
      
      new shapes.Line()
        .config({
          data,
          stroke: d => d.fontColor,
          x: d => d.x,
          y: d => d.y
        })
        .config(this._labelConnectorConfig)
        .select(connectorGroup)
        .render();
      
    }

    const annotationGroupBack = elem("g.d3plus-plot-annotations", {parent, transition, enter: {transform}, update: {transform}}).node();
    const shapeGroup = elem("g.d3plus-plot-shapes", {parent, transition, enter: {transform}, update: {transform}}).node();
    const annotationGroupFront = elem("g.d3plus-plot-annotations-front", {parent, transition, enter: {transform}, update: {transform}}).node();

    Object.keys(this._previousAnnotations).forEach(layer => {

      const group = layer === "front" ? annotationGroupFront : annotationGroupBack;

      const annotationData = this._annotations.filter(d => (layer === "back" && !d.layer) || d.layer === layer);
      const annotationShapes = annotationData.map(d => d.shape);
      annotationData.forEach(annotation => {
        new shapes[annotation.shape]()
          .duration(this._duration)
          .config(annotation)
          .config({
            x: d => d.x2 ? x(d.x2, "x2") : x(d.x),
            x0: this._discrete === "x" ? d => d.x2 ? x(d.x2, "x2") : x(d.x) : x(domains.x[0]),
            x1: this._discrete === "x" ? null : d => d.x2 ? x(d.x2, "x2") : x(d.x),
            y: d => d.y2 ? y(d.y2, "y2") : y(d.y),
            y0: this._discrete === "y" ? d => d.y2 ? y(d.y2, "y2") : y(d.y) : y(domains.y[1]) - yOffset,
            y1: this._discrete === "y" ? null : d => d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset
          })
          .select(group)
          .render();
      });
  
      const exitAnnotations = this._previousAnnotations[layer].filter(d => !annotationShapes.includes(d));
  
      exitAnnotations.forEach(shape => {
        new shapes[shape]()
          .data([])
          .select(group)
          .render();
      });
  
      this._previousAnnotations[layer] = annotationShapes;

    });

    let yOffset = this._xAxis.barConfig()["stroke-width"];
    if (yOffset) yOffset /= 2;

    const discrete = this._discrete || "x";
    
    const shapeConfig = {
      discrete: this._discrete,
      duration: this._duration,
      label: d => this._drawLabel(d.data, d.i),
      select: shapeGroup,
      x: d => d.x2 !== undefined ? x(d.x2, "x2") : x(d.x),
      x0: discrete === "x" ? d => d.x2 ? x(d.x2, "x2") : x(d.x) : x(typeof this._baseline === "number" ? this._baseline : domains.x[0]),
      x1: discrete === "x" ? null : d => d.x2 ? x(d.x2, "x2") : x(d.x),
      y: d => d.y2 !== undefined ? y(d.y2, "y2") : y(d.y),
      y0: discrete === "y" ? d => d.y2 ? y(d.y2, "y2") : y(d.y) : y(typeof this._baseline === "number" ? this._baseline : domains.y[1]) - yOffset,
      y1: discrete === "y" ? null : d => d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset
    };

    const events = Object.keys(this._on);
    shapeData.forEach(d => {

      const shapeConfigInner = Object.assign({}, shapeConfig);
      if (this._stacked && ["Area", "Bar"].includes(d.key)) {
        const scale = opp === "x" ? x : y;
        shapeConfigInner[`${opp}`] = shapeConfigInner[`${opp}0`] = d => {
          const dataIndex = stackKeys.indexOf(d.id),
                discreteIndex = discreteKeys.indexOf(d.discrete);
          const scaleIndex = d[opp] < 0 ? 1 : 0;
          return dataIndex >= 0 ? scale(stackData[dataIndex][discreteIndex][scaleIndex]) : scale(domains[opp][opp === "x" ? 0 : 1]);
        };        shapeConfigInner[`${opp}1`] = d => {
          const dataIndex = stackKeys.indexOf(d.id),
                discreteIndex = discreteKeys.indexOf(d.discrete);
                const scaleIndex = d[opp] < 0 ? 0 : 1;
          return dataIndex >= 0 ? scale(stackData[dataIndex][discreteIndex][scaleIndex]) : scale(domains[opp][opp === "x" ? 0 : 1]);
        };
      }

      const s = new shapes[d.key]().config(shapeConfigInner).data(d.values);

      if (d.key === "Bar") {

        let space;
        const scale = this._discrete === "x" ? x : y;
        const scaleType = this._discrete === "x" ? xScale : yScale;
        const vals = this._discrete === "x" ? xDomain : yDomain;
        const range = this._discrete === "x" ? xRange : yRange;
        if (scaleType !== "Point" && vals.length === 2) {
          const allPositions = Array.from(new Set(d.values.map(d => scale(d[this._discrete]))));
          allPositions.unshift(range[0] - allPositions[0] - range[0]);
          allPositions.push(range[1] + range[1] - allPositions[allPositions.length - 1]);
          space = allPositions.reduce((n, d, i, arr) => {
            if (i) {
              const dist = Math.abs(d - arr[i - 1]);
              if (dist < n) n = dist;
            }
            return n;
          }, Infinity);
        }
        else if (vals.length > 1) space = scale(vals[1]) - scale(vals[0]);
        else space = range[range.length - 1] - range[0];
        if (this._groupPadding < space) space -= this._groupPadding;

        let barSize = space || 1;
        
        const groups = nest()
          .key(d => d[this._discrete])
          .key(d => d.group)
          .entries(d.values);

        const ids = merge(groups.map(d => d.values.map(v => v.key)));
        const uniqueIds = Array.from(new Set(ids));

        if (max(groups.map(d => d.values.length)) === 1) {
          s[this._discrete]((d, i) => shapeConfig[this._discrete](d, i));
        }
        else {

          barSize = (barSize - this._barPadding * uniqueIds.length - 1) / uniqueIds.length;

          const offset = space / 2 - barSize / 2;

          const xMod = scales.scaleLinear()
            .domain([0, uniqueIds.length - 1])
            .range([-offset, offset]);

          s[this._discrete]((d, i) => shapeConfig[this._discrete](d, i) + xMod(uniqueIds.indexOf(d.group)));

        }

        s.width(barSize);
        s.height(barSize);

      }
      else if (d.key === "Line") {

        s.duration(width * 1.5);

        if (this._confidence) {
          const areaConfig = Object.assign({}, shapeConfig);
          const discrete = this._discrete || "x";
          const key = discrete === "x" ? "y" : "x";
          const scaleFunction = discrete === "x" ? y : x;
          areaConfig[`${key}0`] = d => scaleFunction(this._confidence[0] ? d.lci : d[key]);
          areaConfig[`${key}1`] = d => scaleFunction(this._confidence[1] ? d.hci : d[key]);

          const area = new shapes.Area().config(areaConfig).data(d.values);
          const confidenceConfig = Object.assign(this._shapeConfig, this._confidenceConfig);

          area
            .config(assign(configPrep.bind(this)(confidenceConfig, "shape", "Line"), configPrep.bind(this)(confidenceConfig, "shape", "Area")))
            .render();

          this._shapes.push(area);
        }
        
        s.config({
          discrete: shapeConfig.discrete || "x",
          label: showLineLabels ? (d, i) => {
            const visible = typeof this._lineLabels === "function" ? this._lineLabels(d.data, d.i) : true;
            if (!visible) return false;
            const labelData = labelWidths.find(l => l.id === d.id);
            if (labelData) {
              const yPos = labelData.newY || labelData.defaultY;
              const allLabels = labelWidths.filter(l => l.newY === yPos);
              if (allLabels.length > 1) return allLabels[0].id !== d.id ? false 
                : `+${formatAbbreviate(allLabels.length, this._locale)} ${this._translate("more")}`;
              return this._drawLabel(d, i);
            }
            return false;
          } : false,
          labelBounds: showLineLabels ? (d, i, s) => {
            const [firstX, firstY] = s.points[0];
            const [lastX, lastY] = s.points[s.points.length - 1];
            const height = this._height / 4;
            const mod = labelPositions[d.id] ? lastY - labelPositions[d.id] : 0;
            return {
              x: lastX - firstX,
              y: lastY - firstY - height / 2 - mod,
              width: largestLabel,
              height
            };
          } : false
        });

      }

      const classEvents = events.filter(e => e.includes(`.${d.key}`)),
            globalEvents = events.filter(e => !e.includes(".")),
            shapeEvents = events.filter(e => e.includes(".shape"));
      for (let e = 0; e < globalEvents.length; e++) s.on(globalEvents[e], (d, i, x, event) => this._on[globalEvents[e]](d.data, d.i, x, event));
      for (let e = 0; e < shapeEvents.length; e++) s.on(shapeEvents[e], (d, i, x, event) => this._on[shapeEvents[e]](d.data, d.i, x, event));
      for (let e = 0; e < classEvents.length; e++) s.on(classEvents[e], (d, i, x, event) => this._on[classEvents[e]](d.data, d.i, x, event));

      const userConfig = configPrep.bind(this)(this._shapeConfig, "shape", d.key);
      if (this._shapeConfig.duration === undefined) delete userConfig.duration;
      s.config(userConfig).render();

      this._shapes.push(s);

      if (d.key === "Line") {
        const markers = new shapes.Circle()
          .data(this._lineMarkers ? d.values : [])
          .config(shapeConfig)
          .config(this._lineMarkerConfig)
          .id(d => `${d.id}_${d.discrete}`);

        for (let e = 0; e < globalEvents.length; e++) markers.on(globalEvents[e], (d, i, x, event) => this._on[globalEvents[e]](d.data, d.i, x, event));
        for (let e = 0; e < shapeEvents.length; e++) markers.on(shapeEvents[e], (d, i, x, event) => this._on[shapeEvents[e]](d.data, d.i, x, event));
        for (let e = 0; e < classEvents.length; e++) markers.on(classEvents[e], (d, i, x, event) => this._on[classEvents[e]](d.data, d.i, x, event));

        markers.render();
        this._shapes.push(markers);
      }

    });

    const dataShapes = shapeData.map(d => d.key);
    if (dataShapes.includes("Line")) {
      if (this._confidence) dataShapes.push("Area");
      if (this._lineMarkers) dataShapes.push("Circle");
    }
    const exitShapes = this._previousShapes.filter(d => !dataShapes.includes(d));

    exitShapes.forEach(shape => {
      new shapes[shape]()
        .config(shapeConfig)
        .data([])
        .render();
    });

    this._previousShapes = dataShapes;

    return this;

  }

  /**
      @memberof Plot
      @desc Allows drawing custom shapes to be used as annotations in the provided x/y plot. This method accepts custom config objects for the [Shape](http://d3plus.org/docs/#Shape) class, either a single config object or an array of config objects. Each config object requires an additional parameter, the "shape", which denotes which [Shape](http://d3plus.org/docs/#Shape) sub-class to use ([Rect](http://d3plus.org/docs/#Rect), [Line](http://d3plus.org/docs/#Line), etc).

Additionally, each config object can also contain an optional "layer" key, which defines whether the annotations will be displayed in "front" or in "back" of the primary visualization shapes. This value defaults to "back" if not present.
      @param {Array|Object} *annotations* = []
      @chainable
  */
  annotations(_) {
    return arguments.length ? (this._annotations = _ instanceof Array ? _ : [_], this) : this._annotations;
  }

  /**
      @memberof Plot
      @desc Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).
      @param {Boolean} [*value* = false]
      @chainable
  */
  axisPersist(_) {
    return arguments.length ? (this._axisPersist = _, this) : this._axisPersist;
  }

  /**
       @memberof Plot
       @desc A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).
       @param {Object} [*value*]
       @chainable
   */
  backgroundConfig(_) {
    return arguments.length ? (this._backgroundConfig = assign(this._backgroundConfig, _), this) : this._backgroundConfig;
  }

  /**
      @memberof Plot
      @desc Sets the pixel space between each bar in a group of bars.
      @param {Number} *value* = 0
      @chainable
  */
  barPadding(_) {
    return arguments.length ? (this._barPadding = _, this) : this._barPadding;
  }

  /**
      @memberof Plot
      @desc Sets the baseline for the x/y plot. If *value* is not specified, returns the current baseline.
      @param {Number} *value*
      @chainable
  */
  baseline(_) {
    return arguments.length ? (this._baseline = _, this) : this._baseline;
  }

  /**
       @memberof Plot
       @desc Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).
       @param {Object|Boolean} [*value*]
       @chainable
   */
  buffer(_) {
    if (arguments.length) {
      if (!_) this._buffer = {};
      else if (_ === true) this._buffer = defaultBuffers;
      else {
        this._buffer = assign({}, this._buffer, _);
        for (let key in this._buffer) {
          if (this._buffer[key] === true) this._buffer[key] = defaultBuffers[key];
        }
      }
      return this;
    }
    return this._buffer;
  }

  /**
       @memberof Plot
       @desc Sets the confidence to the specified array of lower and upper bounds.
       @param {String[]|Function[]} *value*
       @chainable
       @example <caption>Can be called with accessor functions or static keys:</caption>
       var data = {id: "alpha", value: 10, lci: 9, hci: 11};
       ...
       // Accessor functions
       .confidence([function(d) { return d.lci }, function(d) { return d.hci }])

       // Or static keys
       .confidence(["lci", "hci"])
   */
  confidence(_) {
    if (arguments.length && _ instanceof Array) {
      this._confidence = [];
      const lower = _[0];
      this._confidence[0] = typeof lower === "function" || !lower ? lower : accessor(lower);
      const upper = _[1];
      this._confidence[1] = typeof upper === "function" || !upper ? upper : accessor(upper);

      return this;
    }
    else return this._confidence;
  }

  /**
       @memberof Plot
       @desc If *value* is specified, sets the config method for each shape rendered as a confidence interval and returns the current class instance.
       @param {Object} [*value*]
       @chainable
   */
  confidenceConfig(_) {
    return arguments.length ? (this._confidenceConfig = assign(this._confidenceConfig, _), this) : this._confidenceConfig;
  }

  /**
      @memberof Plot
      @desc Sets the discrete axis to the specified string. If *value* is not specified, returns the current discrete axis.
      @param {String} *value*
      @chainable
  */
  discrete(_) {
    return arguments.length ? (this._discrete = _, this) : this._discrete;
  }

  /**
      @memberof Plot
      @desc When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.
      @param {Number} *value*
      @chainable
  */
  discreteCutoff(_) {
    return arguments.length ? (this._discreteCutoff = _, this) : this._discreteCutoff;
  }

  /**
      @memberof Plot
      @desc Sets the pixel space between groups of bars.
      @param {Number} [*value* = 5]
      @chainable
  */
  groupPadding(_) {
    return arguments.length ? (this._groupPadding = _, this) : this._groupPadding;
  }

  /**
       @memberof Plot
       @desc The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.
       @param {Object} [*value*]
       @chainable
   */
  labelConnectorConfig(_) {
    return arguments.length ? (this._labelConnectorConfig = assign(this._labelConnectorConfig, _), this) : this._labelConnectorConfig;
  }

  /**
      @memberof Viz
      @desc The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.
      @param {Function|String} [*value* = "auto"]
      @chainable
  */
  labelPosition(_) {
    return arguments.length ? (this._labelPosition = typeof _ === "function" ? _ : constant(_), this) : this._labelPosition;
  }

  /**
      @memberof Plot
      @desc Draws labels on the right side of any Line shapes that are drawn on the plot.
      @param {Boolean|Function} [*value* = false]
      @chainable
  */
  lineLabels(_) {
    return arguments.length ? (this._lineLabels = _, this) : this._lineLabels;
  }

  /**
      @memberof Plot
      @desc Shape config for the Circle shapes drawn by the lineMarkers method.
      @param {Object} *value*
      @chainable
  */
  lineMarkerConfig(_) {
    return arguments.length ? (this._lineMarkerConfig = assign(this._lineMarkerConfig, _), this) : this._lineMarkerConfig;
  }

  /**
      @memberof Plot
      @desc Draws circle markers on each vertex of a Line.
      @param {Boolean} [*value* = false]
      @chainable
  */
  lineMarkers(_) {
    return arguments.length ? (this._lineMarkers = _, this) : this._lineMarkers;
  }

  /**
      @memberof Plot
      @desc A JavaScript [sort comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) that receives each shape Class (ie. "Circle", "Line", etc) as it's comparator arguments. Shapes are drawn in groups based on their type, so you are defining the layering order for all shapes of said type.
      @param {Function} *value*
      @chainable
  */
  shapeSort(_) {
    return arguments.length ? (this._shapeSort = _, this) : this._shapeSort;
  }

  /**
      @memberof Plot
      @desc Sets the size of bubbles to the given Number, data key, or function.
      @param {Function|Number|String} *value* = 10
      @chainable
  */
  size(_) {
    return arguments.length ? (this._size = typeof _ === "function" || !_ ? _ : accessor(_), this) : this._size;
  }

  /**
      @memberof Plot
      @desc Sets the size scale maximum to the specified number.
      @param {Number} *value* = 20
      @chainable
  */
  sizeMax(_) {
    return arguments.length ? (this._sizeMax = _, this) : this._sizeMax;
  }

  /**
      @memberof Plot
      @desc Sets the size scale minimum to the specified number.
      @param {Number} *value* = 5
      @chainable
  */
  sizeMin(_) {
    return arguments.length ? (this._sizeMin = _, this) : this._sizeMin;
  }

  /**
      @memberof Plot
      @desc Sets the size scale to the specified string.
      @param {String} *value* = "sqrt"
      @chainable
  */
  sizeScale(_) {
    return arguments.length ? (this._sizeScale = _, this) : this._sizeScale;
  }

  /**
      @memberof Plot
      @desc If *value* is specified, toggles shape stacking. If *value* is not specified, returns the current stack value.
      @param {Boolean} *value* = false
      @chainable
  */
  stacked(_) {
    return arguments.length ? (this._stacked = _, this) : this._stacked;
  }

  /**
      @memberof Plot
      @desc Sets the stack offset. If *value* is not specified, returns the current stack offset function.
      @param {Function|String} *value* = "descending"
      @chainable
  */
  stackOffset(_) {
    return arguments.length ? (this._stackOffset = typeof _ === "function" ? _ : d3Shape[`stackOffset${_.charAt(0).toUpperCase() + _.slice(1)}`], this) : this._stackOffset;
  }

  /**
      @memberof Plot
      @desc Sets the stack order. If *value* is not specified, returns the current stack order function.
      @param {Function|String|Array} *value* = "none"
      @chainable
  */
  stackOrder(_) {
    if (arguments.length) {
      if (typeof _ === "string") this._stackOrder = _ === "ascending" ? stackOrderAscending : _ === "descending" ? stackOrderDescending : d3Shape[`stackOrder${_.charAt(0).toUpperCase() + _.slice(1)}`];
      else this._stackOrder = _;
      return this;
    }
    else return this._stackOrder;
  }

  /**
      @memberof Plot
      @desc Sets the x accessor to the specified function or number. If *value* is not specified, returns the current x accessor.
      @param {Function|Number} *value*
      @chainable
  */
  x(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_);
        this._xKey = _;
      }
      return this;
    }
    else return this._x;
  }

  /**
       @memberof Plot
       @desc Sets the x2 accessor to the specified function or number. If *value* is not specified, returns the current x2 accessor.
       @param {Function|Number} *value*
       @chainable
   */
  x2(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._x2 = _;
      else {
        this._x2 = accessor(_);
        this._x2Key = _;
      }
      return this;
    }
    else return this._x2;
  }

  /**
      @memberof Plot
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
      @param {Object} *value*
      @chainable
  */
  xConfig(_) {
    return arguments.length ? (this._xConfig = assign(this._xConfig, _), this) : this._xConfig;
  }

  /**
      @memberof Plot
      @desc When the width of the chart is less than or equal to this pixel value, and the x-axis is not the discrete axis, it will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.
      @param {Number} *value*
      @chainable
  */
  xCutoff(_) {
    return arguments.length ? (this._xCutoff = _, this) : this._xCutoff;
  }

  /**
      @memberof Plot
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
      @param {Object} *value*
      @chainable
  */
  x2Config(_) {
    return arguments.length ? (this._x2Config = assign(this._x2Config, _), this) : this._x2Config;
  }

  /**
      @memberof Plot
      @desc Sets the x domain to the specified array. If *value* is not specified, returns the current x domain. Additionally, if either value of the array is undefined, it will be calculated from the data.
      @param {Array} *value*
      @chainable
  */
  xDomain(_) {
    return arguments.length ? (this._xDomain = _, this) : this._xDomain;
  }

  /**
       @memberof Plot
       @desc Sets the x2 domain to the specified array. If *value* is not specified, returns the current x2 domain. Additionally, if either value of the array is undefined, it will be calculated from the data.
       @param {Array} *value*
       @chainable
   */
  x2Domain(_) {
    return arguments.length ? (this._x2Domain = _, this) : this._x2Domain;
  }

  /**
      @memberof Plot
      @desc Defines a custom sorting comparitor function to be used for discrete x axes.
      @param {Function} *value*
      @chainable
  */
  xSort(_) {
    return arguments.length ? (this._xSort = _, this) : this._xSort;
  }

  /**
       @memberof Plot
       @desc Defines a custom sorting comparitor function to be used for discrete x2 axes.
       @param {Function} *value*
       @chainable
   */
  x2Sort(_) {
    return arguments.length ? (this._x2Sort = _, this) : this._x2Sort;
  }

  /**
      @memberof Plot
      @desc Sets the y accessor to the specified function or number. If *value* is not specified, returns the current y accessor.
      @param {Function|Number} *value*
      @chainable
  */
  y(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_);
        this._yKey = _;
      }
      return this;
    }
    else return this._y;
  }

  /**
       @memberof Plot
       @desc Sets the y2 accessor to the specified function or number. If *value* is not specified, returns the current y2 accessor.
       @param {Function|Number} *value*
       @chainable
   */
  y2(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._y2 = _;
      else {
        this._y2 = accessor(_);
        this._y2Key = _;
      }
      return this;
    }
    else return this._y2;
  }

  /**
      @memberof Plot
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

*Note:* If a "domain" array is passed to the y-axis config, it will be reversed.
      @param {Object} *value*
      @chainable
  */
  yConfig(_) {
    if (arguments.length) {
      if (_.domain) _.domain = _.domain.slice().reverse();
      this._yConfig = assign(this._yConfig, _);
      return this;
    }
    return this._yConfig;
  }

  /**
      @memberof Plot
      @desc When the height of the chart is less than or equal to this pixel value, and the y-axis is not the discrete axis, it will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.
      @param {Number} *value*
      @chainable
  */
  yCutoff(_) {
    return arguments.length ? (this._yCutoff = _, this) : this._yCutoff;
  }

  /**
      @memberof Plot
      @desc A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
      @param {Object} *value*
      @chainable
  */
  y2Config(_) {
    if (arguments.length) {
      if (_.domain) _.domain = _.domain.slice().reverse();
      this._y2Config = assign(this._y2Config, _);
      return this;
    }
    return this._y2Config;
  }

  /**
      @memberof Plot
      @desc Sets the y domain to the specified array. If *value* is not specified, returns the current y domain. Additionally, if either value of the array is undefined, it will be calculated from the data.
      @param {Array} *value*
      @chainable
  */
  yDomain(_) {
    return arguments.length ? (this._yDomain = _, this) : this._yDomain;
  }

  /**
       @memberof Plot
       @desc Sets the y2 domain to the specified array. If *value* is not specified, returns the current y2 domain. Additionally, if either value of the array is undefined, it will be calculated from the data.
       @param {Array} *value*
       @chainable
   */
  y2Domain(_) {
    return arguments.length ? (this._y2Domain = _, this) : this._y2Domain;
  }

  /**
      @memberof Plot
      @desc Defines a custom sorting comparitor function to be used for discrete y axes.
      @param {Function} *value*
      @chainable
  */
  ySort(_) {
    return arguments.length ? (this._ySort = _, this) : this._ySort;
  }

  /**
       @memberof Plot
       @desc Defines a custom sorting comparitor function to be used for discrete y2 axes.
       @param {Function} *value*
       @chainable
   */
  y2Sort(_) {
    return arguments.length ? (this._y2Sort = _, this) : this._y2Sort;
  }

}
