import {select} from "d3-selection";

import {unique} from "@d3plus/data";
import {date} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";

import {accessor, constant} from "../../utils/index.js";
import type {D3plusConfig} from "../../utils/index.js";
import type {ZoomControlIcons} from "../drawSteps/zoomControlsMarkup.js";
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
      ? ((this.schema.messageStyle = mergeConfigBag(this, "messageStyle", _)), this)
      : this.schema.messageStyle;
  }

  /**
      An additional CSS class name (or space-separated list of class names) applied to the minimap's outer box, viewport box, and zoom-level label, alongside their fixed `d3plus-minimap` / `d3plus-minimap-viewport` / `d3plus-minimap-label` classes. Setting this automatically disables d3plus's built-in inline `minimapStyle`/`minimapViewportStyle`/`minimapViewportStyleActive`/`minimapLabelStyle` defaults (as long as you haven't already customized them yourself), so a host page's own styling applies through the cascade with no other configuration needed.
*/
  minimapClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.minimapClassName = _), this)
      : this.schema.minimapClassName;
  }

  /**
      An object containing CSS key/value pairs that is used to style the minimap's zoom-level text label (e.g. "2x"). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  minimapLabelStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.minimapLabelStyle = _), this)
      : this.schema.minimapLabelStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the minimap's outer box (the full-scene overview). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  minimapStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.minimapStyle = _), this)
      : this.schema.minimapStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box in its resting state. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  minimapViewportStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.minimapViewportStyle = _), this)
      : this.schema.minimapViewportStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the minimap's draggable viewport box while it's being dragged. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.minimapClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  minimapViewportStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.minimapViewportStyleActive = _), this)
      : this.schema.minimapViewportStyleActive;
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
      Resolves the string the search box matches its typed term against, for
      a given datum. Defaults to the mark's resolved on-screen label
      (`viz._drawLabel`) — the same text the user reads on the chart.
      Override it to match against something else instead, e.g. a data
      field that isn't shown as the label.

      This is checked alongside, not instead of, every level of the datum's
      own groupBy hierarchy — searching a leaf's label also matches its
      ancestor group's cell/legend entry, and vice versa, regardless of
      this accessor's override.
*/
  searchAccessor(
    _?: (d: DataPoint, i: number) => string,
  ): this | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this.schema.searchAccessor = _), this)
      : this.schema.searchAccessor;
  }

  /**
      An additional CSS class name (or space-separated list of class names) applied to the search toggle button and input, alongside their fixed `search-control` classes. Setting this automatically disables d3plus's built-in inline `searchControlStyle`/`searchControlStyleActive`/`searchControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
*/
  searchControlClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.searchControlClassName = _), this)
      : this.schema.searchControlClassName;
  }

  /**
      An object containing CSS key/value pairs that is used to style the search toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  searchControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.searchControlStyle = _), this)
      : this.schema.searchControlStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the search toggle button while open. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  searchControlStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.searchControlStyleActive = _), this)
      : this.schema.searchControlStyleActive;
  }

  /**
      An object containing CSS key/value pairs that is used to style the search toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.searchControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  searchControlStyleHover(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.searchControlStyleHover = _), this)
      : this.schema.searchControlStyleHover;
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
      Which margin the size legend claims in the chart's bottom-right corner. `"right"` (the default) widens the right margin, so the chart keeps its full height and the legend sits at the bottom of the right column, below any right-side legend or colorScale. `"bottom"` deepens the bottom margin instead, so the chart keeps its full width and any bottom legend or colorScale narrows to sit beside it.
*/
  sizeLegendPosition(_?: "right" | "bottom"): this | "right" | "bottom" {
    return arguments.length
      ? ((this.schema.sizeLegendPosition = _), this)
      : this.schema.sizeLegendPosition;
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
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.totalPadding = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.totalPadding;
  }

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
      An additional CSS class name (or space-separated list of class names) applied to each zoom control button, alongside the fixed `zoom-control` / `zoom-in` / `zoom-out` / `zoom-reset` / `zoom-brush` classes. Setting this automatically disables d3plus's built-in inline `zoomControlStyle`/`zoomControlStyleActive`/`zoomControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
*/
  zoomControlClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.zoomControlClassName = _), this)
      : this.schema.zoomControlClassName;
  }

  /**
      Overrides one or more of the four built-in zoom-control icons (`zoomIn`, `zoomOut`, `zoomReset`, `zoomBrush`), which otherwise render as inline SVGs. Each value is either an HTML string — used as the button's content in place of the built-in icon — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot (a 12x12px element) so you can mount anything imperative into it: a React tree (`createRoot(el).render(<Icon/>)`), a Vue app, a canvas sprite, a brand `<img>`. Return a cleanup function from the mount function if there's teardown to do; it runs right before that slot is discarded — which happens whenever the whole button panel's markup regenerates (a `.locale(...)` change, a `zoomControlClassName` change, or the brush toggle switching), not just once per chart.
*/
  zoomControlIcons(
    _?: ZoomControlIcons,
  ): this | ZoomControlIcons | undefined {
    return arguments.length
      ? ((this.schema.zoomControlIcons = _), this)
      : (this.schema.zoomControlIcons as ZoomControlIcons | undefined);
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  zoomControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyle = _), this)
      : this.schema.zoomControlStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  zoomControlStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyleActive = _), this)
      : this.schema.zoomControlStyleActive;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.zoomControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  zoomControlStyleHover(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.zoomControlStyleHover = _), this)
      : this.schema.zoomControlStyleHover;
  }

  /**
      A pixel value to be used to pad all sides of a zoomed area.
*/
  zoomPadding(_?: number): this | number {
    return arguments.length
      ? ((this.schema.zoomPadding = _), this)
      : this.schema.zoomPadding;
  }

  /**
      An additional CSS class name (or space-separated list of class names) applied to the `<table>` element the table-view toggle renders, alongside the fixed `d3plus-table-view-table` class. Lets a host page style the data table with its own table styling (Tailwind, Bootstrap, a design system) via descendant selectors.
*/
  tableViewClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.tableViewClassName = _), this)
      : this.schema.tableViewClassName;
  }

  /**
      An additional CSS class name (or space-separated list of class names) applied to the table-view toggle button, alongside the fixed `table-view-control`/`table-view-toggle` classes. Setting this automatically disables d3plus's built-in inline `tableViewControlStyle`/`tableViewControlStyleActive`/`tableViewControlStyleHover` defaults (as long as you haven't already customized them yourself), so a host page's own button styling applies through the cascade with no other configuration needed.
*/
  tableViewControlClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.tableViewControlClassName = _), this)
      : this.schema.tableViewControlClassName;
  }

  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  tableViewControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.tableViewControlStyle = _), this)
      : this.schema.tableViewControlStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button while it is active (showing the data table). Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  tableViewControlStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.tableViewControlStyleActive = _), this)
      : this.schema.tableViewControlStyleActive;
  }

  /**
      An object containing CSS key/value pairs that is used to style the table-view toggle button on hover. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.tableViewControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  tableViewControlStyleHover(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.tableViewControlStyleHover = _), this)
      : this.schema.tableViewControlStyleHover;
  }

  /**
      The number of data-table rows shown per page while in table view. Set to `false` (or any non-positive number) to disable pagination and show every row on one page.
*/
  tableViewPageSize(_?: number | false): this | number | false {
    return arguments.length
      ? ((this.schema.tableViewPageSize = _), this)
      : this.schema.tableViewPageSize;
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
