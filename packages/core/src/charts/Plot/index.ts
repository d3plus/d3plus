/* eslint no-cond-assign: 0*/

import * as d3Shape from "d3-shape";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {
  colorAssign,
  colorContrast,
  colorDefaults,
} from "@d3plus/color";
import {assign, backgroundColor} from "@d3plus/dom";

import {
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
} from "../../components/index.js";
import {accessor, constant} from "../../utils/index.js";
import {installFluent} from "../../fluent.js";

// E4: Plot's identity-coerce accessor schema (18 keys). installFluent's
// per-key idempotence lets this co-exist with vizSchema on the parent
// Viz.prototype — installFluent walks the actual prototype (Plot.prototype
// here) and skips keys already present.
const plotSchema = [
  {key: "barPadding", coerce: "identity" as const},
  {key: "baseline", coerce: "identity" as const},
  {key: "lineLabels", coerce: "identity" as const},
  {key: "shapeSort", coerce: "identity" as const},
  {key: "sizeMax", coerce: "identity" as const},
  {key: "sizeMin", coerce: "identity" as const},
  {key: "sizeScale", coerce: "identity" as const},
  {key: "stacked", coerce: "identity" as const},
  {key: "xCutoff", coerce: "identity" as const},
  {key: "xDomain", coerce: "identity" as const},
  {key: "x2Domain", coerce: "identity" as const},
  {key: "xSort", coerce: "identity" as const},
  {key: "x2Sort", coerce: "identity" as const},
  {key: "yCutoff", coerce: "identity" as const},
  {key: "yDomain", coerce: "identity" as const},
  {key: "y2Domain", coerce: "identity" as const},
  {key: "ySort", coerce: "identity" as const},
  {key: "y2Sort", coerce: "identity" as const},
];

import {plotDef} from "./pipeline.js";
import {drawPlot} from "./draw.js";
import {plotShapeDefaults} from "./shapeDefaults.js";
import {stackOffsetDiverging, stackOrderAscending, stackOrderDescending} from "./stackHelpers.js";
import {plotPaint, type PlotPaintContext} from "../plotPaint.js";
import Viz from "../Viz.js";

import type {Scene, SceneNode} from "@d3plus/render";
import type {DataPoint} from "@d3plus/data";
import type {VizInstance} from "../vizTypes.js";

/** Accessor function or string key for a plotted value. */
type PlotAccessor = (d: DataPoint, i: number) => number | Date | string;
/** Function-or-string-key value accepted by accessor setters. */
type PlotAccessorArg = string | PlotAccessor;

import {default as BarBuffer} from "../plotBuffers/Bar.js";
import {default as BoxBuffer} from "../plotBuffers/Box.js";
import {default as CircleBuffer} from "../plotBuffers/Circle.js";
import {default as LineBuffer} from "../plotBuffers/Line.js";
import {default as RectBuffer} from "../plotBuffers/Rect.js";
const defaultBuffers = {
  Bar: BarBuffer,
  Box: BoxBuffer,
  Circle: CircleBuffer,
  Line: LineBuffer,
  Rect: RectBuffer,
};

