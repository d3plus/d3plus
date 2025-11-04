import {group, max, merge as arrayMerge, min, range, rollup} from "d3-array";
import {brush} from "d3-brush";
import {color} from "d3-color";
import {queue} from "d3-queue";
import {select} from "d3-selection";
import {scaleOrdinal} from "d3-scale";
import {zoom} from "d3-zoom";

import lrucache from "lrucache";

import {colorAssign, colorContrast, colorDefaults} from "@d3plus/color";
import {addToQueue, merge, unique} from "@d3plus/data";
import {assign, date, getSize, inViewport} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {
  ColorScale,
  Legend,
  TextBox,
  Timeline,
  Tooltip,
} from "../components/index.js";
import {accessor, BaseClass, configPrep, constant} from "../utils/index.js";
// import {Rect} from "../shape/index.js";

import Message from "../components/Message.js";

import drawBack from "./drawSteps/drawBack.js";
import drawColorScale from "./drawSteps/drawColorScale.js";
import {default as drawLegend, legendLabel} from "./drawSteps/drawLegend.js";
import drawSubtitle from "./drawSteps/drawSubtitle.js";
import drawTimeline from "./drawSteps/drawTimeline.js";
import drawTitle from "./drawSteps/drawTitle.js";
import drawTotal from "./drawSteps/drawTotal.js";

import zoomControls from "./drawSteps/zoomControls.js";
import drawAttribution from "./drawSteps/drawAttribution.js";

import clickShape from "./events/click.shape.js";
import clickLegend from "./events/click.legend.js";
import mouseenter from "./events/mouseenter.js";
import mouseleave from "./events/mouseleave.js";
import mousemoveLegend from "./events/mousemove.legend.js";
import mousemoveShape from "./events/mousemove.shape.js";
import touchstartBody from "./events/touchstart.body.js";

function debounce(func, delay) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Default padding logic that will return false if the screen is less than 600 pixels wide.
 * @private
 */
function defaultPadding() {
  return typeof window !== "undefined" ? window.innerWidth > 600 : true;
}

/**
 * Turns an array of values into a list string.
 * @private
 */
function listify(n) {
  return n.reduce((str, item, i) => {
    if (!i) str += item;
    else if (i === n.length - 1 && i === 1) str += ` and ${item}`;
    else if (i === n.length - 1) str += `, and ${item}`;
    else str += `, ${item}`;
    return str;
  }, "");
}

/**
 * A function that introspects the `d` Data Object for internally nested
 * d3plus data and indices, runs the accessor function on that user data.
 * @param {Function} acc Accessor function to use.
 * @param {Object} d Data Object
 * @param {Number} i Index of Data Object in Array
 * @private
 */
function accessorFetch(acc, d, i) {
  while (d.__d3plus__ && d.data) {
    d = d.data;
    i = d.i;
  }
  return acc(d, i);
}

