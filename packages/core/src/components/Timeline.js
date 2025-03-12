import {extent, max, min} from "d3-array";
import {brushX} from "d3-brush";
import {scaleTime} from "d3-scale";
import {pointers} from "d3-selection";

import {colorDefaults} from "@d3plus/color";
import {assign, attrize, date, elem, textWidth} from "@d3plus/dom";
import {formatDate} from "@d3plus/format";
import {locale} from "@d3plus/locales";
import {closest} from "@d3plus/math";
import {textWrap} from "@d3plus/text";

import {Axis, TextBox} from "../components/index.js";
import {constant} from "../utils/index.js";

const colorMid = "#bbb";

/**
    @class Timeline
    @extends Axis
*/
export default class Timeline extends Axis {

  /**
      @memberof Timeline
      @desc Invoked when creating a new class instance, and overrides any default parameters inherited from Axis.
      @private
  */
  constructor() {

    super();

    this._barConfig = assign({}, this._barConfig, {
      stroke: () => this._buttonBehaviorCurrent === "buttons" ? "transparent" : colorMid,
      "stroke-width": () => this._buttonBehaviorCurrent === "buttons" ? 0 : 1
    });
    this._brushing = true;
    this._brushFilter = event => !event.button && event.detail < 2;
    this._brushMin = constant(1);
    this._buttonAlign = "middle";
    this._buttonBehavior = "auto";
    this._buttonPadding = 10;
    this._buttonHeight = 24;
    this._domain = [2001, 2010];
    this._gridSize = 0;
    this._handleConfig = {
      fill: colorDefaults.light,
      stroke: "#228be6",
      "stroke-width": 2,
      rx: 2,
      ry: 2
    };
    this._handleSize = 6;
    this._height = 100;
    this._labelOffset = false;
    this._on = {};
    this.orient("bottom");
    this._playButton = true;
    this._playButtonClass = new TextBox()
      .on("click", () => {

        // if playing, pause
        if (this._playTimer) {
          clearInterval(this._playTimer);
          this._playTimer = false;
          this._playButtonClass.render();
        }
        // otherwise, start playing
        else {
          let firstTime = true;
          const nextYear = () => {
            let selection = this._selection || [this._domain[this._domain.length - 1]];
            if (!(selection instanceof Array)) selection = [selection];
            selection = selection.map(date).map(Number);
            if (selection.length === 1) selection.push(selection[0]);
            const ticks = this._ticks.map(Number);
            const firstIndex = ticks.indexOf(selection[0]);
            const lastIndex = ticks.indexOf(selection[selection.length - 1]);
            if (lastIndex === ticks.length - 1) {
              if (!firstTime) {
                clearInterval(this._playTimer);
                this._playTimer = false;
                this._playButtonClass.render();
              }
              else {
                this.selection([
                  this._ticks[0], 
                  this._ticks[lastIndex - firstIndex]
                ]).render();
              }
            }
            else {
              if (lastIndex + 1 === ticks.length - 1) {
                clearInterval(this._playTimer);
                this._playTimer = false;
              }
              this.selection([
                this._ticks[firstIndex + 1], 
                this._ticks[lastIndex + 1]
              ]).render();
            }
            firstTime = false;
          }
          this._playTimer = setInterval(nextYear, this._playButtonInterval);
          nextYear();
        }
      })
      .on("mousemove", () => this._playButtonClass.select().style("cursor", "pointer"));
    this._playButtonConfig = {
      fontColor: colorDefaults.dark,
      fontSize: 15,
      text: () => this._playTimer ? "&#x23f8;&#xFE0E;" : "⏵",
      textAnchor: "middle",
      verticalAlign: "middle"
    };
    this._playButtonInterval = 1000;
    this._selectionConfig = {
      "fill": "#228be6",
      "fill-opacity": () => this._buttonBehaviorCurrent === "buttons" ? 0.3 : 1,
      "stroke-width": 0
    };
    this._shape = "Rect";
    this._shapeConfig = assign({}, this._shapeConfig, {
      labelBounds: d => this._buttonBehaviorCurrent === "buttons" 
        ? {x: d.labelBounds.x, y: -this._buttonHeight / 2 + 1, width: d.labelBounds.width, height: this._buttonHeight} 
        : d.labelBounds,
      labelConfig: {
        fontColor: colorDefaults.dark,
        fontSize: () => 12,
        verticalAlign: () => this._buttonBehaviorCurrent === "buttons" ? "middle" : "top"
      },
      fill: () => this._buttonBehaviorCurrent === "buttons" ? "#fff" : colorMid,
      stroke: () => this._buttonBehaviorCurrent === "buttons" ? colorMid : "transparent",
      height: d => this._buttonBehaviorCurrent === "buttons" ? this._buttonHeight : d.tick ? this._handleSize : 0,
      width: d => this._buttonBehaviorCurrent === "buttons" 
          ? this._ticksWidth / this._availableTicks.length 
        : d.tick 
          ? this._domain.map(Number).includes(d.id) ? 2 : 1 
          : 0,
      y: d => this._buttonBehaviorCurrent === "buttons" 
          ? this._align === "middle" ? this._height / 2 
          : this._align === "start" ? this._margin.top + this._buttonHeight / 2 
          : this._height - this._buttonHeight / 2 - this._margin.bottom 
        : d.y,
      rx: d => this._buttonBehaviorCurrent === "buttons" ? 0 : this._domain.map(Number).includes(d.id) ? 1 : 0,
      ry: d => this._buttonBehaviorCurrent === "buttons" ? 0 : this._domain.map(Number).includes(d.id) ? 1 : 0
    });
    this._snapping = true;

  }