/**
    Creates an x/y plot based on an array of data.
*/
export default class Plot extends Viz {

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    super();
    // E4: install identity-coerce accessors on Plot.prototype. Defaults
    // are still applied below imperatively from plotDef; installFluent
    // skips slots that are already set, so the constructor wins.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, plotSchema);
    // E3: scalar defaults sourced from plotDef.
    const defaults = plotDef.defaults!;
    this._axisPersist = defaults.axisPersist as boolean;
    this._annotations = defaults.annotations as unknown[];
    this._backgroundConfig = {
      duration: 0,
      fill: "transparent",
    };
    this.schema.barPadding = defaults.barPadding as number;
    this._buffer = assign({}, defaultBuffers, {Bar: false, Line: false});
    this._confidenceConfig = {
      fill: (d: DataPoint, i: number) => {
        const c =
          typeof this.schema.shapeConfig.Line.stroke === "function"
            ? this.schema.shapeConfig.Line.stroke(d, i)
            : this.schema.shapeConfig.Line.stroke;
        return c;
      },
      fillOpacity: constant(0.5),
    };
    this._discreteCutoff = defaults.discreteCutoff as number;
    this._groupPadding = defaults.groupPadding as number;
    this._labelConnectorConfig = {
      strokeDasharray: "1 1",
    };
    this._labelPosition = constant("auto");
    this._lineMarkerConfig = {
      fill: (d: DataPoint, i: number) => colorAssign(this._id(d, i)),
      r: constant(3),
    };
    this._lineMarkers = defaults.lineMarkers as boolean;
    this._previousAnnotations = {back: [], front: []};
    this._previousShapes = [];
    this.schema.shape = defaults.shape;
    this.schema.shapeConfig = assign(this.schema.shapeConfig, plotShapeDefaults.call(this));
    this._shapeOrder = ["Area", "Path", "Bar", "Box", "Line", "Rect", "Circle"];
    this.schema.shapeSort = (a: string, b: string) =>
      this._shapeOrder.indexOf(a) - this._shapeOrder.indexOf(b);
    this.schema.sizeMax = 20;
    this.schema.sizeMin = 5;
    this.schema.sizeScale = "sqrt";
    this._stackOffset = stackOffsetDiverging;
    this._stackOrder = stackOrderDescending;
    this.schema.timelineConfig = assign(this.schema.timelineConfig, {
      brushMin: () =>
        this._xTime || this._yTime || this._x2Time || this._y2Time ? 2 : 1,
    });

    this._x = accessor("x");
    this._xKey = "x";
    this._xAxis = new AxisBottom().align("end");
    // _xTest/_yTest/_x2Test/_y2Test are NOT persistent fields anymore. The
    // measure-only test axes are allocated as locals inside `_draw` and
    // garbage-collected after each draw — proving Plot doesn't need to
    // own a long-lived Axis instance just for layout. See measureAxis()
    // in axisLayout.ts for the standalone shape.
    this._xConfig = {
      gridConfig: {
        stroke: (d: {id: string}) => {
          if (this.schema.discrete && this.schema.discrete.charAt(0) === "x")
            return "transparent";
          const range = this._xAxis.range();
          const position = this._xAxis._getPosition.bind(this._xAxis)(d.id);
          if (range[0] === position) return "transparent";
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
                  const contrast = colorContrast(bg);
          return contrast === colorDefaults.dark ? openColor.colors.gray[200] : openColor.colors.gray[600];
        },
      },
    };
    this.schema.xCutoff = 150;

    this._x2 = accessor("x2");
    this._x2Key = "x2";
    this._x2Axis = new AxisTop().align("start");
    this._x2Config = {};

    this._y = accessor("y");
    this._yKey = "y";
    this._yAxis = new AxisLeft().align("start");
    this._yKey = "y";
    this._yConfig = {
      gridConfig: {
        stroke: (d: {id: string}) => {
          if (this.schema.discrete && this.schema.discrete.charAt(0) === "y")
            return "transparent";
          const range = this._yAxis.range();
          const position = this._yAxis._getPosition.bind(this._yAxis)(d.id);
          if (range[range.length - 1] === position) return "transparent";
          const bg = this._select ? backgroundColor(this._select.node()) : "rgb(255, 255, 255)";
                  const contrast = colorContrast(bg);
          return contrast === colorDefaults.dark ? openColor.colors.gray[200] : openColor.colors.gray[600];
        },
      },
    };
    this.schema.yCutoff = 150;

