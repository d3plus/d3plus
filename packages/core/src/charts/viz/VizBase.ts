import {select} from "d3-selection";

import {unique} from "@d3plus/data";
import {assign, date} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {accessor, constant} from "../../utils/index.js";
import VizBaseConfig from "./VizBaseConfig.js";

/**
    Second half of the fluent config accessors shared by every Viz chart
    (`loadingHTML` through `zoomPadding`), extending `VizBaseConfig` which
    holds the first half. Split purely so each file stays under the
    `max-lines` budget; the methods remain real prototype methods, so
    `BaseClass.config()` reflection and polymorphic `this` chaining are
    unchanged.
*/
export default class VizBase extends VizBaseConfig {

  /**
      The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
*/
  loadingHTML(
    _?: string | ((viz: VizBase) => string),
  ): this | string | ((viz: VizBase) => string) {
    return arguments.length
      ? ((this.schema.loadingHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.loadingHTML;
  }

  /**
      Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.
*/
  loadingMessage(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.loadingMessage = _), this)
      : this.schema.loadingMessage;
  }

  /**
      The color of the mask displayed underneath the status message when loading AJAX requests and displaying errors. Set to `false` to turn off the mask completely.
*/
  messageMask(_?: string | boolean): this | string | boolean {
    return arguments.length
      ? ((this.schema.messageMask = _), this)
      : this.schema.messageMask;
  }

  /**
      Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.
*/
  messageStyle(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.messageStyle = assign(this.schema.messageStyle, _!)), this)
      : this.schema.messageStyle;
  }

  /**
      The inner HTML of the status message displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
*/
  noDataHTML(
    _?: string | ((viz: VizBase) => string),
  ): this | string | ((viz: VizBase) => string) {
    return arguments.length
      ? ((this.schema.noDataHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.noDataHTML;
  }

  /**
     Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.
*/
  noDataMessage(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.noDataMessage = _), this)
      : this.schema.noDataMessage;
  }

  /**
      If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.
*/
  scrollContainer(
    _?: string | HTMLElement | Window,
  ): this | string | HTMLElement | Window {
    return arguments.length
      ? ((this.schema.scrollContainer = _), this)
      : this.schema.scrollContainer;
  }

  /**
      The SVG container element as a d3 selector or DOM element. Defaults to `undefined`.
*/
  select(_?: string | HTMLElement): this | ReturnType<typeof select> {
    return arguments.length
      ? ((this._select = select(_! as string)), this)
      : this._select;
  }

  /**
      Changes the primary shape used to represent each data point in a visualization. Not all visualizations support changing shapes, this method can be provided the String name of a D3plus shape class (for example, "Rect" or "Circle"), or an accessor Function that returns the String class name to be used for each individual data point.
*/
  shape(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this.schema.shape = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.shape;
  }

  /**
      Configuration object with key/value pairs applied as method calls on each shape.
*/
  shapeConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.shapeConfig = assign(this.schema.shapeConfig, _!)), this)
      : this.schema.shapeConfig;
  }

  /**
      Accessor function or string for the visualization's subtitle.
*/
  subtitle(
    _?: string | ((data: DataPoint[]) => string),
  ): this | string | ((data: DataPoint[]) => string) {
    return arguments.length
      ? ((this.schema.subtitle = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.subtitle;
  }

  /**
      Configuration object for the subtitle.
*/
  subtitleConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.subtitleConfig = assign(this.schema.subtitleConfig, _!)), this)
      : this.schema.subtitleConfig;
  }

  /**
      Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  subtitlePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this.schema.subtitlePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.subtitlePadding;
  }

  // svgDesc(_?: string): installed by installFluent(this, vizSchema).
  // svgTitle(_?: string): installed by installFluent(this, vizSchema).

  /**
      The threshold value for bucketing small data points together.
*/
  threshold(
    _?: number | ((data: DataPoint[]) => number),
  ): this | number | ((data: DataPoint[]) => number) {
    if (arguments.length) {
      if (typeof _ === "function") {
        this.schema.threshold = _;
      } else if (isFinite(_!) && !isNaN(_!)) {
        this.schema.threshold = constant(_! * 1);
      }
      return this;
    } else return this.schema.threshold;
  }

  /**
      Accessor for the value used in the threshold algorithm.
    @param key The data key used to group values for thresholding.
*/
  thresholdKey(
    key?: string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]),
  ): this | string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]) {
    if (arguments.length) {
      if (typeof key === "function") {
        this.schema.thresholdKey = key;
      } else {
        this.schema.thresholdKey = accessor(key!);
      }
      return this;
    } else return this.schema.thresholdKey;
  }

  /**
      The label displayed for bucketed threshold items.
*/
  thresholdName(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this.schema.thresholdName = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.thresholdName;
  }

  /**
      Accessor function or string key for the time dimension of each data point.
*/
  time(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | false,
  ):
    | this
    | string
    | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    | false {
    if (arguments.length) {
      if (typeof _ === "function") {
        this.schema.time = _;
      } else if (_) {
        this.schema.time = accessor(_);
        if (!this.schema.aggs[_]) {
          this.schema.aggs[_] = (
            a: DataPoint[],
            c: (d: DataPoint) => DataPoint[keyof DataPoint],
          ) => {
            const v = unique(a.map(c));
            return v.length === 1 ? v[0] : v;
          };
        }
        if (
          this._userTime &&
          JSON.stringify(_) !== JSON.stringify(this._userTime)
        ) {
          this.schema.timeFilter = false;
          this._timelineSelection = false;
        }
        this._userTime = _;
      } else {
        this.schema.time = undefined;
        this._userTime = undefined;
        this.schema.timeFilter = false;
        this._timelineSelection = false;
      }
      return this;
    } else return this.schema.time;
  }

  // timeFilter(_?: ((d, i) => boolean) | false): installed by installFluent(this, vizSchema).
  // timeline(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      Configuration object for the timeline.
