/* eslint no-cond-assign: 0*/

import {zoomTransform} from "d3-zoom";

import {assign} from "@d3plus/dom";

import {constant} from "../../utils/index.js";
import {fieldAccessor} from "../../utils/fieldAccessor.js";
import {installFluent, mergeConfigBag, resolvesReset} from "../../fluent.js";
import {baselineValue, setBaseline} from "./baselineDomain.js";
import {initPlotAxes, initPlotDefaults, plotSchema} from "./plotInit.js";

import {plotDef, plotSizeLegendScale} from "./pipeline.js";
import {drawPlot} from "./draw.js";
import {
  resolveStackOffset,
  resolveStackOrder,
  type StackOffsetFn,
  type StackOrderFn,
  type StackOrderInput,
} from "./stackHelpers.js";
import type {PlotPaintContext} from "../features/plotPaint.js";
import {paintZoomablePlot, zoomPlot, type ZoomState} from "./plotZoom.js";
import {validateConfidenceConfig} from "./confidenceConfig.js";
import {
  resolveConfidenceBands,
  type ConfidenceBand,
} from "./confidenceBands.js";
import {trendLineDefaults, type TrendLineType} from "./trendLines.js";
import {contentPoint, handleSharedHover} from "./sharedHover.js";
import {handleAxisHover} from "./axisHover.js";
import {appendSharedHoverNodes} from "./sharedHoverScene.js";
import Viz from "../viz/Viz.js";
import {plotInsetRegion} from "./insetRegion.js";
import {plotFacetHooks} from "./plotFacet.js";
import {
  plotStackThreshold,
  plotStackThresholdLegend,
} from "./stackThreshold.js";

import type {
  InteractionPoint,
  PickResult,
  Scene,
  SceneEvent,
  SceneNode,
} from "@d3plus/render";
import type {DataPoint} from "@d3plus/data";
import type {VizInstance} from "../viz/vizTypes.js";

/** Accessor function or string key for a plotted value. */
type PlotAccessor = (d: DataPoint, i: number) => number | Date | string;
/** Function-or-string-key value accepted by accessor setters. */
type PlotAccessorArg = string | PlotAccessor;

import {defaultBuffers} from "../plotBuffers/defaultBuffers.js";

/** A y-axis config patch with its `domain` array reversed (y scales run top-down). */
function reverseDomain(patch: unknown): unknown {
  const domain = (patch as {domain?: unknown} | undefined)?.domain;
  return Array.isArray(domain)
    ? {...(patch as object), domain: domain.slice().reverse()}
    : patch;
}

/**
    Creates an x/y plot based on an array of data.
*/
export default class Plot extends Viz {
  _trendLine: TrendLineType = plotDef.defaults!.trendLine as TrendLineType;
  _trendLineConfig: Record<string, unknown> = trendLineDefaults();

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    // E4: install identity-coerce accessors on Plot.prototype. Defaults
    // are applied after it from plotDef; installFluent skips slots that
    // are already set, so the constructor wins.
    installFluent(this, plotSchema);
    initPlotDefaults(this);
    initPlotAxes(this);
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
        if (!this.schema.aggs[str] && this.schema.discrete === k) {
          this.schema.aggs[str] = (
            a: DataPoint[],
            c: (d: DataPoint) => unknown,
          ) => {
            const v = Array.from(new Set(a.map(c)));
            return v.length === 1 ? v[0] : v;
          };
        }

