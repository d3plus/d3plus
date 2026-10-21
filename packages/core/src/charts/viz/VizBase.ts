import {select} from "d3-selection";

import {unique} from "@d3plus/data";
import {date} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {accessor, constant} from "../../utils/index.js";
import type {D3plusConfig} from "../../utils/index.js";
import type {SizeLegendScale, SizeLegendSize} from "../../components/SizeLegend/sizeLegendLayout.js";
import validateShapeConfig from "../../shapes/validateShapeConfig.js";
import VizBaseConfig from "./VizBaseConfig.js";
import {isPlainObject, mergeConfigBag, resolvesReset} from "../../fluent.js";

/**
    Second half of the fluent config accessors shared by every Viz chart
    (`loadingHTML` through `tableViewPageSize`), extending `VizBaseConfig` which
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
      Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.
*/
  messageStyle(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.messageStyle = mergeConfigBag(this, "messageStyle", _)), this)
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
  shapeConfig(): D3plusConfig;
  shapeConfig(_: D3plusConfig): this;
  shapeConfig(_?: D3plusConfig): this | D3plusConfig {
    if (!arguments.length) return this.schema.shapeConfig;
    if (isPlainObject(_)) validateShapeConfig(this.constructor.name, _);
    this.schema.shapeConfig = mergeConfigBag(this, "shapeConfig", _);
    return this;
  }

  /**
      Whether to display the size legend: a nested-circle key, in the chart's bottom-right corner, for charts that size their marks with a `size` accessor (bubble plots, Geomap points via `pointSize`, Network, Rings). By default it shows whenever marks are sized by more than one value, unless it would take up more than a third of the chart's width or height. Pass `true` to always show it, `false` to hide it, or a function that receives the resolved chart config, the radius scale, and the legend's measured `{width, height, availableWidth, availableHeight}`, and returns a boolean.
*/
  sizeLegend(
    _?:
      | boolean
      | ((config: Record<string, unknown>, scale: SizeLegendScale, size: SizeLegendSize) => boolean),
  ):
    | this
    | boolean
    | ((config: Record<string, unknown>, scale: SizeLegendScale, size: SizeLegendSize) => boolean) {
    return arguments.length
      ? ((this.schema.sizeLegend = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.sizeLegend;
  }

  /**
      Configuration object passed to the size legend's config method: `values` (an array of values to draw, or how many to pick), `tickFormat`, `title` (defaults to the `size` key when `size` is set to a string), `shapeConfig`, `lineConfig`, `labelConfig`, `titleConfig`, `padding`, `lineLength`, and `labelPadding`.
*/
  sizeLegendConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.sizeLegendConfig = mergeConfigBag(this, "sizeLegendConfig", _)), this)
      : this.schema.sizeLegendConfig;
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
      ? ((this.schema.subtitleConfig = mergeConfigBag(this, "subtitleConfig", _)), this)
      : this.schema.subtitleConfig;
  }

  /**
      Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  subtitlePadding(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.subtitlePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.subtitlePadding;
  }

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

  /**
      Configuration object for the timeline.
*/
  timelineConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.timelineConfig = mergeConfigBag(this, "timelineConfig", _)), this)
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
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
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
      ? ((this.schema.titleConfig = mergeConfigBag(this, "titleConfig", _)), this)
      : this.schema.titleConfig;
  }

  /**
      Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  titlePadding(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
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
      ? ((this.schema.tooltipConfig = mergeConfigBag(this, "tooltipConfig", _)), this)
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
      ? ((this.schema.totalConfig = mergeConfigBag(this, "totalConfig", _)), this)
      : this.schema.totalConfig;
  }

  /**
      Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  totalPadding(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.totalPadding = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.totalPadding;
  }

}

resolvesReset(
  VizBase.prototype,
  "messageStyle",
  "shapeConfig",
  "sizeLegendConfig",
  "subtitleConfig",
  "timelineConfig",
  "titleConfig",
  "tooltipConfig",
  "totalConfig",
);
