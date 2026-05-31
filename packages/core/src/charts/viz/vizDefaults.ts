import {max} from "d3-array";
import {brush} from "d3-brush";
import {color} from "d3-color";
import {scaleOrdinal} from "d3-scale";
import {zoom} from "d3-zoom";

import {colorAssign, colorContrast, colorDefaults} from "@d3plus/color";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import {fontFamily, fontFamilyStringify} from "@d3plus/text";

import {ColorScale, Legend, TextBox, Timeline, Tooltip} from "../../components/index.js";
import Message from "../../components/Message.js";
import {accessor, constant} from "../../utils/index.js";
import {installFluent} from "../../fluent.js";

import {legendLabel} from "../features/legendLabel.js";
import clickShape from "../events/click.shape.js";
import clickLegend from "../events/click.legend.js";
import mouseenter from "../events/mouseenter.js";
import mouseleave from "../events/mouseleave.js";
import mousemoveLegend from "../events/mousemove.legend.js";
import mousemoveShape from "../events/mousemove.shape.js";

import type Viz from "./Viz.js";

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

// E4: Viz's identity-coerce accessor schema. installFluent installs methods on
// Viz.prototype (once via WeakSet) so BaseClass.config() reflection picks them
// up. Constructor assignments below seed defaults (e.g. `this.schema.duration = 600`);
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

/**
    Renderer backend, accessibility, attribution, and back-button defaults.
    @private
*/
function initBaseDefaults(viz: Viz): void {
  // `renderer()` selects the @d3plus/render backend. Default
  // `"svg"` (SvgRenderer); `"canvas"` for large N via CanvasRenderer.
  viz._renderer = "svg";
  viz._renderMode = "full";
  viz.schema.ariaHidden = true;
  viz.schema.attribution = false;
  const attributionBg = "rgba(255, 255, 255, 0.75)";
  viz.schema.attributionStyle = {
    background: attributionBg,
    border: "1px solid rgba(0, 0, 0, 0.25)",
    color: colorContrast(attributionBg),
    display: "block",
    font: `400 11px/11px ${fontFamilyStringify(fontFamily)}`,
    margin: "5px",
    opacity: 0.75,
    padding: "4px 6px 3px",
  };
  viz._backClass = new TextBox()
    .on("click", () => {
      if (viz._history.length) viz.config(viz._history.pop()).render();
      else (viz.depth(viz._drawDepth - 1) as Viz).filter(false);
      viz.render();
    })
    .on("mousemove", () =>
      viz._backClass.select().style("cursor", "pointer"),
    );
  viz.schema.backConfig = {
    fontSize: 10,
    padding: 5,
    resize: false,
  };
  viz.schema.cache = true;
}

/**
    Color accessor and color-scale defaults.
    @private
*/
function initColorDefaults(viz: Viz): void {
  viz.schema.color = (d: DataPoint, i: number) => viz.schema.groupBy[0](d, i);
  viz._colorDefaults = {
    ...colorDefaults,
    scale: scaleOrdinal().range(colorDefaults.scale.range()),
  };
  viz._colorScaleClass = new ColorScale();
  viz.schema.colorScaleConfig = {
    axisConfig: {
      rounding: "inside",
    },
    scale: "jenks",
  };
  viz.schema.colorScalePadding = defaultPadding;
  viz.schema.colorScalePosition = () =>
    viz.schema.width > viz.schema.height * 1.5 ? "right" : "bottom";
  viz.schema.colorScaleMaxSize = 600;
}

/**
    Data, resize/visibility detection, download, and grouping defaults.
    @private
*/
function initDataDefaults(viz: Viz): void {
  viz._data = [];
  viz.schema.dataCutoff = 100;
  viz.schema.detectResize = true;
  viz.schema.detectResizeDelay = 400;
  viz.schema.detectVisible = true;
  viz.schema.detectVisibleInterval = 1000;
  viz.schema.downloadButton = false;
  viz.schema.downloadConfig = {type: "png"};
  viz.schema.downloadPosition = "top";
  viz.schema.duration = 600;
  viz.schema.fontFamily = fontFamily;
  viz._hidden = [];
  viz.schema.hiddenColor = constant("#aaa");
  viz.schema.hiddenOpacity = constant(0.5);
  viz._history = [];
  viz.schema.groupBy = [accessor("id")];
}

