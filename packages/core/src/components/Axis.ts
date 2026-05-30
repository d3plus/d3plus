import {extent, min} from "d3-array";
import {select} from "d3-selection";
import {transition} from "d3-transition";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {colorContrast, colorDefaults} from "@d3plus/color";
import {assign, backgroundColor, date, elem, rtl as detectRTL} from "@d3plus/dom";
import type {D3Selection} from "@d3plus/dom";

import type {GroupNode} from "@d3plus/render";

import {TextBox} from "../components/index.js";
import {measureAxis} from "./axisLayout.js";
import {
  axisToScene,
  buildTickData,
  calculateTicks,
  configureTickShape,
  isNegative,
  renderAxisTitle,
} from "./axisRender.js";
import {BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

/** Axis's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const axisSchema: ConfigField[] = [
  {key: "align", coerce: "identity", default: "middle"},
  {key: "domain", coerce: "identity", default: [0, 10]},
  {key: "duration", coerce: "identity", default: 600},
  {key: "grid", coerce: "identity"},
  {key: "gridLog", coerce: "identity", default: false},
  {key: "gridSize", coerce: "identity"},
  {key: "height", coerce: "identity", default: 400},
  {key: "labels", coerce: "identity"},
  {key: "labelOffset", coerce: "identity", default: false},
  {key: "maxSize", coerce: "identity"},
  {key: "minSize", coerce: "identity"},
  {key: "padding", coerce: "identity", default: 5},
  {key: "paddingInner", coerce: "identity", default: 0.1},
  {key: "paddingOuter", coerce: "identity", default: 0.1},
  {key: "range", coerce: "identity"},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "rounding", coerce: "identity", default: "none"},
  {key: "roundingInsideMinPrefix", coerce: "identity", default: "< "},
  {key: "roundingInsideMinSuffix", coerce: "identity", default: ""},
  {key: "roundingInsideMaxPrefix", coerce: "identity", default: ""},
  {key: "roundingInsideMaxSuffix", coerce: "identity", default: "+"},
  {key: "scale", coerce: "identity", default: "linear"},
  {key: "scalePadding", coerce: "identity", default: 0.5},
  {key: "shape", coerce: "identity", default: "Line"},
  {key: "tickFormat", coerce: "identity"},
  {key: "ticks", coerce: "identity"},
  {key: "tickSize", coerce: "identity", default: 8},
  {key: "tickSuffix", coerce: "identity", default: "normal"},
  {key: "timeLocale", coerce: "identity", default: undefined},
  {key: "title", coerce: "identity"},
  {key: "width", coerce: "identity", default: 400},
];

/**
    Creates an SVG scale based on an array of data.
*/
export default class Axis extends BaseClass {
  // installFluent generates the config accessors (scale, domain, ticks, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  _select!: D3Selection;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _data: any[];
  _labelRotation: boolean | undefined;
  _margin: Record<string, number>;
  _outerBounds: Record<string, number>;
  _position!: {
    horizontal: boolean;
    width: string;
    height: string;
    x: string;
    y: string;
    opposite: string;
  };
  _tickUnit: number;
  _titleClass: TextBox;
  // Stored render() intermediates so toScene() can compose natively.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _tickShape?: {toScene?: () => GroupNode; _data?: unknown[]} | any;
  _gridLineData?: {id: unknown}[];
  // D3 scales have complex polymorphic types that vary at runtime
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _d3Scale: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _d3ScaleNegative: any;
  _group!: D3Selection;
  _lastScale: ((d: unknown) => number) | undefined;
  _availableTicks: unknown[];
  _visibleTicks: unknown[];
  _transition!: ReturnType<typeof transition>;
  _userFormat: ((d: unknown) => string) | false | undefined;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    installFluent(this, axisSchema);

    this._data = [];
    this._labelRotation = false;
    this.schema.barConfig = {
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      "stroke-width": 1,
    };
    this.schema.gridConfig = {
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        const contrast = colorContrast(bg);
        return contrast === colorDefaults.dark ? openColor.colors.gray[200] : openColor.colors.gray[600];
      },
      "stroke-width": 1,
    };
    this.orient("bottom");
    this._outerBounds = {width: 0, height: 0, x: 0, y: 0};
    this.schema.shapeConfig = {
      fill: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      height: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
      label: (d: Record<string, unknown>) => d.text,
      labelBounds: (d: Record<string, unknown>) => d.labelBounds,
      labelConfig: {
        fontColor: () => {
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
          return colorContrast(bg);
        },
        fontResize: false,
        fontSize: constant(12),
        padding: 5,
        textAnchor: () => {
          const rtl = detectRTL();
          return this.schema.orient === "left"
            ? rtl
              ? "start"
              : "end"
            : this.schema.orient === "right"
              ? rtl
                ? "end"
                : "start"
              : this._labelRotation
                ? this.schema.orient === "bottom"
                  ? "end"
                  : "start"
                : "middle";
        },
        verticalAlign: () =>
          this.schema.orient === "bottom"
            ? "top"
            : this.schema.orient === "top"
              ? this._labelRotation ? "top" : "bottom"
              : "middle",
      },
      r: (d: Record<string, unknown>) => (d.tick ? 4 : 0),
      stroke: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      strokeWidth: 1,
      width: (d: Record<string, unknown>) => (d.tick ? 8 : 0),
    };
    this._tickUnit = 0;
    this._titleClass = new TextBox();
    this.schema.titleConfig = {
      fontColor: () => {
        const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
        return colorContrast(bg);
      },
      fontSize: 12,
      textAnchor: "middle",
    };
    this._margin = {top: 0, right: 0, bottom: 0, left: 0};
    this._availableTicks = [];
    this._visibleTicks = [];
  }


  /**
      Returns the scale's domain, taking into account negative and positive log scales.
      @private
*/
  _getDomain(): unknown[] {
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative) ticks = this._d3ScaleNegative.domain();
    if (this._d3Scale) ticks = ticks.concat(this._d3Scale.domain());

    const domain = ["band", "ordinal", "point"].includes(this.schema.scale)
      ? ticks
      : extent(ticks as number[]);
    return (ticks[0] as number) > (ticks[1] as number)
      ? (domain as unknown[]).reverse()
      : (domain as unknown[]);
  }

  /**
      Returns a value's scale position, taking into account negative and positive log scales.
      @param d @private
*/
  _getPosition(d: unknown): number {
    if (this.schema.scale === "log") {
      if (d === 0)
        return (this._d3Scale || this._d3ScaleNegative).range()[
          this._d3Scale ? 0 : 1
        ];
      return (
        isNegative(d as number) ? this._d3ScaleNegative || (() => 0) : this._d3Scale
      )(d);
    }
    return this._d3Scale(d);
  }

  /**
      Returns the scale's range, taking into account negative and positive log scales.
      @private
*/
  _getRange(): unknown[] {
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative) ticks = this._d3ScaleNegative.range();
    if (this._d3Scale) ticks = ticks.concat(this._d3Scale.range());
    return (ticks[0] as number) > (ticks[1] as number)
      ? (extent(ticks as number[]) as unknown[]).reverse()
      : (extent(ticks as number[]) as unknown[]);
  }

  /**
      Returns the scale's labels, taking into account negative and positive log scales.
      @private
*/
  _getLabels(): unknown[] {
    let labels: unknown[] = [];
    if (this._d3ScaleNegative)
      labels = labels.concat(
        calculateTicks.bind(this)(this._d3ScaleNegative, false),
      );
    if (this._d3Scale)
      labels = labels.concat(calculateTicks.bind(this)(this._d3Scale, false));
    if (this.schema.scale === "log") {
      const diverging =
        labels.some((d: unknown) => isNegative(d as number)) &&
        labels.some((d: unknown) => (d as number) > 0);
      if (diverging) {
        const minValue = min([
          ...this._d3ScaleNegative.domain().map(Math.abs),
          ...this._d3Scale.domain(),
        ]);
        // add minValue if it does not exist, and should
        if (!labels.includes(minValue)) {
          labels.splice(
            labels.findIndex((d: unknown) => (d as number) > minValue!),
            0,
            minValue,
          );
        }
        // remove -minValue if minValue also exists
        if (labels.includes(-minValue!) && labels.includes(minValue)) {
          labels.splice(labels.indexOf(-minValue!), 1);
        }
      }
    }
    return labels;
  }

  /**
      Returns the scale's ticks, taking into account negative and positive log scales.
      @private
*/
  _getTicks(): unknown[] {
    if (
      ["band", "ordinal", "point", "time"].includes(this.schema.scale) &&
      this._data.length &&
      this._data.length < this.schema.width / 4
    ) {
      return this.schema.scale === "time" ? this._data.map(date) : this._data;
    }
    let ticks: unknown[] = [];
    if (this._d3ScaleNegative)
      ticks = ticks.concat(
        calculateTicks.bind(this)(this._d3ScaleNegative, true),
      );
    if (this._d3Scale)
      ticks = ticks.concat(calculateTicks.bind(this)(this._d3Scale, true));
    if (this.schema.scale === "log" && ticks.includes(-1) && ticks.includes(1))
      ticks.splice(ticks.indexOf(-1), 1);
    return ticks;
  }


  /**
      Produces a backend-agnostic scene graph for this axis with no DOM dependency:
      gridlines + domain bar emitted natively, tick marks/labels composed from the
      tick Shape's toScene(), and the title from the title TextBox's toScene().
*/
  toScene(): GroupNode {
    return axisToScene(this);
  }

  /**
      Renders the current Axis to the page.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: (...args: unknown[]) => unknown): this {
    /**
     * In `renderMode("compute")` the axis is scene-only — the caller will
     * read `toScene()`, not the DOM. We skip creating any SVG element at
     * all: the elem() calls later in render() are no-ops when `_select`
     * is undefined (d3-selection.select(undefined) yields a null-wrapped
     * selection whose .append/.select on it short-circuit). This also
     * fixes the "every Axis instance holds a detached svg forever" leak
     * — Plot has four long-lived axes and was accumulating 4 detached
     * SVGs per chart instance.
     *
     * In `renderMode("full")` with `_select` unset, we create a
     * body-attached svg so standalone `new Axis().render()` works.
*/
    if (this._select === void 0 && this.schema.renderMode !== "compute") {
      const svgNode = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
      );
      svgNode.setAttribute("width", `${this.schema.width}px`);
      svgNode.setAttribute("height", `${this.schema.height}px`);
      document.body.appendChild(svgNode);
      this.select(svgNode as unknown as HTMLElement);
    }

    // Pure layout pass. `measureAxis(this)` constructs the d3 scale, picks
    // ticks, runs label textWrap, and computes outerBounds — no DOM, no
    // rendering. It mutates `this._d3Scale`/`_outerBounds`/`_margin` etc. for
    // consumers reading off the instance, and returns the local layout
    // artifacts the paint phase below consumes. The standalone `measureAxis`
    // lives in axisLayout.ts so Plot test-axes can drive it without a class
    // instance at all (any AxisLike object works).
    const measure = measureAxis(this);
    const {ticks, labels} = measure;

    const parent = this._select;

    // Skip the wrapper group only when in compute mode WITHOUT a real
    // `_select` (the standalone compute path used by Plot's axes — toScene
    // is the consumer, no DOM mount needed). When `_select` is set, the
    // group still mounts because consumers (Timeline extends Axis and
    // calls `elem("g.brushGroup", {parent: this._group})` after super
    // render) expect it.
    const standaloneCompute =
      this.schema.renderMode === "compute" &&
      (this._select === void 0 || this._select === null ||
        (typeof this._select.node === "function" && this._select.node() === null));
    const group = standaloneCompute
      ? null
      : elem(`g#d3plus-Axis-${this._uuid}`, {parent});
    this._group = group as D3Selection;

    const gridLineData: {id: unknown}[] = (
      this.schema.gridSize !== 0
        ? this.schema.grid || (this.schema.scale === "log" && !this.schema.gridLog)
          ? labels
          : ticks
        : []
    ).map((d: unknown) => ({id: d}));
    // Scene-only: grid lines are emitted natively by toScene() via
    // _gridLinePoints() from this._gridLineData. No <line> DOM.
    this._gridLineData = gridLineData;

    // Tick marks/labels and the title are composed in compute mode by
    // axisRender helpers; toScene() reads the resulting _tickShape/_titleClass.
    // The domain bar is emitted natively by toScene() via _barLinePoints().
    const tickData = buildTickData(this, measure);
    configureTickShape(this, tickData);
    renderAxisTitle(this, measure, group);

    this._lastScale = this._getPosition.bind(this);

    if (callback) setTimeout(callback, this.schema.duration + 100);

    return this;
  }

  /**
      Axis line style.
*/
  barConfig(): Record<string, unknown>;
  barConfig(_: Record<string, unknown>): this;
  barConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.barConfig = Object.assign(this.schema.barConfig, _)), this)
      : this.schema.barConfig;
  }

  /**
      An array of data points, which helps determine which ticks should be shown and which time resolution should be displayed.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(): any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(_: any[]): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data(_?: any[]): unknown {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      Grid config of the axis.
*/
  gridConfig(): Record<string, unknown>;
  gridConfig(_: Record<string, unknown>): this;
  gridConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.gridConfig = Object.assign(this.schema.gridConfig, _)), this)
      : this.schema.gridConfig;
  }

  /**
      Whether to rotate horizontal axis labels -90 degrees.
*/
  labelRotation(): boolean | undefined;
  labelRotation(_: boolean): this;
  labelRotation(_?: boolean): boolean | undefined | this {
    return arguments.length
      ? ((this._labelRotation = _), this)
      : this._labelRotation;
  }

  /**
      The orientation of the shape.
*/
  orient(): string;
  orient(_: string): this;
  orient(_?: string): string | this {
    if (arguments.length) {
      const horizontal = ["top", "bottom"].includes(_!),
        opps: Record<string, string> = {
          top: "bottom",
          right: "left",
          bottom: "top",
          left: "right",
        };

      this._position = {
        horizontal,
        width: horizontal ? "width" : "height",
        height: horizontal ? "height" : "width",
        x: horizontal ? "x" : "y",
        y: horizontal ? "y" : "x",
        opposite: opps[_!],
      };

      return ((this.schema.orient = _!), this);
    }
    return this.schema.orient;
  }

  /**
      Returns the outer bounds of the axis content. Must be called after rendering.
      @example
{"width": 180, "height": 24, "x": 10, "y": 20}
*/
  outerBounds(): Record<string, number> {
    return this._outerBounds;
  }

  /**
      Phase-E: runs the layout pass only — scale construction, tick selection,
      label textWrap, and outerBounds — with **no DOM access**. After it
      returns, `outerBounds()` / `_d3Scale` / `_getPosition()` are populated
      exactly as they would be after a full `render()`, but no `<svg>`, `<g>`,
      tick shapes, or label TextBoxes are created.

      This is the v4 path for "how much room will this axis need?" without
      the temp-DOM dance — see `Plot._draw`'s test-axes for the production
      caller. Internally it delegates to the standalone `measureAxis(axis)`
      function in axisLayout.ts; the free function shape means Plot (and
      future callers) can run layout without owning an Axis instance.
  */
  measure(): this {
    measureAxis(this);
    return this;
  }

  /**
      The SVG container element as a d3 selector or DOM element.

      Passing `null` or `undefined` deliberately leaves the axis unmounted
      — `renderMode("compute")` plus `select(null)` produces a
      scene-only axis (no detached SVG fallback). This is the formal
      contract callers in `plotPaint` use to compute axis layout without
      mounting DOM.
*/
  select(): D3Selection;
  select(_: string | HTMLElement | null | undefined): this;
  select(_?: string | HTMLElement | null): unknown {
    if (!arguments.length) return this._select;
    if (_ == null) {
      this._select = undefined as unknown as D3Selection;
    } else {
      this._select = select(_ as never) as unknown as D3Selection;
    }
    return this;
  }

  /**
      Tick style of the axis.
*/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(): Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(_: Record<string, any>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shapeConfig(_?: Record<string, any>): unknown {
    return arguments.length
      ? ((this.schema.shapeConfig = assign(this.schema.shapeConfig, _ as Record<string, unknown>)), this)
      : this.schema.shapeConfig;
  }

  /**
      Title configuration of the axis.
*/
  titleConfig(): Record<string, unknown>;
  titleConfig(_: Record<string, unknown>): this;
  titleConfig(_?: Record<string, unknown>): unknown {
    return arguments.length
      ? ((this.schema.titleConfig = Object.assign(this.schema.titleConfig, _)), this)
      : this.schema.titleConfig;
  }
}