/**
    @class Viz
    @extends BaseClass
    @desc Creates an x/y plot based on an array of data. If *data* is specified, immediately draws the tree map based on the specified array and returns the current class instance. If *data* is not specified on instantiation, it can be passed/updated after instantiation using the [data](#treemap.data) method. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.
*/
export default class Viz extends BaseClass {
  /**
      @memberof Viz
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    this._aggs = {};
    this._ariaHidden = true;
    this._attribution = false;
    this._attributionStyle = {
      background: "rgba(255, 255, 255, 0.75)",
      border: "1px solid rgba(0, 0, 0, 0.25)",
      color: "rgba(0, 0, 0, 0.75)",
      display: "block",
      font: `400 11px/11px ${fontFamilyStringify(fontFamily)}`,
      margin: "5px",
      opacity: 0.75,
      padding: "4px 6px 3px",
    };
    this._backClass = new TextBox()
      .on("click", () => {
        if (this._history.length) this.config(this._history.pop()).render();
        else
          this.depth(this._drawDepth - 1)
            .filter(false)
            .render();
      })
      .on("mousemove", () =>
        this._backClass.select().style("cursor", "pointer")
      );
    this._backConfig = {
      fontSize: 10,
      padding: 5,
      resize: false,
    };
    this._cache = true;

    this._color = (d, i) => this._groupBy[0](d, i);
    this._colorDefaults = {
      ...colorDefaults,
      scale: scaleOrdinal().range(colorDefaults.scale.range()),
    };
    this._colorScaleClass = new ColorScale();
    this._colorScaleConfig = {
      axisConfig: {
        rounding: "inside",
      },
      scale: "jenks",
    };
    this._colorScalePadding = defaultPadding;
    this._colorScalePosition = () =>
      this._width > this._height * 1.5 ? "right" : "bottom";
    this._colorScaleMaxSize = 600;

    this._data = [];
    this._dataCutoff = 100;
    this._detectResize = true;
    this._detectResizeDelay = 400;
    this._detectVisible = true;
    this._detectVisibleInterval = 1000;
    this._downloadButton = false;
    this._downloadConfig = {type: "png"};
    this._downloadPosition = "top";
    this._duration = 600;
    this._fontFamily = fontFamily;
    this._hidden = [];
    this._hiddenColor = constant("#aaa");
    this._hiddenOpacity = constant(0.5);
    this._history = [];
    this._groupBy = [accessor("id")];

    this._legend = (config, arr) => {
      const maxGrouped = max(arr, (d, i) => {
        const id = this._groupBy[this._legendDepth].bind(this)(d, i);
        return id instanceof Array ? id.length : 1;
      });
      return arr.length > 1 && maxGrouped <= 2;
    };
    this._legendClass = new Legend();
    this._legendConfig = {
      label: legendLabel.bind(this),
      shapeConfig: {
        ariaLabel: legendLabel.bind(this),
        labelConfig: {
          fontColor: undefined,
          fontResize: false,
          padding: 0,
        },
      },
    };
    this._legendFilterInvert = constant(false);
    this._legendPadding = defaultPadding;
    this._legendPosition = () =>
      this._width > this._height * 1.5 ? "right" : "bottom";
    this._legendSort = (a, b) =>
      this._drawLabel(a).localeCompare(this._drawLabel(b));
    this._legendTooltip = {};

    this._loadingHTML = () => `
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
      <strong>${this._translate("Loading Visualization")}</strong>
      <sub style="bottom: 0; display: block; line-height: 1; margin-top: 5px;"><a href="https://d3plus.org" target="_blank">${this._translate(
        "Powered by D3plus"
      )}</a></sub>
    </div>`;

    this._loadingMessage = true;
    this._lrucache = lrucache(10);
    this._messageClass = new Message();
    this._messageMask = "rgba(0, 0, 0, 0.05)";
    this._messageStyle = {
      bottom: "0",
      left: "0",
      position: "absolute",
      right: "0",
      "text-align": "center",
      top: "0",
    };

    this._noDataHTML = () => `
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
      <strong>${this._translate("No Data Available")}</strong>
    </div>`;

    this._noDataMessage = true;
    this._on = {
      "click.shape": clickShape.bind(this),
      "click.legend": clickLegend.bind(this),
      mouseenter: mouseenter.bind(this),
      mouseleave: mouseleave.bind(this),
      "mousemove.shape": mousemoveShape.bind(this),
      "mousemove.legend": mousemoveLegend.bind(this),
    };
    this._queue = [];
    this._resizeObserver = new ResizeObserver(
      debounce(() => {
        this._setSVGSize();
        this.render(this._callback);
      }, this._detectResizeDelay)
    );
    this._scrollContainer = typeof window === "undefined" ? "" : window;
    this._shape = constant("Rect");
    this._shapes = [];
    this._shapeConfig = {
      ariaLabel: (d, i) => this._drawLabel(d, i),
      fill: (d, i) => {
        while (d.__d3plus__ && d.data) {
          d = d.data;
          i = d.i;
        }
        if (this._colorScale) {
          const c = this._colorScale(d, i);
          if (c !== undefined && c !== null) {
            const scale = this._colorScaleClass._colorScale;
            const colors = this._colorScaleClass.color();
            if (!scale)
              return colors instanceof Array
                ? colors[colors.length - 1]
                : colors;
            else if (!scale.domain().length)
              return scale.range()[scale.range().length - 1];
            return scale(c);
          }
        }
        const c = this._color(d, i);
        if (color(c)) return c;
        return colorAssign(
          typeof c === "string" ? c : JSON.stringify(c),
          this._colorDefaults
        );
      },
      labelConfig: {
        fontColor: (d, i) => {
          const c =
            typeof this._shapeConfig.fill === "function"
              ? this._shapeConfig.fill(d, i)
              : this._shapeConfig.fill;
          return colorContrast(c);
        },
      },
      opacity: constant(1),
      stroke: (d, i) => {
        const c =
          typeof this._shapeConfig.fill === "function"
            ? this._shapeConfig.fill(d, i)
            : this._shapeConfig.fill;
        return color(c).darker(0.25);
      },
      role: "presentation",
      strokeWidth: constant(0),
    };
    this._solo = [];

    this._subtitleClass = new TextBox();
    this._subtitleConfig = {
      ariaHidden: true,
      fontSize: 12,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this._subtitlePadding = defaultPadding;

    this._svgDesc = "";
    this._svgTitle = "";

    this._timeline = true;
    this._timelineClass = new Timeline().align("end");
    this._timelineConfig = {
      padding: 5,
    };
    this._timelinePadding = defaultPadding;

    this._threshold = constant(0.0001);
    this._thresholdKey = undefined;
    this._thresholdName = () => this._translate("Values");

    this._titleClass = new TextBox();
    this._titleConfig = {
      ariaHidden: true,
      fontSize: 16,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this._titlePadding = defaultPadding;

    this._tooltip = constant(true);
    this._tooltipClass = new Tooltip();
    this._tooltipConfig = {
      pointerEvents: "none",
      titleStyle: {
        "max-width": "200px",
      },
    };

    this._totalClass = new TextBox();
    this._totalConfig = {
      fontSize: 10,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this._totalFormat = d =>
      `${this._translate("Total")}: ${formatAbbreviate(d, this._locale)}`;
    this._totalPadding = defaultPadding;

    this._zoom = false;
    this._zoomBehavior = zoom();
    this._zoomBrush = brush();
    this._zoomBrushHandleSize = 1;
    this._zoomBrushHandleStyle = {
      fill: "#444",
    };
    this._zoomBrushSelectionStyle = {
      fill: "#777",
      "stroke-width": 0,
    };
    this._zoomControlStyle = {
      background: "rgba(255, 255, 255, 0.75)",
      border: "1px solid rgba(0, 0, 0, 0.75)",
      color: "rgba(0, 0, 0, 0.75)",
      display: "block",
      font: `900 15px/21px ${fontFamilyStringify(fontFamily)}`,
      height: "20px",
      margin: "5px",
      opacity: 0.75,
      padding: 0,
      "text-align": "center",
      width: "20px",
    };
    this._zoomControlStyleActive = {
      background: "rgba(0, 0, 0, 0.75)",
      color: "rgba(255, 255, 255, 0.75)",
      opacity: 1,
    };
    this._zoomControlStyleHover = {
      cursor: "pointer",
      opacity: 1,
    };
    this._zoomFactor = 2;
    this._zoomMax = 16;
    this._zoomPadding = 20;
    this._zoomPan = true;
    this._zoomScroll = true;
  }

  /**
   @memberof Viz
   @desc Called by draw before anything is drawn. Formats the data and performs preparations for draw.
   @private
   */
  _preDraw() {
    const that = this;
    // based on the groupBy, determine the draw depth and current depth id
    this._drawDepth =
      this._depth !== void 0
        ? min([this._depth >= 0 ? this._depth : 0, this._groupBy.length - 1])
        : this._groupBy.length - 1;

    // Returns the current unique ID for a data point, coerced to a String.
    this._id = (d, i) => {
      const groupByDrawDepth = accessorFetch(
        this._groupBy[this._drawDepth],
        d,
        i
      );
      return typeof groupByDrawDepth === "number"
        ? `${groupByDrawDepth}`
        : groupByDrawDepth;
    };

    // Returns an array of the current unique groupBy ID for a data point, coerced to Strings.
    this._ids = (d, i) =>
      this._groupBy.map(g => `${accessorFetch(g, d, i)}`).filter(Boolean);

    this._drawLabel = (d, i, depth = this._drawDepth) => {
      if (!d) return "";
      while (d.__d3plus__ && d.data) {
        d = d.data;
        i = d.i;
      }
      if (d._isAggregation) {
        return `${this._thresholdName(d, i)} < ${formatAbbreviate(
          d._threshold * 100,
          this._locale
        )}%`;
      }
      if (this._label && depth === this._drawDepth)
        return `${this._label(d, i)}`;
      const l = that._ids(d, i).slice(0, depth + 1);
      const n =
        l.reverse().find(ll => !(ll instanceof Array)) || l[l.length - 1];
      return n instanceof Array ? listify(n) : `${n}`;
    };

    // set the default timeFilter if it has not been specified
    if (this._time && !this._timeFilter && this._data.length) {
      const dates = this._data.map(this._time).map(date);
      const d = this._data[0],
        i = 0;

      if (
        this._discrete &&
        `_${this._discrete}` in this &&
        this[`_${this._discrete}`](d, i) === this._time(d, i)
      ) {
        this._timeFilter = () => true;
      } else {
        const latestTime = +max(dates);
        this._timeFilter = (d, i) => +date(this._time(d, i)) === latestTime;
      }
    }

    this._filteredData = [];
    this._legendData = [];
    let flatData = [];
    if (this._data.length) {
      flatData = this._timeFilter
        ? this._data.filter(this._timeFilter)
        : this._data;
      if (this._filter) flatData = flatData.filter(this._filter);
      const nestKeys = [];
      for (let i = 0; i <= this._drawDepth; i++)
        nestKeys.push(this._groupBy[i]);
      if (this._discrete && `_${this._discrete}` in this)
        nestKeys.push(this[`_${this._discrete}`]);
      if (this._discrete && `_${this._discrete}2` in this)
        nestKeys.push(this[`_${this._discrete}2`]);

      const tree = rollup(
        flatData,
        leaves => {
          const index = this._data.indexOf(leaves[0]);
          const shape = this._shape(leaves[0], index);
          const id = this._id(leaves[0], index);

          const d = merge(leaves, this._aggs);

          if (
            !this._hidden.includes(id) &&
            (!this._solo.length || this._solo.includes(id))
          ) {
            if (!this._discrete && shape === "Line")
              this._filteredData = this._filteredData.concat(leaves);
            else this._filteredData.push(d);
          }
          this._legendData.push(d);
        },
        ...nestKeys
      );

      this._filteredData = this._thresholdFunction(this._filteredData, tree);
    }

    // overrides the hoverOpacity of shapes if data is larger than cutoff
    const uniqueIds = group(this._filteredData, this._id).size;
    if (uniqueIds > this._dataCutoff) {
      if (this._userHover === undefined)
        this._userHover = this._shapeConfig.hoverOpacity || 0.5;
      if (this._userDuration === undefined)
        this._userDuration = this._shapeConfig.duration || 600;
      this._shapeConfig.hoverOpacity = 1;
      this._shapeConfig.duration = 0;
    } else if (this._userHover !== undefined) {
      this._shapeConfig.hoverOpacity = this._userHover;
      this._shapeConfig.duration = this._userDuration;
    }

    if (this._noDataMessage && !this._filteredData.length) {
      this._messageClass.render({
        container: this._select.node().parentNode,
        html: this._noDataHTML(this),
        mask: false,
        style: this._messageStyle,
      });
      this._select.transition().duration(this._duration).attr("opacity", 0);
    }
  }

