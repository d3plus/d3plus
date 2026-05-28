import {group, max, merge as arrayMerge, min, range, rollup} from "d3-array";
import {brush} from "d3-brush";
import {color} from "d3-color";
import {select} from "d3-selection";
import {scaleOrdinal} from "d3-scale";
import {zoom} from "d3-zoom";

import {colorAssign, colorContrast, colorDefaults} from "@d3plus/color";
import {addToQueue, merge, unique} from "@d3plus/data";
import {assign, date, getSize, inViewport} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {
  ColorScale,
  Legend,
  TextBox,
  Timeline,
  Tooltip,
} from "../components/index.js";
import {CanvasRenderer, SvgRenderer} from "@d3plus/render";
import type {Scene, SceneNode, Transform} from "@d3plus/render";
import {accessor, BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
// import {Rect} from "../shape/index.js";

import Message from "../components/Message.js";

// E4: Viz's identity-coerce accessor schema. installFluent installs methods on
// Viz.prototype (once via WeakSet) so BaseClass.config() reflection picks them
// up. Constructor assignments below seed defaults (e.g. `this._duration = 600`);
// installFluent skips slots already set, so constructor values win.
const vizSchema = [
  {key: "ariaHidden", coerce: "identity" as const},
  {key: "cache", coerce: "identity" as const},
  {key: "dataCutoff", coerce: "identity" as const},
  {key: "depth", coerce: "identity" as const},
  {key: "discrete", coerce: "identity" as const},
  {key: "duration", coerce: "identity" as const},
  {key: "filter", coerce: "identity" as const},
  {key: "height", coerce: "identity" as const},
  {key: "legendSort", coerce: "identity" as const},
  {key: "svgDesc", coerce: "identity" as const},
  {key: "svgTitle", coerce: "identity" as const},
  {key: "timeFilter", coerce: "identity" as const},
  {key: "timeline", coerce: "identity" as const},
  {key: "width", coerce: "identity" as const},
  {key: "zoom", coerce: "identity" as const},
  {key: "zoomFactor", coerce: "identity" as const},
  {key: "zoomMax", coerce: "identity" as const},
  {key: "zoomPan", coerce: "identity" as const},
  {key: "zoomScroll", coerce: "identity" as const},
];

import {legendLabel} from "./legendLabel.js";
import {runVizPipeline} from "./runVizPipeline.js";

import {
  backFeature,
  colorScaleFeature,
  legendFeature,
  runLayout,
  subtitleFeature,
  timelineFeature,
  titleFeature,
  totalFeature,
} from "./features.js";

import clickShape from "./events/click.shape.js";
import clickLegend from "./events/click.legend.js";
import mouseenter from "./events/mouseenter.js";
import mouseleave from "./events/mouseleave.js";
import mousemoveLegend from "./events/mousemove.legend.js";
import mousemoveShape from "./events/mousemove.shape.js";
import touchstartBody from "./events/touchstart.body.js";

function debounce(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  func: (...args: any[]) => void,
  delay: number,
): (...args: unknown[]) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: unknown, ...args: unknown[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}

/**
 * Default padding logic that will return false if the screen is less than 600 pixels wide.
 * @private
 */
function defaultPadding(): boolean {
  return typeof window !== "undefined" ? window.innerWidth > 600 : true;
}

/**
 * Turns an array of values into a list string.
 * @private
 */
function listify(n: DataPoint[keyof DataPoint][]): string {
  return n.reduce<string>(
    (str: string, item: DataPoint[keyof DataPoint], i: number) => {
      if (!i) str += item;
      else if (i === n.length - 1 && i === 1) str += ` and ${item}`;
      else if (i === n.length - 1) str += `, and ${item}`;
      else str += `, ${item}`;
      return str;
    },
    "",
  );
}

/**
 * A function that introspects the `d` Data Object for internally nested
 * d3plus data and indices, runs the accessor function on that user data.
 * @param {Function} acc Accessor function to use.
 * @param {Object} d Data Object
 * @param {Number} i Index of Data Object in Array
 * @private
 */
function accessorFetch(
  acc: (d: DataPoint, i: number) => DataPoint[keyof DataPoint],
  d: DataPoint,
  i: number,
): DataPoint[keyof DataPoint] {
  while (d.__d3plus__ && d.data) {
    d = d.data as DataPoint;
    i = d.i as number;
  }
  return acc(d, i);
}

/**
    Minimal LRU cache backed by a Map (insertion-order iteration enables O(1) eviction).
    Only .get() and .set() are used by Viz.
    @private
*/
class LRU {
  private _cap: number;
  private _map: Map<string, unknown>;

  constructor(capacity: number) {
    this._cap = capacity;
    this._map = new Map();
  }
  get(key: string): unknown {
    if (!this._map.has(key)) return undefined;
    const val = this._map.get(key);
    this._map.delete(key);
    this._map.set(key, val);
    return val;
  }
  set(key: string, val: unknown): void {
    this._map.delete(key);
    if (this._map.size >= this._cap)
      this._map.delete(this._map.keys().next().value!);
    this._map.set(key, val);
  }
}

/**
    Creates an x/y plot based on an array of data. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.
*/
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class Viz extends (BaseClass as any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    this._aggs = {};
    // E4: install identity-coerce accessors on the prototype. The imperative
    // `this._x = …` assignments below seed defaults; installFluent's "skip
    // if slot already set" guard respects them. Methods are visible to
    // BaseClass.config()'s `getAllMethods` reflection.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    installFluent(this as any, vizSchema);
    // v4: `renderer()` selects the @d3plus/render backend. Default
    // `"svg"` (SvgRenderer); `"canvas"` for large N via CanvasRenderer.
    // The legacy DOM-only opt-out was removed — scene mode is THE path.
    this._renderer = "svg";
    this._renderMode = "full";
    this._ariaHidden = true;
    this._attribution = false;
    const attributionBg = "rgba(255, 255, 255, 0.75)";
    this._attributionStyle = {
      background: attributionBg,
      border: "1px solid rgba(0, 0, 0, 0.25)",
      color: colorContrast(attributionBg),
      display: "block",
      font: `400 11px/11px ${fontFamilyStringify(fontFamily)}`,
      margin: "5px",
      opacity: 0.75,
      padding: "4px 6px 3px",
    };
    this._backClass = new TextBox()
      .on("click", () => {
        if (this._history.length) this.config(this._history.pop()).render();
        else (this.depth(this._drawDepth - 1) as this).filter(false);
        this.render();
      })
      .on("mousemove", () =>
        this._backClass.select().style("cursor", "pointer"),
      );
    this._backConfig = {
      fontSize: 10,
      padding: 5,
      resize: false,
    };
    this._cache = true;

    this._color = (d: DataPoint, i: number) => this._groupBy[0](d, i);
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

    this._legend = (config: Record<string, unknown>, arr: DataPoint[]) => {
      const maxGrouped = max(arr, (d: DataPoint, i: number) => {
        const id = this._groupBy[this._legendDepth].bind(this)(d, i);
        return id instanceof Array ? id.length : 1;
      });
      return arr.length > 1 && (maxGrouped ?? 0) <= 2;
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
    this._legendSort = (a: DataPoint, b: DataPoint) =>
      this._drawLabel(a).localeCompare(this._drawLabel(b));
    this._legendTooltip = {};

    this._loadingHTML = () => `
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
      <strong>${this._translate("Loading Visualization")}</strong>
      <sub style="bottom: 0; display: block; line-height: 1; margin-top: 5px;"><a href="https://d3plus.org" target="_blank">${this._translate(
        "Powered by D3plus",
      )}</a></sub>
    </div>`;

    this._loadingMessage = true;
    this._lrucache = new LRU(10);
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
      debounce((entries: ResizeObserverEntry[]) => {
        const {width, height} = entries[0]!.contentRect;
        if (
          ((width !== this._width && this._autoWidth) || (height !== this._height && this._autoHeight)) &&
          width &&
          height
        ) {
          this._setSVGSize(width, height);
          if (!this._callback) this.render();
        }
      }, this._detectResizeDelay),
    );
    this._scrollContainer = typeof window === "undefined" ? "" : window;
    this._shape = constant("Rect");
    this._shapes = [];
    this._shapeConfig = {
      ariaLabel: (d: DataPoint, i: number) => this._drawLabel(d, i),
      fill: (d: DataPoint, i: number) => {
        while (d.__d3plus__ && d.data) {
          d = d.data as DataPoint;
          i = d.i as number;
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
          this._colorDefaults,
        );
      },
      labelConfig: {
        fontColor: (d: DataPoint, i: number) => {
          const c =
            typeof this._shapeConfig.fill === "function"
              ? this._shapeConfig.fill(d, i)
              : this._shapeConfig.fill;
          return colorContrast(c);
        },
      },
      opacity: constant(1),
      stroke: (d: DataPoint, i: number) => {
        const c =
          typeof this._shapeConfig.fill === "function"
            ? this._shapeConfig.fill(d, i)
            : this._shapeConfig.fill;
        return color(c)!.darker(0.25);
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
    this._totalFormat = (d: number) =>
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
    const zoomBg = "rgba(255, 255, 255, 0.75)";
    this._zoomControlStyle = {
      background: zoomBg,
      border: "1px solid rgba(0, 0, 0, 0.75)",
      color: colorContrast(zoomBg),
      display: "block",
      font: `900 15px/21px ${fontFamilyStringify(fontFamily)}`,
      height: "20px",
      margin: "5px",
      opacity: 0.75,
      padding: 0,
      "text-align": "center",
      width: "20px",
    };
    const zoomActiveBg = "rgba(0, 0, 0, 0.75)";
    this._zoomControlStyleActive = {
      background: zoomActiveBg,
      color: colorContrast(zoomActiveBg),
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
   Called by draw before anything is drawn. Formats the data and performs preparations for draw.
   @private
   */
  _preDraw(): void {
    const that = this;
    // based on the groupBy, determine the draw depth and current depth id
    this._drawDepth =
      this._depth !== void 0
        ? min([this._depth >= 0 ? this._depth : 0, this._groupBy.length - 1])
        : this._groupBy.length - 1;

    // Returns the current unique ID for a data point, coerced to a String.
    this._id = (d: DataPoint, i: number) => {
      const groupByDrawDepth = accessorFetch(
        this._groupBy[this._drawDepth],
        d,
        i,
      );
      return typeof groupByDrawDepth === "number"
        ? `${groupByDrawDepth}`
        : groupByDrawDepth;
    };

    // Returns an array of the current unique groupBy ID for a data point, coerced to Strings.
    this._ids = (d: DataPoint, i: number) =>
      this._groupBy
        .map(
          (g: (d: DataPoint, i: number) => DataPoint[keyof DataPoint]) =>
            `${accessorFetch(g, d, i)}`,
        )
        .filter(Boolean);

    this._drawLabel = (
      d: DataPoint,
      i: number,
      depth: number = this._drawDepth,
    ) => {
      if (!d) return "";
      while (d.__d3plus__ && d.data) {
        d = d.data as DataPoint;
        i = d.i as number;
      }
      if (d._isAggregation) {
        return `${this._thresholdName(d, i)} < ${formatAbbreviate(
          (d._threshold as number) * 100,
          this._locale,
        )}%`;
      }
      if (this._label && depth === this._drawDepth)
        return `${this._label(d, i)}`;
      const l = that._ids(d, i).slice(0, depth + 1);
      const n =
        l.reverse().find((ll: string) => !((ll as unknown) instanceof Array)) ||
        l[l.length - 1];
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
        const latestTime = +max(dates)!;
        this._timeFilter = (d: DataPoint, i: number) =>
          +date(this._time(d, i))! === latestTime;
      }
    }

    this._filteredData = [];
    this._legendData = [];
    let flatData: DataPoint[] = [];
    if (this._data.length) {
      flatData = this._timeFilter
        ? this._data.filter(this._timeFilter)
        : this._data;
      if (this._filter) flatData = flatData.filter(this._filter);
      const nestKeys: ((
        d: DataPoint,
        i: number,
      ) => DataPoint[keyof DataPoint])[] = [];
      for (let i = 0; i <= this._drawDepth; i++)
        nestKeys.push(this._groupBy[i]);
      if (this._discrete && `_${this._discrete}` in this)
        nestKeys.push(this[`_${this._discrete}`]);
      if (this._discrete && `_${this._discrete}2` in this)
        nestKeys.push(this[`_${this._discrete}2`]);

      const tree = rollup(
        flatData,
        (leaves: DataPoint[]) => {
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
        ...nestKeys,
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
      Composes a backend-agnostic scene graph from the shapes/features produced
      by the most recent render. Combines:
      - `_chartScene` (cells from `chartDef.emit`) wrapped in viz-chart-cells
      - legacy `_shapes` (still used by some charts) — each shape's toScene
      - chart-level components (Legend/ColorScale/Timeline) via their toScene
      - `_featurePanels` (from FeatureModule layouts) wrapped in viz-features
  */
  toScene(): Scene {
    const children: SceneNode[] = [];
    // Chart cells emitted via `chartDef.emit(ctx)` and stashed on _chartScene.
    if (this._chartScene && this._chartScene.length) {
      children.push({
        type: "group",
        key: "viz-chart-cells",
        ...(this._chartTransform ? {transform: this._chartTransform} : {}),
        children: this._chartScene.slice(),
      });
    }
    // Legacy `_shapes` collection (Treemap/Pack/etc. moved off this; Plot's
    // `absorbShapeIntoChartScene` also routes through `_chartScene`).
    (this._shapes || []).forEach((shape: any, si: number) => {
      if (!shape || typeof shape.toScene !== "function") return;
      const group = shape.toScene();
      let transform: Transform | undefined;
      const sel = shape._select;
      if (sel && typeof sel.attr === "function")
        transform = parseTranslate(sel.attr("transform"));
      children.push({
        type: "group",
        key: `${group.key || "shape"}-${si}`,
        ...(transform ? {transform} : {}),
        children: group.children,
      });
    });
    // Chart-level components that have their own toScene.
    const components: [string, any][] = [
      ["legend", this._legendClass],
      ["colorScale", this._colorScaleClass],
      ["timeline", this._timelineClass],
    ];
    for (const [name, comp] of components) {
      if (
        comp &&
        typeof comp.toScene === "function" &&
        comp._select &&
        typeof comp._select.node === "function" &&
        comp._select.node()
      ) {
        children.push({
          type: "group",
          key: `viz-${name}`,
          children: [comp.toScene()],
        });
      }
    }
    // E2: FeatureModule.layout() panels (title/subtitle/total/back).
    if (this._featurePanels && this._featurePanels.length) {
      children.push({
        type: "group",
        key: "viz-features",
        children: this._featurePanels.slice(),
      });
    }
    return {
      width: this._width,
      height: this._height,
      root: {type: "group", key: "viz-root", children},
    };
  }

  /**
      Called by render once all checks are passed.
      @private
  */
  _draw(): void {
    // E2: reset feature-emitted scene panels at the start of each draw.
    this._featurePanels = [];
    // Charts that drive emit() (Treemap/Pack/etc.) populate `_chartScene`
    // from within `_draw`. Reset on every draw.
    this._chartScene = [];
    this._chartTransform = undefined;
    // Sanitizes user input for legendPosition and colorScalePosition
    let legendPosition = this._legendPosition.bind(this)(this.config());
    if (![false, "top", "bottom", "left", "right"].includes(legendPosition))
      legendPosition = "bottom";
    let colorScalePosition = this._colorScalePosition.bind(this)(this.config());
    if (![false, "top", "bottom", "left", "right"].includes(colorScalePosition))
      colorScalePosition = "bottom";

    // E2: legend (left/right) and colorScale (left/right/hidden) lay out
    // first so the chart body and top-anchored features (title etc.) see
    // their margin claim.
    if (legendPosition === "left" || legendPosition === "right") {
      const claim = runLayout({viz: this} as any, [legendFeature]);
      this._margin.left += claim.margin.left;
      this._margin.right += claim.margin.right;
    }
    if (
      colorScalePosition === "left" ||
      colorScalePosition === "right" ||
      colorScalePosition === false
    ) {
      const claim = runLayout({viz: this} as any, [colorScaleFeature]);
      this._margin.left += claim.margin.left;
      this._margin.right += claim.margin.right;
    }

    // E2: back / title / subtitle / total / timeline / attribution all run
    // through the layout engine. Each feature returns a panel + margin claim;
    // subsequent features see the updated margin and position themselves
    // accordingly.
    const topBlocks = runLayout({viz: this} as any, [
      backFeature,
      titleFeature,
      subtitleFeature,
      totalFeature,
    ]);
    this._featurePanels.push(...topBlocks.panels);
    this._margin.top += topBlocks.margin.top;
    const timelineClaim = runLayout({viz: this} as any, [timelineFeature]);
    this._margin.bottom += timelineClaim.margin.bottom;

    // E2: legend (top/bottom) and colorScale (top/bottom).
    if (legendPosition === "top" || legendPosition === "bottom") {
      const claim = runLayout({viz: this} as any, [legendFeature]);
      this._margin.top += claim.margin.top;
      this._margin.bottom += claim.margin.bottom;
    }
    if (colorScalePosition === "top" || colorScalePosition === "bottom") {
      const claim = runLayout({viz: this} as any, [colorScaleFeature]);
      this._margin.top += claim.margin.top;
      this._margin.bottom += claim.margin.bottom;
    }

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
  _thresholdFunction(data: DataPoint[], _tree?: unknown): DataPoint[] {
    return data;
  }

  /**
   * Detects width and height and sets SVG properties
   * @private
   */
  _setSVGSize(width?: number, height?: number): void {
    let [w, h] =
      width && height
        ? [width, height]
        : getSize(this._select.node().parentNode);
    w! -= parseFloat(this._select.style("border-left-width"));
    w! -= parseFloat(this._select.style("border-right-width"));
    h! -= parseFloat(this._select.style("border-top-width"));
    h! -= parseFloat(this._select.style("border-bottom-width"));
    
    if (this._autoWidth && this._width !== w) {
      this.width(w);
      this._select
        .style("width", `${this._width}px`)
        .attr("width", `${this._width}px`);
    }
    if (this._autoHeight && this._height !== h) {
      this.height(h);
      this._select
        .style("height", `${this._height}px`)
        .attr("height", `${this._height}px`);
    }
  }

  /**
      Draws the visualization given the specified configuration.
    @param callback Optional callback invoked after rendering completes.
  */
  render(callback?: () => void): this {
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
        this._select === void 0
          ? select("body")
              .insert("div", "#d3plus-portal")
              .style("height", "100dvh")
              .style("width", "100%")
              .style("min-height", "150px")
          : this._select;
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

    const parent = select(this._select.node().parentNode);

    this._select
      .attr("class", "d3plus-viz")
      .attr("aria-hidden", this._ariaHidden)
      .attr("aria-labelledby", `${this._uuid}-title ${this._uuid}-desc`)
      .attr("role", "img")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .style("position", "absolute")
      .style("top", parent.style("padding-top"))
      .style("left", parent.style("padding-left"))
      .transition()
      .duration(this._duration)
      .style(
        "width",
        this._width !== undefined ? `${this._width}px` : undefined,
      )
      .style(
        "height",
        this._height !== undefined ? `${this._height}px` : undefined,
      )
      .attr("width", this._width !== undefined ? `${this._width}px` : undefined)
      .attr(
        "height",
        this._height !== undefined ? `${this._height}px` : undefined,
      );

    // sets "position: relative" on the SVG parent if currently undefined
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
      const promises: Promise<void>[] = [];

      this._queue.forEach(
        (
          p: [
            (...args: unknown[]) => void,
            string,
            ((data: unknown) => unknown) | undefined,
            string,
          ],
        ) => {
          const cache = this._cache
            ? this._lrucache.get(`${p[3]}_${p[1]}`)
            : undefined;
          if (!cache) {
            promises.push(
              new Promise<void>(resolve => {
                p[0](p[1], p[2], p[3], (err: unknown) => {
                  if (err) console.error(err);
                  resolve();
                });
              }),
            );
          } else this[`_${p[3]}`] = p[2] ? p[2](cache) : cache;
        },
      );
      this._queue = [];

      if (this._loadingMessage && promises.length) {
        this._messageClass.render({
          container: this._select.node().parentNode,
          html: this._loadingHTML(this),
          mask: this._filteredData ? this._messageMask : false,
          style: this._messageStyle,
        });
      }

      Promise.all(promises).then(() => {
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
              : [],
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
            this._data instanceof Array ? range(0, this._data.length + 1) : [],
          );
        rows.exit().remove();
        const cells = rows
          .merge(rows.enter().append("text").attr("role", "row"))
          .selectAll("tspan")
          .data((d: number, i: number) =>
            columns.map((c: string) => ({
              role: i ? "cell" : "columnheader",
              text: i ? this._data[i - 1][c] : c,
            })),
          );
        cells.exit().remove();
        cells
          .merge(cells.enter().append("tspan"))
          .attr("role", (d: {role: string; text: string}) => d.role)
          .attr("dy", "-1000px")
          .html((d: {role: string; text: string}) => d.text);

        // Run the v4 chart pipeline. Extracted to a free function so the
        // "transform data → scene" boundary is callable without holding a
        // Viz instance (RFC §3.1 architectural seam). Lifecycle (DOM setup,
        // viewport detection, data loading, callback timing) stays on the
        // class because it's inherently instance-bound.
        runVizPipeline(this);

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

        if (callback)
          setTimeout(() => {
            callback();
            this._callback = undefined;
          }, this._duration + 100);
      });
    }

    // Attaches touchstart event listener to the BODY to hide the tooltip when the user touches any element without data
    select("body").on(`touchstart.${this._uuid}`, touchstartBody.bind(this));

    return this;
  }

  /**
      Selects which @d3plus/render backend paints the visible output
      (RFC §4.6). `"svg"` = SvgRenderer (default), `"canvas"` =
      CanvasRenderer.

      The legacy DOM-only opt-out (`false`) was removed in v4: scene mode
      is THE path, the class API just chooses between backends. Existing
      callers passing `false` get `"svg"` (the closest equivalent).
  */
  renderer(): "svg" | "canvas";
  renderer(_: "svg" | "canvas" | true | false): this;
  renderer(_?: "svg" | "canvas" | true | false): "svg" | "canvas" | this {
    if (!arguments.length) return this._renderer;
    // Normalize: true → "svg", false → "svg" (legacy opt-out removed).
    this._renderer = _ === "canvas" ? "canvas" : "svg";
    return this;
  }

  /**
      @deprecated Renamed to `renderer()` in v4 (RFC §4.6). Will be removed
      in v5. Forwards to the new accessor.
  */
  useSceneRenderer(): "svg" | "canvas";
  useSceneRenderer(_: "svg" | "canvas" | true | false): this;
  useSceneRenderer(_?: "svg" | "canvas" | true | false): "svg" | "canvas" | this {
    if (!arguments.length) return this.renderer();
    return this.renderer(_!);
  }

  /**
      "full" runs the legacy DOM enter/update/exit for every shape; "compute"
      skips DOM work and only populates the scene data (`_textData`,
      `_shapes[i]._select`, etc.) for `toScene()` to read. Set automatically by
      `renderScene` callers; users can also opt-in.
  */
  renderMode(): "full" | "compute";
  renderMode(_: "full" | "compute"): this;
  renderMode(_?: "full" | "compute"): "full" | "compute" | this {
    if (!arguments.length) return this._renderMode || "full";
    this._renderMode = _!;
    return this;
  }

  /**
      Public entry point that renders this chart through the @d3plus/render
      pluggable backends. The legacy compute happens via render() (in an svg
      auto-created inside the target div); SvgRenderer/CanvasRenderer paints
      the scene to the target. Returns `{renderer, scene}` so callers can
      interact with the renderer (e.g. for picking) or read the scene data.
  */
  async renderScene(
    target: Element,
    opts?: {kind?: "svg" | "canvas"},
  ): Promise<{renderer: Renderer; scene: Scene}> {
    const kind = opts?.kind || (this._renderer === "canvas" ? "canvas" : "svg");
    this._sceneTarget = target;
    this._renderer = kind;
    this.select(target as HTMLElement);
    await new Promise<void>(resolve => this.render(() => resolve()));
    return {
      renderer: this._sceneRenderer as Renderer,
      scene: this._lastSceneRendered as Scene,
    };
  }

  /**
      Renders this chart through the @d3plus/render pluggable backends. Called
      automatically by `render()`. The legacy
      compute path drew into `this._select` (an auto-created svg INSIDE the
      user's target div) — that svg becomes the off-stage detached compute
      svg. SvgRenderer mounts to the user's target div (the parent), as a
      sibling to the detached compute svg. The compute svg's children get
      cleared so only the scene output is visible.
  */
  _drawSceneToTarget(): void {
    const kind = this._renderer === "canvas" ? "canvas" : "svg";
    const legacySvg = this._select && this._select.node ? this._select.node() : null;
    if (!legacySvg) return;
    // Mount renderer INSIDE the user's `_select` (svg or div). Tests like
    // `svgA.querySelector('[data-key="viz-legend"]')` need the scene output
    // to live inside the user's container, not as a sibling.
    const userTarget = this._sceneTarget || legacySvg;
    if (!userTarget) return;
    const scene = this.toScene();
    const w = this._width || 400;
    const h = this._height || 300;
    // Reuse the renderer instance if it matches the kind, to avoid mount churn.
    if (
      !this._sceneRenderer ||
      this._sceneRenderer.kind !== kind ||
      this._sceneRenderer._target?.container !== userTarget
    ) {
      const Ctor = kind === "canvas" ? CanvasRenderer : SvgRenderer;
      this._sceneRenderer = new Ctor();
      this._sceneRenderer.mount({container: userTarget, width: w, height: h});
    } else {
      this._sceneRenderer.resize(w, h);
    }
    this._sceneRenderer.drawScene(scene, {duration: this._duration});
    this._lastSceneRendered = scene;
  }

  /**
      Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.
  */
  destroy(): this {
    this._resizeObserver.disconnect();
    this._tooltipClass.data([]).render();
    select("body").on(`touchstart.${this._uuid}`, null);
    return this;
  }

  /**
      The active callback function for highlighting shapes.
*/
  active(
    _?: ((d: DataPoint, i: number) => boolean) | false,
  ): this | ((d: DataPoint, i: number) => boolean) | false {
    this._active = _;

    if (this._shapeConfig.activeOpacity !== 1) {
      this._shapes.forEach((s: {active: (...args: unknown[]) => unknown}) => s.active(_));
      if (this._legend) this._legendClass.active(_);
    }

    return this;
  }

  /**
      Custom aggregation methods for each data key.
*/
  aggs(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._aggs = assign(this._aggs, _!)), this)
      : this._aggs;
  }

  // ariaHidden(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).
*/
  attribution(_?: string | boolean): this | string | boolean {
    return arguments.length
      ? ((this._attribution = _), this)
      : this._attribution;
  }

  /**
      Configuration object for the attribution style.
*/
  attributionStyle(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this._attributionStyle = assign(this._attributionStyle, _!)), this)
      : this._attributionStyle;
  }

  /**
      Configuration object for the back button.
*/
  backConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._backConfig = assign(this._backConfig, _!)), this)
      : this._backConfig;
  }

  // cache(_?: boolean): installed by installFluent(this, vizSchema).

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
      ? ((this._color = !_ || typeof _ === "function" ? _ : accessor(_)), this)
      : this._color;
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
      ? ((this._colorScale = !_ || typeof _ === "function" ? _ : accessor(_)),
        this)
      : this._colorScale;
  }

  /**
      A pass-through to the config method of ColorScale.
*/
  colorScaleConfig(
    _?: Record<string, unknown>,
  ): this | Record<string, unknown> {
    return arguments.length
      ? ((this._colorScaleConfig = assign(this._colorScaleConfig, _!)), this)
      : this._colorScaleConfig;
  }

  /**
      Tells the colorScale whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the colorScale appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  colorScalePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._colorScalePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._colorScalePadding;
  }

  /**
      Defines which side of the visualization to anchor the color scale. Acceptable values are `"top"`, `"bottom"`, `"left"`, `"right"`, and `false`. A `false` value will cause the color scale to not be displayed, but will still color shapes based on the scale.
*/
  colorScalePosition(
    _?: string | boolean | (() => string | boolean),
  ): this | string | boolean | (() => string | boolean) {
    return arguments.length
      ? ((this._colorScalePosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._colorScalePosition;
  }

  /**
      The maximum pixel size for drawing the color scale: width for horizontal scales and height for vertical scales.
*/
  colorScaleMaxSize(_?: number): this | number {
    return arguments.length
      ? ((this._colorScaleMaxSize = _), this)
      : this._colorScaleMaxSize;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addToQueue.bind(this as any)(_ as any, f, "data");
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

  // dataCutoff(_?: number): installed by installFluent(this, vizSchema).
  // depth(_?: number): installed by installFluent(this, vizSchema).

  /**
      If the width and/or height of a Viz is not user-defined, it is determined by the size of it's parent element. When this method is set to `true`, the Viz will listen for the `window.onresize` event and adjust it's dimensions accordingly.
*/
  detectResize(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._detectResize = _), this)
      : this._detectResize;
  }

  /**
      When resizing the browser window, this is the millisecond delay to trigger the resize event.
*/
  detectResizeDelay(_?: number): this | number {
    return arguments.length
      ? ((this._detectResizeDelay = _), this)
      : this._detectResizeDelay;
  }

  /**
      Toggles whether or not the Viz should try to detect if it visible in the current viewport. When this method is set to `true`, the Viz will only be rendered when it has entered the viewport either through scrolling or if it's display or visibility is changed.
*/
  detectVisible(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._detectVisible = _), this)
      : this._detectVisible;
  }

  /**
      The interval, in milliseconds, for checking if the visualization is visible on the page.
*/
  detectVisibleInterval(_?: number): this | number {
    return arguments.length
      ? ((this._detectVisibleInterval = _), this)
      : this._detectVisibleInterval;
  }

  // discrete(_?: string): installed by installFluent(this, vizSchema).

  /**
      Shows a button that allows for downloading the current visualization.
*/
  downloadButton(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._downloadButton = _), this)
      : this._downloadButton;
  }

  /**
      Sets specific options of the saveElement function used when downloading the visualization.
*/
  downloadConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._downloadConfig = assign(this._downloadConfig, _!)), this)
      : this._downloadConfig;
  }

  /**
      Defines which control group to add the download button into.
*/
  downloadPosition(_?: string): this | string {
    return arguments.length
      ? ((this._downloadPosition = _), this)
      : this._downloadPosition;
  }

  // duration(_?: number): installed by installFluent(this, vizSchema).
  // filter(_?: ((d, i) => boolean) | false): installed by installFluent(this, vizSchema).

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

      this._fontFamily = _;
      return this;
    }
    return this._fontFamily;
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
    if (!arguments.length) return this._groupBy;
    this._groupByRaw = _;
    const arr: (string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]))[] =
      _ instanceof Array ? _ : [_!];
    return (
      (this._groupBy = arr.map(
        (
          k: string | ((d: DataPoint, i: number) => DataPoint[keyof DataPoint]),
        ) => {
          if (typeof k === "function") return k;
          else {
            if (!this._aggs[k]) {
              this._aggs[k] = (
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

  // height(_?: number): installed by installFluent(this, vizSchema).

  /**
      Defines the color used for legend shapes when the corresponding grouping is hidden from display (by clicking on the legend).
*/
  hiddenColor(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this._hiddenColor = typeof _ === "function" ? _ : constant(_)), this)
      : this._hiddenColor;
  }

  /**
      Defines the opacity used for legend labels when the corresponding grouping is hidden from display (by clicking on the legend).
*/
  hiddenOpacity(
    _?: number | ((d: DataPoint, i: number) => number),
  ): this | number | ((d: DataPoint, i: number) => number) {
    return arguments.length
      ? ((this._hiddenOpacity = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._hiddenOpacity;
  }

  /**
      The hover callback function for highlighting shapes on mouseover.
*/
  hover(_?: ((d: DataPoint, i: number) => boolean) | false): this {
    let hoverFunction = (this._hover = _);

    if (this._shapeConfig.hoverOpacity !== 1 && _ !== undefined) {
      if (typeof _ === "function") {
        let shapeData = arrayMerge(
          this._shapes.map((s: {data: () => DataPoint[]}) => s.data()),
        );
        shapeData = shapeData.concat(this._legendClass.data());
        const activeData = _ ? (shapeData as DataPoint[]).filter(_ as (d: DataPoint) => boolean) : [];

        let activeIds: string[] = [];
        (activeData.map(this._ids) as string[][]).forEach((ids: string[]) => {
          for (let x = 1; x <= ids.length; x++) {
            activeIds.push(JSON.stringify(ids.slice(0, x)));
          }
        });
        activeIds = activeIds.filter(
          (id: string, i: number) => activeIds.indexOf(id) === i,
        );

        if (activeIds.length)
          hoverFunction = (d: DataPoint, i: number) =>
            activeIds.includes(JSON.stringify(this._ids(d, i)));
      }

      this._shapes.forEach((s: {hover: (...args: unknown[]) => unknown}) => s.hover(hoverFunction));
      if (this._legend) this._legendClass.hover(hoverFunction);
    }

    return this;
  }

  /**
      Accessor function or string key for the label of each data point.
*/
  label(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this._label = typeof _ === "function" ? _ : constant(_)), this)
      : this._label;
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
      ? ((this._legend = typeof _ === "function" ? _ : constant(_)), this)
      : this._legend;
  }

  /**
      Configuration object passed to the legend's config method.
*/
  legendConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._legendConfig = assign(this._legendConfig, _!)), this)
      : this._legendConfig;
  }

  /**
      Defines the click functionality of categorical legend squares. When set to false, clicking will hide that category and shift+clicking will solo that category. When set to true, clicking with solo that category and shift+clicking will hide that category.
*/
  legendFilterInvert(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._legendFilterInvert = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendFilterInvert;
  }

  /**
      Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  legendPadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._legendPadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendPadding;
  }

  /**
      Defines which side of the visualization to anchor the legend. Expected values are `"top"`, `"bottom"`, `"left"`, and `"right"`.
*/
  legendPosition(_?: string | (() => string)): this | string | (() => string) {
    return arguments.length
      ? ((this._legendPosition = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._legendPosition;
  }

  // legendSort(_?: (a, b) => number): installed by installFluent(this, vizSchema).

  /**
      Configuration object for the legend tooltip.
*/
  legendTooltip(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._legendTooltip = assign(this._legendTooltip, _!)), this)
      : this._legendTooltip;
  }

  /**
      The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
*/
  loadingHTML(
    _?: string | ((viz: Viz) => string),
  ): this | string | ((viz: Viz) => string) {
    return arguments.length
      ? ((this._loadingHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this._loadingHTML;
  }

  /**
      Toggles the visibility of the status message that is displayed when loading AJAX requests and displaying errors.
*/
  loadingMessage(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._loadingMessage = _), this)
      : this._loadingMessage;
  }

  /**
      The color of the mask displayed underneath the status message when loading AJAX requests and displaying errors. Set to `false` to turn off the mask completely.
*/
  messageMask(_?: string | boolean): this | string | boolean {
    return arguments.length
      ? ((this._messageMask = _), this)
      : this._messageMask;
  }

  /**
      Defines the CSS style properties for the status message that is displayed when loading AJAX requests and displaying errors.
*/
  messageStyle(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._messageStyle = assign(this._messageStyle, _!)), this)
      : this._messageStyle;
  }

  /**
      The inner HTML of the status message displayed when no data is supplied to the visualization. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
*/
  noDataHTML(
    _?: string | ((viz: Viz) => string),
  ): this | string | ((viz: Viz) => string) {
    return arguments.length
      ? ((this._noDataHTML = typeof _ === "function" ? _ : constant(_)), this)
      : this._noDataHTML;
  }

  /**
     Toggles the visibility of the status message that is displayed when no data is supplied to the visualization.
*/
  noDataMessage(_?: boolean): this | boolean {
    return arguments.length
      ? ((this._noDataMessage = _), this)
      : this._noDataMessage;
  }

  /**
      If using scroll or visibility detection, this method allow a custom override of the element to which the scroll detection function gets attached.
*/
  scrollContainer(
    _?: string | HTMLElement | Window,
  ): this | string | HTMLElement | Window {
    return arguments.length
      ? ((this._scrollContainer = _), this)
      : this._scrollContainer;
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
      ? ((this._shape = typeof _ === "function" ? _ : constant(_)), this)
      : this._shape;
  }

  /**
      Configuration object with key/value pairs applied as method calls on each shape.
*/
  shapeConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._shapeConfig = assign(this._shapeConfig, _!)), this)
      : this._shapeConfig;
  }

  /**
      Accessor function or string for the visualization's subtitle.
*/
  subtitle(
    _?: string | ((data: DataPoint[]) => string),
  ): this | string | ((data: DataPoint[]) => string) {
    return arguments.length
      ? ((this._subtitle = typeof _ === "function" ? _ : constant(_)), this)
      : this._subtitle;
  }

  /**
      Configuration object for the subtitle.
*/
  subtitleConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._subtitleConfig = assign(this._subtitleConfig, _!)), this)
      : this._subtitleConfig;
  }

  /**
      Tells the subtitle whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the subtitle appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  subtitlePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._subtitlePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._subtitlePadding;
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
        this._threshold = _;
      } else if (isFinite(_!) && !isNaN(_!)) {
        this._threshold = constant(_! * 1);
      }
      return this;
    } else return this._threshold;
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
        this._thresholdKey = key;
      } else {
        this._thresholdKey = accessor(key!);
      }
      return this;
    } else return this._thresholdKey;
  }

  /**
      The label displayed for bucketed threshold items.
*/
  thresholdName(
    _?: string | ((d: DataPoint, i: number) => string),
  ): this | string | ((d: DataPoint, i: number) => string) {
    return arguments.length
      ? ((this._thresholdName = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._thresholdName;
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
        this._time = _;
      } else if (_) {
        this._time = accessor(_);
        if (!this._aggs[_]) {
          this._aggs[_] = (
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

  // timeFilter(_?: ((d, i) => boolean) | false): installed by installFluent(this, vizSchema).
  // timeline(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      Configuration object for the timeline.
*/
  timelineConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._timelineConfig = assign(this._timelineConfig, _!)), this)
      : this._timelineConfig;
  }

  /**
      The starting time or range for the timeline. Can be a single Date/String, or an Array of 2 values representing the min and max.
*/
  timelineDefault(_?: Date | string | (Date | string)[]): this | Date[] {
    if (arguments.length) {
      if (!(_ instanceof Array)) _ = [_!, _!];
      this._timelineDefault = (_ as (Date | string)[])
        .map(d => date(d as string | number | false))
        .filter((d): d is Date => d !== false);
      return this;
    } else return this._timelineDefault;
  }

  /**
      Tells the timeline whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the timeline appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  timelinePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._timelinePadding = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._timelinePadding;
  }

  /**
      Accessor function or string for the visualization's title.
*/
  title(
    _?: string | ((data: DataPoint[]) => string),
  ): this | string | ((data: DataPoint[]) => string) {
    return arguments.length
      ? ((this._title = typeof _ === "function" ? _ : constant(_)), this)
      : this._title;
  }

  /**
      Configuration object for the title.
*/
  titleConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._titleConfig = assign(this._titleConfig, _!)), this)
      : this._titleConfig;
  }

  /**
      Tells the title whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the title appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  titlePadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._titlePadding = typeof _ === "function" ? _ : constant(_)), this)
      : this._titlePadding;
  }

  /**
      Whether to display tooltips on hover.
*/
  tooltip(
    _?: boolean | ((d: DataPoint, i: number) => boolean),
  ): this | boolean | ((d: DataPoint, i: number) => boolean) {
    return arguments.length
      ? ((this._tooltip = typeof _ === "function" ? _ : constant(_)), this)
      : this._tooltip;
  }

  /**
      Configuration object for the tooltip.
*/
  tooltipConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._tooltipConfig = assign(this._tooltipConfig, _!)), this)
      : this._tooltipConfig;
  }

  /**
      Accessor function or string key for the total value displayed in the visualization.
*/
  total(
    _?: boolean | string | ((d: DataPoint, i: number) => number),
  ): this | boolean | string | ((d: DataPoint, i: number) => number) {
    if (arguments.length) {
      if (typeof _ === "function") this._total = _;
      else if (_) this._total = accessor(_ as string);
      else this._total = false;
      return this;
    } else return this._total;
  }

  /**
      Configuration object for the total bar.
*/
  totalConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this._totalConfig = assign(this._totalConfig, _!)), this)
      : this._totalConfig;
  }

  /**
      Formatter function for the value in the total bar.
*/
  totalFormat(_?: (d: number) => string): this | ((d: number) => string) {
    return arguments.length
      ? ((this._totalFormat = _), this)
      : this._totalFormat;
  }

  /**
      Tells the total whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the total appears centered above the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  totalPadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this._totalPadding = typeof _ === "function" ? _ : constant(_)), this)
      : this._totalPadding;
  }

  // width(_?: number): installed by installFluent(this, vizSchema).
  // zoom(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      The pixel stroke-width of the zoom brush area.
*/
  zoomBrushHandleSize(_?: number): this | number {
    return arguments.length
      ? ((this._zoomBrushHandleSize = _), this)
      : this._zoomBrushHandleSize;
  }

  /**
      An object containing CSS key/value pairs that is used to style the outer handle area of the zoom brush. Passing `false` will remove all default styling.
*/
  zoomBrushHandleStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this._zoomBrushHandleStyle = _), this)
      : this._zoomBrushHandleStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style the inner selection area of the zoom brush. Passing `false` will remove all default styling.