  /**
      @memberof Timeline
      @desc Triggered on brush "brush".
      @private
  */
  _brushBrush(event) {

    if (event.sourceEvent && event.sourceEvent.offsetX && event.selection !== null && (!this._brushing || this._snapping)) {

      clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();

      const domain = this._updateDomain(event);
      this._brushGroup.call(this._brush.move, this._updateBrushLimit(domain));

    }

    this._brushStyle();
    if (this._on.brush) this._on.brush(this._selection);

  }

  /**
      @memberof Timeline
      @desc Triggered on brush "end".
      @private
  */
  _brushEnd(event) {

    if (!event.sourceEvent) return; // Only transition after input.

    const domain = this._updateDomain(event);

    this._brushStyle();

    if (this._brushing || !this._snapping) this._brushGroup.transition(this._transition).call(this._brush.move, this._updateBrushLimit(domain));

    if (this._on.end) this._on.end(this._selection);

  }

  /**
      @memberof Timeline
      @desc Triggered on brush "start".
      @private
  */
  _brushStart(event) {

    if (event.sourceEvent !== null && (!this._brushing || this._snapping)) {

      clearInterval(this._playTimer);
      this._playTimer = false;
      this._playButtonClass.render();

      const domain = this._updateDomain(event);
      this._brushGroup.call(this._brush.move, this._updateBrushLimit(domain));

    }

    this._brushStyle();
    if (this._on.start) this._on.start(event);

  }

  /**
      @memberof Timeline
      @desc Overrides the default brush styles.
      @private
  */
  _brushStyle() {

    const {height} = this._position;
    const timelineHeight = this._shape === "Circle"
      ? typeof this._shapeConfig.r === "function" ? this._shapeConfig.r({tick: true}) * 2 : this._shapeConfig.r
      : this._shape === "Rect"
        ? typeof this._shapeConfig[height] === "function" ? this._shapeConfig[height]({tick: true}) : this._shapeConfig[height]
        : this._tickSize;

    const brushSelection = this._brushGroup.selectAll(".selection")
      .call(attrize, this._selectionConfig)
      .attr("transform", "translate(0,-1)")
      .attr("height", timelineHeight + 2);

    const brushHandle = this._brushGroup.selectAll(".handle")
      .call(attrize, this._handleConfig)
      .attr("display", this._hiddenHandles ? "none" : "block")
      .attr("transform", d => this._buttonBehaviorCurrent === "buttons" ? `translate(${d.type === "w" ? -this._handleSize / 2 : 0},-1)` : "")
      .attr("height", this._buttonBehaviorCurrent === "buttons" ? this._buttonHeight + 2 : timelineHeight + this._handleSize);

    this._brushGroup.selectAll(".overlay")
      .attr("x", this._paddingLeft)
      .attr("cursor", "pointer")
      .attr("transform", `translate(0,${this._buttonBehaviorCurrent === "buttons" ? this._buttonHeight / 2 : -this._handleSize})`)
      .attr("width", this._buttonBehaviorCurrent === "buttons" ? this._ticksWidth : this._width)
      .attr("height", this._buttonBehaviorCurrent === "buttons" ? this._buttonHeight : this._handleSize * 2);

    if (this._buttonBehaviorCurrent === "buttons") {

      const yTransform = this._align === "middle"
        ? this._height / 2 - this._buttonHeight / 2
        : this._align === "start"
          ? this._margin.top : this._height - this._buttonHeight - this._margin.bottom;

      brushHandle.attr("y", yTransform);
      brushSelection.attr("y", yTransform);
    }

  }