  /**
      @memberof Viz
      @desc Called by render once all checks are passed.
      @private
  */
  _draw() {
    // Sanitizes user input for legendPosition and colorScalePosition
    let legendPosition = this._legendPosition.bind(this)(this.config());
    if (![false, "top", "bottom", "left", "right"].includes(legendPosition))
      legendPosition = "bottom";
    let colorScalePosition = this._colorScalePosition.bind(this)(this.config());
    if (![false, "top", "bottom", "left", "right"].includes(colorScalePosition))
      colorScalePosition = "bottom";

    // Draws legend and colorScale if they are positioned "left" or "right"
    if (legendPosition === "left" || legendPosition === "right")
      drawLegend.bind(this)(this._legendData);
    if (
      colorScalePosition === "left" ||
      colorScalePosition === "right" ||
      colorScalePosition === false
    )
      drawColorScale.bind(this)(this._filteredData);

    // Draws all of the top/bottom UI elements
    drawBack.bind(this)();
    drawTitle.bind(this)(this._filteredData);
    drawSubtitle.bind(this)(this._filteredData);
    drawTotal.bind(this)(this._filteredData);
    drawTimeline.bind(this)(this._filteredData);

    // Draws legend and colorScale if they are positioned "top" or "bottom"
    if (legendPosition === "top" || legendPosition === "bottom")
      drawLegend.bind(this)(this._legendData);
    if (colorScalePosition === "top" || colorScalePosition === "bottom")
      drawColorScale.bind(this)(this._filteredData);

    this._shapes = [];

    // Draws a container and zoomGroup to test functionality.
    // this._testGroup = this._select.selectAll("g.d3plus-viz-testGroup").data([0]);
    // const enterTest = this._testGroup.enter().append("g").attr("class", "d3plus-viz-testGroup")
    //   .merge(this._testGroup);
    // this._testGroup = enterTest.merge(this._testGroup);
    // const bgHeight = this._height - this._margin.top - this._margin.bottom;
    // const bgWidth = this._width - this._margin.left - this._margin.right;
    // new Rect()
    //   .data([{id: "background"}])
    //   .select(this._testGroup.node())
    //   .x(bgWidth / 2 + this._margin.left)
    //   .y(bgHeight / 2 + this._margin.top)
    //   .width(bgWidth)
    //   .height(bgHeight)
    //   .fill("#ccc")
    //   .render();

    // this._zoomGroup = this._select.selectAll("g.d3plus-viz-zoomGroup").data([0]);
    // const enter = this._zoomGroup.enter().append("g").attr("class", "d3plus-viz-zoomGroup")
    //   .merge(this._zoomGroup);

    // this._zoomGroup = enter.merge(this._zoomGroup);
    // const testConfig = {
    //   on: {
    //     click: this._on["click.shape"],
    //     mouseenter: this._on.mouseenter,
    //     mouseleave: this._on.mouseleave,
    //     mousemove: this._on["mousemove.shape"]
    //   }
    // };

    // const testWidth = 50;
    // this._shapes.push(new Rect()
    //   .config(this._shapeConfig)
    //   .config(configPrep.bind(this)(testConfig))
    //   .data(this._filteredData)
    //   .label("Test Label")
    //   .select(this._zoomGroup.node())
    //   .id(this._id)
    //   .x(d => {
    //     if (!d.x) d.x = Math.random() * bgWidth;
    //     return d.x;
    //   })
    //   .y(d => {
    //     if (!d.y) d.y = Math.random() * bgHeight;
    //     return d.y;
    //   })
    //   .width(testWidth)
    //   .height(testWidth)
    //   .render());
  }