/**
    Legend visibility, class instance, and config defaults.
    @private
*/
function initLegendDefaults(viz: Viz): void {
  viz.schema.legend = (config: Record<string, unknown>, arr: DataPoint[]) => {
    const maxGrouped = max(arr, (d: DataPoint, i: number) => {
      const id = viz.schema.groupBy[viz._legendDepth].bind(viz)(d, i);
      return id instanceof Array ? id.length : 1;
    });
    return arr.length > 1 && (maxGrouped ?? 0) <= 2;
  };
  viz._legendClass = new Legend();
  viz.schema.legendConfig = {
    label: legendLabel.bind(viz),
    shapeConfig: {
      ariaLabel: legendLabel.bind(viz),
      labelConfig: {
        fontColor: undefined,
        fontResize: false,
        padding: 0,
      },
    },
  };
  viz.schema.legendFilterInvert = constant(false);
  viz.schema.legendPadding = defaultPadding;
  viz.schema.legendPosition = () =>
    viz.schema.width > viz.schema.height * 1.5 ? "right" : "bottom";
  viz.schema.legendSort = (a: DataPoint, b: DataPoint) =>
    viz._drawLabel(a).localeCompare(viz._drawLabel(b));
  viz.schema.legendTooltip = {};
}

/**
    Loading/no-data message HTML, class instances, and mask/style defaults.
    @private
*/
function initMessageDefaults(viz: Viz): void {
  viz.schema.loadingHTML = () => `
  <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
    <strong>${viz.schema.translate("Loading Visualization")}</strong>
    <sub style="bottom: 0; display: block; line-height: 1; margin-top: 5px;"><a href="https://d3plus.org" target="_blank">${viz.schema.translate(
      "Powered by D3plus",
    )}</a></sub>
  </div>`;

  viz.schema.loadingMessage = true;
  viz._lrucache = new LRU(10);
  viz._messageClass = new Message();
  viz.schema.messageMask = "rgba(0, 0, 0, 0.05)";
  viz.schema.messageStyle = {
    bottom: "0",
    left: "0",
    position: "absolute",
    right: "0",
    "text-align": "center",
    top: "0",
  };

  viz.schema.noDataHTML = () => `
  <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
    <strong>${viz.schema.translate("No Data Available")}</strong>
  </div>`;

  viz.schema.noDataMessage = true;
}

/**
    Event handler bindings, render queue, resize observer, and scroll container.
    @private
*/
function initEventDefaults(viz: Viz): void {
  viz.schema.on = {
    "click.shape": clickShape.bind(viz),
    "click.legend": clickLegend.bind(viz),
    mouseenter: mouseenter.bind(viz),
    mouseleave: mouseleave.bind(viz),
    "mousemove.shape": mousemoveShape.bind(viz),
    "mousemove.legend": mousemoveLegend.bind(viz),
  };
  viz._queue = [];
  viz._resizeObserver = new ResizeObserver(
    debounce((entries: ResizeObserverEntry[]) => {
      const {width, height} = entries[0]!.contentRect;
      if (
        ((width !== viz.schema.width && viz._autoWidth) || (height !== viz.schema.height && viz._autoHeight)) &&
        width &&
        height
      ) {
        viz._setSVGSize(width, height);
        if (!viz._callback) viz.render();
      }
    }, viz.schema.detectResizeDelay),
  );
  viz.schema.scrollContainer = typeof window === "undefined" ? "" : window;
}

/**
    Shape accessor and the fill/stroke/label shapeConfig defaults.
    @private
*/
function initShapeDefaults(viz: Viz): void {
  viz.schema.shape = constant("Rect");
  viz._shapes = [];
  viz.schema.shapeConfig = {
    ariaLabel: (d: DataPoint, i: number) => viz._drawLabel(d, i),
    fill: (d: DataPoint, i: number) => {
      while (d.__d3plus__ && d.data) {
        d = d.data as DataPoint;
        i = d.i as number;
      }
      if (viz.schema.colorScale) {
        const c = viz.schema.colorScale(d, i);
        if (c !== undefined && c !== null) {
          const scale = viz._colorScaleClass._colorScale;
          const colors = viz._colorScaleClass.color();
          if (!scale)
            return colors instanceof Array
              ? colors[colors.length - 1]
              : colors;
          else if (!scale.domain().length)
            return scale.range()[scale.range().length - 1];
          return scale(c);
        }
      }
      const c = viz.schema.color(d, i);
      if (color(c)) return c;
      return colorAssign(
        typeof c === "string" ? c : JSON.stringify(c),
        viz._colorDefaults,
      );
    },
    labelConfig: {
      fontColor: (d: DataPoint, i: number) => {
        const c =
          typeof viz.schema.shapeConfig.fill === "function"
            ? viz.schema.shapeConfig.fill(d, i)
            : viz.schema.shapeConfig.fill;
        return colorContrast(c);
      },
    },
    opacity: constant(1),
    stroke: (d: DataPoint, i: number) => {
      const c =
        typeof viz.schema.shapeConfig.fill === "function"
          ? viz.schema.shapeConfig.fill(d, i)
          : viz.schema.shapeConfig.fill;
      return color(c)!.darker(0.25);
    },
    role: "presentation",
    strokeWidth: constant(0),
  };
  viz._solo = [];
}