  /**
      @memberof Timeline
      @desc Updates domain of the timeline used in brush functions.
      @private
  */
  _updateDomain(event) {

    const x = pointers(event, this._select.node());
    let domain = event.selection && this._brushing || !x.length ? event.selection : [x[0][0], x[0][0]];

    if (this._buttonBehaviorCurrent === "ticks") domain = domain.map(this._d3Scale.invert);
    domain = domain.map(Number);

    if (event.type === "brush" && this._brushing && this._buttonBehaviorCurrent === "buttons") {
      const diffs = event.selection.map(d => Math.abs(d - event.sourceEvent.offsetX));

      domain = diffs[1] <= diffs[0]
        ? [event.selection[0], event.sourceEvent.offsetX].sort((a, b) => a - b)
        : [event.sourceEvent.offsetX, event.selection[1]].sort((a, b) => a - b);

    }

    const ticks = this._buttonBehaviorCurrent === "ticks"
      ? this._availableTicks.map(Number)
      : this._d3Scale.range();

    if (this._buttonBehaviorCurrent === "ticks") {

      // find closest min and max ticks from data
      // and their indices in the ticks Array
      let minDomain = date(closest(domain[0], ticks));
      let minIndex = ticks.indexOf(+minDomain);
      let maxDomain = date(closest(domain[1], ticks));
      let maxIndex = ticks.indexOf(+maxDomain);

      // using the indices, determine if the 2 ends of the brush
      // are too close to each other. "ticksApart" always needs to
      // be less than the current current brushMin minus 1. For
      // example, a brushMin of "2" means that the min and max domain
      // values need to be "1" space apart from eachother.
      let ticksApart = Math.abs(maxIndex - minIndex);
      const minTicksAllowed = this._brushMin() - 1;

      // if the min and max are not far enough apart to satisfy
      // brushMin, then forcibly extend the domain.
      if (ticksApart < minTicksAllowed) {

        // push the maxDomain out as far as possible to account for brushMin
        maxIndex = min([ticks.length - 1, maxIndex + (minTicksAllowed - ticksApart)]);
        maxDomain = ticks[maxIndex];
        ticksApart = Math.abs(maxIndex - minIndex);

        // if the domain is still not far enough apart, extent the minDomain
        // as far as possible to allow for brushMin
        if (ticksApart < minTicksAllowed) {
          minIndex = max([0, minIndex - (minTicksAllowed - ticksApart)]);
          minDomain = ticks[minIndex];
        }

      }

      domain[0] = minDomain;
      domain[1] = maxDomain;

    }
    else {
      domain[0] = closest(domain[0], ticks);
      domain[1] = closest(domain[1], ticks);
    }

    // if the brush event has finished, update the current "selection" value
    const single = +domain[0] === +domain[1];
    if (event.type === "brush" || event.type === "end") {
      this._selection = this._buttonBehaviorCurrent === "ticks"
        ? single ? domain[0] : domain
        : single
          ? date(this._availableTicks[ticks.indexOf(domain[0])])
          : [date(this._availableTicks[ticks.indexOf(domain[0])]), date(this._availableTicks[ticks.indexOf(domain[1])])];
    }

    return domain;

  }