    this._y2 = accessor("y2");
    this._y2Key = "y2";
    this._y2Axis = new AxisRight().align("end");
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
        if (!this.schema.aggs[str] && this.schema.discrete === k) {
          this.schema.aggs[str] = (a: DataPoint[], c: (d: DataPoint) => unknown) => {
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
        axisNodes.push({type: "group", key: `plot-${name}`, children: [axis.toScene()]});
      }
    }
    // Axes are drawn behind the shapes in the legacy DOM order.
    scene.root.children.unshift(...axisNodes);
    return scene;
  }

  /**
      Wires user-registered `on()` event handlers onto a freshly-configured
      shape instance. Splits the registered events into three buckets the
      legacy code maintained: global (`"click"`), shape-scoped
      (`"click.shape"`), and shape-class-scoped (`"click.Bar"` etc.). All
      three forward into `this.schema.on[event](d.data, d.i, x, event)`. Extracted
      from Plot._paint so the chart-level event wiring is in one place.

      MIGRATION NOTE (RFC §4.5 — interaction decoupled from DOM): each
      shape's `.on(evt, handler)` call binds a d3-selection DOM listener
      to its SVG nodes. That works under `SvgRenderer` but not under
      `CanvasRenderer`, which has no per-shape DOM target — every pixel
      lives on one <canvas>. The renderer interface already exposes
      `Renderer.on(handler)` + `Renderer.pick(point)` for the proper
      scene-driven path, but rewiring every Plot event through that
      pipeline (registry-keyed-by-shape-id → pick() per pointer event →
      dispatch by id → forward to `this.schema.on[...]`) is a multi-file
      refactor scheduled as a v4 follow-on. Until then, charts using
      `.renderer("canvas")` with custom shape events silently drop them.
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
      (d: {data: DataPoint; i: number}, i: number, x: unknown, event: unknown) =>
        this.schema.on[evt](d.data, d.i, x, event);
    for (const evt of globalEvents) shape.on(evt, forward(evt));
    for (const evt of shapeEvents) shape.on(evt, forward(evt));
    for (const evt of classEvents) shape.on(evt, forward(evt));
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    return drawPlot(this, callback);
  }

  /**
      Paint phase: production axis rendering, shape buffer setup, and shape
      emission with event handlers. Receives all cross-phase locals from
      _draw via `pCtx` (so this method has zero coupling to _draw's local
      scope beyond the explicit context).
  */
  _paint(pCtx: PlotPaintContext) {
    const nodes = plotPaint(this as unknown as VizInstance, pCtx);
    // plotPaint is now a returning function (RFC §3.1 purification). Push
    // the emitted scene nodes into _chartScene in place; allocating a
    // fresh array via `.concat(nodes)` per draw churns GC on wide
    // charts (1000s of bars/cells) under zoom/animation. Viz.toScene
    // wraps the collection in viz-chart-cells + zoom transform.
    const scene = (this._chartScene ||= []);
    for (let i = 0; i < nodes.length; i++) scene.push(nodes[i]);
    return this;
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
       A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).
