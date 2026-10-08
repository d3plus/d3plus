import {merge as arrayMerge} from "d3-array";

import {addToQueue, unique} from "@d3plus/data";
import {assign} from "@d3plus/dom";
import {fontFamilyStringify} from "@d3plus/text";
import type {DataPoint} from "@d3plus/data";

import {accessor, BaseClass, constant} from "../../utils/index.js";
import {broadcastLink} from "./linkGroup.js";
import type {VizInstance} from "./vizTypes.js";
import type VizBase from "./VizBase.js";

/**
    First half of the fluent config accessors shared by every Viz chart
    (`active` through `legendTooltip`). Split from `VizBase` purely so each
    file stays under the `max-lines` budget; the methods remain real prototype
    methods, so `BaseClass.config()` reflection and polymorphic `this` chaining
    are unchanged.
*/
export default class VizBaseConfig extends BaseClass {
  // installFluent generates the config accessors (data, sum, x, …) and the
  // pipeline stamps derived `_`-prefixed state at runtime; the index signature
  // lets the chart code reach both through the type (same rationale as the
  // shape/component classes).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      The active callback function for highlighting shapes.
*/
  active(
    _?: ((d: DataPoint, i: number) => boolean) | false,
  ): this | ((d: DataPoint, i: number) => boolean) | false {
    this._active = _;

    if (this.schema.shapeConfig.activeOpacity !== 1) {
      this._shapes.forEach((s: {active: (...args: unknown[]) => unknown}) => s.active(_));
      if (this.schema.legend) this._legendClass.active(_);
      // See hover(): scene-rendered charts dim via the scene's
      // interaction-opacity pass, so repaint to apply/clear active state.
      if (this._sceneRenderer) this._scheduleSceneRepaint();
    }

    broadcastLink(this as unknown as VizInstance, "active", _);
    return this;
  }