  /**
      @memberof Timeline
      @desc Updates limits of the brush.
      @private
  */
  _updateBrushLimit(domain) {

    const selection = this._buttonBehaviorCurrent === "ticks" ? domain.map(date).map(this._d3Scale) : domain;

    if (selection[0] === selection[1]) {
      selection[0] -= 0.1;
      selection[1] += 0.1;
    }

    if (this._buttonBehaviorCurrent === "buttons") {
      const handleSize = this._hiddenHandles ? 0 : this._handleSize;
      const buttonWidth = 0.5 * (this._ticksWidth / this._availableTicks.length - handleSize);
      selection[0] -= buttonWidth;
      selection[1] += buttonWidth;
    }

    return selection;
  }

  /**
      @memberof Timeline
      @desc Draws the timeline.
      @param {Function} [*callback* = undefined]
      @chainable
  */
  render(callback) {
    const {height, y} = this._position;

    if (this._ticks) this._ticks = this._ticks.map(date);
    if (this._data) this._data = this._data.map(date);

    let ticks = this._ticks ? this._ticks : this._domain.map(date);
    if (!this._ticks) {
      const d3Scale = scaleTime().domain(ticks).range([0, this._width]);
      ticks = d3Scale.ticks();
    }
    
    const timeLocale = this._timeLocale || locale[this._locale] || locale["en-US"];
    if (this._userFormat === undefined) this._userFormat = this._tickFormat || false;
    const tickFormat = this._tickFormat = this._userFormat ? this._userFormat : d => formatDate(d, ticks).replace(/^Q/g, timeLocale.quarter);

    // Measures size of ticks
    this._ticksWidth = this._width;
    if (["auto", "buttons"].includes(this._buttonBehavior)) {
      let maxLabel = 0;
      ticks.forEach((d, i) => {

        const {fontFamily, fontSize} = this._shapeConfig.labelConfig
  
        const f = typeof fontFamily === "function" ? fontFamily(d, i) : fontFamily,
              s = typeof fontSize === "function" ? fontSize(d, i) : fontSize;
  
        const wrap = textWrap()
          .fontFamily(f)
          .fontSize(s)
          .lineHeight(this._shapeConfig.lineHeight ? this._shapeConfig.lineHeight(d, i) : undefined);
  
        const res = wrap(tickFormat(d));
        
        let width = res.lines.length
          ? Math.ceil(max(res.lines.map(line => textWidth(line, {"font-family": f, "font-size": s})))) + s / 4
          : 0;
  
        if (width % 2) width++;
        if (maxLabel < width) maxLabel = width + 2 * this._buttonPadding;
  
      });
      this._ticksWidth = maxLabel * ticks.length;
    }

    const playButtonWidth = this._playButton ? this._buttonHeight : 0;
    const space = this._width - playButtonWidth;
    
    this._buttonBehaviorCurrent = this._buttonBehavior === "auto" ? this._ticksWidth < space ? "buttons" : "ticks" : this._buttonBehavior;
    const hiddenHandles = this._hiddenHandles = this._buttonBehaviorCurrent === "buttons" && !this._brushing;

    if (this._buttonBehaviorCurrent === "buttons") {

      this._scale = "ordinal";
      const domain = scaleTime().domain(this._domain.map(date)).ticks().map(Number);

      this._domain = this._ticks ? this._ticks : Array.from(Array(domain[domain.length - 1] - domain[0] + 1), (_, x) => domain[0] + x).map(date);

      this._ticks = this._domain;

      const buttonMargin = 0.5 * this._ticksWidth / this._ticks.length;

      const emptySpace = this._width - this._ticksWidth - playButtonWidth;

      this._paddingLeft = this._buttonAlign === "middle" ? emptySpace / 2 + playButtonWidth
        : this._buttonAlign === "end" ? emptySpace + playButtonWidth
          : playButtonWidth;

      this._range = [
        this._paddingLeft + buttonMargin,
        this._paddingLeft + this._ticksWidth - buttonMargin
      ];
    }
    else {
      this._scale = "time";
      this._domain = extent(ticks);
      this._range = [playButtonWidth ? playButtonWidth * 1.5 : undefined, undefined];
      this._paddingLeft = playButtonWidth;
    }

    super.render(callback);

    const offset = this._outerBounds[y],
          range = this._d3Scale.range();

    const brush = this._brush = brushX()
      .extent([[range[0], offset], [range[range.length - 1], offset + this._outerBounds[height]]])
      .filter(this._brushFilter)
      .handleSize(hiddenHandles ? 0 : this._handleSize)
      .on("start", this._brushStart.bind(this))
      .on("brush", this._brushBrush.bind(this))
      .on("end", this._brushEnd.bind(this));

    // data Array to be used when detecting the default value
    const defaultData = this._buttonBehaviorCurrent === "ticks"
      ? this._availableTicks
      : range;

    // the default selection, if needed
    const defaultSelection = [
      this._brushMin() > defaultData.length
        ? defaultData[0]
        : defaultData[defaultData.length - this._brushMin()],
      defaultData[defaultData.length - 1]
    ];

    // the current selection, considering user input, defaults, and data
    const selection = this._selection === void 0 ? defaultSelection
      : this._selection instanceof Array
        ? this._buttonBehaviorCurrent === "buttons"
          ? this._selection.map(date).map(d => range[this._ticks.map(Number).indexOf(+d)])
          : this._selection.map(date)
        : this._buttonBehaviorCurrent === "buttons"
          ? [range[this._ticks.map(Number).indexOf(+this._selection)]]
          : [this._selection];

    if (selection.length === 1) selection.push(selection[0]);
    this._updateBrushLimit(selection);

    this._brushGroup = elem("g.brushGroup", {parent: this._group});
    this._brushGroup.call(brush).transition(this._transition)
      .call(brush.move, this._buttonBehaviorCurrent === "ticks" ? this._updateBrushLimit(selection) : selection);

    this._outerBounds.y -= this._handleSize / 2;
    this._outerBounds.height += this._handleSize / 2;

    const playButtonGroup = elem("g.d3plus-Timeline-play", {parent: this._group});
  
    this._playButtonClass
      .data(this._playButton ? [{
        x: this._paddingLeft - playButtonWidth, 
        y: this._buttonBehaviorCurrent === "buttons" 
            ? this._align === "middle" ? this._height / 2 - this._buttonHeight / 2  
            : this._align === "start" ? this._margin.top
            : this._height - this._buttonHeight - this._margin.bottom 
          : this._outerBounds.y, 
        width: playButtonWidth,
        height: playButtonWidth
      }] : [])
      .select(playButtonGroup.node())
      .config(this._playButtonConfig)
      .render();

    return this;
  }