  /**
   * Applies the threshold algorithm according to the type of chart used.
   * @param {Array} data The data to process.
   * @private
   */
  _thresholdFunction(data) {
    return data;
  }

  /**
   * Detects width and height and sets SVG properties
   * @private
   */
  _setSVGSize() {
    const display = this._select.style("display");
    this._select.style("display", "none");

    let [w, h] = getSize(this._select.node().parentNode);
    w -= parseFloat(this._select.style("border-left-width"), 10);
    w -= parseFloat(this._select.style("border-right-width"), 10);
    h -= parseFloat(this._select.style("border-top-width"), 10);
    h -= parseFloat(this._select.style("border-bottom-width"), 10);
    this._select.style("display", display);

    if (this._autoWidth) {
      this.width(w);
      this._select
        .style("width", `${this._width}px`)
        .attr("width", `${this._width}px`);
    }
    if (this._autoHeight) {
      this.height(h);
      this._select
        .style("height", `${this._height}px`)
        .attr("height", `${this._height}px`);
    }
  }

  /**
      @memberof Viz
      @desc Draws the visualization given the specified configuration.
      @param {Function} [*callback*] An optional callback function that, if passed, will be called after animation is complete.
      @chainable
  */
  render(callback) {
    this._callback = callback;
    // Resets margins and padding
    this._margin = {bottom: 0, left: 0, right: 0, top: 0};
    this._padding = {bottom: 0, left: 0, right: 0, top: 0};

    // Appends a fullscreen SVG to the BODY if a container has not been provided through .select().
    if (
      this._select === void 0 ||
      this._select.node().tagName.toLowerCase() !== "svg"
    ) {
      const parent =
        this._select === void 0 ? select("body").append("div") : this._select;
      const svg = parent.select(".d3plus-viz").size()
        ? parent.select(".d3plus-viz")
        : parent.append("svg");
      this.select(svg.node());
    }

    // Calculates the width and/or height of the Viz based on the this._select, if either has not been defined.
    if (
      (!this._width || !this._height) &&
      (!this._detectVisible || inViewport(this._select.node()))
    ) {
      this._autoWidth = this._width === undefined;
      this._autoHeight = this._height === undefined;
      this._setSVGSize();
    }

    this._select
      .attr("class", "d3plus-viz")
      .attr("aria-hidden", this._ariaHidden)
      .attr("aria-labelledby", `${this._uuid}-title ${this._uuid}-desc`)
      .attr("role", "img")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .transition()
      .duration(this._duration)
      .style(
        "width",
        this._width !== undefined ? `${this._width}px` : undefined
      )
      .style(
        "height",
        this._height !== undefined ? `${this._height}px` : undefined
      )
      .attr("width", this._width !== undefined ? `${this._width}px` : undefined)
      .attr(
        "height",
        this._height !== undefined ? `${this._height}px` : undefined
      );

    // sets "position: relative" on the SVG parent if currently undefined
    const parent = select(this._select.node().parentNode);
    const position = parent.style("position");
    if (position === "static") parent.style("position", "relative");
    parent.style("font-family", fontFamilyStringify(this._fontFamily));

    // sets initial opacity to 1, if it has not already been set
    if (this._select.attr("opacity") === null) this._select.attr("opacity", 1);

    // Updates the <title> tag if already exists else creates a new <title> tag on this.select.
    const svgTitle = this._select.selectAll("title").data([0]);
    const svgTitleEnter = svgTitle
      .enter()
      .append("title")
      .attr("id", `${this._uuid}-title`);
    svgTitle.merge(svgTitleEnter).text(this._svgTitle);

    // Updates the <desc> tag if already exists else creates a new <desc> tag on this.select.
    const svgDesc = this._select.selectAll("desc").data([0]);
    const svgDescEnter = svgDesc
      .enter()
      .append("desc")
      .attr("id", `${this._uuid}-desc`);
    svgDesc.merge(svgDescEnter).text(this._svgDesc);

    this._visiblePoll = clearInterval(this._visiblePoll);
    this._resizePoll = clearTimeout(this._resizePoll);
    this._scrollPoll = clearTimeout(this._scrollPoll);
    select(this._scrollContainer).on(`scroll.${this._uuid}`, null);
    if (this._detectVisible && this._select.style("visibility") === "hidden") {
      this._visiblePoll = setInterval(() => {
        if (this._select.style("visibility") !== "hidden") {
          this._visiblePoll = clearInterval(this._visiblePoll);
          this.render(callback);
        }
      }, this._detectVisibleInterval);
    } else if (
      this._detectVisible &&
      this._select.style("display") === "none"
    ) {
      this._visiblePoll = setInterval(() => {
        if (this._select.style("display") !== "none") {
          this._visiblePoll = clearInterval(this._visiblePoll);
          this.render(callback);
        }
      }, this._detectVisibleInterval);
    } else if (this._detectVisible && !inViewport(this._select.node())) {
      select(this._scrollContainer).on(`scroll.${this._uuid}`, () => {
        if (!this._scrollPoll) {
          this._scrollPoll = setTimeout(() => {
            if (inViewport(this._select.node())) {
              select(this._scrollContainer).on(`scroll.${this._uuid}`, null);
              this.render(callback);
            }
            this._scrollPoll = clearTimeout(this._scrollPoll);
          }, this._detectVisibleInterval);
        }
      });
    } else {
      const q = queue();

      this._queue.forEach(p => {
        const cache = this._cache
          ? this._lrucache.get(`${p[3]}_${p[1]}`)
          : undefined;
        if (!cache) q.defer(...p);
        else this[`_${p[3]}`] = p[2] ? p[2](cache) : cache;
      });
      this._queue = [];

      if (this._loadingMessage && q._tasks.length) {
        this._messageClass.render({
          container: this._select.node().parentNode,
          html: this._loadingHTML(this),
          mask: this._filteredData ? this._messageMask : false,
          style: this._messageStyle,
        });
      }

      q.awaitAll(() => {
        // creates a data table as DOM elements inside of the SVG for accessibility
        // only if this._ariaHidden is set to true
        const columns =
          this._data instanceof Array && this._data.length > 0
            ? Object.keys(this._data[0])
            : [];
        const svgTable = this._select
          .selectAll("g.data-table")
          .data(
            !this._ariaHidden &&
              this._data instanceof Array &&
              this._data.length
              ? [0]
              : []
          );
        const svgTableEnter = svgTable
          .enter()
          .append("g")
          .attr("class", "data-table")
          .attr("role", "table");
        svgTable.exit().remove();
        const rows = svgTable
          .merge(svgTableEnter)
          .selectAll("text")
          .data(
            this._data instanceof Array ? range(0, this._data.length + 1) : []
          );
        rows.exit().remove();
        const cells = rows
          .merge(rows.enter().append("text").attr("role", "row"))
          .selectAll("tspan")
          .data((d, i) =>
            columns.map(c => ({
              role: i ? "cell" : "columnheader",
              text: i ? this._data[i - 1][c] : c,
            }))
          );
        cells.exit().remove();
        cells
          .merge(cells.enter().append("tspan"))
          .attr("role", d => d.role)
          .attr("dy", "-1000px")
          .html(d => d.text);

        // finishes the draw cycle
        this._preDraw();
        this._draw(callback);
        zoomControls.bind(this)();
        drawAttribution.bind(this)();

        if (
          this._messageClass._isVisible &&
          (!this._noDataMessage || this._filteredData.length)
        ) {
          this._messageClass.hide();
          if (this._select.attr("opacity") === "0")
            this._select
              .transition()
              .duration(this._duration)
              .attr("opacity", 1);
        }

        if (this._detectResize && (this._autoWidth || this._autoHeight)) {
          this._resizeObserver.observe(this._select.node().parentNode);
        } else {
          this._resizeObserver.unobserve(this._select.node().parentNode);
        }

        if (callback) setTimeout(callback, this._duration + 100);
      });
    }

    // Attaches touchstart event listener to the BODY to hide the tooltip when the user touches any element without data
    select("body").on(`touchstart.${this._uuid}`, touchstartBody.bind(this));

    return this;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the active method to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  active(_) {
    this._active = _;

    if (this._shapeConfig.activeOpacity !== 1) {
      this._shapes.forEach(s => s.active(_));
      if (this._legend) this._legendClass.active(_);
    }

    return this;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the aggregation method for each key in the object and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  aggs(_) {
    return arguments.length
      ? ((this._aggs = assign(this._aggs, _)), this)
      : this._aggs;
  }

  /**
      @memberof Viz
      @desc Sets the "aria-hidden" attribute of the containing SVG element. The default value is "false", but it you need to hide the SVG from screen readers set this property to "true".
      @param {Boolean} [*value* = true]
      @chainable
  */
  ariaHidden(_) {
    return arguments.length ? ((this._ariaHidden = _), this) : this._ariaHidden;
  }

  /**
      @memberof Viz
      @desc Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).
      @param {HTMLString|Boolean} *value* = false
      @chainable
  */
  attribution(_) {
    return arguments.length
      ? ((this._attribution = _), this)
      : this._attribution;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the back button and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  attributionStyle(_) {
    return arguments.length
      ? ((this._attributionStyle = assign(this._attributionStyle, _)), this)
      : this._attributionStyle;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the back button and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  backConfig(_) {
    return arguments.length
      ? ((this._backConfig = assign(this._backConfig, _)), this)
      : this._backConfig;
  }

  /**
      @memberof Viz
      @desc Enables a lru cache that stores up to 5 previously loaded files/URLs. Helpful when constantly writing over the data array with a URL in the render function of a react component.
      @param {Boolean} [*value* = false]
      @chainable
  */
  cache(_) {
    return arguments.length ? ((this._cache = _), this) : this._cache;
  }

  /**
      @memberof Viz
      @desc Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.
      @param {Function|String|False} [*value*]
      @chainable
  */
  color(_) {
    return arguments.length
      ? ((this._color = !_ || typeof _ === "function" ? _ : accessor(_)), this)
      : this._color;
  }

  /**
      @memberof Viz
      @desc Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.
      @param {Function|String|False} [*value*]
      @chainable
  */
  colorScale(_) {
    return arguments.length
      ? ((this._colorScale = !_ || typeof _ === "function" ? _ : accessor(_)),
        this)
      : this._colorScale;
  }

  /**
      @memberof Viz
      @desc A pass-through to the config method of ColorScale.
      @param {Object} [*value*]
      @chainable
  */
  colorScaleConfig(_) {
    return arguments.length
      ? ((this._colorScaleConfig = assign(this._colorScaleConfig, _)), this)
      : this._colorScaleConfig;
  }

  /**
      @memberof Viz
      @desc Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  colorScalePadding(_) {
    return arguments.length
      ? ((this._colorScalePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._colorScalePadding;
  }

  /**
      @memberof Viz
      @desc Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.
      @param {Function|String|Boolean} [*value* = "bottom"]
      @chainable
  */
  colorScalePosition(_) {
    return arguments.length
      ? ((this._colorScalePosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._colorScalePosition;
  }

  /**
      @memberof Viz
      @desc Sets the maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.
      @param {Number} [*value* = 600]
      @chainable
  */
  colorScaleMaxSize(_) {
    return arguments.length
      ? ((this._colorScaleMaxSize = _), this)
      : this._colorScaleMaxSize;
  }

  /**
      @memberof Viz
      @desc Sets the primary data array to be used when drawing the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

If *data* is not specified, this method returns the current primary data array, which defaults to an empty array (`[]`);
      @param {Array|String} *data* = []
      @param {Function} [*formatter*]
      @chainable
  */
  data(_, f) {
    if (arguments.length) {
      addToQueue.bind(this)(_, f, "data");
      this._hidden = [];
      this._solo = [];
      if (
        this._userData &&
        JSON.stringify(_) !== JSON.stringify(this._userData)
      ) {
        this._timeFilter = false;
        this._timelineSelection = false;
      }
      this._userData = _;
      return this;
    }
    return this._data;
  }

  /**
      @memberof Viz
      @desc If the number of visible data points exceeds this number, the default hover behavior will be disabled (helpful for very large visualizations bogging down the DOM with opacity updates).
      @param {Number} [*value* = 100]
      @chainable
  */
  dataCutoff(_) {
    return arguments.length ? ((this._dataCutoff = _), this) : this._dataCutoff;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the depth to the specified number and returns the current class instance. The *value* should correspond with an index in the [groupBy](#groupBy) array.
      @param {Number} [*value*]
      @chainable
  */
  depth(_) {
    return arguments.length ? ((this._depth = _), this) : this._depth;
  }

  /**
      @memberof Viz
      @desc If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.
      @param {Boolean} *value* = true
      @chainable
  */
  detectResize(_) {
    return arguments.length
      ? ((this._detectResize = _), this)
      : this._detectResize;
  }

  /**
      @memberof Viz
      @desc When resizing the browser window, this is the millisecond delay to trigger the resize event.
      @param {Number} *value* = 400
      @chainable
  */
  detectResizeDelay(_) {
    return arguments.length
      ? ((this._detectResizeDelay = _), this)
      : this._detectResizeDelay;
  }

  /**
      @memberof Viz
      @desc Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.
      @param {Boolean} *value* = true
      @chainable
  */
  detectVisible(_) {
    return arguments.length
      ? ((this._detectVisible = _), this)
      : this._detectVisible;
  }

  /**
      @memberof Viz
      @desc The interval, in milliseconds, for checking if the visualization is visible on the page.
      @param {Number} *value* = 1000
      @chainable
  */
  detectVisibleInterval(_) {
    return arguments.length
      ? ((this._detectVisibleInterval = _), this)
      : this._detectVisibleInterval;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the discrete accessor to the specified method name (usually an axis) and returns the current class instance.
      @param {String} [*value*]
      @chainable
  */
  discrete(_) {
    return arguments.length ? ((this._discrete = _), this) : this._discrete;
  }

  /**
      @memberof Viz
      @desc Shows a button that allows for downloading the current visualization.
      @param {Boolean} [*value* = false]
      @chainable
  */
  downloadButton(_) {
    return arguments.length
      ? ((this._downloadButton = _), this)
      : this._downloadButton;
  }

  /**
      @memberof Viz
      @desc Sets specific options of the saveElement function used when downloading the visualization.
      @param {Object} [*value* = {type: "png"}]
      @chainable
  */
  downloadConfig(_) {
    return arguments.length
      ? ((this._downloadConfig = assign(this._downloadConfig, _)), this)
      : this._downloadConfig;
  }

  /**
      @memberof Viz
      @desc Defines which control group to add the download button into.
      @param {String} [*value* = "top"]
      @chainable
  */
  downloadPosition(_) {
    return arguments.length
      ? ((this._downloadPosition = _), this)
      : this._downloadPosition;
  }

  /**
      @memberof Viz
      @desc If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.
      @param {Number} [*ms* = 600]
      @chainable
  */
  duration(_) {
    return arguments.length ? ((this._duration = _), this) : this._duration;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the filter to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  filter(_) {
    return arguments.length ? ((this._filter = _), this) : this._filter;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the filter to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  fontFamily(_) {
    if (arguments.length) {
      const labelConfig = {fontFamily: _};

      const axisConfig = {titleConfig: labelConfig, shapeConfig: {labelConfig}};

      this.shapeConfig({labelConfig});
      this.colorScaleConfig({axisConfig});

      ["axis", "column", "row", "timeline", "x", "y", "x2", "y2"].forEach(
        axis => {
          const method = `${axis}Config`;
          if (this[method]) this[method](axisConfig);
        }
      );
      ["back", "title", "total", "subtitle"].forEach(label => {
        const method = `${label}Config`;
        if (this[method]) this[method](labelConfig);
      });

      this.tooltipConfig({
        tooltipStyle: {"font-family": fontFamilyStringify(_)},
      });

      this._fontFamily = _;
      return this;
    }
    return this._fontFamily;
  }

  /**
      @memberof Viz
      @desc Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.
      @param {String|Function|Array} [*value*]
      @chainable
  */
  groupBy(_) {
    if (!arguments.length) return this._groupBy;
    this._groupByRaw = _;
    if (!(_ instanceof Array)) _ = [_];
    return (
      (this._groupBy = _.map(k => {
        if (typeof k === "function") return k;
        else {
          if (!this._aggs[k]) {
            this._aggs[k] = (a, c) => {
              const v = unique(a.map(c));
              return v.length === 1 ? v[0] : v;
            };
          }
          return accessor(k);
        }
      })),
      this
    );
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the overall height to the specified number and returns the current class instance.
      @param {Number} [*value* = window.innerHeight]
      @chainable
  */
  height(_) {
    return arguments.length ? ((this._height = _), this) : this._height;
  }

  /**
      @memberof Viz
      @desc Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).
      @param {Function|String} [*value* = "#aaa"]
      @chainable
  */
  hiddenColor(_) {
    return arguments.length
      ? ((this._hiddenColor = typeof _ === "function" ? _ : constant(_)), this)
      : this._hiddenColor;
  }

  /**
      @memberof Viz
      @desc Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).
      @param {Function|Number} [*value* = 0.5]
      @chainable
  */
  hiddenOpacity(_) {
    return arguments.length
      ? ((this._hiddenOpacity = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._hiddenOpacity;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the hover method to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  hover(_) {
    let hoverFunction = (this._hover = _);

    if (this._shapeConfig.hoverOpacity !== 1) {
      if (typeof _ === "function") {
        let shapeData = arrayMerge(this._shapes.map(s => s.data()));
        shapeData = shapeData.concat(this._legendClass.data());
        const activeData = _ ? shapeData.filter(_) : [];

        let activeIds = [];
        activeData.map(this._ids).forEach(ids => {
          for (let x = 1; x <= ids.length; x++) {
            activeIds.push(JSON.stringify(ids.slice(0, x)));
          }
        });
        activeIds = activeIds.filter((id, i) => activeIds.indexOf(id) === i);

        if (activeIds.length)
          hoverFunction = (d, i) =>
            activeIds.includes(JSON.stringify(this._ids(d, i)));
      }

      this._shapes.forEach(s => s.hover(hoverFunction));
      if (this._legend) this._legendClass.hover(hoverFunction);
    }

    return this;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the label accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value*]
      @chainable
  */
  label(_) {
    return arguments.length
      ? ((this._label = typeof _ === "function" ? _ : constant(_)), this)
      : this._label;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, toggles the legend based on the specified boolean and returns the current class instance.
      @param {Boolean|Function} [*value* = true]
      @chainable
  */
  legend(_) {
    return arguments.length
      ? ((this._legend = typeof _ === "function" ? _ : constant(_)), this)
      : this._legend;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, the object is passed to the legend's config method.
      @param {Object} [*value*]
      @chainable
  */
  legendConfig(_) {
    return arguments.length
      ? ((this._legendConfig = assign(this._legendConfig, _)), this)
      : this._legendConfig;
  }

  /**
      @memberof Viz
      @desc Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.
      @param {Boolean|Function} [*value* = false]
      @chainable
  */
  legendFilterInvert(_) {
    return arguments.length
      ? ((this._legendFilterInvert = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendFilterInvert;
  }

  /**
      @memberof Viz
      @desc Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  legendPadding(_) {
    return arguments.length
      ? ((this._legendPadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendPadding;
  }

  /**
      @memberof Viz
      @desc Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.
      @param {Function|String} [*value* = "bottom"]
      @chainable
  */
  legendPosition(_) {
    return arguments.length
      ? ((this._legendPosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendPosition;
  }

  /**
      @memberof Viz
      @desc A JavaScript [sort comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) used to sort the legend.
      @param {Function} *value*
      @chainable
  */
  legendSort(_) {
    return arguments.length ? ((this._legendSort = _), this) : this._legendSort;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the legend tooltip and returns the current class instance.
      @param {Object} [*value* = {}]
      @chainable
  */
  legendTooltip(_) {
    return arguments.length
      ? ((this._legendTooltip = assign(this._legendTooltip, _)), this)
      : this._legendTooltip;
  }

  /**
      @memberof Viz
      @desc Sets the inner HTML of the status message that is displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
      @param {Function|String} [*value*]
      @chainable
  */
  loadingHTML(_) {
    return arguments.length
      ? ((this._loadingHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this._loadingHTML;
  }

  /**
      @memberof Viz
      @desc Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.
      @param {Boolean} [*value* = true]
      @chainable
  */
  loadingMessage(_) {
    return arguments.length
      ? ((this._loadingMessage = _), this)
      : this._loadingMessage;
  }

  /**
      @memberof Viz
      @desc Sets the color of the mask used underneath the status message that is displayed when loading AJAX requests and displaying errors. Additionally, `false` will turn off the mask completely.
      @param {Boolean|String} [*value* = "rgba(0, 0, 0, 0.1)"]
      @chainable
  */
  messageMask(_) {
    return arguments.length
      ? ((this._messageMask = _), this)
      : this._messageMask;
  }

  /**
      @memberof Viz
      @desc Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.
      @param {Object} [*value*]
      @chainable
  */
  messageStyle(_) {
    return arguments.length
      ? ((this._messageStyle = assign(this._messageStyle, _)), this)
      : this._messageStyle;
  }

  /**
      @memberof Viz
      @desc Sets the inner HTML of the status message that is displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
      @param {Function|String} [*value*]
      @chainable
  */
  noDataHTML(_) {
    return arguments.length
      ? ((this._noDataHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this._noDataHTML;
  }

  /**
     @memberof Viz
     @desc Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.
     @param {Boolean} [*value* = true]
     @chainable
  */
  noDataMessage(_) {
    return arguments.length
      ? ((this._noDataMessage = _), this)
      : this._noDataMessage;
  }

  /**
      @memberof Viz
      @desc If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.
      @param {String|HTMLElement} *selector*
      @chainable
  */
  scrollContainer(_) {
    return arguments.length
      ? ((this._scrollContainer = _), this)
      : this._scrollContainer;
  }

  /**
      @memberof Viz
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element, which is `undefined` by default.
      @param {String|HTMLElement} [*selector*]
      @chainable
  */
  select(_) {
    return arguments.length ? ((this._select = select(_)), this) : this._select;
  }

  /**
      @memberof Viz
      @desc Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.
      @param {String|Function} [*value*]
      @chainable
  */
  shape(_) {
    return arguments.length
      ? ((this._shape = typeof _ === "function" ? _ : constant(_)), this)
      : this._shape;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for each shape and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  shapeConfig(_) {
    return arguments.length
      ? ((this._shapeConfig = assign(this._shapeConfig, _)), this)
      : this._shapeConfig;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the subtitle accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value*]
      @chainable
  */
  subtitle(_) {
    return arguments.length
      ? ((this._subtitle = typeof _ === "function" ? _ : constant(_)), this)
      : this._subtitle;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the subtitle and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  subtitleConfig(_) {
    return arguments.length
      ? ((this._subtitleConfig = assign(this._subtitleConfig, _)), this)
      : this._subtitleConfig;
  }

  /**
      @memberof Viz
      @desc Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  subtitlePadding(_) {
    return arguments.length
      ? ((this._subtitlePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._subtitlePadding;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the description accessor to the specified string and returns the current class instance.
      @param {String} [*value*]
      @chainable
  */
  svgDesc(_) {
    return arguments.length ? ((this._svgDesc = _), this) : this._svgDesc;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the title accessor to the specified string and returns the current class instance.
      @param {String} [*value*]
      @chainable
  */
  svgTitle(_) {
    return arguments.length ? ((this._svgTitle = _), this) : this._svgTitle;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the threshold for buckets to the specified function or string, and returns the current class instance.
      @param {Function|Number} [value]
      @chainable
   */
  threshold(_) {
    if (arguments.length) {
      if (typeof _ === "function") {
        this._threshold = _;
      } else if (isFinite(_) && !isNaN(_)) {
        this._threshold = constant(_ * 1);
      }
      return this;
    } else return this._threshold;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the accesor for the value used in the threshold algorithm, and returns the current class instance.
      @param {Function|Number} [value]
      @chainable
   */
  thresholdKey(key) {
    if (arguments.length) {
      if (typeof key === "function") {
        this._thresholdKey = key;
      } else {
        this._thresholdKey = accessor(key);
      }
      return this;
    } else return this._thresholdKey;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the label for the bucket item, and returns the current class instance.
      @param {Function|String} [value]
      @chainable
   */
  thresholdName(_) {
    return arguments.length
      ? ((this._thresholdName = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._thresholdName;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the time accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value*]
      @chainable
  */
  time(_) {
    if (arguments.length) {
      if (typeof _ === "function") {
        this._time = _;
      } else if (_) {
        this._time = accessor(_);
        if (!this._aggs[_]) {
          this._aggs[_] = (a, c) => {
            const v = unique(a.map(c));
            return v.length === 1 ? v[0] : v;
          };
        }
        if (
          this._userTime &&
          JSON.stringify(_) !== JSON.stringify(this._userTime)
        ) {
          this._timeFilter = false;
          this._timelineSelection = false;
        }
        this._userTime = _;
      } else {
        this._time = undefined;
        this._userTime = undefined;
        this._timeFilter = false;
        this._timelineSelection = false;
      }
      return this;
    } else return this._time;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the time filter to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
  */
  timeFilter(_) {
    return arguments.length ? ((this._timeFilter = _), this) : this._timeFilter;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, toggles the timeline based on the specified boolean and returns the current class instance.
      @param {Boolean} [*value* = true]
      @chainable
  */
  timeline(_) {
    return arguments.length ? ((this._timeline = _), this) : this._timeline;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the timeline and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  timelineConfig(_) {
    return arguments.length
      ? ((this._timelineConfig = assign(this._timelineConfig, _)), this)
      : this._timelineConfig;
  }

  /**
      @memberof Viz
      @desc Sets the starting time or range for the timeline. The value provided can either be a single Date/String, or an Array of 2 values representing the min and max.
      @param {Date|String|Array} [*value*]
      @chainable
  */
  timelineDefault(_) {
    if (arguments.length) {
      if (!(_ instanceof Array)) _ = [_, _];
      this._timelineDefault = _.map(date);
      return this;
    } else return this._timelineDefault;
  }

  /**
      @memberof Viz
      @desc Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  timelinePadding(_) {
    return arguments.length
      ? ((this._timelinePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._timelinePadding;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the title accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value*]
      @chainable
  */
  title(_) {
    return arguments.length
      ? ((this._title = typeof _ === "function" ? _ : constant(_)), this)
      : this._title;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the title and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  titleConfig(_) {
    return arguments.length
      ? ((this._titleConfig = assign(this._titleConfig, _)), this)
      : this._titleConfig;
  }

  /**
      @memberof Viz
      @desc Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  titlePadding(_) {
    return arguments.length
      ? ((this._titlePadding = typeof _ === "function" ? _ : constant(_)), this)
      : this._titlePadding;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, toggles the tooltip based on the specified boolean and returns the current class instance.
      @param {Boolean|Function} [*value* = true]
      @chainable
  */
  tooltip(_) {
    return arguments.length
      ? ((this._tooltip = typeof _ === "function" ? _ : constant(_)), this)
      : this._tooltip;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the tooltip and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  tooltipConfig(_) {
    return arguments.length
      ? ((this._tooltipConfig = assign(this._tooltipConfig, _)), this)
      : this._tooltipConfig;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the total accessor to the specified function or string and returns the current class instance.
      @param {Boolean|Function|String} [*value*]
      @chainable
  */
  total(_) {
    if (arguments.length) {
      if (typeof _ === "function") this._total = _;
      else if (_) this._total = accessor(_);
      else this._total = false;
      return this;
    } else return this._total;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for the total and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  totalConfig(_) {
    return arguments.length
      ? ((this._totalConfig = assign(this._totalConfig, _)), this)
      : this._totalConfig;
  }

  /**
      @memberof Viz
      @desc Formatter function for the value in the total bar.
      @param {Function} *value*
      @chainable
  */
  totalFormat(_) {
    return arguments.length
      ? ((this._totalFormat = _), this)
      : this._totalFormat;
  }

  /**
      @memberof Viz
      @desc Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
      @param {Boolean|Function} [*value*]
      @chainable
  */
  totalPadding(_) {
    return arguments.length
      ? ((this._totalPadding = typeof _ === "function" ? _ : constant(_)), this)
      : this._totalPadding;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the overallwidth to the specified number and returns the current class instance.
      @param {Number} [*value* = window.innerWidth]
      @chainable
  */
  width(_) {
    return arguments.length ? ((this._width = _), this) : this._width;
  }

  /**
      @memberof Viz
      @desc Toggles the ability to zoom/pan the visualization. Certain parameters for zooming are required to be hooked up on a visualization by visualization basis.
      @param {Boolean} *value* = false
      @chainable
  */
  zoom(_) {
    return arguments.length ? ((this._zoom = _), this) : this._zoom;
  }

  /**
      @memberof Viz
      @desc The pixel stroke-width of the zoom brush area.
      @param {Number} *value* = 1
      @chainable
  */
  zoomBrushHandleSize(_) {
    return arguments.length
      ? ((this._zoomBrushHandleSize = _), this)
      : this._zoomBrushHandleSize;
  }

  /**
      @memberof Viz
      @desc An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.
      @param {Object|Boolean} *value*
      @chainable
  */
  zoomBrushHandleStyle(_) {
    return arguments.length
      ? ((this._zoomBrushHandleStyle = _), this)
      : this._zoomBrushHandleStyle;
  }

  /**
      @memberof Viz
      @desc An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.
      @param {Object|Boolean} *value*
      @chainable
  */
  zoomBrushSelectionStyle(_) {
    return arguments.length
      ? ((this._zoomBrushSelectionStyle = _), this)
      : this._zoomBrushSelectionStyle;
  }

  /**
      @memberof Viz
      @desc An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
      @param {Object|Boolean} *value*
      @chainable
  */
  zoomControlStyle(_) {
    return arguments.length
      ? ((this._zoomControlStyle = _), this)
      : this._zoomControlStyle;
  }

  /**
      @memberof Viz
      @desc An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
      @param {Object|Boolean} *value*
      @chainable
  */
  zoomControlStyleActive(_) {
    return arguments.length
      ? ((this._zoomControlStyleActive = _), this)
      : this._zoomControlStyleActive;
  }

  /**
      @memberof Viz
      @desc An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
      @param {Object|Boolean} *value*
      @chainable
  */
  zoomControlStyleHover(_) {
    return arguments.length
      ? ((this._zoomControlStyleHover = _), this)
      : this._zoomControlStyleHover;
  }

  /**
      @memberof Viz
      @desc The multiplier that is used in with the control buttons when zooming in and out.
      @param {Number} *value* = 2
      @chainable
  */
  zoomFactor(_) {
    return arguments.length ? ((this._zoomFactor = _), this) : this._zoomFactor;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the max zoom scale to the specified number and returns the current class instance. If *value* is not specified, returns the current max zoom scale.
      @param {Number} *value* = 16
      @chainable
  */
  zoomMax(_) {
    return arguments.length ? ((this._zoomMax = _), this) : this._zoomMax;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, toggles panning to the specified boolean and returns the current class instance. If *value* is not specified, returns the current panning value.
      @param {Boolean} *value* = true
      @chainable
  */
  zoomPan(_) {
    return arguments.length ? ((this._zoomPan = _), this) : this._zoomPan;
  }

  /**
      @memberof Viz
      @desc A pixel value to be used to pad all sides of a zoomed area.
      @param {Number} *value* = 20
      @chainable
  */
  zoomPadding(_) {
    return arguments.length
      ? ((this._zoomPadding = _), this)
      : this._zoomPadding;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, toggles scroll zooming to the specified boolean and returns the current class instance. If *value* is not specified, returns the current scroll zooming value.
      @param {Boolean} [*value* = true]
      @chainable
  */
  zoomScroll(_) {
    return arguments.length ? ((this._zoomScroll = _), this) : this._zoomScroll;
  }
}