  /**
      Custom aggregation methods for each data key.
*/
  aggs(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.aggs = assign(this.schema.aggs, _!)), this)
      : this.schema.aggs;
  }

  /**
      Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).
*/
  attribution(_?: string | boolean): this | string | boolean {
    return arguments.length
      ? ((this.schema.attribution = _), this)
      : this.schema.attribution;
  }

  /**
      Overrides the "ⓘ" icon a long attribution collapses to (see `attribution`), which otherwise renders as an inline SVG. Accepts an HTML string — used as the toggle button's content — or a mount function, `(el: HTMLElement) => void | (() => void)`, called once with the button's reserved icon slot so a live component (a React tree via `createRoot(el).render(...)`, or anything else imperative) can be mounted into it. A returned cleanup function runs right before that slot is discarded, which happens whenever the credit's markup regenerates (its text or theme changes), not just once per chart.
*/
  attributionIcon(
    _?: string | ((el: HTMLElement) => void | (() => void)),
  ): this | string | ((el: HTMLElement) => void | (() => void)) | undefined {
    return arguments.length
      ? ((this.schema.attributionIcon = _), this)
      : (this.schema.attributionIcon as
          | string
          | ((el: HTMLElement) => void | (() => void))
          | undefined);
  }

  /**
      Configuration object for the attribution style.
*/
  attributionStyle(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.attributionStyle = assign(this.schema.attributionStyle, _!)), this)
      : this.schema.attributionStyle;
  }

  /**
      Configuration object for the back button. Superseded by
      `.backControlStyle()`/`.backControlClassName()` for the button's
      appearance (it renders as a real `<button>`, like the zoom/search
      controls, not a configurable text node) — kept for backwards
      compatibility, but no longer affects how the button looks.
*/
  backConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.backConfig = assign(this.schema.backConfig, _!)), this)
      : this.schema.backConfig;
  }

  /**
      An additional CSS class name (or space-separated list of class names) applied to the back button, alongside its fixed `back-control` class. Setting this automatically disables d3plus's built-in inline `backControlStyle` default (as long as you haven't already customized it yourself), so a host page's own button styling — Tailwind, Bootstrap, a design system — applies through the cascade with no other configuration needed.
*/
  backControlClassName(_?: string): this | string {
    return arguments.length
      ? ((this.schema.backControlClassName = _), this)
      : this.schema.backControlClassName;
  }

  /**
      An object containing CSS key/value pairs that is used to style the back button. Passing `false` will remove all default styling. Automatically skipped (as if `false`) once `.backControlClassName(...)` is set, unless you've explicitly customized this yourself.
*/
  backControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this.schema.backControlStyle = _), this)
      : this.schema.backControlStyle;
  }

  /**
      Defines the main color to be used for each data point in a visualization. Can be either an accessor function or a string key to reference in each data point. If a color value is returned, it will be used as is. If a string is returned, a unique color will be assigned based on the string.
*/
  color(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | false,
  ):
    | this
    | string
    | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    | false {
    return arguments.length
      ? ((this.schema.color = !_ || typeof _ === "function" ? _ : accessor(_)), this)
      : this.schema.color;
  }

  /**
      Defines the value to be used for a color scale. Can be either an accessor function or a string key to reference in each data point.
*/
  colorScale(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | false,
  ):
    | this
    | string
    | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
    | false {
    return arguments.length
      ? ((this.schema.colorScale = !_ || typeof _ === "function" ? _ : accessor(_)),
        this)
      : this.schema.colorScale;
  }

  /**
      A pass-through to the config method of ColorScale.
*/
  colorScaleConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.colorScaleConfig = assign(this.schema.colorScaleConfig, _!)), this)
      : this.schema.colorScaleConfig;
  }

  /**
      Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  colorScalePadding(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.colorScalePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.colorScalePadding;
  }

  /**
      Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.
*/
  colorScalePosition(
    _?: string | boolean | (() => string | boolean),
  ): this | string | boolean | (() => string | boolean) {
    return arguments.length
      ? ((this.schema.colorScalePosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.colorScalePosition;
  }

  /**
      The maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.
*/
  colorScaleMaxSize(_?: number): this | number {
    return arguments.length
      ? ((this.schema.colorScaleMaxSize = _), this)
      : this.schema.colorScaleMaxSize;
  }

  /**
      The primary data array used to draw the visualization. The value passed should be an *Array* of objects or a *String* representing a filepath or URL to be loaded. The following filetypes are supported: `csv`, `tsv`, `txt`, and `json`.

If your data URL needs specific headers to be set, an Object with "url" and "headers" keys may also be passed.

Additionally, a custom formatting function can be passed as a second argument to this method. This custom function will be passed the data that has been loaded, as long as there are no errors. This function should return the final array of obejcts to be used as the primary data array. For example, some JSON APIs return the headers split from the data values to save bandwidth. These would need be joined using a custom formatter.

If you would like to specify certain configuration options based on the yet-to-be-loaded data, you can also return a full `config` object from the data formatter (including the new `data` array as a key in the object).

Defaults to an empty array (`[]`).
    @param f The data array or a URL string to load data from.
  */
  data(
    _?: DataPoint[] | string | {url: string; headers: Record<string, string>},
    f?: (data: DataPoint[]) => DataPoint[] | Record<string, unknown>,
  ): this | DataPoint[] {
    if (arguments.length) {
      addToQueue.bind(this as unknown as ThisParameterType<typeof addToQueue>)(
        _!,
        f,
        "data",
      );
      this._hidden = [];
      this._solo = [];
      if (
        this._userData &&
        JSON.stringify(_) !== JSON.stringify(this._userData)
      ) {
        this.schema.timeFilter = false;
        this._timelineSelection = false;
      }
      this._userData = _;
      return this;
    }
    return this._data;
  }

  /**
      If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.
*/
  detectResize(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.detectResize = _), this)
      : this.schema.detectResize;
  }

  /**
      When resizing the browser window, this is the millisecond delay to trigger the resize event.
*/
  detectResizeDelay(_?: number): this | number {
    return arguments.length
      ? ((this.schema.detectResizeDelay = _), this)
      : this.schema.detectResizeDelay;
  }

  /**
      Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.
*/
  detectVisible(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.detectVisible = _), this)
      : this.schema.detectVisible;
  }

  /**
      The interval, in milliseconds, for checking if the visualization is visible on the page. When `detectVisible` defers a render until the visualization scrolls into view, this is also how long it must stay in view before it renders, so visualizations scrolled past quickly are never drawn.
*/
  detectVisibleInterval(_?: number): this | number {
    return arguments.length
      ? ((this.schema.detectVisibleInterval = _), this)
      : this.schema.detectVisibleInterval;
  }

  /**
      When `true` (the default) and `detectVisible` is enabled, the Viz releases its DOM and scene while it is scrolled out of view and redraws when it returns, keeping the page light when there are many visualizations. Data and configuration are retained; interaction state such as zoom or selection is not, so set this to `false` to keep it. With `detectVisible` enabled, each chart's `<svg>` is also given `content-visibility: auto`, so the browser skips rendering its contents while it is far off-screen (this matters most when this is `false` and charts are kept). For a larger saving you can also apply `content-visibility: auto` and a `contain-intrinsic-size` to the container element yourself; that adds paint containment to an element you own, so it is not done automatically. Requires `IntersectionObserver`.
*/
  detectVisibleUnload(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.detectVisibleUnload = _), this)
      : this.schema.detectVisibleUnload;
  }

  /**
      The font family used throughout the visualization.
*/
  fontFamily(_?: string | string[]): this | string | string[] {
    if (arguments.length) {
      const labelConfig = {fontFamily: _};

      const axisConfig = {titleConfig: labelConfig, shapeConfig: {labelConfig}};

      this.shapeConfig({labelConfig});
      this.colorScaleConfig({axisConfig});

      ["axis", "column", "row", "timeline", "x", "y", "x2", "y2"].forEach(
        (axis: string) => {
          const method = `${axis}Config`;
          if (this[method]) this[method](axisConfig);
        },
      );
      ["back", "title", "total", "subtitle"].forEach((label: string) => {
        const method = `${label}Config`;
        if (this[method]) this[method](labelConfig);
      });

      this.tooltipConfig({
        tooltipStyle: {"font-family": fontFamilyStringify(_!)},
      });

      this.schema.fontFamily = _;
      return this;
    }
    return this.schema.fontFamily;
  }

  /**
      Defines the mapping between data and shape. The value can be a String matching a key in each data point (default is "id"), or an accessor Function that returns a unique value for each data point. Additionally, an Array of these values may be provided if the visualization supports nested hierarchies.
*/
  groupBy(
    _?:
      | string
      | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])
      | (string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]))[],
  ): this | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint])[] {
    if (!arguments.length) return this.schema.groupBy;
    this._groupByRaw = _;
    const arr: (string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]))[] =
      _ instanceof Array ? _ : [_!];
    return (
      (this.schema.groupBy = arr.map(
        (
          k: string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]),
        ) => {
          if (typeof k === "function") return k;
          else {
            if (!this.schema.aggs[k]) {
              this.schema.aggs[k] = (
                a: DataPoint[],
                c: (d: DataPoint) => DataPoint[keyof DataPoint],
              ) => {
                const v = unique(a.map(c));
                return v.length === 1 ? v[0] : v;
              };
            }
            return accessor(k);
          }
        },
      )),
      this
    );
  }

  /**
      Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).
*/
  hiddenColor(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this.schema.hiddenColor = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.hiddenColor;
  }

  /**
      Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).
*/
  hiddenOpacity(
    _?: number | ((d: DataPoint, i: number) => number),
  ): this | number | ((d: DataPoint, i: number) => number) {
    return arguments.length
      ? ((this.schema.hiddenOpacity = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.hiddenOpacity;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_?: ((d: DataPoint, i: number) => boolean) | false): this {
    let hoverFunction = (this._hover = _);

    if (this.schema.shapeConfig.hoverOpacity !== 1 && _ !== undefined) {
      if (typeof _ === "function") {
        let shapeData = arrayMerge(
          this._shapes.map((s: {data: () => DataPoint[]}) => s.data()),
        );
        shapeData = shapeData.concat(this._legendClass.data());
        const activeData = _ ? (shapeData as DataPoint[]).filter(_ as (d: DataPoint) => boolean) : [];

        // Build a Set<string> of activeIds for O(1) membership lookup.
        // Previously `activeIds.filter((id, i) => activeIds.indexOf(id) === i)`
        // was O(N²) dedup, and the hover predicate did `activeIds.includes(...)`
        // — also O(N) per datum per repaint. With ~5k segments, hover
        // dispatch was ~250 ms on a 2023 laptop; Set drops it to <5 ms.
        const activeIds = new Set<string>();
        (activeData.map(this._ids) as string[][]).forEach((ids: string[]) => {
          for (let x = 1; x <= ids.length; x++) {
            activeIds.add(JSON.stringify(ids.slice(0, x)));
          }
        });

        if (activeIds.size)
          hoverFunction = (d: DataPoint, i: number) =>
            activeIds.has(JSON.stringify(this._ids(d, i)));
      }

      this._shapes.forEach((s: {hover: (...args: unknown[]) => unknown}) => s.hover(hoverFunction));
      if (this.schema.legend) this._legendClass.hover(hoverFunction);
    }

    // Scene-rendered charts emit into `_chartScene` (not `_shapes`), so the
    // forEach above is a no-op for them. Repaint so the scene's
    // interaction-opacity pass re-reads `_hover` and dims the non-matching
    // nodes (or restores them when `_` is `false`). Also repaint for a
    // colorScale-bucket hover even when per-shape dimming is off
    // (`hoverOpacity: 1`, e.g. Geomap): the bucket highlight is applied by that
    // same pass, so without a repaint the map would never re-compose. Coalesced
    // to one paint per frame so a fast pointer sweep doesn't saturate the main
    // thread.
    if (
      this._sceneRenderer &&
      _ !== undefined &&
      (this.schema.shapeConfig.hoverOpacity !== 1 || this._hoverBucket)
    )
      this._scheduleSceneRepaint();

    broadcastLink(this as unknown as VizInstance, "hover", _);
    return this;
  }

  /**
      Persistently emphasizes the data points matching the given predicate: the
      matching marks keep their color while every other mark is de-emphasized to
      a neutral gray (the "emphasis" form — highlight one series, gray the rest).
      Unlike `hover`/`active` (transient, opacity-based), `highlight` is a
      standing state that survives pointer movement. Pass `false` to clear it.
*/
  highlight(
    _?: ((d: DataPoint, i: number) => boolean) | false,
  ): this | ((d: DataPoint, i: number) => boolean) | false | undefined {
    if (!arguments.length) return this._highlight;
    this._highlight = _;
    // Scene-rendered charts express de-emphasis via the scene's
    // interaction-opacity pass, so repaint to apply/clear the gray treatment.
    if (this._sceneRenderer) this._scheduleSceneRepaint();
    broadcastLink(this as unknown as VizInstance, "highlight", _);
    return this;
  }

  /**
      Accessor function, or a constant string applied to every data point's
      label (unlike `value`/`nodeId`/etc., a string here is not treated as a
      per-datum object key — pass a function for that).
*/
  label(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this.schema.label = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.label;
  }

  /**
      Whether to display the legend.
*/
  legend(
    _?:
      | boolean
      | ((config: Record<string, unknown>, arr: DataPoint[]) => boolean),
  ):
    | this
    | boolean
    | ((config: Record<string, unknown>, arr: DataPoint[]) => boolean) {
    return arguments.length
      ? ((this.schema.legend = typeof _ === "function" ? _ : constant(_)), this)
      : this.schema.legend;
  }

  /**
      Configuration object passed to the legend's config method.
*/
  legendConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.legendConfig = assign(this.schema.legendConfig, _!)), this)
      : this.schema.legendConfig;
  }

  /**
      Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.
*/
  legendFilterInvert(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.legendFilterInvert = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.legendFilterInvert;
  }

  /**
      Whether the chart may draw one of its legends inside the empty space around its marks instead of in a margin, for charts that leave room (Plot, Network, Pack, Pie, Rings, Tree, and Geomap). After the chart lays out, the size legend is tried first, then the legend, then the colorScale; the first that fits is drawn over a semi-transparent box (see `legendInsetConfig`), and any others keep their margins. Space enclosed by the marks, like the middle of a ring of points, is never used. A legend or colorScale whose position was set explicitly stays in that margin. Defaults to `true`; also accepts a function that receives the resolved chart config and returns a boolean.
*/
  legendInset(
    _?: boolean | ((config: Record<string, unknown>) => boolean),
  ): this | boolean | ((config: Record<string, unknown>) => boolean) {
    return arguments.length
      ? ((this.schema.legendInset = _), this)
      : this.schema.legendInset;
  }

  /**
      Style of the box drawn behind a legend placed inside the chart (see `legendInset`): `fill` (defaults to the chart's background color), `fillOpacity` (0.85), `stroke` (defaults to a faint contrasting line), `strokeWidth` (1), `rx` (corner radius, 4), `margin` (space between the box's edge and the legend, 6), and `padding` (space kept between the box and the chart's marks and edges, 10).
*/
  legendInsetConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.legendInsetConfig = assign(this.schema.legendInsetConfig, _!)), this)
      : this.schema.legendInsetConfig;
  }

  /**
      Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  legendPadding(
    _?: boolean | ((viz: VizBase) => boolean),
  ): this | boolean | ((viz: VizBase) => boolean) {
    return arguments.length
      ? ((this.schema.legendPadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.legendPadding;
  }

  /**
      Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.
*/
  legendPosition(_?: string | (() => string)): this | string | (() => string) {
    return arguments.length
      ? ((this.schema.legendPosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.legendPosition;
  }

  /**
      Configuration object for the legend tooltip.
*/
  legendTooltip(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.legendTooltip = assign({}, this.schema.legendTooltip, _!)), this)
      : this.schema.legendTooltip;
  }
}