  /**
        @memberof Timeline
        @desc If *value* is specified, sets the button padding and returns the current class instance. If *value* is not specified, returns the current button padding.
        @param {Number} [*value* = 10]
        @chainable
    */
  buttonPadding(_) {
    return arguments.length ? (this._buttonPadding = _, this) : this._buttonPadding;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, toggles the brushing value and returns the current class instance. If *value* is not specified, returns the current brushing value.
      @param {Boolean} [*value* = true]
      @chainable
  */
  brushing(_) {
    return arguments.length ? (this._brushing = _, this) : this._brushing;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, sets the brush event filter and returns the current class instance. If *value* is not specified, returns the current brush event filter.
      @param {Function} [*value*]
      @chainable
      @example
function() {
  return !event.button && event.detail < 2;
}
  */
  brushFilter(_) {
    return arguments.length ? (this._brushFilter = _, this) : this._brushFilter;
  }

  /**
      @memberof Timeline
      @desc Sets the minimum number of "ticks" to allow to be highlighted when using "ticks" buttonBehavior. Helpful when using x/y plots where you don't want the user to select less than 2 time periods. Value passed can either be a static Number, or a function that is expected to return a Number.
      @param {Number|Function} [*value* = 1]
      @chainable
  */
  brushMin(_) {
    return arguments.length ? (this._brushMin = typeof _ === "function" ? _ : constant(_), this) : this._brushMin;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, toggles the horizontal alignment of the button timeline. Accepted values are `"start"`, `"middle"` and `"end"`. If *value* is not specified, returns the current button value.
      @param {String} [*value* = "middle"]
      @chainable
  */
  buttonAlign(_) {
    return arguments.length ? (this._buttonAlign = _, this) : this._buttonAlign;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, toggles the style of the timeline. Accepted values are `"auto"`, `"buttons"` and `"ticks"`. If *value* is not specified, returns the current button value.
      @param {String} [*value* = "auto"]
      @chainable
  */
  buttonBehavior(_) {
    return arguments.length ? (this._buttonBehavior = _, this) : this._buttonBehavior;
  }

  /**
        @memberof Timeline
        @desc If *value* is specified, sets the button height and returns the current class instance. If *value* is not specified, returns the current button height.
        @param {Number} [*value* = 30]
        @chainable
    */
  buttonHeight(_) {
    return arguments.length ? (this._buttonHeight = _, this) : this._buttonHeight;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, sets the handle style and returns the current class instance. If *value* is not specified, returns the current handle style.
      @param {Object} [*value*]
      @chainable
  */
  handleConfig(_) {
    return arguments.length ? (this._handleConfig = assign(this._handleConfig, _), this) : this._handleConfig;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, sets the handle size and returns the current class instance. If *value* is not specified, returns the current handle size.
      @param {Number} [*value* = 6]
      @chainable
  */
  handleSize(_) {
    return arguments.length ? (this._handleSize = _, this) : this._handleSize;
  }

  /**
      @memberof Timeline
      @desc Adds or removes a *listener* for the specified brush event *typename*. If a *listener* is not specified, returns the currently-assigned listener for the specified event *typename*. Mirrors the core [d3-brush](https://github.com/d3/d3-brush#brush_on) behavior.
      @param {String|Object} [*typename*]
      @param {Function} [*listener*]
      @chainable
  */
  on(_, f) {
    return arguments.length === 2 ? (this._on[_] = f, this) : arguments.length ? typeof _ === "string" ? this._on[_] : (this._on = assign({}, this._on, _), this) : this._on;
  }

  /**
      @memberof Timeline
      @desc Determines the visibility of the play button to the left the of timeline, which will cycle through the available periods at a rate defined by the playButtonInterval method.
      @param {Boolean} [*value* = true]
      @chainable
  */
  playButton(_) {
    return arguments.length ? (this._playButton = _, this) : this._playButton;
  }

  /**
      @memberof Timeline
      @desc The config Object for the Rect class used to create the playButton.
      @param {Object} [*value*]
      @chainable
  */
  playButtonConfig(_) {
    return arguments.length ? (this._playButtonConfig = assign(this._playButtonConfig, _), this) : this._playButtonConfig;
  }

  /**
      @memberof Timeline
      @desc The value, in milliseconds, to use when cycling through the available time periods when the user clicks the playButton.
      @param {Number} [*value* = 1000]
      @chainable
  */
  playButtonInterval(_) {
    return arguments.length ? (this._playButtonInterval = _, this) : this._playButtonInterval;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, sets the selection style and returns the current class instance. If *value* is not specified, returns the current selection style.
      @param {Object} [*value*]
      @chainable
  */
  selectionConfig(_) {
    return arguments.length ? (this._selectionConfig = assign(this._selectionConfig, _), this) : this._selectionConfig;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, sets the selection and returns the current class instance. If *value* is not specified, returns the current selection. Defaults to the most recent year in the timeline.
      @param {Array|Date|Number|String} [*value*]
      @chainable
  */
  selection(_) {
    return arguments.length ? (this._selection = _, this) : this._selection;
  }

  /**
      @memberof Timeline
      @desc If *value* is specified, toggles the snapping value and returns the current class instance. If *value* is not specified, returns the current snapping value.
      @param {Boolean} [*value* = true]
      @chainable
  */
  snapping(_) {
    return arguments.length ? (this._snapping = _, this) : this._snapping;
  }

}