/* ============================== free function ============================== */

/**
    Pure-function entry point for axis layout. Given a fully configured
    `Axis` instance, runs the layout pass (no DOM) and returns a fresh result
    bag — bounds, the d3 scale(s), a `getPosition` projector, plus the
    laid-out tick state.

    Callers who don't want to manage an Axis instance long-term can build
    one on the fly, call this, and discard:

    ```ts
    const axis = new AxisBottom()
      .domain([0, 100])
      .width(800).height(400)
      .data(data)
      .config(userAxisConfig);
    const layout = computeAxisLayout(axis);
    // layout.bounds, layout.getPosition, layout.d3Scale all populated.
    ```

    This is the "no temp DOM, no test svg" path Plot's `_xTest`/`_yTest`
    consume — see Plot._draw. Internally this is a thin wrapper over
    `axis.measure()` returning a frozen snapshot of the laid-out state.
*/
export interface AxisLayout {
  bounds: Record<string, number>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d3Scale: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  d3ScaleNegative: any;
  getPosition: (d: unknown) => number;
  availableTicks: unknown[];
  visibleTicks: unknown[];
  margin: Record<string, number>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function computeAxisLayout(axis: any): AxisLayout {
  // Free function from axisLayout.ts. Mutates `axis` (so instance-slot
  // readers stay in sync) and returns the layout artifacts; we re-shape
  // its result + the mutated instance fields into the stable `AxisLayout` API.
  measureAxis(axis);
  return {
    bounds: axis._outerBounds,
    d3Scale: axis._d3Scale,
    d3ScaleNegative: axis._d3ScaleNegative,
    getPosition: (d: unknown) => axis._getPosition(d),
    availableTicks: axis._availableTicks,
    visibleTicks: axis._visibleTicks,
    margin: axis._margin,
  };
}

// Re-export the standalone `measureAxis` and its result type so consumers
// can import them from the same module as the Axis class.
export {measureAxis} from "./axisLayout.js";
export type {AxisLayoutResult} from "./axisLayout.js";
