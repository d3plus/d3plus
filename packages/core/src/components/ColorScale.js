
import {extent, max, min, quantile, range, deviation} from "d3-array";
import {interpolateRgb} from "d3-interpolate";
import {scaleLinear, scaleThreshold} from "d3-scale";
import {select} from "d3-selection";
import {transition} from "d3-transition";

import {Axis} from "../components/index.js";
import {colorDefaults, colorLighter} from "../color/index.js";
import {assign, elem, textWidth} from "../dom/index.js";
import {formatAbbreviate} from "../format/index.js";
import ckmeans from "../math/ckmeans.js";
import {Rect} from "../shape/index.js";
import {TextBox} from "../text/index.js";
import {accessor, BaseClass, constant, unique} from "../utils/index.js";

import Legend from "./Legend.js";

/**
    @class ColorScale
    @extends BaseClass
    @desc Creates an SVG scale based on an array of data. If *data* is specified, immediately draws based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#shape.data) method.
*/
export default class ColorScale extends BaseClass {

  /**
      @memberof ColorScale
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {

    super();

    this._axisClass = new Axis();
    this._axisConfig = {
      gridSize: 0
    };
    this._axisTest = new Axis();
    this._align = "middle";
    this._buckets = 5;
    this._bucketAxis = false;
    this._bucketFormat = (tick, i, ticks, allValues) => {

      const format = this._axisConfig.tickFormat
        ? this._axisConfig.tickFormat : formatAbbreviate;

      const next = ticks[i + 1];
      const prev = i ? ticks[i - 1] : false;
      const last = i === ticks.length - 1;
      if (tick === next || last) {
        const suffix = last && tick < max(allValues) ? "+" : "";
        return `${format(tick)}${suffix}`;
      }
      else {
        const mod = next ? next / 100 : tick / 100;

        const pow = mod >= 1 || mod <= -1 ? Math.round(mod).toString().length - 1 : mod.toString().split(".")[1].replace(/([1-9])[1-9].*$/, "$1").length * -1;
        const ten = Math.pow(10, pow);

        const prevValue = prev === tick && i === 1
          ? format(min([tick + ten, allValues.find(d => d > tick && d < next)]))
          : format(tick);

        const nextValue = tick && i === 1
          ? format(next)
          : format(max([next - ten, allValues.reverse().find(d => d > tick && d < next)]));

        return this._bucketJoiner(prevValue, nextValue);

      }
    };
    this._bucketJoiner = (a, b) => a !== b ? `${a} - ${b}` : `${a}`;
    this._centered = true;
    this._color = ["#54478C", "#2C699A", "#0DB39E", "#83E377", "#EFEA5A"];
    this._colorMax = colorDefaults.on;
    this._colorMid = colorDefaults.light;
    this._colorMin = colorDefaults.off;
    this._data = [];
    this._duration = 600;
    this._height = 200;
    this._labelClass = new TextBox();
    this._labelConfig = {
      fontColor: colorDefaults.dark,
      fontSize: 12
    };
    this._legendClass = new Legend();
    this._legendConfig = {
      shapeConfig: {
        stroke: colorDefaults.dark,
        strokeWidth: 1
      }
    };
    this._midpoint = 0;
    this._orient = "bottom";
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this._padding = 5;
    this._rectClass = new Rect().parent(this);
    this._rectConfig = {
      stroke: "#999",
      strokeWidth: 1
    };
    this._scale = "linear";
    this._size = 10;
    this._value = accessor("value");
    this._width = 400;

  }

  /**
      @memberof ColorScale
      @desc Renders the current ColorScale to the page. If a *callback* is specified, it will be called once the ColorScale is done drawing.
      @param {Function} [*callback* = undefined]
      @chainable
  */
  render(callback) {

    if (this._select === void 0) this.select(select("body").append("svg").attr("width", `${this._width}px`).attr("height", `${this._height}px`).node());

    const horizontal = ["bottom", "top"].includes(this._orient);

    const height = horizontal ? "height" : "width",
          width = horizontal ? "width" : "height",
          x = horizontal ? "x" : "y",
          y = horizontal ? "y" : "x";

    // Shape <g> Group
    this._group = elem("g.d3plus-ColorScale", {parent: this._select});

    const allValues = this._data
      .map(this._value)
      .filter(d => d !== null && typeof d === "number")
      .sort((a, b) => a - b);

    const domain = this._domain || extent(allValues);
    const negative = domain[0] < this._midpoint;
    const positive = domain[1] > this._midpoint;
    const diverging = negative && positive;

    const numBuckets = min([
      this._buckets instanceof Array ? this._buckets.length : this._buckets,
      diverging && this._scale !== "jenks" ? 2 * Math.floor(unique(allValues).length / 2) - 1 : unique(allValues).length
    ]);

    let colors = diverging 
          && (!this._color || (this._color instanceof Array && !this._color.includes(this._colorMid))) 
            ? undefined 
          : this._color, 
        labels, 
        ticks;

    if (colors && !(colors instanceof Array)) {
      colors = range(0, numBuckets, 1)
        .map(i => colorLighter(colors, (i + 1) / numBuckets))
        .reverse();
    }

    if (this._scale === "jenks") {

      const buckets = min([colors ? colors.length : numBuckets, numBuckets, allValues.length]);

      let jenks = [];

      if (this._buckets instanceof Array) {
        ticks = this._buckets;
      }
      else {

        if (diverging && this._centered) {

          const half = Math.floor(buckets / 2);
          const residual = buckets % 2;

          const negatives = allValues.filter(d => d < this._midpoint);
          const negativesDeviation = deviation(negatives);

          const positives = allValues.concat(this._midpoint).filter(d => d >= this._midpoint);
          const positivesDeviation = deviation(positives);

          const isNegativeMax = negativesDeviation > positivesDeviation ? 1 : 0;
          const isPositiveMax = positivesDeviation > negativesDeviation ? 1 : 0;

          const negativeJenks = ckmeans(negatives, min([half + residual * isNegativeMax, negatives.length]));
          const positiveJenks = ckmeans(positives, min([half + residual * isPositiveMax, positives.length]));

          jenks = negativeJenks.concat(positiveJenks);
        }
        else {
          jenks = ckmeans(allValues, buckets);
        }

        ticks = jenks.map(c => c[0]);

      }

      const tickSet = new Set(ticks);

      if (ticks.length !== tickSet.size) labels = Array.from(tickSet);

      if (!colors) {
        if (diverging) {
          colors = [this._colorMin, this._colorMid, this._colorMax];
          const negatives = ticks
            .slice(0, buckets)
            .filter((d, i) => d < this._midpoint && ticks[i + 1] <= this._midpoint);
          const spanning = ticks
            .slice(0, buckets)
            .filter((d, i) => d <= this._midpoint && ticks[i + 1] > this._midpoint);
          const positives = ticks
            .slice(0, buckets)
            .filter(d => d > this._midpoint);
          const negativeColors = negatives.map((d, i) => !i ? colors[0] : colorLighter(colors[0], i / negatives.length));
          const spanningColors = spanning.map(() => colors[1]);
          const positiveColors = positives.map((d, i) => i === positives.length - 1 ? colors[2] : colorLighter(colors[2], 1 - (i + 1) / positives.length));
          colors = negativeColors.concat(spanningColors).concat(positiveColors);
        }
        else {
          colors = range(0, numBuckets, 1)
            .map(i => colorLighter(this._colorMax, i / numBuckets))
            .reverse();
        }
      }

      if (ticks.length <= buckets) colors = colors.slice(-ticks.length);

      colors = [colors[0]].concat(colors);

      this._colorScale = scaleThreshold()
        .domain(ticks)
        .range(colors);

    }
    else {

      let buckets = this._buckets instanceof Array ? this._buckets : undefined;
      if (diverging && !colors) {
        const half = Math.floor(numBuckets / 2);
        const negativeColorScale = interpolateRgb.gamma(2.2)(this._colorMin, this._colorMid);
        const negativeColors = range(0, half, 1).map(i => negativeColorScale(i / half));
        const spanningColors = (numBuckets % 2 ? [0] : []).map(() => this._colorMid);
        const positiveColorScale = interpolateRgb.gamma(2.2)(this._colorMax, this._colorMid);
        const positiveColors = range(0, half, 1).map(i => positiveColorScale(i / half)).reverse();
        colors = negativeColors.concat(spanningColors).concat(positiveColors);
        if (!buckets) {
          const step = (colors.length - 1) / 2;
          buckets = [domain[0], this._midpoint, domain[1]];
          buckets = range(domain[0], this._midpoint, -(domain[0] - this._midpoint) / step)
            .concat(range(this._midpoint, domain[1], (domain[1] - this._midpoint) / step))
            .concat([domain[1]]);
        }
      }
      else {
        if (!colors) {
          if (this._scale === "buckets" || this._scale === "quantile") {
            colors = range(0, numBuckets, 1)
              .map(i => colorLighter(negative ? this._colorMin : this._colorMax, i / numBuckets));
            if (positive) colors = colors.reverse();
          }
          else {
            colors = negative ? [this._colorMin, colorLighter(this._colorMin, 0.8)]
              : [colorLighter(this._colorMax, 0.8), this._colorMax];
          }
        }
        if (!buckets) {
          if (this._scale === "quantile") {
            const step = 1 / (colors.length - 1);
            buckets = range(0, 1 + step / 2, step)
              .map(d => quantile(allValues, d));
          }
          else if (diverging && this._color && this._centered) {
            const midIndex = colors.indexOf(this._colorMid);
            const negativeStep = (this._midpoint - domain[0]) / midIndex;
            const positiveStep = (domain[1] - this._midpoint) / (colors.length - midIndex);
            const negativeBuckets = range(domain[0], this._midpoint, negativeStep);
            const positiveBuckets = range(this._midpoint, domain[1] + positiveStep / 2, positiveStep);

            buckets = negativeBuckets.concat(positiveBuckets);
          }
          else {
            const step = (domain[1] - domain[0]) / (colors.length - 1);
            buckets = range(domain[0], domain[1] + step / 2, step);
          }
        }
      }

      if (this._scale === "buckets" || this._scale === "quantile") {
        ticks = buckets;
        colors = [colors[0]].concat(colors);
      }
      else if (this._scale === "log") {
        const negativeBuckets = buckets.filter(d => d < 0);
        if (negativeBuckets.length) {
          const minVal = negativeBuckets[0];
          const newNegativeBuckets = negativeBuckets.map(d => -Math.pow(Math.abs(minVal), d / minVal));
          negativeBuckets.forEach((bucket, i) => {
            buckets[buckets.indexOf(bucket)] = newNegativeBuckets[i];
          });
        }
        const positiveBuckets = buckets.filter(d => d > 0);
        if (positiveBuckets.length) {
          const maxVal = positiveBuckets[positiveBuckets.length - 1];
          const newPositiveBuckets = positiveBuckets.map(d => Math.pow(maxVal, d / maxVal));
          positiveBuckets.forEach((bucket, i) => {
            buckets[buckets.indexOf(bucket)] = newPositiveBuckets[i];
          });
        }
        if (buckets.includes(0)) buckets[buckets.indexOf(0)] = 1;
      }

      this._colorScale = (this._scale === "buckets" || this._scale === "quantile" ? scaleThreshold : scaleLinear)()
        .domain(buckets)
        .range(colors);

    }

    if (this._colorScale.clamp) this._colorScale.clamp(true);

    const gradient = this._bucketAxis || !["buckets", "jenks", "quantile"].includes(this._scale);
    const t = transition().duration(this._duration);
    const groupParams = {enter: {opacity: 0}, exit: {opacity: 0}, parent: this._group, transition: t, update: {opacity: 1}};
    const labelGroup = elem("g.d3plus-ColorScale-labels", Object.assign({condition: gradient}, groupParams));
    const rectGroup = elem("g.d3plus-ColorScale-Rect", Object.assign({condition: gradient}, groupParams));
    const legendGroup = elem("g.d3plus-ColorScale-legend", Object.assign({condition: !gradient}, groupParams));

    if (gradient) {

      const offsets = {x: 0, y: 0};

      const axisDomain = domain.slice();
      if (this._bucketAxis) {
        const last = axisDomain[axisDomain.length - 1];
        const prev = axisDomain[axisDomain.length - 2];
        const mod = last ? last / 10 : prev / 10;

        const pow = mod >= 1 || mod <= -1 ? Math.round(mod).toString().length - 1 : mod.toString().split(".")[1].replace(/([1-9])[1-9].*$/, "$1").length * -1;
        const ten = Math.pow(10, pow);
        axisDomain[axisDomain.length - 1] = last + ten;
      }

      const axisConfig = assign({
        domain: horizontal ? axisDomain : axisDomain.slice().reverse(),
        duration: this._duration,
        height: this._height,
        labels: labels || ticks,
        orient: this._orient,
        padding: this._padding,
        scale: this._scale === "log" ? "log" : "linear",
        ticks,
        width: this._width
      }, this._axisConfig);

      const labelConfig = assign({
        height: this[`_${height}`] / 2,
        width: this[`_${width}`] / 2
      }, this._labelConfig);

      this._labelClass.config(labelConfig);
      const labelData = [];

      if (horizontal && this._labelMin) {

        const labelCSS = {
          "font-family": this._labelClass.fontFamily()(this._labelMin),
          "font-size": this._labelClass.fontSize()(this._labelMin),
          "font-weight": this._labelClass.fontWeight()(this._labelMin)
        };

        if (labelCSS["font-family"] instanceof Array) labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMinWidth = textWidth(this._labelMin, labelCSS);

        if (labelMinWidth && labelMinWidth < this[`_${width}`] / 2) {
          labelData.push(this._labelMin);
          labelMinWidth += this._padding;
          if (horizontal) offsets.x += labelMinWidth;
          axisConfig[width] -= labelMinWidth;
        }

      }
      if (horizontal && this._labelMax) {

        const labelCSS = {
          "font-family": this._labelClass.fontFamily()(this._labelMax),
          "font-size": this._labelClass.fontSize()(this._labelMax),
          "font-weight": this._labelClass.fontWeight()(this._labelMax)
        };

        if (labelCSS["font-family"] instanceof Array) labelCSS["font-family"] = labelCSS["font-family"][0];
        let labelMaxWidth = textWidth(this._labelMax, labelCSS);

        if (labelMaxWidth && labelMaxWidth < this[`_${width}`] / 2) {
          labelData.push(this._labelMax);
          labelMaxWidth += this._padding;
          if (!horizontal) offsets.y += labelMaxWidth;
          axisConfig[width] -= labelMaxWidth;
        }

      }

      this._axisTest
        .select(elem("g.d3plus-ColorScale-axisTest", {enter: {opacity: 0}, parent: this._group}).node())
        .config(axisConfig)
        .duration(0)
        .render();

      const axisBounds = this._axisTest.outerBounds();

      this._outerBounds[width] = this[`_${width}`] - this._padding * 2;
      this._outerBounds[height] = axisBounds[height] + this._size;

      this._outerBounds[x] = this._padding;
      this._outerBounds[y] = this._padding;
      if (this._align === "middle") this._outerBounds[y] = (this[`_${height}`] - this._outerBounds[height]) / 2;
      else if (this._align === "end") this._outerBounds[y] = this[`_${height}`] - this._padding - this._outerBounds[height];

      const axisGroupOffset = this._outerBounds[y] + (["bottom", "right"].includes(this._orient) ? this._size : 0) - (axisConfig.padding || this._axisClass.padding());
      const transform = `translate(${offsets.x + (horizontal ? 0 : axisGroupOffset)}, ${offsets.y + (horizontal ? axisGroupOffset : 0)})`;
      this._axisClass
        .select(elem("g.d3plus-ColorScale-axis", assign(groupParams, {
          condition: true,
          enter: {transform},
          update: {transform}
        })).node())
        .config(axisConfig)
        .align("start")
        .render();

      const axisScale = this._axisTest._getPosition.bind(this._axisTest);
      const scaleRange = this._axisTest._getRange();

      let defs = this._group.selectAll("defs").data([0]);
      const defsEnter = defs.enter().append("defs");
      defsEnter.append("linearGradient").attr("id", `gradient-${this._uuid}`);
      defs = defsEnter.merge(defs);
      defs.select("linearGradient")
        .attr(`${x}1`, horizontal ? "0%" : "100%")
        .attr(`${x}2`, horizontal ? "100%" : "0%")
        .attr(`${y}1`, "0%")
        .attr(`${y}2`, "0%");
      const stops = defs.select("linearGradient").selectAll("stop")
        .data(colors);
      const scaleDomain = this._colorScale.domain();
      const offsetScale = scaleLinear()
        .domain(scaleRange)
        .range(horizontal ? [0, 100] : [100, 0]);

      stops.enter().append("stop").merge(stops)
        .attr("offset", (d, i) => `${i <= scaleDomain.length - 1 ? offsetScale(axisScale(scaleDomain[i])) : 100}%`)
        .attr("stop-color", String);

      /** determines the width of buckets */
      const bucketWidth = (d, i) => {
        const next = ticks[i + 1] || axisDomain[axisDomain.length - 1];
        return Math.abs(axisScale(next) - axisScale(d));
      };

      const rectConfig = assign({
        duration: this._duration,
        fill: ticks ? d => this._colorScale(d) : `url(#gradient-${this._uuid})`,
        [x]: ticks ? (d, i) => axisScale(d) + bucketWidth(d, i) / 2 - (["left", "right"].includes(this._orient) ? bucketWidth(d, i) : 0) : scaleRange[0] + (scaleRange[1] - scaleRange[0]) / 2 + offsets[x],
        [y]: this._outerBounds[y] + (["top", "left"].includes(this._orient) ? axisBounds[height] : 0) + this._size / 2 + offsets[y],
        [width]: ticks ? bucketWidth : scaleRange[1] - scaleRange[0],
        [height]: this._size
      }, this._rectConfig);

      this._rectClass
        .data(ticks || [0])
        .id((d, i) => i)
        .select(rectGroup.node())
        .config(rectConfig)
        .render();

      labelConfig.height = this._outerBounds[height];
      labelConfig.width = this._outerBounds[width];
      this._labelClass
        .config(labelConfig)
        .data(labelData)
        .select(labelGroup.node())
        .x(d => d === this._labelMax
          ? rectConfig.x + rectConfig.width / 2 + this._padding
          : this._outerBounds.x)
        .y(d => rectConfig.y - this._labelClass.fontSize()(d) / 2)
        .text(d => d)
        .rotate(horizontal ? 0 : this._orient === "right" ? 90 : -90)
        .render();

    }
    else {

      elem("g.d3plus-ColorScale-axis", Object.assign({condition: gradient}, groupParams));

      let legendData = ticks.reduce((arr, tick, i) => {

        const label = this._bucketFormat.bind(this)(tick, i, ticks, allValues);
        arr.push({color: colors[i + 1], id: label});

        return arr;
      }, []);
      if (!horizontal) legendData = legendData.reverse();

      const legendConfig = assign({
        align: horizontal ? "center" : {start: "left", middle: "center", end: "right"}[this._align],
        direction: horizontal ? "row" : "column",
        duration: this._duration,
        height: this._height,
        padding: this._padding,
        shapeConfig: assign({
          duration: this._duration
        }, this._axisConfig.shapeConfig || {}),
        title: this._axisConfig.title,
        titleConfig: this._axisConfig.titleConfig || {},
        width: this._width,
        verticalAlign: horizontal ? {start: "top", middle: "middle", end: "bottom"}[this._align] : "middle"
      }, this._legendConfig);

      this._legendClass
        .data(legendData)
        .select(legendGroup.node())
        .config(legendConfig)
        .render();

      this._outerBounds = this._legendClass.outerBounds();

    }

    if (callback) setTimeout(callback, this._duration + 100);

    return this;

  }