*/
  timelineConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.timelineConfig = assign(this.schema.timelineConfig, _!)), this)
      : this.schema.timelineConfig;
  }

  /**
      The starting time or range for the timeline. Can be a single Date/String, or an Array of 2 values representing the min and max.
*/
  timelineDefault(_?: Date | string | (Date | string)[]): this | Date[] {
    if (arguments.length) {
      if (!(_ instanceof Array)) _ = [_!, _!];
      this.schema.timelineDefault = (_ as (Date | string)[])
        .map(d => date(d as string | number | false))
        .filter((d): d is Date => d !== false);
      return this;
    } else return this.schema.timelineDefault;
  }

  /**
      Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  timelinePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this.schema.timelinePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.timelinePadding;
  }

  /**
      Accessor function or string for the visualization's title.
*/
  title(
    _?: string | ((data: DataPoint[]) => string),
  ): this | string | ((data: DataPoint[]) => string) {
    return arguments.length
      ? ((this.schema.title = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.title;
  }

  /**
      Configuration object for the title.
*/
  titleConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.titleConfig = assign(this.schema.titleConfig, _!)), this)
      : this.schema.titleConfig;
  }

  /**
      Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  titlePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this.schema.titlePadding = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.titlePadding;
  }

  /**
      Whether to display tooltips on hover.
*/
  tooltip(
    _?: boolean | ((d: DataPoint, i: number) => boolean),
  ): this | boolean | ((d: DataPoint, i: number) => boolean) {
    return arguments.length
      ? ((this.schema.tooltip = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.tooltip;
  }

  /**
      Configuration object for the tooltip.
*/
  tooltipConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.tooltipConfig = assign(this.schema.tooltipConfig, _!)), this)
      : this.schema.tooltipConfig;
  }

  /**
      Accessor function or string key for the total value displayed in the visualization.
*/
  total(
    _?: boolean | string | ((d: DataPoint, i: number) => number),
  ): this | boolean | string | ((d: DataPoint, i: number) => number) {
    if (arguments.length) {
      if (typeof _ === "function") this.schema.total = _;
      else if (_) this.schema.total = accessor(_ as string);
      else this.schema.total = false;
      return this;
    } else return this.schema.total;
  }

  /**
      Configuration object for the total bar.
*/
  totalConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.totalConfig = assign(this.schema.totalConfig, _!)), this)
      : this.schema.totalConfig;
  }

  /**
      Formatter function for the value in the total bar.
*/
  totalFormat(_?: (d: number) => string): this | ((d: number) => string) {
    return arguments.length
      ? ((this.schema.totalFormat = _), this)
      : this.schema.totalFormat;
  }

  /**
      Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  totalPadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this.schema.totalPadding = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.totalPadding;
  }

  // width(_?: number): installed by installFluent(this, vizSchema).
  // zoom(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      The pixel stroke-width of the zoom brush area.
*/
  zoomBrushHandleSize(_?: number): this | number {
    return arguments.length
      ? ((this.schema.zoomBrushHandleSize = _), this)
      : this.schema.zoomBrushHandleSize;
  }

  /**
      An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.
*/
  zoomBrushHandleStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomBrushHandleStyle = _), this)
      : this.schema.zoomBrushHandleStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.
*/
  zoomBrushSelectionStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomBrushSelectionStyle = _), this)
      : this.schema.zoomBrushSelectionStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyle = _), this)
      : this.schema.zoomControlStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyleActive = _), this)
      : this.schema.zoomControlStyleActive;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyleHover(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyleHover = _), this)
      : this.schema.zoomControlStyleHover;
  }

  // zoomFactor(_?: number): installed by installFluent(this, vizSchema).
  // zoomMax(_?: number): installed by installFluent(this, vizSchema).
  // zoomPan(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      A pixel value to be used to pad all sides of a zoomed area.
*/
  zoomPadding(_?: number): this | number {
    return arguments.length
      ? ((this.schema.zoomPadding = _), this)
      : this.schema.zoomPadding;
  }

  // zoomScroll(_?: boolean): installed by installFluent(this, vizSchema).
}