*/
  zoomBrushSelectionStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this._zoomBrushSelectionStyle = _), this)
      : this._zoomBrushSelectionStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyle(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this._zoomControlStyle = _), this)
      : this._zoomControlStyle;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button when active (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyleActive(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this._zoomControlStyleActive = _), this)
      : this._zoomControlStyleActive;
  }

  /**
      An object containing CSS key/value pairs that is used to style each zoom control button on hover (`.zoom-in`, `.zoom-out`, `.zoom-reset`, and `.zoom-brush`). Passing `false` will remove all default styling.
*/
  zoomControlStyleHover(
    _?: Record<string, unknown> | false,
  ): this | Record<string, unknown> | false {
    return arguments.length
      ? ((this._zoomControlStyleHover = _), this)
      : this._zoomControlStyleHover;
  }

  // zoomFactor(_?: number): installed by installFluent(this, vizSchema).
  // zoomMax(_?: number): installed by installFluent(this, vizSchema).
  // zoomPan(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      A pixel value to be used to pad all sides of a zoomed area.
*/
  zoomPadding(_?: number): this | number {
    return arguments.length
      ? ((this._zoomPadding = _), this)
      : this._zoomPadding;
  }

  // zoomScroll(_?: boolean): installed by installFluent(this, vizSchema).
}