  /**
      @memberof ColorScale
      @desc The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
      @param {Object} [*value*]
      @chainable
  */
  axisConfig(_) {
    return arguments.length ? (this._axisConfig = assign(this._axisConfig, _), this) : this._axisConfig;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the horizontal alignment to the specified value and returns the current class instance. If *value* is not specified, returns the current horizontal alignment.
      @param {String} [*value* = "center"] Supports `"left"` and `"center"` and `"right"`.
      @chainable
  */
  align(_) {
    return arguments.length ? (this._align = _, this) : this._align;
  }

  /**
      @memberof ColorScale
      @desc The number of discrete buckets to create in a bucketed color scale. Will be overridden by any custom Array of colors passed to the `color` method. Optionally, users can supply an Array of values used to separate buckets, such as `[0, 10, 25, 50, 90]` for a percentage scale. This value would create 4 buckets, with each value representing the break point between each bucket (so 5 values makes 4 buckets).
      @param {Number|Array} [*value* = 5]
      @chainable
  */
  buckets(_) {
    return arguments.length ? (this._buckets = _, this) : this._buckets;
  }

  /**
      @memberof ColorScale
      @desc Determines whether or not to use an Axis to display bucket scales (both "buckets" and "jenks"). When set to `false`, bucketed scales will use the `Legend` class to display squares for each range of data. When set to `true`, bucketed scales will be displayed on an `Axis`, similar to "linear" scales.
      @param {Boolean} [*value* = false]
      @chainable
  */
  bucketAxis(_) {
    return arguments.length ? (this._bucketAxis = _, this) : this._bucketAxis;
  }

  /**
      @memberof ColorScale
      @desc A function for formatting the labels associated to each bucket in a bucket-type scale ("jenks", "quantile", etc). The function is passed four arguments: the start value of the current bucket, it's index in the full Array of buckets, the full Array of buckets, and an Array of every value present in the data used to construct the buckets. Keep in mind that the end value for the bucket is not actually the next bucket in the list, but includes every value up until that next bucket value (less than, but not equal to). By default, d3plus will make the end value slightly less than it's current value, so that it does not overlap with the start label for the next bucket.
      @param {Function} [*value*]
      @chainable
  */
  bucketFormat(_) {
    return arguments.length ? (this._bucketFormat = _, this) : this._bucketFormat;
  }

  /**
      @memberof ColorScale
      @desc A function that receives the minimum and maximum values of a bucket, and is expected to return the full label.
      @param {Function} [*value*]
      @chainable
  */
  bucketJoiner(_) {
    return arguments.length ? (this._bucketJoiner = _, this) : this._bucketJoiner;
  }

  /**
      @memberof ColorScale
      @desc Determines whether or not to display a midpoint centered Axis. Does not apply to quantile scales.
      @param {Boolean} [*value* = false]
      @chainable
  */

  centered(_) {
    return arguments.length ? (this._centered = _, this) : this._centered;
  }

  /**
      @memberof ColorScale
      @desc Overrides the default internal logic of `colorMin`, `colorMid`, and `colorMax` to only use just this specified color. If a single color is given as a String, then the scale is interpolated by lightening that color. Otherwise, the function expects an Array of color values to be used in order for the scale.
      @param {String|Array} [*value*]
      @chainable
  */
  color(_) {
    return arguments.length ? (this._color = _, this) : this._color;
  }

  /**
      @memberof ColorScale
      @desc Defines the color to be used for numbers greater than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
      @param {String} [*value* = "#0C8040"]
      @chainable
  */
  colorMax(_) {
    return arguments.length ? (this._colorMax = _, this) : this._colorMax;
  }

  /**
      @memberof ColorScale
      @desc Defines the color to be used for the midpoint of a diverging scale, based on the current value of the `midpoint` method (defaults to `0`). Colors in between this value and the values of `colorMin` and `colorMax` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
      @param {String} [*value* = "#f7f7f7"]
      @chainable
  */
  colorMid(_) {
    return arguments.length ? (this._colorMid = _, this) : this._colorMid;
  }

  /**
      @memberof ColorScale
      @desc Defines the color to be used for numbers less than the value of the `midpoint` on the scale (defaults to `0`). Colors in between this value and the value of `colorMid` will be interpolated, unless a custom Array of colors has been specified using the `color` method.
      @param {String} [*value* = "#b22200"]
      @chainable
  */
  colorMin(_) {
    return arguments.length ? (this._colorMin = _, this) : this._colorMin;
  }

  /**
      @memberof ColorScale
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. A shape key will be drawn for each object in the array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof ColorScale
      @desc In a linear scale, this Array of 2 values defines the min and max values used in the color scale. Any values outside of this range will be mapped to the nearest color value.
      @param {Array} [*value*]
      @chainable
  */
  domain(_) {
    return arguments.length ? (this._domain = _, this) : this._domain;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the transition duration of the ColorScale and returns the current class instance. If *value* is not specified, returns the current duration.
      @param {Number} [*value* = 600]
      @chainable
  */
  duration(_) {
    return arguments.length ? (this._duration = _, this) : this._duration;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the overall height of the ColorScale and returns the current class instance. If *value* is not specified, returns the current height value.
      @param {Number} [*value* = 100]
      @chainable
  */
  height(_) {
    return arguments.length ? (this._height = _, this) : this._height;
  }

  /**
      @memberof ColorScale
      @desc A pass-through for the [TextBox](http://d3plus.org/docs/#TextBox) class used to style the labelMin and labelMax text.
      @param {Object} [*value*]
      @chainable
  */
  labelConfig(_) {
    return arguments.length ? (this._labelConfig = assign(this._labelConfig, _), this) : this._labelConfig;
  }

  /**
      @memberof ColorScale
      @desc Defines a text label to be displayed off of the end of the minimum point in the scale (currently only available in horizontal orientation).
      @param {String} [*value*]
      @chainable
  */
  labelMin(_) {
    return arguments.length ? (this._labelMin = _, this) : this._labelMin;
  }

  /**
      @memberof ColorScale
      @desc Defines a text label to be displayed off of the end of the maximum point in the scale (currently only available in horizontal orientation).
      @param {String} [*value*]
      @chainable
  */
  labelMax(_) {
    return arguments.length ? (this._labelMax = _, this) : this._labelMax;
  }

  /**
      @memberof ColorScale
      @desc The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Axis](http://d3plus.org/docs/#Axis). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
      @param {Object} [*value*]
      @chainable
  */
  legendConfig(_) {
    return arguments.length ? (this._legendConfig = assign(this._legendConfig, _), this) : this._legendConfig;
  }

  /**
      @memberof ColorScale
      @desc The number value to be used as the anchor for `colorMid`, and defines the center point of the diverging color scale.
      @param {Number} [*value* = 0]
      @chainable
  */
  midpoint(_) {
    return arguments.length ? (this._midpoint = _, this) : this._midpoint;
  }

  /**
      @memberof ColorScale
      @desc Sets the flow of the items inside the ColorScale. If no value is passed, the current flow will be returned.
      @param {String} [*value* = "bottom"]
      @chainable
  */
  orient(_) {
    return arguments.length ? (this._orient = _, this) : this._orient;
  }

  /**
      @memberof ColorScale
      @desc If called after the elements have been drawn to DOM, will returns the outer bounds of the ColorScale content.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
  */
  outerBounds() {
    return this._outerBounds;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the padding between each key to the specified number and returns the current class instance. If *value* is not specified, returns the current padding value.
      @param {Number} [*value* = 10]
      @chainable
  */
  padding(_) {
    return arguments.length ? (this._padding = _, this) : this._padding;
  }

  /**
      @memberof ColorScale
      @desc The [ColorScale](http://d3plus.org/docs/#ColorScale) is constructed by combining an [Axis](http://d3plus.org/docs/#Axis) for the ticks/labels and a [Rect](http://d3plus.org/docs/#Rect) for the actual color box (or multiple boxes, as in a jenks scale). Because of this, there are separate configs for the [Axis](http://d3plus.org/docs/#Axis) class used to display the text ([axisConfig](http://d3plus.org/docs/#ColorScale.axisConfig)) and the [Rect](http://d3plus.org/docs/#Rect) class used to draw the color breaks ([rectConfig](http://d3plus.org/docs/#ColorScale.rectConfig)). This method acts as a pass-through to the config method of the [Rect](http://d3plus.org/docs/#Rect). An example usage of this method can be seen [here](http://d3plus.org/examples/d3plus-legend/colorScale-dark/).
      @param {Object} [*value*]
      @chainable
  */
  rectConfig(_) {
    return arguments.length ? (this._rectConfig = assign(this._rectConfig, _), this) : this._rectConfig;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the scale of the ColorScale and returns the current class instance. If *value* is not specified, returns the current scale value.
      @param {String} [*value* = "linear"] Can either be "linear", "jenks", or "buckets".
      @chainable
  */
  scale(_) {
    return arguments.length ? (this._scale = _, this) : this._scale;
  }

  /**
      @memberof ColorScale
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
      @memberof ColorScale
      @desc The height of horizontal color scales, and width when positioned vertical.
      @param {Number} [*value* = 10]
      @chainable
  */
  size(_) {
    return arguments.length ? (this._size = _, this) : this._size;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the value accessor to the specified function or string and returns the current class instance. If *value* is not specified, returns the current value accessor.
      @param {Function|String} [*value*]
      @chainable
      @example
function value(d) {
  return d.value;
}
  */
  value(_) {
    return arguments.length ? (this._value = typeof _ === "function" ? _ : constant(_), this) : this._value;
  }

  /**
      @memberof ColorScale
      @desc If *value* is specified, sets the overall width of the ColorScale and returns the current class instance. If *value* is not specified, returns the current width value.
      @param {Number} [*value* = 400]
      @chainable
  */
  width(_) {
    return arguments.length ? (this._width = _, this) : this._width;
  }

}
