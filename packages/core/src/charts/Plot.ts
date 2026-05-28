/* eslint no-cond-assign: 0*/

import {
  groups,
  max,
  merge,
  min,
  range,
} from "d3-array";
import * as scales from "d3-scale";
import * as d3Shape from "d3-shape";
// @ts-ignore
import pkg from "open-color/open-color.js";
const {theme: openColor} = pkg;

import {
  colorAssign,
  colorContrast,
  colorDefaults,
  colorLegible,
} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {assign, backgroundColor, rtl} from "@d3plus/dom";
import {largestRect} from "@d3plus/math";
import {formatAbbreviate} from "@d3plus/format";

import {
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
  TextBox,
} from "../components/index.js";
import * as shapes from "../shapes/index.js";
import {accessor, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";

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

const testLineShape = new shapes.Line();
const testTextBox = new TextBox();
import {computePlotAxisValues, computePlotInitialDomains, computePlotScales, extendPlotOppScales, formatPlotData, measurePlotLineLabels, preparePlotAxisLayout, plotDef} from "./ChartDefinition.js";
import {shapeConfigFor} from "./emitHelpers.js";
import {runStages} from "./stages.js";
import Viz from "./Viz.js";

/**
    Pulls a fully-rendered shape's scene (cells + labels) into
    `viz._chartScene` instead of pushing onto the legacy `_shapes` array.
    Plot's chart-as-data tail: each Bar/Line/Area/Circle/Rect/Box/Whisker
    that used to live as a long-running `_shapes[i]` now contributes its
    scene nodes once and is discarded.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function absorbShapeIntoChartScene(viz: any, shape: any): void {
  if (!shape || typeof shape.toScene !== "function") return;
  if (!Array.isArray(viz._chartScene)) viz._chartScene = [];
  const scene = shape.toScene();
  if (scene && Array.isArray(scene.children))
    viz._chartScene.push(...scene.children);
  const lbl = shape._labelClass;
  if (lbl && typeof lbl.toScene === "function") {
    const ls = lbl.toScene();
    if (ls && Array.isArray(ls.children)) viz._chartScene.push(...ls.children);
  }
}
import type {Scene, SceneNode} from "@d3plus/render";

import {default as BarBuffer} from "./plotBuffers/Bar.js";
import {default as BoxBuffer} from "./plotBuffers/Box.js";
import {default as CircleBuffer} from "./plotBuffers/Circle.js";
import {default as LineBuffer} from "./plotBuffers/Line.js";
import {default as RectBuffer} from "./plotBuffers/Rect.js";
const defaultBuffers = {
  Bar: BarBuffer,
  Box: BoxBuffer,
  Circle: CircleBuffer,
  Line: LineBuffer,
  Rect: RectBuffer,
};

/**
    Logic for determining default sizes of shapes using the sizeScaleD3 internal function.
    @private
*/
function defaultSize(this: any, d: any) {
  return this._sizeScaleD3(this._size ? this._size(d) : null);
}

/**
    Logic for determining stackOrder ascending using groups.
    @private
*/
function stackOrderAscending(series: any) {
  const sums = series.map(stackSum);
  const keys = series.map((d: any) => d.key.split("_")[0]);
  return d3Shape
    .stackOrderNone(series)
    .sort((a: any, b: any) => keys[b].localeCompare(keys[a]) || sums[a] - sums[b]);
}

/**
    Logic for determining stackOrder descending using groups.
    @private
*/
function stackOrderDescending(series: any) {
  return stackOrderAscending(series).reverse();
}

/**
    Logic for determining default sum of shapes using the stackSum function used in d3Shape.
    @private
*/
function stackSum(series: any) {
  let i = -1,
    s = 0,
    v;
  const n = series.length;
  while (++i < n) if ((v = +series[i][1])) s += v;
  return s;
}

/**
    Logic for determining default sum of shapes using the stackSum function used in d3Shape.
    @private
*/
function stackOffsetDiverging(series: any, order: any) {
  let n;
  if (!((n = series.length) > 0)) return;
  let d, dy, i, yn, yp;
  const m = series[order[0]].length;
  for (let j = 0; j < m; ++j) {
    for (yp = yn = 0, i = 0; i < n; ++i) {
      if ((dy = (d = series[order[i]][j])[1] - d[0]) >= 0) {
        ((d[0] = yp), (d[1] = yp += dy));
      } else if (dy < 0) {
        ((d[1] = yn), (d[0] = yn += dy));
      } else {
        d[0] = yp;
      }
    }
  }
}

/**
 * Determines if a Bar label should be placed outside of the Bar.
 * @param {@} d
 * @param {*} i
 * @private
 */
function outside(this: any, d: any, i: any) {
  // Force all Stacked Bars to use "inside" labels.
  if (this._stacked) return false;

  // Detect user "outside" or "inside" override.
  const labelPosition = this._labelPosition(d, i);
  if (labelPosition === "outside") return true;
  else if (labelPosition === "inside") return false;

  // Run "auto" logic based on available space.
  const other = this._discrete.charAt(0) === "x" ? "y" : "x";
  const nonDiscrete = this._discrete.replace(this._discrete.charAt(0), other);
  const range = (this as any)[`_${nonDiscrete}Axis`]._d3Scale.range();
  const value = (this as any)[`_${nonDiscrete}`](d, i);
  const negative = value < 0;
  const zero = (this as any)[`_${nonDiscrete}Axis`]._getPosition(0);
  const space =
    nonDiscrete === "y"
      ? negative
        ? range[1] - zero
        : zero - range[0]
      : negative
        ? zero - range[0]
        : range[1] - zero;
  const pos = (this as any)[`_${nonDiscrete}Axis`]._getPosition(value);
  const size = Math.abs(negative ? zero - pos : pos - zero);
  return size < space / 2;
}

/**
    Creates an x/y plot based on an array of data.
*/
export default class Plot extends Viz {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

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
    this._axisPersist = plotDef.defaults.axisPersist as boolean;
    this._annotations = plotDef.defaults.annotations as any[];
    this._backgroundConfig = {
      duration: 0,
      fill: "transparent",
    };
    this._barPadding = plotDef.defaults.barPadding as number;
    this._buffer = assign({}, defaultBuffers, {Bar: false, Line: false});
    this._confidenceConfig = {
      fill: (d: any, i: any) => {
        const c =
          typeof this._shapeConfig.Line.stroke === "function"
            ? this._shapeConfig.Line.stroke(d, i)
            : this._shapeConfig.Line.stroke;
        return c;
      },
      fillOpacity: constant(0.5),
    };
    this._discreteCutoff = plotDef.defaults.discreteCutoff as number;
    this._groupPadding = plotDef.defaults.groupPadding as number;
    this._labelConnectorConfig = {
      strokeDasharray: "1 1",
    };
    this._labelPosition = constant("auto");
    this._lineMarkerConfig = {
      fill: (d: any, i: any) => colorAssign(this._id(d, i)),
      r: constant(3),
    };
    this._lineMarkers = plotDef.defaults.lineMarkers as boolean;
    this._previousAnnotations = {back: [], front: []};
    this._previousShapes = [];
    this._shape = plotDef.defaults.shape;
    this._shapeConfig = assign(this._shapeConfig, {
      Area: {
        label: (d: any, i: any) => (this._stacked ? this._drawLabel(d, i) : false),
        labelBounds: (d: any, i: any, aes: any) => {
          let r = largestRect(aes.points, {angle: range(-20, 20, 5)});
          if (!r || r.height < 20 || r.width < 50)
            r = largestRect(aes.points, {angle: range(-80, 80, 5)});
          if (!r) return null;
          const x = min(aes.points, (d: any) => d[0]) as unknown as number;
          const y = max(
            aes.points.filter((d: any) => d[0] === x),
            (d: any) => d[1],
          ) as unknown as number;
          return {
            angle: r.angle,
            width: r.width,
            height: r.height,
            x: r.cx - r.width / 2 - x,
            y: r.cy - r.height / 2 - y,
          };
        },
        labelConfig: {
          fontMin: 6,
          fontResize: true,
          padding: 10,
        },
      },
      ariaLabel: (d: any, i: any) => {
        let ariaLabelStr = "";
        if (d.nested) ariaLabelStr = `${this._drawLabel(d.data, d.i)}`;
        else {
          ariaLabelStr = `${this._drawLabel(d, i)}`;
          if (this._x(d, i) !== undefined)
            ariaLabelStr += `, x: ${this._x(d, i)}`;
          if (this._y(d, i) !== undefined)
            ariaLabelStr += `, y: ${this._y(d, i)}`;
          if (this._x2(d, i) !== undefined)
            ariaLabelStr += `, x2: ${this._x2(d, i)}`;
          if (this._y2(d, i) !== undefined)
            ariaLabelStr += `, y2: ${this._y2(d, i)}`;
        }
        return `${ariaLabelStr}.`;
      },
      Bar: {
        labelBounds(this: any, d: any, i: any, s: any) {
          const padding = 1;

          const width = this._discrete === "y" ? "width" : "height";
          const height = this._discrete === "y" ? "height" : "width";

          const other = this._discrete.charAt(0) === "x" ? "y" : "x";
          const invert = other === "y";
          const nonDiscrete = this._discrete.replace(
            this._discrete.charAt(0),
            other,
          );
          const range = (this as any)[`_${nonDiscrete}Axis`]._d3Scale.range();
          const space = Math.abs(range[1] - range[0]);
          const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;

          if (outside.bind(this)(d, i)) {
            return {
              [width]: space - s[width],
              [height]: s[height],
              x: invert ? -s.width / 2 : negative ? -space : s.width + padding,
              y: invert
                ? negative
                  ? s.height + padding
                  : -space
                : -s.height / 2 + 1,
            };
          }
          return {
            [width]: s[width],
            [height]: s[height],
            x: invert
              ? -s.width / 2
              : negative
                ? this._stacked
                  ? padding - s.width
                  : padding - s.width
                : -padding,
            y: invert
              ? negative
                ? this._stacked
                  ? padding
                  : padding
                : -s.height + padding
              : -s.height / 2 + padding,
          };
        },
        labelConfig: {
          fontMax: 16,
          fontMin: 6,
          fontResize: true,
          fontColor(this: any, d: any, i: any) {
            if (outside.bind(this)(d, i)) {
              const bg: string = this._backgroundConfig.fill === "transparent"
                ? backgroundColor(this._select.node())
                : this._backgroundConfig.fill;
              return colorContrast(bg);
            }
            return colorContrast(
              typeof this._shapeConfig.fill === "function"
                ? this._shapeConfig.fill(d, i)
                : this._shapeConfig.fill,
            );
          },
          fontStroke(this: any, d: any, i: any) {
            if (outside.bind(this)(d, i)) {
              const bg: string = this._backgroundConfig.fill === "transparent"
                ? backgroundColor(this._select.node())
                : this._backgroundConfig.fill;
              return colorContrast(bg);
            }
            return "transparent";
          },
          fontStrokeWidth(this: any, d: any, i: any) {
            return outside.bind(this)(d, i) ? 0.1 : 0;
          },
          padding: 3,
          textAnchor(this: any, d: any, i: any): string {
            const other = this._discrete.charAt(0) === "x" ? "y" : "x";
            const invert = other === "y";
            const nonDiscrete: string = this._discrete.replace(
              this._discrete.charAt(0),
              other,
            );
            const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;
            const anchor = invert
              ? "middle"
              : outside.bind(this)(d, i)
                ? negative
                  ? "end"
                  : "start"
                : negative
                  ? "start"
                  : "end";
            return rtl()
              ? anchor === "start"
                ? "end"
                : anchor === "end"
                  ? "start"
                  : anchor
              : anchor;
          },
          verticalAlign(this: any, d: any, i: any): string {
            const other = this._discrete.charAt(0) === "x" ? "y" : "x";
            const invert = other === "y";
            const nonDiscrete: string = this._discrete.replace(
              this._discrete.charAt(0),
              other,
            );
            const negative = (this as any)[`_${nonDiscrete}`](d, i) < 0;
            return invert
              ? outside.bind(this)(d, i)
                ? negative
                  ? "top"
                  : "bottom"
                : negative
                  ? "bottom"
                  : "top"
              : "middle";
          },
        },
      },
      Circle: {
        r: defaultSize.bind(this),
      },
      Line: {
        curve: () =>
          this._discrete
            ? `monotone${this._discrete.charAt(0).toUpperCase()}`
            : "linear",
        fill: constant("none"),
        labelConfig: {
          fontColor: (d: any, i: any) => {
            const c =
              typeof this._shapeConfig.Line.stroke === "function"
                ? this._shapeConfig.Line.stroke(d, i)
                : this._shapeConfig.Line.stroke;
            return colorLegible(c);
          },
          fontResize: false,
          padding: 5,
          textAnchor: "start",
          verticalAlign: "middle",
        },
        strokeWidth: constant(2),
      },
      Rect: {
        height: (d: any) => defaultSize.bind(this)(d) * 2,
        width: (d: any) => defaultSize.bind(this)(d) * 2,
      },
    });
    this._shapeOrder = ["Area", "Path", "Bar", "Box", "Line", "Rect", "Circle"];
    this._shapeSort = (a: any, b: any) =>
      this._shapeOrder.indexOf(a) - this._shapeOrder.indexOf(b);
    this._sizeMax = 20;
    this._sizeMin = 5;
    this._sizeScale = "sqrt";
    this._stackOffset = stackOffsetDiverging;
    this._stackOrder = stackOrderDescending;
    this._timelineConfig = assign(this._timelineConfig, {
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
        stroke: (d: any) => {
          if (this._discrete && this._discrete.charAt(0) === "x")
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
    this._xCutoff = 150;

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
        stroke: (d: any) => {
          if (this._discrete && this._discrete.charAt(0) === "y")
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
    this._yCutoff = 150;

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
        if (!this._aggs[str] && this._discrete === k) {
          this._aggs[str] = (a: any, c: any) => {
            const v = Array.from(new Set(a.map(c)));
            return v.length === 1 ? v[0] : v;
          };
        }

        // set axis title if not discrete
        if (
          str !== k &&
          this[`_${k}Title`] === this[`_${k}Config`].title &&
          this._discrete !== k
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
      three forward into `this._on[event](d.data, d.i, x, event)`. Extracted
      from Plot._paint so the chart-level event wiring is in one place.
  */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _wirePlotShapeEvents(shape: any, shapeKey: string, events: string[]) {
    const classEvents = events.filter(e => e.includes(`.${shapeKey}`));
    const globalEvents = events.filter(e => !e.includes("."));
    const shapeEvents = events.filter(e => e.includes(".shape"));
    for (const evt of globalEvents) {
      shape.on(evt, ((d: any, i: any, x: any, event: any) =>
        this._on[evt](d.data, d.i, x, event)) as any);
    }
    for (const evt of shapeEvents) {
      shape.on(evt, ((d: any, i: any, x: any, event: any) =>
        this._on[evt](d.data, d.i, x, event)) as any);
    }
    for (const evt of classEvents) {
      shape.on(evt, ((d: any, i: any, x: any, event: any) =>
        this._on[evt](d.data, d.i, x, event)) as any);
    }
  }

  /**
      Extends the draw behavior of the abstract Viz class.
      @private
*/
  _draw(callback?: () => void) {
    if (!this._filteredData.length && !this._annotations.length) return this;

    // Throwaway measure-only axes. Allocated per draw, configured + measured
    // below, then garbage-collected when _draw returns. Replaces the persistent
    // `this._xTest`/etc. fields — Plot no longer owns long-lived Axis instances
    // just to compute layout. gridSize(0)
    // signals "labels-only" measure: the production axes (`_xAxis`,
    // `_yAxis`, …) handle grid rendering with their default gridSize.
    const xTest = new AxisBottom().align("end").gridSize(0);
    const x2Test = new AxisTop().align("start").gridSize(0);
    const yTest = new AxisLeft().align("start").gridSize(0);
    const y2Test = new AxisLeft().align("end").gridSize(0);

    // Plot's data-format + time-axis + sizeScale prep extracted to the
    // `formatPlotData` TransformStage, and per-axis values extracted to
    // `computePlotAxisValues`. Both run here; downstream paint code reads
    // their outputs from the returned context.
    const plotCtx = runStages({viz: this} as any, [
      formatPlotData,
      computePlotAxisValues,
    ]) as {
      plotFormattedData: any[];
      plotAxisData: any[];
      x2Exists: boolean;
      y2Exists: boolean;
      xData: any[];
      x2Data: any[];
      yData: any[];
      y2Data: any[];
    };
    const data = plotCtx.plotFormattedData;
    const axisData = plotCtx.plotAxisData;
    const {x2Exists, y2Exists, xData, x2Data, yData, y2Data} = plotCtx;
    const stackGroup = (plotCtx as any).plotStackGroup as (d: any, i: number) => string;
    // Time flags (xTime/x2Time/yTime/y2Time) are written onto `this` by
    // `formatPlotData` and read directly via `this._xTime` etc. in the
    // remainder of `_draw`.

    const height = this._height - this._margin.top - this._margin.bottom,
      opp = this._discrete ? (this._discrete === "x" ? "y" : "x") : undefined,
      // `opps`/`opp2` previously used inline for log/baseline domain
      // adjustments — that's now part of `computePlotScales`. `opp` is still
      // read by the stacking branch below.
      parent = this._select,
      transition = this._transition,
      width = this._width - this._margin.left - this._margin.right;

    // xData/x2Data/yData/y2Data computed by `computePlotAxisValues` stage.

    // Stacked/non-stacked domain construction + domain/scale setup are stages
    // on `plotDef`. Run them together and read all the outputs the paint phase
    // below needs.
    const layoutCtx = runStages({
      viz: this,
      plotFormattedData: data,
      plotAxisData: axisData,
      xData,
      x2Data,
      yData,
      y2Data,
      plotStackGroup: stackGroup,
    } as any, [computePlotInitialDomains, computePlotScales]) as {
      plotInitialDomains: Record<string, any[]>;
      plotDiscreteKeys: any[];
      plotStackData: any[];
      plotStackKeys: any[];
      plotDomains: Record<string, any[]>;
      plotScales: any;
      plotConfigScales: any;
      plotOpps: any;
    };
    let domains = layoutCtx.plotDomains;
    let discreteKeys = layoutCtx.plotDiscreteKeys;
    let stackData = layoutCtx.plotStackData;
    let stackKeys = layoutCtx.plotStackKeys;
    let {x, y, x2, y2} = layoutCtx.plotScales;
    const {xScale, yScale} = layoutCtx.plotScales;
    const {xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = layoutCtx.plotConfigScales;

    const shapeData = groups(
      data,
      (d: Record<string, unknown>) => d.shape as string,
    ).sort(([a], [b]) => this._shapeSort(a, b));

    // Opposite-axis scale extension via buffers lives in the
    // `extendPlotOppScales` stage. Reassigns x/y/x2/y2 from the stage's
    // returned scales bundle.
    const extCtx = runStages({
      viz: this,
      plotFormattedData: data,
      plotAxisData: axisData,
      plotScales: {...layoutCtx.plotScales, x, y, x2, y2},
      plotConfigScales: layoutCtx.plotConfigScales,
    } as any, [extendPlotOppScales]) as {plotScales: any};
    x = extCtx.plotScales.x;
    y = extCtx.plotScales.y;
    x2 = extCtx.plotScales.x2;
    y2 = extCtx.plotScales.y2;

    // Axis-layout-prep lives in `preparePlotAxisLayout`.
    // Produces xDomain/yDomain/etc., defaultConfig/showX/showY, yC, barLabels,
    // and the four ticks arrays (null when ticks show, [] when redundant).
    const prepCtx = runStages({
      viz: this,
      plotAxisData: axisData,
      plotScales: {...layoutCtx.plotScales, x, y, x2, y2},
      x2Exists,
      y2Exists,
      x2Data,
      y2Data,
      yData,
    } as any, [preparePlotAxisLayout]) as {
      plotDefaultConfig: any;
      plotDefaultX2Config: any;
      plotDefaultY2Config: any;
      plotShowX: boolean;
      plotShowY: boolean;
      plotYC: any;
      plotBarLabels: string[];
      plotXTicks: any[] | null;
      plotX2Ticks: any[] | null;
      plotYTicks: any[] | null;
      plotY2Ticks: any[] | null;
      plotXDomain: any[];
      plotX2Domain: any[];
      plotYDomain: any[];
      plotY2Domain: any[];
    };
    const xDomain = prepCtx.plotXDomain;
    const x2Domain = prepCtx.plotX2Domain;
    const yDomain = prepCtx.plotYDomain;
    const y2Domain = prepCtx.plotY2Domain;
    const defaultConfig = prepCtx.plotDefaultConfig;
    const defaultX2Config = prepCtx.plotDefaultX2Config;
    const defaultY2Config = prepCtx.plotDefaultY2Config;
    const showX = prepCtx.plotShowX;
    const showY = prepCtx.plotShowY;
    const yC = prepCtx.plotYC;
    let xTicks = prepCtx.plotXTicks;
    let x2Ticks = prepCtx.plotX2Ticks;
    let yTicks = prepCtx.plotYTicks;
    let y2Ticks = prepCtx.plotY2Ticks;
    const barLabels = prepCtx.plotBarLabels;

    // Test axes use `.measure()` instead of `.select(testGroup).render()` —
    // pure layout pass, zero DOM creation. Eliminates the entire `g.d3plus-plot-test`
    // DOM subtree the legacy code temporarily attached to `this._select`.
    if (showY) {
      yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range([undefined, undefined])
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(this._yConfig)
        .scale(yConfigScale)
        .measure();
    }

    let yBounds = yTest.outerBounds();
    let yWidth = yBounds.width
      ? yBounds.width + yTest.padding()
      : undefined;

    if (y2Exists) {
      y2Test
        .domain(y2Domain)
        .height(height)
        .range([undefined, undefined])
        .ticks(y2Ticks)
        .width(width)
        .config(yC)
        .config(defaultY2Config)
        .config(this._y2Config)
        .scale(y2ConfigScale)
        .measure();
    }

    let y2Bounds = y2Test.outerBounds();
    let y2Width = y2Bounds.width
      ? y2Bounds.width + y2Test.padding()
      : undefined;
    const xC: Record<string, unknown> = {
      data: xData,
      locale: this._locale,
      rounding: this._xDomain ? "none" : "outside",
      scalePadding: x.padding ? x.padding() : 0,
    };
    if (!showY && showX) {
      xC.barConfig = {stroke: "transparent"};
      xC.tickSize = 0;
      xC.shapeConfig = {
        labelBounds: (d: any, i: any) => {
          const {height, y} = d.labelBounds;
          const width = this._width / 2;
          const x = i ? -width : 0;
          return {x, y, width, height};
        },
        labelConfig: {
          padding: 0,
          rotate: 0,
          textAnchor: (d: any) => (xTicks && d.id === xTicks[0] ? "start" : "end"),
        },
        labelRotation: false,
      };
    }

    let xRangeMax = undefined;

    if (showX) {
      xTest
        .domain(xDomain)
        .height(height)
        .maxSize(height / 2)
        .range([undefined, xRangeMax])
        .ticks(xTicks)
        .width(width)
        .config(xC)
        .config(this._xConfig)
        .scale(xConfigScale)
        .measure();
    }

    // Line-label width measurement lives in the `measurePlotLineLabels`
    // stage. Pre-measured test axes + label test shapes are passed via
    // context. `showLineLabels` is still read by the shape-emission block
    // downstream.
    const showLineLabels = this._lineLabels && !y2Exists;
    const lineLabelCtx = runStages({
      viz: this,
      plotFormattedData: data,
      plotScales: layoutCtx.plotScales,
      plotConfigScales: layoutCtx.plotConfigScales,
      plotTestAxes: {xTest, yTest},
      plotLineLabelTest: {testLineShape, testTextBox},
      y2Exists,
    } as any, [measurePlotLineLabels]) as {
      plotLabelWidths: any[];
      plotLargestLabel: number | undefined;
      plotXRangeMax: number | undefined;
    };
    const labelWidths = lineLabelCtx.plotLabelWidths;
    const largestLabel = lineLabelCtx.plotLargestLabel;
    if (lineLabelCtx.plotXRangeMax !== undefined)
      xRangeMax = lineLabelCtx.plotXRangeMax;

    if (showX && xRangeMax) {
      xTest
        .domain(xDomain)
        .height(height)
        .maxSize(height / 2)
        .range([undefined, xRangeMax])
        .ticks(xTicks)
        .width(width)
        .config(xC)
        .config(this._xConfig)
        .scale(xConfigScale)
        .measure();
    }

    if (x2Exists) {
      x2Test
        .domain(x2Domain)
        .height(height)
        .range([undefined, xRangeMax])
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .tickSize(0)
        .config(defaultX2Config)
        .config(this._x2Config)
        .scale(x2ConfigScale)
        .measure();
    }

    const xTestRange = xTest._getRange();
    const x2TestRange = x2Test._getRange();

    const x2Bounds = x2Test.outerBounds();
    const x2Height = x2Exists ? x2Bounds.height + x2Test.padding() : 0;

    let xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (showX) {
      xTest.range([xOffsetLeft, undefined]).measure();
    }

    const topOffset = showY
      ? yTest.shapeConfig().labelConfig.fontSize() / 2
      : 0;

    let xOffsetRight = max([
      y2Width,
      width - xTestRange[1],
      width - x2TestRange[1],
    ]);
    const xBounds = xTest.outerBounds();
    const xHeight = xBounds.height + (showY ? xTest.padding() : 0);

    this._padding.left += xOffsetLeft;
    this._padding.right += xOffsetRight;
    this._padding.bottom += xHeight;
    this._padding.top += x2Height + topOffset;

    (super._draw as (...args: unknown[]) => unknown)(callback);
    const horizontalMargin = this._margin.left + this._margin.right;
    const verticalMargin = this._margin.top + this._margin.bottom;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pCtx: any = {domains, shapeData, axisData, data, discreteKeys, stackData, stackKeys, x, y, x2, y2, xScale, yScale, xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale, xDomain, yDomain, x2Domain, y2Domain, xData, yData, x2Data, y2Data, x2Exists, y2Exists, showX, showY, defaultConfig, defaultX2Config, defaultY2Config, yC, xC, xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, largestLabel, xRangeMax, xTest, yTest, x2Test, y2Test, yBounds, y2Bounds, yWidth, y2Width, xHeight, x2Height, xOffsetLeft, xOffsetRight, topOffset, xTestRange, x2TestRange, height, width, parent, transition, opp, barLabels, showLineLabels, stackGroup, horizontalMargin, verticalMargin};
    return this._paint(pCtx);
  }

  /**
      Paint phase: production axis rendering, shape buffer setup, and shape
      emission with event handlers. Receives all cross-phase locals from
      _draw via `pCtx` (so this method has zero coupling to _draw's local
      scope beyond the explicit context).
  */
  /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
  _paint(pCtx: any) {
    // Paint phase. All cross-phase locals captured from _draw's pre-super
    // pipeline + measure work are received via `pCtx`. Body below is the
    // original imperative paint code (axis painting, shape buffer setup,
    // shape emission with event handlers), unchanged in semantics — just
    // moved to its own method so the data/paint boundary is explicit.
    //
    // The destructure is split into themed chunks as a table of contents:
    // readers can scan the categories instead of memorizing 40 names.
    /* eslint-disable @typescript-eslint/no-explicit-any */
    // Data & domain inputs (computed by formatPlotData / computePlotInitialDomains).
    const {data, shapeData, axisData, domains, discreteKeys, stackData, stackKeys, xData, yData, x2Data, y2Data, xDomain, yDomain, x2Domain, y2Domain} = pCtx;
    // Accessors / scales (from computePlotScales). `x`/`y` are reassigned
    // below where Plot caches the resolved accessors back onto `this._xFunc`
    // / `this._yFunc`; the other names are read-only.
    let {x, y} = pCtx;
    const {x2, y2, xScale, yScale, xConfigScale, yConfigScale, x2ConfigScale, y2ConfigScale} = pCtx;
    // Axis configs & visibility flags.
    const {defaultConfig, defaultX2Config, defaultY2Config, showX, showY, x2Exists, y2Exists, xC, yC} = pCtx;
    // Axis measurements (from preparePlotAxisLayout): tick values + label
    // bounds + test-axis bounds. `xTicks`/`yTicks`/`x2Ticks`/`y2Ticks` carried
    // by `pCtx`; reads pass through directly.
    const {xTicks, yTicks, x2Ticks, y2Ticks, labelWidths, largestLabel, xRangeMax, xTest, yTest, x2Test, y2Test, xTestRange, x2TestRange} = pCtx;
    // Layout offsets & viewport. `yBounds`/`yWidth`/`xOffsetLeft`/`y2Bounds`/
    // `y2Width`/`xOffsetRight` are *re*-computed below from the production
    // axes; the initial values from `pCtx` are the throwaway test-axis
    // measurements and get overwritten in this method's body.
    let {yBounds, y2Bounds, yWidth, y2Width, xOffsetLeft, xOffsetRight} = pCtx;
    const {xHeight, x2Height, topOffset, height, width, horizontalMargin, verticalMargin} = pCtx;
    // Paint plumbing (DOM parent + transition + stack accumulator + label flags).
    const {parent, transition, opp, barLabels, showLineLabels, stackGroup} = pCtx;
    /* eslint-enable @typescript-eslint/no-explicit-any */

    let yRange = [x2Height, height - (xHeight + topOffset + verticalMargin)];

    if (showY) {
      yTest
        .domain(yDomain)
        .height(height)
        .maxSize(width / 2)
        .range(yRange)
        .ticks(yTicks)
        .width(width)
        .config(yC)
        .config(this._yConfig)
        .scale(yConfigScale)
        .measure();
    }

    yBounds = yTest.outerBounds();
    yWidth = yBounds.width ? yBounds.width + yTest.padding() : undefined;
    xOffsetLeft = max([yWidth, xTestRange[0], x2TestRange[0]]);

    if (y2Exists) {
      y2Test
        .config(yC)
        .domain(y2Domain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - y2Width])!)
        .title(false)
        .config(this._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .measure();
    }

    y2Bounds = y2Test.outerBounds();
    y2Width = y2Bounds.width
      ? y2Bounds.width + y2Test.padding()
      : undefined;
    xOffsetRight = max([
      0,
      y2Width,
      width - xTestRange[1],
      width - x2TestRange[1],
    ]);
    const xRange = [xOffsetLeft, width - (xOffsetRight + horizontalMargin)];

    // Legacy `g.d3plus-plot-background` removed in v4. The background Rect
    // (when fill != "transparent") absorbs into `_chartScene` directly —
    // since `_chartScene` is wrapped with `_chartTransform = (margin.left,
    // margin.top + x2Height + topOffset)`, the rect's coords are passed
    // RELATIVE to that origin. See the absorb call further down.

    // Capture the shape-group offset so `_chartScene` nodes appear at the
    // same position legacy `g.d3plus-plot-shapes` had.
    this._chartTransform = {
      x: this._margin.left,
      y: this._margin.top + x2Height + topOffset,
    };

    // Per-axis absolute transforms (legacy values). Stored so we can derive
    // each axis's transform RELATIVE to `_chartTransform` when absorbing
    // axis scenes into `_chartScene` (the chart-cells group already applies
    // _chartTransform). The 4 legacy `g.d3plus-plot-{x,x2,y,y2}-axis` elem()
    // calls are gone — axes are scene-only in v4 (`renderMode("compute")`
    // creates a detached svg behind the scenes; `axis.toScene()` produces
    // the visible output).
    const xTrans = xOffsetLeft > yWidth ? xOffsetLeft - yWidth : 0;
    const axisAbsoluteTransforms = {
      x: {x: this._margin.left, y: this._margin.top + x2Height + topOffset},
      x2: {x: this._margin.left, y: this._margin.top + topOffset},
      y: {x: this._margin.left + xTrans, y: this._margin.top + topOffset},
      y2: {x: -this._margin.right, y: this._margin.top + topOffset},
    };
    const axisRelativeTransform = (which: "x" | "x2" | "y" | "y2") => ({
      x: axisAbsoluteTransforms[which].x - this._chartTransform!.x,
      y: axisAbsoluteTransforms[which].y - this._chartTransform!.y,
    });
    // Queued axis scenes — pushed onto `_chartScene` AFTER the shape loop
    // so axes render ABOVE shapes (preserving legacy DOM z-order).
    const axisSceneQueue: {key: string; transform: {x: number; y: number}; axis: any}[] = [];

    this._xAxis
      .renderMode("compute")
      .select(undefined as unknown as HTMLElement)
      .domain(xDomain)
      .height(height - (x2Height + topOffset + verticalMargin))
      .maxSize(height / 2)
      .range(xRange)
      .ticks(xTicks)
      .width(width)
      .config(xC)
      .config(this._xConfig)
      .scale(xConfigScale)
      .render();
    if (showX) {
      axisSceneQueue.push({
        key: "plot-x-axis",
        transform: axisRelativeTransform("x"),
        axis: this._xAxis,
      });
    }

    if (x2Exists) {
      this._x2Axis
        .renderMode("compute")
        .select(undefined as unknown as HTMLElement)
        .domain(x2Domain)
        .height(height - (xHeight + topOffset + verticalMargin))
        .range(xRange)
        .ticks(x2Ticks)
        .width(width)
        .config(xC)
        .config(defaultX2Config)
        .config(this._x2Config)
        .scale(x2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-x2-axis",
        transform: axisRelativeTransform("x2"),
        axis: this._x2Axis,
      });
    }

    this._xFunc = x = (d: any, x: any) => {
      if (x === "x2") {
        if (x2ConfigScale === "log" && d === 0)
          d =
            x2Domain[0] < 0
              ? this._x2Axis._d3Scale.domain()[1]
              : this._x2Axis._d3Scale.domain()[0];
        return this._x2Axis._getPosition.bind(this._x2Axis)(d);
      } else {
        if (xConfigScale === "log" && d === 0)
          d =
            xDomain[0] < 0
              ? this._xAxis._d3Scale.domain()[1]
              : this._xAxis._d3Scale.domain()[0];
        return this._xAxis._getPosition.bind(this._xAxis)(d);
      }
    };

    yRange = [
      this._xAxis.outerBounds().y + x2Height,
      height - (xHeight + topOffset + verticalMargin),
    ];

    this._yAxis
      .renderMode("compute")
      .select(undefined as unknown as HTMLElement)
      .domain(yDomain)
      .height(height)
      .maxSize(width / 2)
      .range(yRange)
      .ticks(yTicks)
      .width(xRange[xRange.length - 1])
      .config(yC)
      .config(this._yConfig)
      .scale(yConfigScale)
      .render();
    if (showY) {
      axisSceneQueue.push({
        key: "plot-y-axis",
        transform: axisRelativeTransform("y"),
        axis: this._yAxis,
      });
    }

    if (y2Exists) {
      this._y2Axis
        .renderMode("compute")
        .select(undefined as unknown as HTMLElement)
        .config(yC)
        .domain(y2Exists ? y2Domain : yDomain)
        .gridSize(0)
        .height(height)
        .range(yRange)
        .width(width - max([0, xOffsetRight - y2Width])!)
        .title(false)
        .config(this._y2Config)
        .config(defaultY2Config)
        .scale(y2ConfigScale)
        .render();
      axisSceneQueue.push({
        key: "plot-y2-axis",
        transform: axisRelativeTransform("y2"),
        axis: this._y2Axis,
      });
    }

    let labelPositions = {};
    if (labelWidths) {
      groups(labelWidths as any[], (d: any) => d.xValue).forEach(([, values]) => {
        const minFontSize = max(values.map((d: any) => d.fontSize));
        const yBuckets = range(yRange[0], yRange[1], minFontSize).reverse();
        const bumpLimit = (yRange[1] - yRange[0]) / 8;

        /***/
        function bumpPrevious(this: any, d: any, i: any, arr: any) {
          if (!d.defaultY) d.defaultY = this._yAxis._getPosition(d.value);
          if (i) {
            const prev = arr[i - 1];
            const {fontSize, padding} = d;
            const y = d.newY || d.defaultY;
            const prevY = prev.newY || prev.defaultY;
            if (y - fontSize / 2 - padding < prevY) {
              const newY = yBuckets.find(n => n < prevY);
              const change = d.defaultY - newY!;
              if (change < bumpLimit) {
                prev.newY = newY;
                if (i) bumpPrevious(prev, i - 1, arr);
              }
            }
          }
        }

        values.forEach(bumpPrevious.bind(this));
      });

      labelPositions = (labelWidths as any[]).reduce((obj: any, d: any) => {
        if (d.newY) obj[d.id] = d.newY;
        return obj;
      }, {});
    }

    this._yFunc = y = (d: any, y: any) => {
      if (y === "y2") {
        if (y2ConfigScale === "log" && d === 0)
          d =
            y2Domain[1] < 0
              ? this._y2Axis._d3ScaleNegative.domain()[0]
              : this._y2Axis._d3Scale.domain()[1];
        return this._y2Axis._getPosition.bind(this._y2Axis)(d) - x2Height;
      } else {
        if (yConfigScale === "log" && d === 0)
          d =
            yDomain[1] < 0
              ? this._yAxis._d3ScaleNegative.domain()[0]
              : this._yAxis._d3Scale.domain()[1];
        return this._yAxis._getPosition.bind(this._yAxis)(d) - x2Height;
      }
    };

    let yOffset = this._xAxis.barConfig()["stroke-width"];
    if (yOffset) yOffset /= 2;

    // Background Rect: skip rendering when transparent (the default) — under
    // the v4 scene path it would emit a 5th `rect.d3plus-render-rect` that
    // confuses bar-counting tests. When a user customizes
    // `backgroundConfig.fill` to a real color, render it normally.
    if (this._backgroundConfig.fill && this._backgroundConfig.fill !== "transparent") {
      // Coords are relative to `_chartTransform` (margin.left, margin.top +
      // x2Height + topOffset). Legacy used absolute coords; we subtract the
      // chart-transform offset so the absorbed scene rect lands at the same
      // visual position. yRange[0] = x2Height (see line ~940), so the y
      // simplification is (yRange[1] - yRange[0]) / 2.
      const bgRect = new shapes.Rect()
        .renderMode("compute")
        .data([{}])
        .x(xRange[0] - this._margin.left + (xRange[1] - xRange[0]) / 2)
        .width(xRange[1] - xRange[0])
        .y((yRange[1] - yRange[0]) / 2)
        .height(yRange[1] - yRange[0])
        .config(this._backgroundConfig);
      bgRect.render();
      // Prepend so the background sits BEHIND chart shapes.
      const before = (this._chartScene || []).slice();
      this._chartScene = [];
      absorbShapeIntoChartScene(this, bgRect);
      this._chartScene.push(...before);
    }

    const labelConnectors = (labelWidths as any[]).filter((d: any) => d.newY !== undefined);
    if (labelConnectors.length) {
      const data = labelConnectors
        .map(d =>
          assign(
            {
              x: this._xAxis._getPosition.bind(this._xAxis)(d.xValue),
              y: d.defaultY,
            },
            d,
          ),
        )
        .concat(
          labelConnectors.map(d =>
            assign(
              {
                x:
                  this._xAxis._getPosition.bind(this._xAxis)(d.xValue) +
                  d.padding -
                  1,
                y: d.newY || d.defaultY,
              },
              d,
            ),
          ),
        );

      // Connector lines: compute-mode emit → absorbed into _chartScene. The
      // legacy `g.d3plus-plot-connectors` group is gone; the chart-wide
      // `_chartTransform` provides the same positioning the legacy group's
      // transform did.
      const connectorLine = new shapes.Line()
        .config({
          data: data as DataPoint[],
          stroke: (d: any) => d.fontColor,
          x: (d: any) => d.x,
          y: (d: any) => d.y,
        })
        .config(this._labelConnectorConfig)
        .renderMode("compute");
      connectorLine.render();
      absorbShapeIntoChartScene(this, connectorLine);
    }

    // Legacy `g.d3plus-plot-annotations` / `g.d3plus-plot-annotations-front`
    // groups removed in v4. Annotations now run in `renderMode("compute")`
    // and their scenes are absorbed into `_chartScene`. Layering: "back"
    // annotations absorb here (before the main shape loop below); "front"
    // annotations queue and absorb AFTER the shape loop (preserving the
    // legacy z-order: back → shapes → front).
    const frontAnnotationShapes: any[] = [];
    const renderAnnotation = (annotation: any) => {
      const inst = new (shapes as any)[annotation.shape]()
        .renderMode("compute")
        .duration(this._duration)
        .config(annotation)
        .config({
          x: (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          x0:
            this._discrete === "x"
              ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
              : x(domains.x[0]),
          x1:
            this._discrete === "x"
              ? null
              : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
          y: (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y)),
          y0:
            this._discrete === "y"
              ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
              : y(domains.y[1]) - yOffset,
          y1:
            this._discrete === "y"
              ? null
              : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
        });
      inst.render();
      return inst;
    };

    Object.keys(this._previousAnnotations).forEach(layer => {
      const annotationData = this._annotations.filter(
        (d: any) => (layer === "back" && !d.layer) || d.layer === layer,
      );
      const annotationShapes = annotationData.map((d: any) => d.shape);
      annotationData.forEach((annotation: any) => {
        const inst = renderAnnotation(annotation);
        if (layer === "front") frontAnnotationShapes.push(inst);
        else absorbShapeIntoChartScene(this, inst);
      });
      // Exits: render with empty data in compute mode so their scenes go
      // empty; no DOM to clean up in v4.
      const exitAnnotations = this._previousAnnotations[layer].filter(
        (d: any) => !annotationShapes.includes(d),
      );
      exitAnnotations.forEach((shape: any) => {
        new (shapes as any)[shape]()
          .renderMode("compute")
          .data([])
          .render();
      });

      this._previousAnnotations[layer] = annotationShapes;
    });

    const discrete = this._discrete || "x";

    const shapeConfig = {
      discrete: this._discrete,
      duration: this._duration,
      label: (d: any) => this._drawLabel(d.data, d.i),
      x: (d: any) => (d.x2 !== undefined ? x(d.x2, "x2") : x(d.x)),
      x0:
        discrete === "x"
          ? (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x))
          : x(
              typeof this._baseline === "number"
                ? this._baseline
                : domains.x[0],
            ),
      x1: discrete === "x" ? null : (d: any) => (d.x2 ? x(d.x2, "x2") : x(d.x)),
      y: (d: any) => (d.y2 !== undefined ? y(d.y2, "y2") : y(d.y)),
      y0:
        discrete === "y"
          ? (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y))
          : y(
              typeof this._baseline === "number"
                ? this._baseline
                : domains.y[1],
            ) - yOffset,
      y1:
        discrete === "y"
          ? null
          : (d: any) => (d.y2 ? y(d.y2, "y2") : y(d.y) - yOffset),
    };

    const events = Object.keys(this._on);
    shapeData.forEach(([key, values]) => {
      const d = {key, values};
      const shapeConfigInner = Object.assign({}, shapeConfig);
      if (this._stacked && ["Area", "Bar"].includes(d.key)) {
        const scale = opp === "x" ? x : y;
        (shapeConfigInner as any)[`${opp}`] = (shapeConfigInner as any)[`${opp}0`] = (d: any) => {
          const dataIndex = stackKeys.indexOf(d.id),
            discreteIndex = discreteKeys.indexOf(d.discrete);
          const scaleIndex = d[opp!] < 0 ? 1 : 0;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
        (shapeConfigInner as any)[`${opp}1`] = (d: any) => {
          const dataIndex = stackKeys.indexOf(d.id),
            discreteIndex = discreteKeys.indexOf(d.discrete);
          const scaleIndex = d[opp!] < 0 ? 0 : 1;
          return dataIndex >= 0
            ? scale(stackData[dataIndex][discreteIndex][scaleIndex])
            : scale(domains[opp!][opp === "x" ? 0 : 1]);
        };
      }

      const s = new (shapes as any)[d.key]()
        .renderMode("compute")
        .config(shapeConfigInner)
        .data(d.values);

      if (d.key === "Bar") {
        let space;
        const scale = this._discrete === "x" ? x : y;
        const scaleType = this._discrete === "x" ? xScale : yScale;
        const vals = this._discrete === "x" ? xDomain : yDomain;
        const range = this._discrete === "x" ? xRange : yRange;
        if (scaleType !== "Point" && vals.length === 2) {
          const allPositions = Array.from(
            new Set(d.values.map((d: any) => scale(d[this._discrete as string]))),
          );
          allPositions.unshift(
            (range[0] as number) -
              (allPositions[0] as number) -
              (range[0] as number),
          );
          allPositions.push(
            (range[1] as number) +
              (range[1] as number) -
              (allPositions[allPositions.length - 1] as number),
          );
          space = allPositions.reduce((n: number, d, i, arr) => {
            if (i) {
              const dist = Math.abs((d as number) - (arr[i - 1] as number));
              if (dist < n) n = dist;
            }
            return n;
          }, Infinity);
        } else if (vals.length > 1) space = scale(vals[1]) - scale(vals[0]);
        else space = range[range.length - 1] - range[0];
        if (this._groupPadding < space) space -= this._groupPadding;

        let barSize = space || 1;

        const barGroups = groups(
          d.values as Record<string, unknown>[],
          (d: Record<string, unknown>) => d[this._discrete],
          (d: Record<string, unknown>) => d.group,
        );

        const ids = merge(
          barGroups.map(([, innerEntries]) => innerEntries.map(([k]) => k)),
        );
        const uniqueIds = Array.from(new Set(ids));

        if (
          max(barGroups.map(([, innerEntries]) => innerEntries.length)) === 1
        ) {
          (s as any)[this._discrete]((d: any, i: any) => (shapeConfig as any)[this._discrete](d, i));
        } else {
          barSize =
            (barSize - this._barPadding * uniqueIds.length - 1) /
            uniqueIds.length;

          const offset = space / 2 - barSize / 2;

          const xMod = scales
            .scaleLinear()
            .domain([0, uniqueIds.length - 1])
            .range([-offset, offset]);

          (s as any)[this._discrete](
            (d: any, i: any) =>
              (shapeConfig as any)[this._discrete](d, i) +
              xMod(uniqueIds.indexOf(d.group)),
          );
        }

        s.width(barSize);
        s.height(barSize);
      } else if (d.key === "Line") {
        s.duration(width * 1.5);

        if (this._confidence) {
          const areaConfig = Object.assign({}, shapeConfig);
          const discrete = this._discrete || "x";
          const key = discrete === "x" ? "y" : "x";
          const scaleFunction = discrete === "x" ? y : x;
          (areaConfig as any)[`${key}0`] = (d: any) =>
            scaleFunction(this._confidence[0] ? d.lci : d[key]);
          (areaConfig as any)[`${key}1`] = (d: any) =>
            scaleFunction(this._confidence[1] ? d.hci : d[key]);

          const area = new shapes.Area()
            .renderMode("compute")
            .config(areaConfig)
            .data(d.values as DataPoint[]);
          const confidenceConfig = Object.assign(
            this._shapeConfig,
            this._confidenceConfig,
          );

          area
            .config(
              assign(
                shapeConfigFor(this, "Line", confidenceConfig),
                shapeConfigFor(this, "Area", confidenceConfig),
              ) as any,
            )
            .render();

          absorbShapeIntoChartScene(this, area);
        }

        s.config({
          discrete: shapeConfig.discrete || "x",
          label: showLineLabels
            ? (d: any, i: any) => {
                const visible =
                  typeof this._lineLabels === "function"
                    ? this._lineLabels(d.data, d.i)
                    : true;
                if (!visible) return false;
                const labelData = labelWidths.find(l => l.id === d.id);
                if (labelData) {
                  const yPos = labelData.newY || labelData.defaultY;
                  const allLabels = labelWidths.filter(l => l.newY === yPos);
                  if (allLabels.length > 1)
                    return allLabels[0].id !== d.id
                      ? false
                      : `+${formatAbbreviate(
                          allLabels.length,
                          this._locale,
                        )} ${this._translate("more")}`;
                  return this._drawLabel(d, i);
                }
                return false;
              }
            : false,
          labelBounds: showLineLabels
            ? (d: any, i: any, s: any) => {
                const [firstX, firstY] = s.points[0];
                const [lastX, lastY] = s.points[s.points.length - 1];
                const height = this._height / 4;
                const mod = (labelPositions as any)[d.id]
                  ? lastY - (labelPositions as any)[d.id]
                  : 0;
                return {
                  x: lastX - firstX,
                  y: lastY - firstY - height / 2 - mod,
                  width: largestLabel,
                  height,
                };
              }
            : false,
        });
      }

      this._wirePlotShapeEvents(s, d.key, events);

      const userConfig = shapeConfigFor(this, d.key);
      if (this._shapeConfig.duration === undefined) delete userConfig.duration;
      s.config(userConfig as any).render();

      absorbShapeIntoChartScene(this, s);

      if (d.key === "Line") {
        const markers = new shapes.Circle()
          .renderMode("compute")
          .data(this._lineMarkers ? (d.values as DataPoint[]) : [])
          .config(shapeConfig)
          .config(this._lineMarkerConfig)
          .id(d => `${d.id}_${d.discrete}`);

        this._wirePlotShapeEvents(markers, "Circle", events);
        markers.render();
        absorbShapeIntoChartScene(this, markers);
      }
    });

    const dataShapes = shapeData.map(([key]) => key);
    if (dataShapes.includes("Line")) {
      if (this._confidence) dataShapes.push("Area");
      if (this._lineMarkers) dataShapes.push("Circle");
    }
    const exitShapes = this._previousShapes.filter(
      (d: any) => !dataShapes.includes(d),
    );

    exitShapes.forEach((shape: any) => {
      new (shapes as any)[shape]().config(shapeConfig).data([]).render();
    });

    this._previousShapes = dataShapes;

    // Absorb queued front annotations AFTER the shape loop so they render
    // above shapes (preserving the legacy "front" z-order).
    frontAnnotationShapes.forEach(inst => absorbShapeIntoChartScene(this, inst));

    // Absorb queued axis scenes AFTER shapes + annotations so axes render
    // ABOVE everything else (matching the legacy DOM order: shapes →
    // annotations → axis groups appended last). Each axis is wrapped in a
    // group with its axis-relative transform; the chart-cells group's
    // `_chartTransform` composes with this to land at the legacy absolute
    // position.
    axisSceneQueue.forEach(({key, transform, axis}) => {
      if (!axis || typeof axis.toScene !== "function") return;
      const scene = axis.toScene();
      if (!scene) return;
      (this._chartScene ||= []).push({
        type: "group",
        key,
        transform,
        children: scene.children || [],
      });
    });

    return this;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */

  /**
      Allows drawing custom shapes to be used as annotations in the provided x/y plot. This method accepts custom config objects for the [Shape](http://d3plus.org/docs/#Shape) class, either a single config object or an array of config objects. Each config object requires an additional parameter, the "shape", which denotes which [Shape](http://d3plus.org/docs/#Shape) sub-class to use ([Rect](http://d3plus.org/docs/#Rect), [Line](http://d3plus.org/docs/#Line), etc).

Additionally, each config object can also contain an optional "layer" key, which defines whether the annotations will be displayed in "front" or in "back" of the primary visualization shapes. This value defaults to "back" if not present.
*/
  annotations(_: any) {
    return arguments.length
      ? ((this._annotations = _ instanceof Array ? _ : [_]), this)
      : this._annotations;
  }

  /**
      Determines whether the x and y axes should have their scales persist while users filter the data, the timeline being the prime example (set this to `true` to make the axes stay consistent when the timeline changes).
*/
  axisPersist(_: any) {
    return arguments.length
      ? ((this._axisPersist = _), this)
      : this._axisPersist;
  }

  /**
       A d3plus-shape configuration Object used for styling the background rectangle of the inner x/y plot (behind all of the shapes and gridlines).
*/
  backgroundConfig(_: any) {
    return arguments.length
      ? ((this._backgroundConfig = assign(this._backgroundConfig, _)), this)
      : this._backgroundConfig;
  }

  // barPadding(_: any): installed by installFluent(this, plotSchema).
  // baseline(_: any): installed by installFluent(this, plotSchema).

  /**
      Determines whether or not to add additional padding at the ends of x or y scales. The most commone use for this is in Scatter Plots, so that the shapes do not appear directly on the axis itself. The value provided can either be `true` or `false` to toggle the behavior for all shape types, or a keyed Object for each shape type (ie. `{Bar: false, Circle: true, Line: false}`).
*/
  buffer(_: any) {
    if (arguments.length) {
      if (!_) this._buffer = {};
      else if (_ === true) this._buffer = defaultBuffers;
      else {
        this._buffer = assign({}, this._buffer, _);
        for (const key in this._buffer) {
          if ((this._buffer as any)[key] === true)
            (this._buffer as any)[key] = (defaultBuffers as any)[key];
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
  confidence(_: any) {
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
  confidenceConfig(_: any) {
    return arguments.length
      ? ((this._confidenceConfig = assign(this._confidenceConfig, _)), this)
      : this._confidenceConfig;
  }

  /**
      When the width or height of the chart is less than or equal to this pixel value, the discrete axis will not be shown. This helps produce slick sparklines. Set this value to `0` to disable the behavior entirely.
*/
  discreteCutoff(_: any) {
    return arguments.length
      ? ((this._discreteCutoff = _), this)
      : this._discreteCutoff;
  }

  /**
      The pixel space between groups of bars.
*/
  groupPadding(_: any) {
    return arguments.length
      ? ((this._groupPadding = _), this)
      : this._groupPadding;
  }

  /**
       The d3plus-shape config used on the Line shapes created to connect lineLabels to the end of their associated Line path.
*/
  labelConnectorConfig(_: any) {
    return arguments.length
      ? ((this._labelConnectorConfig = assign(this._labelConnectorConfig, _)),
        this)
      : this._labelConnectorConfig;
  }

  /**
      The behavior to be used when calculating the position and size of each shape's label(s). The value passed can either be the _String_ name of the behavior to be used for all shapes, or an accessor _Function_ that will be provided each data point and will be expected to return the behavior to be used for that data point. The availability and options for this method depend on the default logic for each Shape. As an example, the values "outside" or "inside" can be set for Bar shapes, whose "auto" default will calculate the best position dynamically based on the available space.
*/
  labelPosition(_: any) {
    return arguments.length
      ? ((this._labelPosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._labelPosition;
  }

  // lineLabels(_: any): installed by installFluent(this, plotSchema).

  /**
      Shape config for the Circle shapes drawn by the lineMarkers method.
*/
  lineMarkerConfig(_: any) {
    return arguments.length
      ? ((this._lineMarkerConfig = assign(this._lineMarkerConfig, _)), this)
      : this._lineMarkerConfig;
  }

  /**
      Draws circle markers on each vertex of a Line.
*/
  lineMarkers(_: any) {
    return arguments.length
      ? ((this._lineMarkers = _), this)
      : this._lineMarkers;
  }

  // shapeSort(_: any): installed by installFluent(this, plotSchema).

  /**
      Sets the size of bubbles to the given Number, data key, or function.
*/
  size(_: any) {
    return arguments.length
      ? ((this._size = typeof _ === "function" || !_ ? _ : accessor(_)), this)
      : this._size;
  }

  // sizeMax(_: any): installed by installFluent(this, plotSchema).
  // sizeMin(_: any): installed by installFluent(this, plotSchema).
  // sizeScale(_: any): installed by installFluent(this, plotSchema).
  // stacked(_: any): installed by installFluent(this, plotSchema).

  /**
      Sets the stack offset. If *value* is not specified, returns the current stack offset function.
*/
  stackOffset(_: any) {
    return arguments.length
      ? ((this._stackOffset =
          typeof _ === "function"
            ? _
            : (d3Shape as any)[`stackOffset${_.charAt(0).toUpperCase() + _.slice(1)}`]),
        this)
      : this._stackOffset;
  }

  /**
      Sets the stack order. If *value* is not specified, returns the current stack order function.
*/
  stackOrder(_: any) {
    if (arguments.length) {
      if (typeof _ === "string")
        this._stackOrder =
          _ === "ascending"
            ? stackOrderAscending
            : _ === "descending"
              ? stackOrderDescending
              : (d3Shape as any)[`stackOrder${_.charAt(0).toUpperCase() + _.slice(1)}`];
      else this._stackOrder = _;
      return this;
    } else return this._stackOrder;
  }

  /**
      Accessor function or string key for the x-axis value of each data point.
*/
  x(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._x = _;
      else {
        this._x = accessor(_);
        this._xKey = _;
      }
      return this;
    } else return this._x;
  }

  /**
       Accessor function or string key for the secondary x-axis value of each data point.
*/
  x2(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._x2 = _;
      else {
        this._x2 = accessor(_);
        this._x2Key = _;
      }
      return this;
    } else return this._x2;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  xConfig(_: any) {
    return arguments.length
      ? ((this._xConfig = assign(this._xConfig, _)), this)
      : this._xConfig;
  }

  // xCutoff(_: any): installed by installFluent(this, plotSchema).

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary x-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  x2Config(_: any) {
    return arguments.length
      ? ((this._x2Config = assign(this._x2Config, _)), this)
      : this._x2Config;
  }

  // xDomain(_: any): installed by installFluent(this, plotSchema).
  // x2Domain(_: any): installed by installFluent(this, plotSchema).
  // xSort(_: any): installed by installFluent(this, plotSchema).
  // x2Sort(_: any): installed by installFluent(this, plotSchema).

  /**
      Accessor function or string key for the y-axis value of each data point.
*/
  y(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._y = _;
      else {
        this._y = accessor(_);
        this._yKey = _;
      }
      return this;
    } else return this._y;
  }

  /**
       Accessor function or string key for the secondary y-axis value of each data point.
*/
  y2(_: any) {
    if (arguments.length) {
      if (typeof _ === "function") this._y2 = _;
      else {
        this._y2 = accessor(_);
        this._y2Key = _;
      }
      return this;
    } else return this._y2;
  }

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.

*Note:* If a "domain" array is passed to the y-axis config, it will be reversed.
*/
  yConfig(_: any) {
    if (arguments.length) {
      if (_.domain) _.domain = _.domain.slice().reverse();
      this._yConfig = assign(this._yConfig, _);
      return this;
    }
    return this._yConfig;
  }

  // yCutoff(_: any): installed by installFluent(this, plotSchema).

  /**
      A pass-through to the underlying [Axis](http://d3plus.org/docs/#Axis) config used for the secondary y-axis. Includes additional functionality where passing "auto" as the value for the [scale](http://d3plus.org/docs/#Axis.scale) method will determine if the scale should be "linear" or "log" based on the provided data.
*/
  y2Config(_: any) {
    if (arguments.length) {
      if (_.domain) _.domain = _.domain.slice().reverse();
      this._y2Config = assign(this._y2Config, _);
      return this;
    }
    return this._y2Config;
  }

  // yDomain(_: any): installed by installFluent(this, plotSchema).
  // y2Domain(_: any): installed by installFluent(this, plotSchema).
  // ySort(_: any): installed by installFluent(this, plotSchema).
  // y2Sort(_: any): installed by installFluent(this, plotSchema).
}