        // set axis title if not discrete
        if (
          str !== k &&
          this[`_${k}Title`] === this[`_${k}Config`].title &&
          this.schema.discrete !== k
        ) {
          this[`_${k}Title`] = str;
          this[`_${k}Config`].title = str;
        }
      }
    });

    super._preDraw();
  }

  /**
      The legend rows with a stacked chart's threshold bucket folded into
      one entry (see `stackThreshold.ts`).
      @private
*/
  _thresholdLegend(legendData: DataPoint[]): DataPoint[] {
    return plotStackThresholdLegend(this as unknown as VizInstance, legendData);
  }

  /**
      Folds a stacked chart's small series into one threshold bucket (see
      `stackThreshold.ts`).
      @private
*/
  _thresholdFunction(
    data: DataPoint[],
    _tree?: unknown,
    all?: DataPoint[],
  ): DataPoint[] {
    return plotStackThreshold(this as unknown as VizInstance, data, all);
  }

  /**
      Composes the chart's scene graph: the native shape scenes from Viz.toScene
      (bars/lines/areas + labels) plus snapshots of the rendered axes, so a Plot
      renders fully — geometry and axes — through the @d3plus/render backends.
*/
  toScene(): Scene {
    const scene = (Viz.prototype.toScene as () => Scene).call(this);
    // Skip the axis walk when an explicit empty-data render just
    // happened. Axes are constructor-allocated and never reset between
    // renders, so a previous-render's axis._select.node() still exists
    // after `.data([]).render()` — emitting its toScene snapshot
    // would leak stale tick marks + grid lines under the no-data
    // overlay. We test `length === 0` explicitly so test fixtures that
    // construct viz without ever calling .render() (and leave
    // _filteredData undefined) don't trip the early-return.
    if (
      Array.isArray(this._filteredData) &&
      this._filteredData.length === 0 &&
      (!this._annotations || this._annotations.length === 0)
    )
      return scene;
    const axisNodes: SceneNode[] = [];
    for (const name of ["_xAxis", "_x2Axis", "_yAxis", "_y2Axis"]) {
      const axis = this[name];
      if (
        axis &&
        typeof axis.toScene === "function" &&
        axis._select &&
        typeof axis._select.node === "function" &&
        axis._select.node()
      ) {
        // Wrap in a uniquely-keyed group so sibling axes never collide (axis
        // snapshots reuse a per-call key counter).
        axisNodes.push({
          type: "group",
          key: `plot-${name}`,
          children: [axis.toScene()],
        });
      }
    }
    // Axes are drawn behind the shapes.
    scene.root.children.unshift(...axisNodes);
    appendSharedHoverNodes(this as unknown as VizInstance, scene);
    return scene;
  }

  /**
      Wires user-registered `on()` event handlers onto a freshly-configured
      shape instance. Splits the registered events into three buckets:
      global (`"click"`), shape-scoped (`"click.shape"`), and
      shape-class-scoped (`"click.Bar"` etc.). All three forward into
      `this.schema.on[event](d.data, d.i, x, event)`. Extracted from
      Plot._paint so the chart-level event wiring is in one place.

      On the scene path (SvgRenderer/CanvasRenderer) these d3-selection
      bindings don't fire — compute-mode shapes mount no per-shape DOM.
      Pointer events are instead routed by `Viz._drawSceneToTarget`'s
      renderer bridge: it hit-tests via `Renderer.pick`, reads the picked
      node's stamped `shapeType`, and dispatches the matching global,
      `.shape`, and shape-class-scoped (`.Bar`) handlers — the same three
      buckets this method wires, so SVG and Canvas behave identically.
  */
  _wirePlotShapeEvents(
    shape: {on(event: string, handler: unknown): unknown},
    shapeKey: string,
    events: string[],
  ) {
    const classEvents = events.filter(e => e.includes(`.${shapeKey}`));
    const globalEvents = events.filter(e => !e.includes("."));
    const shapeEvents = events.filter(e => e.includes(".shape"));
    const forward =
      (evt: string) =>
      (
        d: {data: DataPoint; i: number},
        i: number,
        x: unknown,
        event: unknown,
      ) =>
        this.schema.on[evt](d.data, d.i, x, event);
    for (const evt of globalEvents) shape.on(evt, forward(evt));
    for (const evt of shapeEvents) shape.on(evt, forward(evt));
    for (const evt of classEvents) shape.on(evt, forward(evt));
  }

  /**
      For a multi-point shape (Line/Area) reports the point nearest the cursor
      along the discrete axis, so every mouse event (tooltip, click, user
      handlers) reflects the hovered x rather than the whole-series aggregate.
      Non-nested shapes and legend swatches fall through to the base (aggregate)
      behavior.
      @private
*/
  _interactionDatum(
    pick: PickResult,
    event: SceneEvent,
  ): {d: unknown; i: number; x: unknown} {
    const node = pick.node as SceneNode & {
      interactionPoints?: InteractionPoint[];
      interactionGroup?: string;
    };
    const points = node && node.interactionPoints;
    if (
      node &&
      node.interactionGroup !== "legend" &&
      Array.isArray(points) &&
      points.length &&
      event &&
      Array.isArray(event.point)
    ) {
      const nearest = this._nearestInteractionPoint(points, event.point);
      if (nearest) {
        const wrapped = nearest.datum as {data?: unknown; i?: number};
        return {
          d: wrapped && wrapped.data ? wrapped.data : wrapped,
          i: typeof wrapped.i === "number" ? wrapped.i : nearest.index,
          x: wrapped,
        };
      }
    }
    return super._interactionDatum(pick, event);
  }

  /**
      Picks the interaction point closest to a surface-local cursor position
      along the discrete axis. `event.point` is post-zoom surface space while the
      points are in chart content space (under the `viz-zoom` group and then
      the chart's own `viz-chart-body` transform), so the cursor is un-zoomed
      by `_zoomTransform` and offset by `_chartTransform` before comparing.
      @private
*/
  _nearestInteractionPoint(
    points: InteractionPoint[],
    point: [number, number],
  ): InteractionPoint | null {
    const [cx, cy] = contentPoint(this as unknown as VizInstance, point);
    const axis = this.schema.discrete === "y" ? "y" : "x";
    const target = axis === "y" ? cy : cx;
    let best: InteractionPoint | null = null;
    let bestDist = Infinity;
    for (const p of points) {
      const dist = Math.abs(p[axis] - target);
      if (dist < bestDist) {
        bestDist = dist;
        best = p;
      }
    }
    return best;
  }

  /**
      Drives the shared multi-series tooltip + crosshair: while the pointer is
      inside the plot area, snaps to the nearest discrete position and, when
      two or more series share it, shows them all in one tooltip (suppressing
      the single-shape tooltip). Clears on leaving the plot area or the chart.
      Then tracks the hovered point's axis guides and badges (`axisHover`).
      @private
*/
  _sharedHover(event: SceneEvent): void {
    handleSharedHover(this as unknown as VizInstance, event);
    handleAxisHover(this as unknown as VizInstance, event);
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    return drawPlot(this as unknown as VizInstance, callback);
  }

  /**
      Small multiples: shared domains, outer-edge axis labels, and the
      per-panel state the shared tooltip reads (see `Plot/plotFacet.ts`).
      @private
  */
  _facetHooks() {
    return plotFacetHooks;
  }

  /**
      The bubble radius scale, for the size legend (see `plotSizeLegendScale`).
      @private
  */
  _sizeLegendScale() {
    return plotSizeLegendScale(this as unknown as VizInstance);
  }

  /**
      The plot area, with the plotted marks as obstacles, for drawing a
      legend inside the plot's empty space (see `legendInset`).
      @private
  */
  _insetRegion() {
    return plotInsetRegion(this as unknown as VizInstance);
  }

  /**
      Paint phase: production axis rendering, shape buffer setup, and shape
      emission with event handlers. Receives all cross-phase locals from
      _draw via `pCtx` (so this method has zero coupling to _draw's local
      scope beyond the explicit context).
  */
  _paint(pCtx: PlotPaintContext) {
    // plotPaint builds the chart scene as a fresh array from the paint
    // context (data, scales, axis measurements) — emission is a pure
    // function of its inputs. `super._draw` resets `_chartScene` to []
    // before the paint phase, so the emit output IS the scene. Viz.toScene
    // wraps the collection in viz-chart-cells + zoom transform.
    const viz = this as unknown as VizInstance;
    const target = viz._zoomEventTarget || viz._container;
    this._chartScene = paintZoomablePlot(
      viz,
      pCtx,
      target && target.node() ? zoomTransform(target.node()) : undefined,
    );
    return this;
  }

  /**
      Zooms by rescaling the plot's linear and time axes instead of scaling the
      rendered picture (see `Plot/plotZoom.ts`). Returns false when no axis
      is linear or time, so the plot falls back to picture zoom.
      @private
*/
  _zoomRescale(t: ZoomState, duration = 0): boolean {
    // Small multiples zoom as one picture: there's no single set of axes to rescale.
    if (this._facetPanels) return false;
    const nodes = zoomPlot(this as unknown as VizInstance, t, duration);
    if (!nodes) return false;
    this._chartScene = nodes;
    return true;
  }

  /**
      Allows drawing custom shapes to be used as annotations in the provided x/y plot. This method accepts custom config objects for the [Shape](http://d3plus.org/docs/#Shape) class, either a single config object or an array of config objects. Each config object requires an additional parameter, the "shape", which denotes which [Shape](http://d3plus.org/docs/#Shape) sub-class to use ([Rect](http://d3plus.org/docs/#Rect), [Line](http://d3plus.org/docs/#Line), etc).

Additionally, each config object can also contain an optional "layer" key, which defines whether the annotations will be displayed in "front" or in "back" of the primary visualization shapes. This value defaults to "back" if not present.
*/
  annotations(_?: unknown): this | unknown[] {
    return arguments.length
      ? ((this._annotations = _ instanceof Array ? _ : [_]), this)
      : this._annotations;
  }

  /**
      Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).
*/
  axisPersist(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._axisPersist = _), this)
      : this._axisPersist;
  }

  /**
      Starts the value axis (the x axis for horizontal charts) at a value: `baseline(n)` renders exactly like `yDomain([n])` (or `xDomain([n])`). Bars, areas, and stems still grow from the chart's own `0` in the Plots that draw from one (such as BarChart, AreaPlot, Histogram, and Lollipop), so with `baselineBreak` on (their default) the axis breaks back to a `0` tick and bars run through the break, with its gap cut across them, and with it off the axis stretches down to `0`. As with `yDomain([n])`, only `n` is pinned: the far end comes from the data and is rounded where the axis would round it with no domain set (left at the data when the axis config's `rounding` is "none"), and marks for values past `n` stop at the axis's edge. When every value sits at or below `n`, it ends the axis instead, like `yDomain([undefined, n])`. A bound given in `yDomain`/`xDomain` wins. Returns the chart's own baseline when none is set.
*/
  baseline(_?: number): this | number | undefined {
    return arguments.length
      ? (setBaseline(this as unknown as VizInstance, _), this)
      : baselineValue(this as unknown as VizInstance);
  }

  /**
       A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).
*/
  backgroundConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this._backgroundConfig = mergeConfigBag(
          this,
          "backgroundConfig",
          _,
          this._backgroundConfig,
        )),
        this)
      : this._backgroundConfig;
  }

  /**
      Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).
*/
  buffer(
    _?: boolean | Record<string, boolean>,
  ): this | Record<string, unknown> {
    if (arguments.length) {
      if (!_) this._buffer = {};
      else if (_ === true) this._buffer = defaultBuffers;
      else {
        this._buffer = assign({}, this._buffer, _);
        for (const key in this._buffer) {
          const buf = this._buffer as Record<string, unknown>;
          if (buf[key] === true)
            buf[key] = (defaultBuffers as Record<string, unknown>)[key];
        }
      }
      return this;
    }
    return this._buffer;
  }

  /**
       The confidence interval as an array of [lower, upper] bounds. Lines draw it as a shaded band; bars draw an error bar per bar, from the lower to the upper bound with a cap at each end (a stacked bar's bounds keep their distance from its value, measured from the bar's stacked end). Either bound may be `false` for a one-sided interval, and a row without a bound pinches the band onto its line. The value axis widens to fit the bounds, and tooltips list them (see `confidenceConfig.tooltip`). Pass `false` to turn the interval off.

       Pass an array of bands, outermost first, to draw nested bands around each line (a fan): each band is a `[lower, upper]` pair or `[lower, upper, label]`, or a `{lower, upper, label}` object, and `confidenceConfig.bandOpacity` shades them from the widest (lightest) to the narrowest (darkest). Tooltips list each band's range under its label ("Band 1", "Band 2", … when unlabeled), and bars draw the first band's error bar.

@example <caption>Can be called with accessor functions or static keys:</caption>
       var data = {id: "alpha", value: 10, lci: 9, hci: 11};
       ...
       // Accessor functions
       .confidence([function(d) { return d.lci }, function(d) { return d.hci }])

       // Or static keys
       .confidence(["lci", "hci"])

       // Or nested bands, outermost first
       .confidence([["p5", "p95", "90%"], ["p25", "p75", "50%"]])
*/
  confidence(
    _?: unknown,
  ): this | VizInstance["_confidence"] | ConfidenceBand[] {
    if (!arguments.length)
      return this._confidenceBands && this._confidenceBands.length > 1
        ? this._confidenceBands
        : this._confidence;
    const bands = (this._confidenceBands = resolveConfidenceBands(_));
    this._confidence = bands.length ? [bands[0].lower, bands[0].upper] : false;
    return this;
  }

  /**
       Configuration object for shapes rendered as confidence intervals. A line's band is an Area, filled with the line's color at half opacity. A bar's error bar is a Path styled by `stroke` (default a shade darker than the bar), `strokeWidth` (default `2`), `strokeDasharray`, `strokeOpacity`, and `capWidth`: the length of each end cap, in pixels or as a percentage string of the bar's thickness (default `"50%"`). Keys nested under `Area` or `Bar` apply only to that shape's interval. With several bands, `bandOpacity` sets how each band looks where it is the innermost band drawn: an array ramps from the outermost band to the innermost (default `[0.15, 0.6]`), a number gives every band that opacity, and either replaces `fillOpacity`. `tooltip` (default `true`) lists the bounds in tooltips: a "Lower Bound" and "Upper Bound" row for a single mark, and a range after each series' value in a shared tooltip; set it to `false` to leave them out. Accepted keys: any key the Area or Path shape takes at the top level, plus `bandOpacity`, `capWidth`, `tooltip`, `Area` (Area keys), and `Bar` (Path keys and `capWidth`); any other key logs a warning.

@example
       .confidenceConfig({Bar: {stroke: "#333", capWidth: 8}, tooltip: false})
*/
  confidenceConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    if (!arguments.length) return this._confidenceConfig;
    validateConfidenceConfig(this.constructor.name, _);
    this._confidenceConfig = mergeConfigBag(
      this,
      "confidenceConfig",
      _,
      this._confidenceConfig,
    );
    return this;
  }

  /**
      When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.
*/
  discreteCutoff(_?: number): this | number {
    return arguments.length
      ? ((this._discreteCutoff = _), this)
      : this._discreteCutoff;
  }

  /**
      The pixel space between groups of bars.
*/
  groupPadding(_?: number): this | number {
    return arguments.length
      ? ((this._groupPadding = _), this)
      : this._groupPadding;
  }

  /**
       The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.
*/
  labelConnectorConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this._labelConnectorConfig = mergeConfigBag(
          this,
          "labelConnectorConfig",
          _,
          this._labelConnectorConfig,
        )),
        this)
      : this._labelConnectorConfig;
  }

  /**
      The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.
*/
  labelPosition(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this._labelPosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._labelPosition;
  }

  /**
      Paint for the shared tooltip's crosshair guide line (`stroke`,
      `strokeWidth`, `strokeDasharray`, `strokeOpacity`, …). Merged into the
      current config.
*/
  crosshairConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._crosshairConfig = mergeConfigBag(
          this,
          "crosshairConfig",
          _,
          this._crosshairConfig,
        )),
        this)
      : this._crosshairConfig;
  }

  /**
      Draws an automatic trend line fit to the plotted data: `true` (or `"linear"`) for a least-squares line, or one of `"exponential"`, `"logarithmic"`, `"power"`, or `"polynomial"`. By default each series gets its own line in its color; see `trendLineConfig` for grouping, a confidence band, and styling. On a chart with a discrete axis, the line runs along that axis, fitting categories by their order. Set to `false` (the default) to remove.
*/
  trendLine(_?: TrendLineType): this | TrendLineType {
    return arguments.length
      ? ((this._trendLine = _ as TrendLineType), this)
      : this._trendLine;
  }

  /**
      Options for the trend lines drawn by `trendLine`, merged into the current config:
      - `group`: `"series"` (default) fits one line per series, colored to match it; `"all"` fits a single line to every point.
      - `order`: the polynomial degree when `trendLine` is `"polynomial"` (default `2`).
      - `confidence`: draws a confidence band around a linear fit (default `false`).
      - `confidenceLevel`: the band's confidence level (default `0.95`).
      - `confidenceConfig`: Area shape config for the band (default `{fillOpacity: 0.15}`; fill defaults to the line color).
      - `projection`: extends each line past the end of its data, by a number of steps at the data's own spacing (e.g. `5` more years), or to an end value with `{to: 2030}` (default `0`, off). The axis widens to fit, and a linear fit's band becomes a prediction interval that fans out over the projection. Hovering a projected step lists each series' projected value. Ignored on a category axis.
      - `projectionConfig`: Line shape config for the projected stretch, over the line's own styles (default `{strokeDasharray: "2 4"}`).
      - `tooltip`: shows the fitted equation and R² when hovering a line (default `true`).
      - Any other key (`stroke`, `strokeWidth`, `strokeDasharray`, …) styles the Line shape.

Stacked charts always fit one line to the stack totals.
*/
  trendLineConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._trendLineConfig = mergeConfigBag(
          this,
          "trendLineConfig",
          _,
          this._trendLineConfig,
        )),
        this)
      : this._trendLineConfig;
  }

  /**
      Shape config for the Circle shapes drawn by the lineMarkers method.
*/
  lineMarkerConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this._lineMarkerConfig = mergeConfigBag(
          this,
          "lineMarkerConfig",
          _,
          this._lineMarkerConfig,
        )),
        this)
      : this._lineMarkerConfig;
  }

  /**
      Draws circle markers on each vertex of a Line.
*/
  lineMarkers(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._lineMarkers = _), this)
      : this._lineMarkers;
  }

  /**
      Sets the size of bubbles to the given Number, data key, or function.
*/
  size(_?: PlotAccessorArg | false): this | PlotAccessor {
    if (!arguments.length) return this._size;
    this._size = typeof _ === "function" || !_ ? _ : fieldAccessor(_ as string);
    this._sizeKey = typeof _ === "string" ? _ : undefined;
    return this;
  }

  /**
      Sets the vertical offset applied to stacked series. Accepts a named
      offset — `"diverging"` (default), `"none"`, `"expand"`, `"silhouette"`,
      or `"wiggle"` — or a custom offset function. Unknown names warn and fall
      back to `"diverging"`. If *value* is not specified, returns the current
      stack offset function.
*/
  stackOffset(_?: string | StackOffsetFn): this | StackOffsetFn {
    return arguments.length
      ? ((this._stackOffset = resolveStackOffset(_!)), this)
      : (this._stackOffset as StackOffsetFn);
  }

  /**
      Sets the order of stacked series, from the bottom of the stack upward.
      Accepts:
      - a named order: `"descending"` (default) / `"ascending"` by summed
        value, `"key"` / `"keyReverse"` alphabetically by series key,
        `"none"` / `"data"` for input order, or d3's `"insideOut"`,
        `"appearance"`, `"reverse"`;
      - an Array of series keys for an explicit order;
      - a value accessor, or a `{value, order}` config, to rank series by an
        aggregate of any data field.

      Unknown named strings warn and fall back to `"descending"`. If *value*
      is not specified, returns the current stack order.
*/
  stackOrder(_?: StackOrderInput): this | StackOrderFn | string[] {
    return arguments.length
      ? ((this._stackOrder = resolveStackOrder(_!)), this)
      : (this._stackOrder as StackOrderFn | string[]);
  }

  /**
      Accessor function or string key for the x-axis value of each data point.
*/
  x(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = fieldAccessor(_ as string);
        this._xKey = _;
      }
      return this;
    } else return this._x;
  }

  /**
       Accessor function or string key for the secondary x-axis value of each data point.
*/
  x2(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._x2 = _;
      else {
        this._x2 = fieldAccessor(_ as string);
        this._x2Key = _;
      }
      return this;
    } else return this._x2;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  xConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._xConfig = mergeConfigBag(this, "xConfig", _, this._xConfig)),
        this)
      : this._xConfig;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  x2Config(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._x2Config = mergeConfigBag(this, "x2Config", _, this._x2Config)),
        this)
      : this._x2Config;
  }

  /**
      Accessor function or string key for the y-axis value of each data point.
*/
  y(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = fieldAccessor(_ as string);
        this._yKey = _;
      }
      return this;
    } else return this._y;
  }

  /**
       Accessor function or string key for the secondary y-axis value of each data point.
*/
  y2(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._y2 = _;
      else {
        this._y2 = fieldAccessor(_ as string);
        this._y2Key = _;
      }
      return this;
    } else return this._y2;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

*Note:* If a "domain" array is passed to the y-axis config, it will be reversed.
*/
  yConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._yConfig = mergeConfigBag(
          this,
          "yConfig",
          reverseDomain(_),
          this._yConfig,
        )),
        this)
      : this._yConfig;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  y2Config(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._y2Config = mergeConfigBag(
          this,
          "y2Config",
          reverseDomain(_),
          this._y2Config,
        )),
        this)
      : this._y2Config;
  }
}

resolvesReset(
  Plot.prototype,
  "backgroundConfig",
  "baseline",
  "confidenceConfig",
  "crosshairConfig",
  "labelConnectorConfig",
  "lineMarkerConfig",
  "trendLineConfig",
  "xConfig",
  "x2Config",
  "yConfig",
  "y2Config",
);