*/
  backgroundConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._backgroundConfig = assign(this._backgroundConfig, _!)), this)
      : this._backgroundConfig;
  }

  // barPadding(_: any): installed by installFluent(this, plotSchema).
  // baseline(_: any): installed by installFluent(this, plotSchema).

  /**
      Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).
*/
  buffer(_?: boolean | Record<string, boolean>): this | Record<string, unknown> {
    if (arguments.length) {
      if (!_) this._buffer = {};
      else if (_ === true) this._buffer = defaultBuffers;
      else {
        this._buffer = assign({}, this._buffer, _);
        for (const key in this._buffer) {
          const buf = this._buffer as Record<string, unknown>;
          if (buf[key] === true) buf[key] = (defaultBuffers as Record<string, unknown>)[key];
        }
      }
      return this;
    }
    return this._buffer;
  }

  /**
       The confidence interval as an array of [lower, upper] bounds.

@example <caption>Can be called with accessor functions or static keys:</caption>
       var data = {id: "alpha", value: 10, lci: 9, hci: 11};
       ...
       // Accessor functions
       .confidence([function(d) { return d.lci }, function(d) { return d.hci }])

       // Or static keys
       .confidence(["lci", "hci"])
*/
  confidence(_?: unknown): this | [number, number] | false {
    if (arguments.length && _ instanceof Array) {
      this._confidence = [];
      const lower = _[0];
      this._confidence[0] =
        typeof lower === "function" || !lower ? lower : accessor(lower);
      const upper = _[1];
      this._confidence[1] =
        typeof upper === "function" || !upper ? upper : accessor(upper);

      return this;
    } else return this._confidence;
  }

  /**
       Configuration object for shapes rendered as confidence intervals.
*/
  confidenceConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._confidenceConfig = assign(this._confidenceConfig, _!)), this)
      : this._confidenceConfig;
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
  labelConnectorConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._labelConnectorConfig = assign(this._labelConnectorConfig, _!)),
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

  // lineLabels(_: any): installed by installFluent(this, plotSchema).

  /**
      Shape config for the Circle shapes drawn by the lineMarkers method.
*/
  lineMarkerConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._lineMarkerConfig = assign(this._lineMarkerConfig, _!)), this)
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

  // shapeSort(_: any): installed by installFluent(this, plotSchema).

  /**
      Sets the size of bubbles to the given Number, data key, or function.
*/
  size(_?: PlotAccessorArg | false): this | PlotAccessor {
    return arguments.length
      ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_ as string)), this)
      : this._size;
  }

  // sizeMax(_: any): installed by installFluent(this, plotSchema).
  // sizeMin(_: any): installed by installFluent(this, plotSchema).
  // sizeScale(_: any): installed by installFluent(this, plotSchema).
  // stacked(_: any): installed by installFluent(this, plotSchema).

  /**
      Sets the stack offset. If *value* is not specified, returns the current stack offset function.
*/
  stackOffset(
    _?: string | ((series: number[][], order: number[]) => void),
  ): this | ((series: number[][], order: number[]) => void) {
    return arguments.length
      ? ((this._stackOffset =
          typeof _ === "function"
            ? _
            : (d3Shape as Record<string, unknown>)[
                `stackOffset${_!.charAt(0).toUpperCase() + _!.slice(1)}`
              ]),
        this)
      : this._stackOffset;
  }

  /**
      Sets the stack order. If *value* is not specified, returns the current stack order function.
*/
  stackOrder(
    _?: string | ((series: number[][]) => number[]),
  ): this | ((series: number[][]) => number[]) {
    if (arguments.length) {
      if (typeof _ === "string")
        this._stackOrder =
          _ === "ascending"
            ? stackOrderAscending
            : _ === "descending"
              ? stackOrderDescending
              : (d3Shape as Record<string, unknown>)[
                  `stackOrder${_.charAt(0).toUpperCase() + _.slice(1)}`
                ];
      else this._stackOrder = _;
      return this;
    } else return this._stackOrder;
  }

  /**
      Accessor function or string key for the x-axis value of each data point.
*/
  x(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_ as string);
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
        this._x2 = accessor(_ as string);
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
      ? ((this._xConfig = assign(this._xConfig, _!)), this)
      : this._xConfig;
  }

  // xCutoff(_: any): installed by installFluent(this, plotSchema).

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  x2Config(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._x2Config = assign(this._x2Config, _!)), this)
      : this._x2Config;
  }

  // xDomain(_: any): installed by installFluent(this, plotSchema).
  // x2Domain(_: any): installed by installFluent(this, plotSchema).
  // xSort(_: any): installed by installFluent(this, plotSchema).
  // x2Sort(_: any): installed by installFluent(this, plotSchema).

  /**
      Accessor function or string key for the y-axis value of each data point.
*/
  y(_?: PlotAccessorArg): this | PlotAccessor {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_ as string);
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
        this._y2 = accessor(_ as string);
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
    if (arguments.length) {
      const cfg = _ as {domain?: unknown[]};
      if (cfg.domain) cfg.domain = cfg.domain.slice().reverse();
      this._yConfig = assign(this._yConfig, _!);
      return this;
    }
    return this._yConfig;
  }

  // yCutoff(_: any): installed by installFluent(this, plotSchema).

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  y2Config(_?: Record<string, unknown>): this | Record<string, unknown> {
    if (arguments.length) {
      const cfg = _ as {domain?: unknown[]};
      if (cfg.domain) cfg.domain = cfg.domain.slice().reverse();
      this._y2Config = assign(this._y2Config, _!);
      return this;
    }
    return this._y2Config;
  }

  // yDomain(_: any): installed by installFluent(this, plotSchema).
  // y2Domain(_: any): installed by installFluent(this, plotSchema).
  // ySort(_: any): installed by installFluent(this, plotSchema).
  // y2Sort(_: any): installed by installFluent(this, plotSchema).
}
