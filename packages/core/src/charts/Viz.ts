import {select} from "d3-selection";

import {getSize} from "@d3plus/dom";
import type {DataPoint} from "@d3plus/data";
import {CanvasRenderer, SvgRenderer} from "@d3plus/render";
import type {Renderer, Scene, SceneEvent, SceneNode, Transform} from "@d3plus/render";

import VizBase from "./VizBase.js";
import {initVizDefaults} from "./vizDefaults.js";
import {vizRender} from "./vizRender.js";
import {vizDraw} from "./vizDraw.js";
import {vizPreDraw} from "./vizPreDraw.js";
import type {VizInstance} from "./vizTypes.js";

/**
    Creates an x/y plot based on an array of data. See [this example](https://d3plus.org/examples/d3plus-treemap/getting-started/) for help getting started using the treemap generator.
*/
export default class Viz extends VizBase {

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    super();
    initVizDefaults(this);
  }

  /**
   Called by draw before anything is drawn. Formats the data and performs preparations for draw.
   @private
   */
  _preDraw(): void {
    vizPreDraw(this as unknown as VizInstance);
  }

  /**
      Composes a backend-agnostic scene graph from the shapes/features produced
      by the most recent render. Combines:
      - `_chartScene` (cells from `chartDef.emit`) wrapped in viz-chart-cells
      - `_shapes` (still used by some charts) — each shape's toScene
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
    // `_shapes` collection (Treemap/Pack/etc. route through `_chartScene`
    // instead, as does Plot's `absorbShapeIntoChartScene`). Any caller
    // pushing into `_shapes` gets its `toScene()` walked here; we read the
    // shape's `_select` transform via d3's transform baseVal if present,
    // otherwise emit without a transform.
    (this._shapes || []).forEach((shape: any, si: number) => {
      if (!shape || typeof shape.toScene !== "function") return;
      const group = shape.toScene();
      let transform: Transform | undefined;
      const sel = shape._select;
      if (sel && typeof sel.attr === "function") {
        // Parse `translate(x, y)` from the selection's transform attr.
        // Falls back to undefined for non-translate transforms — the
        // `_shapes` path only uses translate.
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
    vizDraw(this as unknown as VizInstance);
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
    return vizRender(this, callback) as this;
  }

  /**
      Selects which @d3plus/render backend paints the visible output
      (RFC §4.6). `"svg"` = SvgRenderer (default), `"canvas"` =
      CanvasRenderer. Scene mode is the only path; this chooses the
      backend. Boolean arguments both normalize to `"svg"`.
  */
  renderer(): "svg" | "canvas";
  renderer(_: "svg" | "canvas" | true | false): this;
  renderer(_?: "svg" | "canvas" | true | false): "svg" | "canvas" | this {
    if (!arguments.length) return this._renderer;
    this._renderer = _ === "canvas" ? "canvas" : "svg";
    return this;
  }

  /**
      "full" runs the DOM enter/update/exit for every shape; "compute"
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
      pluggable backends. The compute pass happens via render() (in an svg
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
      automatically by `render()`. The compute pass draws into `this._select`
      (an auto-created svg INSIDE the user's target div) — that svg is the
      off-stage detached compute svg. SvgRenderer mounts to the user's target
      div (the parent), as a sibling to the detached compute svg. The compute
      svg's children get cleared so only the scene output is visible.
  */
  _drawSceneToTarget(durationOverride?: number): void {
    const kind = this._renderer === "canvas" ? "canvas" : "svg";
    const computeSvg = this._select && this._select.node ? this._select.node() : null;
    if (!computeSvg) return;
    // Mount renderer INSIDE the user's `_select` (svg or div). Tests like
    // `svgA.querySelector('[data-key="viz-legend"]')` need the scene output
    // to live inside the user's container, not as a sibling.
    const userTarget = this._sceneTarget || computeSvg;
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
        // shapes that's the wrapped record; the handlers expect
        // `(d.data, d.i, x, event)`.
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

}
