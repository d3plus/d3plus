import {max, merge as arrayMerge, range} from "d3-array";
import {brush} from "d3-brush";
import {color} from "d3-color";
import {select} from "d3-selection";
import {scaleOrdinal} from "d3-scale";
import {zoom} from "d3-zoom";

import {colorAssign, colorContrast, colorDefaults} from "@d3plus/color";
import {addToQueue, unique} from "@d3plus/data";
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
import type {Scene, SceneEvent, SceneNode, Transform} from "@d3plus/render";
import {accessor, BaseClass, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
// import {Rect} from "../shape/index.js";

import Message from "../components/Message.js";

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

import {legendLabel} from "./legendLabel.js";
import {runVizPipeline} from "./runVizPipeline.js";
import {vizDraw} from "./vizDraw.js";
import {vizPreDraw} from "./vizPreDraw.js";

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

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();

    this.schema.aggs = {};
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
    this.schema.ariaHidden = true;
    this.schema.attribution = false;
    const attributionBg = "rgba(255, 255, 255, 0.75)";
    this.schema.attributionStyle = {
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
    this.schema.backConfig = {
      fontSize: 10,
      padding: 5,
      resize: false,
    };
    this.schema.cache = true;

    this.schema.color = (d: DataPoint, i: number) => this.schema.groupBy[0](d, i);
    this._colorDefaults = {
      ...colorDefaults,
      scale: scaleOrdinal().range(colorDefaults.scale.range()),
    };
    this._colorScaleClass = new ColorScale();
    this.schema.colorScaleConfig = {
      axisConfig: {
        rounding: "inside",
      },
      scale: "jenks",
    };
    this.schema.colorScalePadding = defaultPadding;
    this.schema.colorScalePosition = () =>
      this.schema.width > this.schema.height * 1.5 ? "right" : "bottom";
    this.schema.colorScaleMaxSize = 600;

    this._data = [];
    this.schema.dataCutoff = 100;
    this.schema.detectResize = true;
    this.schema.detectResizeDelay = 400;
    this.schema.detectVisible = true;
    this.schema.detectVisibleInterval = 1000;
    this.schema.downloadButton = false;
    this.schema.downloadConfig = {type: "png"};
    this.schema.downloadPosition = "top";
    this.schema.duration = 600;
    this.schema.fontFamily = fontFamily;
    this._hidden = [];
    this.schema.hiddenColor = constant("#aaa");
    this.schema.hiddenOpacity = constant(0.5);
    this._history = [];
    this.schema.groupBy = [accessor("id")];

    this.schema.legend = (config: Record<string, unknown>, arr: DataPoint[]) => {
      const maxGrouped = max(arr, (d: DataPoint, i: number) => {
        const id = this.schema.groupBy[this._legendDepth].bind(this)(d, i);
        return id instanceof Array ? id.length : 1;
      });
      return arr.length > 1 && (maxGrouped ?? 0) <= 2;
    };
    this._legendClass = new Legend();
    this.schema.legendConfig = {
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
    this.schema.legendFilterInvert = constant(false);
    this.schema.legendPadding = defaultPadding;
    this.schema.legendPosition = () =>
      this.schema.width > this.schema.height * 1.5 ? "right" : "bottom";
    this.schema.legendSort = (a: DataPoint, b: DataPoint) =>
      this._drawLabel(a).localeCompare(this._drawLabel(b));
    this.schema.legendTooltip = {};

    this.schema.loadingHTML = () => `
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
      <strong>${this.schema.translate("Loading Visualization")}</strong>
      <sub style="bottom: 0; display: block; line-height: 1; margin-top: 5px;"><a href="https://d3plus.org" target="_blank">${this.schema.translate(
        "Powered by D3plus",
      )}</a></sub>
    </div>`;

    this.schema.loadingMessage = true;
    this._lrucache = new LRU(10);
    this._messageClass = new Message();
    this.schema.messageMask = "rgba(0, 0, 0, 0.05)";
    this.schema.messageStyle = {
      bottom: "0",
      left: "0",
      position: "absolute",
      right: "0",
      "text-align": "center",
      top: "0",
    };

    this.schema.noDataHTML = () => `
    <div style="left: 50%; top: 50%; position: absolute; transform: translate(-50%, -50%);">
      <strong>${this.schema.translate("No Data Available")}</strong>
    </div>`;

    this.schema.noDataMessage = true;
    this.schema.on = {
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
          ((width !== this.schema.width && this._autoWidth) || (height !== this.schema.height && this._autoHeight)) &&
          width &&
          height
        ) {
          this._setSVGSize(width, height);
          if (!this._callback) this.render();
        }
      }, this.schema.detectResizeDelay),
    );
    this.schema.scrollContainer = typeof window === "undefined" ? "" : window;
    this.schema.shape = constant("Rect");
    this._shapes = [];
    this.schema.shapeConfig = {
      ariaLabel: (d: DataPoint, i: number) => this._drawLabel(d, i),
      fill: (d: DataPoint, i: number) => {
        while (d.__d3plus__ && d.data) {
          d = d.data as DataPoint;
          i = d.i as number;
        }
        if (this.schema.colorScale) {
          const c = this.schema.colorScale(d, i);
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
        const c = this.schema.color(d, i);
        if (color(c)) return c;
        return colorAssign(
          typeof c === "string" ? c : JSON.stringify(c),
          this._colorDefaults,
        );
      },
      labelConfig: {
        fontColor: (d: DataPoint, i: number) => {
          const c =
            typeof this.schema.shapeConfig.fill === "function"
              ? this.schema.shapeConfig.fill(d, i)
              : this.schema.shapeConfig.fill;
          return colorContrast(c);
        },
      },
      opacity: constant(1),
      stroke: (d: DataPoint, i: number) => {
        const c =
          typeof this.schema.shapeConfig.fill === "function"
            ? this.schema.shapeConfig.fill(d, i)
            : this.schema.shapeConfig.fill;
        return color(c)!.darker(0.25);
      },
      role: "presentation",
      strokeWidth: constant(0),
    };
    this._solo = [];

    this._subtitleClass = new TextBox();
    this.schema.subtitleConfig = {
      ariaHidden: true,
      fontSize: 12,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this.schema.subtitlePadding = defaultPadding;

    this.schema.svgDesc = "";
    this.schema.svgTitle = "";

    this.schema.timeline = true;
    this._timelineClass = new Timeline().align("end");
    this.schema.timelineConfig = {
      padding: 5,
    };
    this.schema.timelinePadding = defaultPadding;

    this.schema.threshold = constant(0.0001);
    this.schema.thresholdKey = undefined;
    this.schema.thresholdName = () => this.schema.translate("Values");

    this._titleClass = new TextBox();
    this.schema.titleConfig = {
      ariaHidden: true,
      fontSize: 16,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this.schema.titlePadding = defaultPadding;

    this.schema.tooltip = constant(true);
    this._tooltipClass = new Tooltip();
    this.schema.tooltipConfig = {
      pointerEvents: "none",
      titleStyle: {
        "max-width": "200px",
      },
    };

    this._totalClass = new TextBox();
    this.schema.totalConfig = {
      fontSize: 10,
      padding: 5,
      resize: false,
      textAnchor: "middle",
    };
    this.schema.totalFormat = (d: number) =>
      `${this.schema.translate("Total")}: ${formatAbbreviate(d, this.schema.locale)}`;
    this.schema.totalPadding = defaultPadding;

    this.schema.zoom = false;
    this._zoomBehavior = zoom();
    this._zoomBrush = brush();
    this.schema.zoomBrushHandleSize = 1;
    this.schema.zoomBrushHandleStyle = {
      fill: "#444",
    };
    this.schema.zoomBrushSelectionStyle = {
      fill: "#777",
      "stroke-width": 0,
    };
    const zoomBg = "rgba(255, 255, 255, 0.75)";
    this.schema.zoomControlStyle = {
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
    this.schema.zoomControlStyleActive = {
      background: zoomActiveBg,
      color: colorContrast(zoomActiveBg),
      opacity: 1,
    };
    this.schema.zoomControlStyleHover = {
      cursor: "pointer",
      opacity: 1,
    };
    this.schema.zoomFactor = 2;
    this.schema.zoomMax = 16;
    this.schema.zoomPadding = 20;
    this.schema.zoomPan = true;
    this.schema.zoomScroll = true;
  }

  /**
   Called by draw before anything is drawn. Formats the data and performs preparations for draw.
   @private
   */
  _preDraw(): void {
    vizPreDraw(this);
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
    // Wraps in two groups when a zoom transform is active:
    //   viz-chart-cells (chart-positioning transform)
    //     viz-zoom (zoom transform — pan/scale from d3-zoom)
    //       … chart scene children
    // This lets zoom apply to the chart content WITHOUT moving legend/
    // title/total/etc. (which live in sibling viz-* groups, not under
    // viz-chart-cells).
    if (this._chartScene && this._chartScene.length) {
      const sliced = this._chartScene.slice();
      const zoomNode = this._zoomTransform
        ? [{
            type: "group" as const,
            key: "viz-zoom",
            transform: this._zoomTransform,
            children: sliced,
          }]
        : sliced;
      children.push({
        type: "group",
        key: "viz-chart-cells",
        ...(this._chartTransform ? {transform: this._chartTransform} : {}),
        children: zoomNode,
      });
    }
    // Legacy `_shapes` collection (Treemap/Pack/etc. moved off this; Plot's
    // `absorbShapeIntoChartScene` also routes through `_chartScene`). Any
    // remaining caller pushing into `_shapes` gets its `toScene()` walked
    // here; we read the shape's `_select` transform via d3's transform
    // baseVal if present, otherwise emit without a transform.
    (this._shapes || []).forEach((shape: any, si: number) => {
      if (!shape || typeof shape.toScene !== "function") return;
      const group = shape.toScene();
      let transform: Transform | undefined;
      const sel = shape._select;
      if (sel && typeof sel.attr === "function") {
        // Parse `translate(x, y)` from the selection's transform attr.
        // Falls back to undefined for non-translate transforms — the
        // legacy `_shapes` path only ever used translate.
        const t = sel.attr("transform");
        if (typeof t === "string") {
          const m = t.match(/translate\(\s*(-?[\d.]+)[, ]\s*(-?[\d.]+)\s*\)/);
          if (m) transform = {x: parseFloat(m[1]), y: parseFloat(m[2])};
        }
      }
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
      width: this.schema.width,
      height: this.schema.height,
      root: {type: "group", key: "viz-root", children},
    };
  }

  /**
      Called by render once all checks are passed.
      @private
  */
  _draw(): void {
    vizDraw(this);
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
    
    if (this._autoWidth && this.schema.width !== w) {
      this.width(w);
      this._select
        .style("width", `${this.schema.width}px`)
        .attr("width", `${this.schema.width}px`);
    }
    if (this._autoHeight && this.schema.height !== h) {
      this.height(h);
      this._select
        .style("height", `${this.schema.height}px`)
        .attr("height", `${this.schema.height}px`);
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

    // v4: scope this chart's tooltip to its own parent (instead of the
    // global body-level #d3plus-portal). Multiple charts on a page now
    // don't fight over a shared portal, and tooltips are GC'd cleanly
    // when the parent goes away.
    if (this._tooltipClass && this._select?.node) {
      const tooltipParent = this._select.node()?.parentNode as HTMLElement | null;
      if (tooltipParent) this._tooltipClass.parent(tooltipParent);
    }

    // Calculates the width and/or height of the Viz based on the this._select, if either has not been defined.
    if (
      (!this.schema.width || !this.schema.height) &&
      (!this.schema.detectVisible || inViewport(this._select.node()))
    ) {
      this._autoWidth = this.schema.width === undefined;
      this._autoHeight = this.schema.height === undefined;
      this._setSVGSize();
    }

    const parent = select(this._select.node().parentNode);

    this._select
      .attr("class", "d3plus-viz")
      .attr("aria-hidden", this.schema.ariaHidden)
      .attr("aria-labelledby", `${this._uuid}-title ${this._uuid}-desc`)
      .attr("role", "img")
      .attr("xmlns", "http://www.w3.org/2000/svg")
      .attr("xmlns:xlink", "http://www.w3.org/1999/xlink")
      .style("position", "absolute")
      .style("top", parent.style("padding-top"))
      .style("left", parent.style("padding-left"))
      .transition()
      .duration(this.schema.duration)
      .style(
        "width",
        this.schema.width !== undefined ? `${this.schema.width}px` : undefined,
      )
      .style(
        "height",
        this.schema.height !== undefined ? `${this.schema.height}px` : undefined,
      )
      .attr("width", this.schema.width !== undefined ? `${this.schema.width}px` : undefined)
      .attr(
        "height",
        this.schema.height !== undefined ? `${this.schema.height}px` : undefined,
      );

    // sets "position: relative" on the SVG parent if currently undefined
    const position = parent.style("position");
    if (position === "static") parent.style("position", "relative");
    parent.style("font-family", fontFamilyStringify(this.schema.fontFamily));

    // sets initial opacity to 1, if it has not already been set
    if (this._select.attr("opacity") === null) this._select.attr("opacity", 1);

    // Updates the <title> tag if already exists else creates a new <title> tag on this.select.
    const svgTitle = this._select.selectAll("title").data([0]);
    const svgTitleEnter = svgTitle
      .enter()
      .append("title")
      .attr("id", `${this._uuid}-title`);
    svgTitle.merge(svgTitleEnter).text(this.schema.svgTitle);

    // Updates the <desc> tag if already exists else creates a new <desc> tag on this.select.
    const svgDesc = this._select.selectAll("desc").data([0]);
    const svgDescEnter = svgDesc
      .enter()
      .append("desc")
      .attr("id", `${this._uuid}-desc`);
    svgDesc.merge(svgDescEnter).text(this.schema.svgDesc);

    this._visiblePoll = clearInterval(this._visiblePoll);
    this._resizePoll = clearTimeout(this._resizePoll);
    this._scrollPoll = clearTimeout(this._scrollPoll);
    select(this.schema.scrollContainer).on(`scroll.${this._uuid}`, null);
    if (this.schema.detectVisible && this._select.style("visibility") === "hidden") {
      this._visiblePoll = setInterval(() => {
        if (this._select.style("visibility") !== "hidden") {
          this._visiblePoll = clearInterval(this._visiblePoll);
          this.render(callback);
        }
      }, this.schema.detectVisibleInterval);
    } else if (
      this.schema.detectVisible &&
      this._select.style("display") === "none"
    ) {
      this._visiblePoll = setInterval(() => {
        if (this._select.style("display") !== "none") {
          this._visiblePoll = clearInterval(this._visiblePoll);
          this.render(callback);
        }
      }, this.schema.detectVisibleInterval);
    } else if (this.schema.detectVisible && !inViewport(this._select.node())) {
      select(this.schema.scrollContainer).on(`scroll.${this._uuid}`, () => {
        if (!this._scrollPoll) {
          this._scrollPoll = setTimeout(() => {
            if (inViewport(this._select.node())) {
              select(this.schema.scrollContainer).on(`scroll.${this._uuid}`, null);
              this.render(callback);
            }
            this._scrollPoll = clearTimeout(this._scrollPoll);
          }, this.schema.detectVisibleInterval);
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
          const cache = this.schema.cache
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
          } else {
            const val = p[2] ? p[2](cache) : cache;
            if (`_${p[3]}` in this) this[`_${p[3]}`] = val;
            else this.schema[p[3]] = val;
          }
        },
      );
      this._queue = [];

      if (this.schema.loadingMessage && promises.length) {
        this._messageClass.render({
          container: this._select.node().parentNode,
          html: this.schema.loadingHTML(this),
          mask: this._filteredData ? this.schema.messageMask : false,
          style: this.schema.messageStyle,
        });
      }

      Promise.all(promises).then(() => {
        // creates a data table as DOM elements inside of the SVG for accessibility
        // only if this.schema.ariaHidden is set to true
        const columns =
          this._data instanceof Array && this._data.length > 0
            ? Object.keys(this._data[0])
            : [];
        const svgTable = this._select
          .selectAll("g.data-table")
          .data(
            !this.schema.ariaHidden &&
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
          (!this.schema.noDataMessage || this._filteredData.length)
        ) {
          this._messageClass.hide();
          if (this._select.attr("opacity") === "0")
            this._select
              .transition()
              .duration(this.schema.duration)
              .attr("opacity", 1);
        }

        if (this.schema.detectResize && (this._autoWidth || this._autoHeight)) {
          this._resizeObserver.observe(this._select.node().parentNode);
        } else {
          this._resizeObserver.unobserve(this._select.node().parentNode);
        }

        if (callback)
          setTimeout(() => {
            callback();
            this._callback = undefined;
          }, this.schema.duration + 100);
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
      @deprecated Renamed to `renderer()` in v4 (RFC §4.6). Kept as a
      permanent alias — forwards to `renderer()`. No removal scheduled.
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
  _drawSceneToTarget(durationOverride?: number): void {
    const kind = this._renderer === "canvas" ? "canvas" : "svg";
    const legacySvg = this._select && this._select.node ? this._select.node() : null;
    if (!legacySvg) return;
    // Mount renderer INSIDE the user's `_select` (svg or div). Tests like
    // `svgA.querySelector('[data-key="viz-legend"]')` need the scene output
    // to live inside the user's container, not as a sibling.
    const userTarget = this._sceneTarget || legacySvg;
    if (!userTarget) return;
    const scene = this.toScene();
    const w = this.schema.width || 400;
    const h = this.schema.height || 300;
    // Reuse the renderer instance if it matches the kind, to avoid mount
    // churn. `target()` is the public Renderer-interface method (no
    // reaching into renderer-private slots). It's optional on the
    // interface; third-party renderers without it fall through to
    // remount on every draw — correct but with mount churn.
    const currentContainer = this._sceneRenderer?.target
      ? this._sceneRenderer.target()?.container
      : undefined;
    const containerChanged = this._sceneRenderer?.target
      ? currentContainer !== userTarget
      : false;
    if (
      !this._sceneRenderer ||
      this._sceneRenderer.kind !== kind ||
      containerChanged
    ) {
      const Ctor = kind === "canvas" ? CanvasRenderer : SvgRenderer;
      this._sceneRenderer = new Ctor();
      this._sceneRenderer.mount({container: userTarget, width: w, height: h});
      // Bridge renderer pointer events → viz.schema.on handlers. Without this,
      // tooltips never fire on the v4 scene-rendered path because
      // `shape.on(evt, fn)` in plotPaint only wires d3-selection
      // listeners on DOM nodes the scene renderer doesn't create.
      // Renderer events carry the picked scene node; we look up the
      // appropriate viz.schema.on key based on whether the pick belongs to
      // a chart shape, the legend, or neither.
      this._sceneRenderer.on((event: SceneEvent) => {
        const pick = event.pick;
        if (!pick || !pick.node) return;
        // Walk up from the pick to find a parent group keyed with
        // "viz-legend" — if found, dispatch to legend handlers; else
        // dispatch to shape handlers.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nodeAny = pick.node as any;
        // Try to detect legend membership by inspecting key prefixes
        // emitted by features.ts / legendFeature.
        const isLegendNode =
          typeof nodeAny.key === "string" &&
          nodeAny.key.toLowerCase().includes("legend");
        const suffix = isLegendNode ? "legend" : "shape";
        const handlerKey = `${event.type}.${suffix}`;
        // Resolve the source datum + index. `pick.datum` is the raw
        // scene datum (which Shape._sceneXxx populated). For Plot
        // shapes that's the wrapped record; the legacy handlers
        // expect `(d.data, d.i, x, event)`.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawDatum: any = pick.datum;
        const sourceDatum = rawDatum && rawDatum.data ? rawDatum.data : rawDatum;
        const sourceIndex =
          rawDatum && typeof rawDatum.i === "number" ? rawDatum.i : pick.index ?? 0;
        // Dispatch to the matching viz.schema.on handler if present.
        const dispatch = (key: string): void => {
          const fn = this.schema.on && this.schema.on[key];
          if (typeof fn === "function") {
            try {
              fn.call(this, sourceDatum, sourceIndex, rawDatum, event.nativeEvent);
            } catch {
              // swallow per-event errors so one bad handler doesn't
              // break subsequent events.
            }
          }
        };
        dispatch(handlerKey);
        // Also fire the un-suffixed handler (e.g. "mousemove") so
        // user-registered global handlers see the event too.
        dispatch(event.type);
      });
    } else {
      this._sceneRenderer.resize(w, h);
    }
    // `durationOverride` defaults to the chart's `_duration` for normal
    // re-renders. Interaction handlers (zoomed, hover, etc.) pass 0 to
    // skip the transition machinery — animating every wheel/drag tick
    // accumulates `setTimeout(duration+10)` per event.
    const drawDuration =
      durationOverride !== undefined ? durationOverride : this.schema.duration;
    this._sceneRenderer.drawScene(scene, {duration: drawDuration});
    this._lastSceneRendered = scene;
  }

  /**
      Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.
  */
  destroy(): this {
    this._resizeObserver.disconnect();
    this._tooltipClass.data([]).render();
    select("body").on(`touchstart.${this._uuid}`, null);
    // Clear the visibility/resize/scroll poll timers + scroll listener
    // so a destroyed chart doesn't keep firing intervals/timeouts that
    // hold the entire viz instance alive. Without this, an SPA that
    // mounts/unmounts charts on tab switches leaks the scene tree +
    // a 200ms-interval timer per leaked chart.
    if (this._visiblePoll) {
      this._visiblePoll = clearInterval(this._visiblePoll) as never;
    }
    if (this._resizePoll) {
      this._resizePoll = clearTimeout(this._resizePoll) as never;
    }
    if (this._scrollPoll) {
      this._scrollPoll = clearTimeout(this._scrollPoll) as never;
    }
    select(this.schema.scrollContainer).on(`scroll.${this._uuid}`, null);
    // Destroy the active scene renderer (clears its own pointer-rect
    // listeners, overlay host, canvas/svg DOM, timers).
    if (this._sceneRenderer && typeof this._sceneRenderer.destroy === "function") {
      this._sceneRenderer.destroy();
      this._sceneRenderer = undefined;
    }
    return this;
  }

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
    }

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

  // ariaHidden(_?: boolean): installed by installFluent(this, vizSchema).

  /**
      Sets text to be shown positioned absolute on top of the visualization in the bottom-right corner. This is most often used in Geomaps to display the copyright of map tiles. The text is rendered as HTML, so any valid HTML string will render as expected (eg. anchor links work).
*/
  attribution(_?: string | boolean): this | string | boolean {
    return arguments.length
      ? ((this.schema.attribution = _), this)
      : this.schema.attribution;
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
      Configuration object for the back button.
*/
  backConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.backConfig = assign(this.schema.backConfig, _!)), this)
      : this.schema.backConfig;
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
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      addToQueue.bind(this as any)(_ as any, f, "data");
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

  // dataCutoff(_?: number): installed by installFluent(this, vizSchema).
  // depth(_?: number): installed by installFluent(this, vizSchema).

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
      The interval, in milliseconds, for checking if the visualization is visible on the page.
*/
  detectVisibleInterval(_?: number): this | number {
    return arguments.length
      ? ((this.schema.detectVisibleInterval = _), this)
      : this.schema.detectVisibleInterval;
  }

  // discrete(_?: string): installed by installFluent(this, vizSchema).

  /**
      Shows a button that allows for downloading the current visualization.
*/
  downloadButton(_?: boolean): this | boolean {
    return arguments.length
      ? ((this.schema.downloadButton = _), this)
      : this.schema.downloadButton;
  }

  /**
      Sets specific options of the saveElement function used when downloading the visualization.
*/
  downloadConfig(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.downloadConfig = assign(this.schema.downloadConfig, _!)), this)
      : this.schema.downloadConfig;
  }

  /**
      Defines which control group to add the download button into.
*/
  downloadPosition(_?: string): this | string {
    return arguments.length
      ? ((this.schema.downloadPosition = _), this)
      : this.schema.downloadPosition;
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

  // height(_?: number): installed by installFluent(this, vizSchema).

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

    return this;
  }

  /**
      Accessor function or string key for the label of each data point.
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
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
    return arguments.length
      ? ((this.schema.legendFilterInvert = typeof _ === "function" ? _ : constant(_)),
        this)
      : this.schema.legendFilterInvert;
  }

  /**
      Tells the legend whether or not to use the internal padding defined by the visualization in it's positioning. For example, d3plus-plot will add padding on the left so that the legend appears centered underneath the x-axis. By default, this padding is only applied on screens larger than 600 pixels wide.
*/
  legendPadding(
    _?: boolean | (() => boolean),
  ): this | boolean | (() => boolean) {
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

  // legendSort(_?: (a, b) => number): installed by installFluent(this, vizSchema).

  /**
      Configuration object for the legend tooltip.
*/
  legendTooltip(_?: Record<string, unknown>): this | Record<string, unknown> {
    return arguments.length
      ? ((this.schema.legendTooltip = assign(this.schema.legendTooltip, _!)), this)
      : this.schema.legendTooltip;
  }

  /**
      The inner HTML of the status message displayed when loading AJAX requests and displaying errors. Must be a valid HTML string or a function that, when passed this Viz instance, returns a valid HTML string.
*/
  loadingHTML(
    _?: string | ((viz: Viz) => string),
  ): this | string | ((viz: Viz) => string) {
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
    _?: string | ((viz: Viz) => string),
  ): this | string | ((viz: Viz) => string) {
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