/**
    Subtitle, title, timeline, threshold, tooltip, and total label defaults.
    @private
*/
function initLabelDefaults(viz: Viz): void {
  viz._subtitleClass = new TextBox();
  viz.schema.subtitleConfig = {
    ariaHidden: true,
    fontSize: 12,
    padding: 5,
    resize: false,
    textAnchor: "middle",
  };
  viz.schema.subtitlePadding = defaultPadding;

  viz.schema.svgDesc = "";
  viz.schema.svgTitle = "";

  viz.schema.timeline = true;
  viz._timelineClass = new Timeline().align("end");
  viz.schema.timelineConfig = {
    padding: 5,
  };
  viz.schema.timelinePadding = defaultPadding;

  viz.schema.threshold = constant(0.0001);
  viz.schema.thresholdKey = undefined;
  viz.schema.thresholdName = () => viz.schema.translate("Values");

  viz._titleClass = new TextBox();
  viz.schema.titleConfig = {
    ariaHidden: true,
    fontSize: 16,
    padding: 5,
    resize: false,
    textAnchor: "middle",
  };
  viz.schema.titlePadding = defaultPadding;

  viz.schema.tooltip = constant(true);
  viz._tooltipClass = new Tooltip();
  viz.schema.tooltipConfig = {
    pointerEvents: "none",
    titleStyle: {
      "max-width": "200px",
    },
  };

  viz._totalClass = new TextBox();
  viz.schema.totalConfig = {
    fontSize: 10,
    padding: 5,
    resize: false,
    textAnchor: "middle",
  };
  viz.schema.totalFormat = (d: number) =>
    `${viz.schema.translate("Total")}: ${formatAbbreviate(d, viz.schema.locale)}`;
  viz.schema.totalPadding = defaultPadding;
}

/**
    Zoom behavior, brush, control button styling, and zoom limit defaults.
    @private
*/
function initZoomDefaults(viz: Viz): void {
  viz.schema.zoom = false;
  viz._zoomBehavior = zoom();
  viz._zoomBrush = brush();
  viz.schema.zoomBrushHandleSize = 1;
  viz.schema.zoomBrushHandleStyle = {
    fill: "#444",
  };
  viz.schema.zoomBrushSelectionStyle = {
    fill: "#777",
    "stroke-width": 0,
  };
  const zoomBg = "rgba(255, 255, 255, 0.75)";
  viz.schema.zoomControlStyle = {
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
  viz.schema.zoomControlStyleActive = {
    background: zoomActiveBg,
    color: colorContrast(zoomActiveBg),
    opacity: 1,
  };
  viz.schema.zoomControlStyleHover = {
    cursor: "pointer",
    opacity: 1,
  };
  viz.schema.zoomFactor = 2;
  viz.schema.zoomMax = 16;
  viz.schema.zoomPadding = 20;
  viz.schema.zoomPan = true;
  viz.schema.zoomScroll = true;
}

/**
    Seeds a fresh Viz instance's schema defaults and installs the identity-coerce
    fluent accessors. Extracted from the constructor so the seeding logic stays
    readable and the constructor stays under the per-function line budget.
    @private
*/
export function initVizDefaults(viz: Viz): void {
  viz.schema.aggs = {};
  // E4: install identity-coerce accessors on the prototype. The imperative
  // `viz._x = …` assignments below seed defaults; installFluent's "skip
  // if slot already set" guard respects them. Methods are visible to
  // BaseClass.config()'s `getAllMethods` reflection.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  installFluent(viz as any, vizSchema);
  initBaseDefaults(viz);
  initColorDefaults(viz);
  initDataDefaults(viz);
  initLegendDefaults(viz);
  initMessageDefaults(viz);
  initEventDefaults(viz);
  initShapeDefaults(viz);
  initLabelDefaults(viz);
  initZoomDefaults(viz);
}
