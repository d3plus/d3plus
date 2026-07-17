import {select} from "d3-selection";

import {date, getSize} from "@d3plus/dom";

import {computeTrailCatchup} from "./trailCatchup.js";
import type {DataPoint} from "@d3plus/data";
import {CanvasRenderer, SvgRenderer} from "@d3plus/render";
import type {PickResult, Renderer, Scene, SceneEvent, SceneNode, Transform} from "@d3plus/render";

import VizBase from "./VizBase.js";
import type {ColorScale, Legend, Timeline} from "../../components/index.js";
import type Shape from "../../shapes/Shape.js";
import {applyColorScaleBucketOpacity, applyInteractionOpacity} from "./interactionOpacity.js";
import {initVizDefaults} from "./vizDefaults.js";
import {vizRender} from "./vizRender.js";
import {vizDraw} from "../pipeline/vizDraw.js";
import {vizPreDraw} from "../pipeline/vizPreDraw.js";
import type {VizInstance} from "./vizTypes.js";

/**
    Stamps `interactionGroup` onto a component's scene subtree so the pointer
    bridge can route its nodes to component-scoped handlers (e.g. legend) on
    every backend — including Canvas, where there is no per-shape DOM to walk.
*/
function tagInteractionGroup(node: SceneNode, group: string): void {
  (node as {interactionGroup?: string}).interactionGroup = group;
  const kids = (node as {children?: SceneNode[]}).children;
  if (kids) for (const child of kids) tagInteractionGroup(child, group);
}

/**
    Resolves the element a renderer mounts into. A `<canvas>` cannot paint inside
    an `<svg>`, so when the scene target is the compute svg, the canvas mounts
    into that svg's parent (the user's element); the emptied, position:absolute
    compute svg overlays the same top-left box. SVG mounts into the target as-is.
*/
function mountTargetFor(kind: string, target: Element): Element {
  if (
    kind === "canvas" &&
    typeof Element !== "undefined" &&
    target instanceof Element &&
    target.tagName.toLowerCase() === "svg"
  )
    return (target.parentNode as Element | null) ?? target;
  return target;
}

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
      - `_chartScene` (cells from `chartDef.emit`, or `Plot._paint` for the
        paint-driven Plot family) wrapped in viz-chart-cells
      - `_shapes` (still used by some charts) — each shape's toScene
      - chart-level components (Legend/ColorScale/Timeline) via their toScene
      - `_featurePanels` (from FeatureModule layouts) wrapped in viz-features
  */
  toScene(): Scene {
    const children: SceneNode[] = [];
    // Chart cells stashed on _chartScene — via `chartDef.emit(ctx)` for
    // data-driven charts, or `Plot._paint` for the paint-driven Plot family.
    // Wraps in two groups when a zoom transform is active:
    //   viz-chart-cells (chart-positioning transform)
    //     viz-zoom (zoom transform — pan/scale from d3-zoom)
    //       … chart scene children
    // This lets zoom apply to the chart content WITHOUT moving legend/
    // title/total/etc. (which live in sibling viz-* groups, not under
    // viz-chart-cells).
    if (this._chartScene && this._chartScene.length) {
      const sliced = applyInteractionOpacity(
        this._chartScene,
        this as unknown as VizInstance,
      );
      // Always emit the viz-zoom group (identity transform when no zoom is
      // active) so its key is stable across the first zoom. Otherwise the first
      // zoom adds a brand-new group → the renderer treats the chart cells as
      // exit+enter (teardown/rebuild) instead of tweening the group transform,
      // so the zoom snaps in instead of animating.
      const zoomNode = [{
        type: "group" as const,
        key: "viz-zoom",
        transform: this._zoomTransform ?? {x: 0, y: 0, scale: 1},
        children: sliced,
      }];
      children.push({
        type: "group",
        key: "viz-chart-cells",
        ...(this._chartTransform ? {transform: this._chartTransform} : {}),
        // Fixed clip window (e.g. Geomap's map rect): stays put in scene space
        // while the viz-zoom child transform pans/scales content beneath it.
        ...(this._chartClip ? {clip: this._chartClip} : {}),
        children: zoomNode,
      });
    }
    // `_shapes` collection (Treemap/Pack/etc. route through `_chartScene`
    // instead, as does Plot's `absorbShapeIntoChartScene`). Any caller
    // pushing into `_shapes` gets its `toScene()` walked here; we read the
    // shape's `_select` transform via d3's transform baseVal if present,
    // otherwise emit without a transform.
    (this._shapes || []).forEach((shape: Shape, si: number) => {
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
    const components: [string, Legend | ColorScale | Timeline | undefined][] = [
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
        let compScene: SceneNode = comp.toScene();
        // Tag the legend subtree so its swatches route to legend handlers via
        // the node stamp (renderer-independent), not just SVG DOM ancestry.
        if (name === "legend") {
          tagInteractionGroup(compScene, "legend");
          // Hovering a legend swatch dims the others, like the chart marks:
          // run the legend subtree through the same interaction-opacity pass
          // (a no-op when no hover/active predicate is set).
          compScene = applyInteractionOpacity(
            [compScene],
            this as unknown as VizInstance,
          )[0];
        }
        // Hovering a colorScale swatch (or a data shape) dims the sibling
        // swatches by bucket color — leaving the colorScale title/axis/gradient
        // untouched. Not tagged "legend": colorScale swatches keep the shape
        // event path (range-based tooltip + hover), unlike groupBy legend items.
        else if (name === "colorScale") {
          compScene = applyColorScaleBucketOpacity(
            [compScene],
            this as unknown as VizInstance,
          )[0];
        }
        // Tag the timeline subtree so its ticks/labels are exempt from shape
        // tooltips and hover/active dimming (it's chrome, not data marks).
        else if (name === "timeline") tagInteractionGroup(compScene, "timeline");
        children.push({
          type: "group",
          key: `viz-${name}`,
          children: [compScene],
        });
      }
    }
    // E2: FeatureModule.layout() panels (title/subtitle/total/back).
    if (this._featurePanels && this._featurePanels.length) {
      const panels = this._featurePanels.slice();
      // Tag the back-button panel so the pointer bridge can route its click.
      for (const panel of panels) {
        if (
          panel &&
          typeof (panel as {key?: string}).key === "string" &&
          (panel as {key: string}).key.toLowerCase().includes("back")
        )
          tagInteractionGroup(panel as SceneNode, "back");
      }
      children.push({type: "group", key: "viz-features", children: panels});
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
      Serializes the most recently rendered output to an SVG string. Returns
      `""` if the chart has not been rendered yet. Both backends support this:
      the SVG backend returns its live `<svg>`, the canvas backend re-renders the
      retained scene through a throwaway SVG backend. Primarily used for
      server-side rendering (see `@d3plus/ssr`).
  */
  toSVGString(): string {
    return this._sceneRenderer?.toSVGString?.() ?? "";
  }

  /**
      Returns the underlying canvas element of the most recent render when the
      canvas backend is active (`renderer("canvas")`), or `undefined` otherwise.
      Server-side callers cast this to their native canvas to encode a raster
      (see `@d3plus/ssr`).
  */
  toCanvas(): unknown {
    return this._renderer === "canvas"
      ? this._sceneRenderer?.toCanvas?.()
      : undefined;
  }

  /**
      Selects which @d3plus/render backend paints the visible output.
      `"svg"` = SvgRenderer (default), `"canvas"` = CanvasRenderer.
      Boolean arguments both normalize to `"svg"`.
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
    const mountTarget = mountTargetFor(kind, userTarget as Element);
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
      ? currentContainer !== mountTarget
      : false;
    if (
      !this._sceneRenderer ||
      this._sceneRenderer.kind !== kind ||
      containerChanged
    ) {
      // Tear down the outgoing renderer before mounting a fresh one. It owns
      // its own DOM (canvas/svg + overlay host), pointer listeners, and
      // transition timers; without this, switching kind (svg<->canvas) or
      // container orphans that DOM in the user's element, stacking the old
      // mode's output behind the new one and accumulating on every switch.
      if (this._sceneRenderer && typeof this._sceneRenderer.destroy === "function")
        this._sceneRenderer.destroy();
      const Ctor = kind === "canvas" ? CanvasRenderer : SvgRenderer;
      this._sceneRenderer = new Ctor();
      // `_scenePixelRatio`, when set (e.g. by @d3plus/ssr for hi-res PNG output),
      // fixes the canvas backing-store scale; otherwise the renderer falls back
      // to `devicePixelRatio`.
      this._sceneRenderer.mount({
        container: mountTarget,
        width: w,
        height: h,
        pixelRatio: this._scenePixelRatio,
      });
      // Bridge renderer pointer events → viz.schema.on handlers. Without this,
      // tooltips never fire on the v4 scene-rendered path because
      // `shape.on(evt, fn)` in plotPaint only wires d3-selection
      // listeners on DOM nodes the scene renderer doesn't create.
      // Renderer events carry the picked scene node; the routing lives in
      // `_routeSceneEvent` (kept out of this method so the mount path stays
      // readable). `_lastScenePick` remembers the most recently hovered node
      // so `mouseleave` — fired with a null pick — can still tell the matching
      // handlers which shape/legend item was left (so the tooltip clears).
      this._lastScenePick = null;
      this._sceneRenderer.on((event: SceneEvent) => this._routeSceneEvent(event));
    } else {
      this._sceneRenderer.resize(w, h);
    }
    // `durationOverride` defaults to the chart's `_duration` for normal
    // re-renders. Interaction handlers (zoomed, hover, etc.) pass 0 to
    // skip the transition machinery — animating every wheel/drag tick
    // accumulates `setTimeout(duration+10)` per event.
    const drawDuration =
      durationOverride !== undefined ? durationOverride : this.schema.duration;
    // A duration>0 render (drill-down, zoom, re-center) must win over any
    // pending coalesced duration-0 repaint — otherwise that repaint fires on
    // the next frame and interrupts this transition, snapping shapes to their
    // final geometry.
    if (drawDuration > 0 && this._sceneRepaintRAF != null) {
      cancelAnimationFrame(this._sceneRepaintRAF);
      this._sceneRepaintRAF = undefined;
    }
    // Mark the window during which an animated transition is in flight, so the
    // pointer bridge can ignore interaction until it settles. A hover/click
    // mid-transition would schedule a duration-0 repaint that interrupts the
    // running transition and snaps it to its end (the glitchy jump). Matches
    // the SvgRenderer/CanvasRenderer `duration + 10` end timer, plus a small
    // buffer so events re-enable just after the paint completes.
    if (drawDuration > 0)
      this._transitionEndsAt = Date.now() + drawDuration + 30;
    // Order persistent motion trails in time by the current timeline period, so
    // they grow only as playback moves forward and rewind when it steps back.
    // Only when the timeline selects a single period (`brushing: false`): a range
    // selection has no single "current time", which would scramble the step
    // logic, so we withhold the sequence and trails fall back to ephemeral.
    // Normalize to milliseconds via `date()` — the selection mixes Date objects
    // (brush/initial) and raw period numbers (playback), which compare on wildly
    // different scales otherwise, scrambling the forward/backward test.
    const sel = this._timelineSelection;
    const brushing = this._timelineClass
      ? (this._timelineClass.schema as {brushing?: boolean}).brushing !== false
      : true;
    const sequence = !brushing && Array.isArray(sel) && sel.length
      ? Math.max(...sel.map(v => Number(date(Number(v)))))
      : undefined;
    // A forward jump that skips periods (manual click, not single-step play) draws
    // one coarse segment; compute the marks' real positions at the skipped periods
    // so the trail bends through them (see render commitTrailCatchups).
    const trailCatchup =
      sequence !== undefined && this._trailSeq !== undefined && sequence > this._trailSeq
        ? computeTrailCatchup(this as unknown as VizInstance, scene, this._trailSeq, sequence)
        : undefined;
    if (sequence !== undefined) this._trailSeq = sequence;
    this._sceneRenderer.drawScene(scene, {duration: drawDuration, sequence, trailCatchup});
    this._lastSceneRendered = scene;

    // Canvas backend: the compute <svg> (`_select`) is an emptied overlay
    // sitting on top of the <canvas>. An svg root hit-tests its whole box, so
    // even empty it swallows the pointer events the canvas needs for
    // tooltip/hover/legend picking — the symptom being "renders fine, no
    // tooltips." Make the overlay transparent to pointer events so the canvas
    // is the sole interaction surface. The only interactive DOM that still
    // lives in this svg is the timeline's d3-brush (the canvas can't host the
    // native brush handles), so re-enable events on just that group. On the
    // SVG backend `_select` IS the scene host, so events must stay enabled.
    if (this._select) {
      this._select.style("pointer-events", kind === "canvas" ? "none" : null);
      if (this._container)
        this._container.style("pointer-events", kind === "canvas" ? "none" : null);
      if (kind === "canvas")
        this._select
          .select("g.d3plus-viz-timeline")
          .style("pointer-events", "auto");
    }

    // The timeline brush (d3-brush DOM, mounted in `g.d3plus-viz-timeline` in
    // the outer svg) must paint above the scene-rendered timeline buttons/ticks
    // so its selection tint + handles sit on top of them (matching v3). The
    // renderer appends its scene <svg> last, so without this the brush layer
    // ends up behind it — the selection's translucent fill is then hidden by
    // the opaque buttons and only the edge handles peek out.
    if (kind === "svg") {
      const host =
        userTarget && typeof (userTarget as Element).querySelector === "function"
          ? (userTarget as Element)
          : null;
      const tlGroup = host
        ? host.querySelector(":scope > g.d3plus-viz-timeline")
        : null;
      if (tlGroup) host!.appendChild(tlGroup);
    }
  }

  /**
      Resolves the `(d, i, x)` a picked scene node reports to interaction
      handlers (tooltip, click, user `on` handlers). `pick.datum` is the raw
      scene datum; for a Plot shape that's the wrapped record `{data, i}`, which
      handlers expect unwrapped to `(d.data, d.i, wrapped)`. The base does that
      unwrap; Plot overrides this to report the point nearest the cursor for
      multi-point shapes (Line/Area) so a series tooltip reflects the hovered
      x rather than the whole-series aggregate.
      @private
  */
  _interactionDatum(
    pick: PickResult,
    _event: SceneEvent,
  ): {d: unknown; i: number; x: unknown} {
    const rawDatum = pick.datum as {data?: unknown; i?: number} | null | undefined;
    const sourceDatum = rawDatum && rawDatum.data ? rawDatum.data : rawDatum;
    const sourceIndex =
      rawDatum && typeof rawDatum.i === "number" ? rawDatum.i : pick.index ?? 0;
    return {d: sourceDatum, i: sourceIndex, x: rawDatum};
  }

  /**
      Routes a renderer pointer event to the matching `viz.schema.on` handlers.
      Bridges the v4 scene-rendered path (SvgRenderer/CanvasRenderer), where
      compute-mode shapes mount no per-shape DOM, so `shape.on(evt, fn)`
      listeners never fire. We look up the appropriate `on` key from the picked
      scene node: legend swatches route to legend handlers, chart shapes to
      shape (+ shape-class-scoped) handlers, and chrome (axis/timeline/back) is
      excluded. Split out of `_drawSceneToTarget` to keep that method small.
      @private
  */
  _routeSceneEvent(event: SceneEvent): void {
    // Ignore all pointer interaction while an animated transition (zoom,
    // re-center, drill-down, entrance) is in flight. Hovering or clicking a
    // shape mid-transition would fire a handler that schedules a duration-0
    // repaint, interrupting the running transition and snapping it to its end
    // — the glitchy jump. `_transitionEndsAt` is stamped by `_drawSceneToTarget`
    // for the transition's duration; it lapses on its own, so interaction
    // resumes the instant the transition settles.
    if (this._transitionEndsAt && Date.now() < this._transitionEndsAt) return;
    const pick = event.pick;
    // Dispatch helper shared by the live-pick path and the leave path.
    const fire = (
      key: string,
      d: unknown,
      i: number,
      x: unknown,
    ): void => {
      const fn = this.schema.on && this.schema.on[key];
      if (typeof fn === "function") {
        try {
          fn.call(this, d, i, x, event.nativeEvent);
        } catch {
          // swallow per-event errors so one bad handler doesn't
          // break subsequent events.
        }
      }
    };
    if (event.type === "mouseleave") {
      const lastPick = this._lastScenePick;
      if (lastPick) {
        fire(
          `mouseleave.${lastPick.isLegend ? "legend" : "shape"}`,
          lastPick.d,
          lastPick.i,
          lastPick.x,
        );
        if (!lastPick.isLegend && lastPick.shapeType)
          fire(`mouseleave.${lastPick.shapeType}`, lastPick.d, lastPick.i, lastPick.x);
        fire("mouseleave", lastPick.d, lastPick.i, lastPick.x);
      }
      this._lastScenePick = null;
      // Cleared here, then re-set by the enter/move the renderer fires
      // synchronously when the pointer crosses to an adjacent node — so a
      // shape→label hand-off leaves `_hoverDatum` pointing at the new node
      // (same datum), which `mouseleave` reads to suppress a flicker.
      this._hoverDatum = null;
      return;
    }
    if (!pick || !pick.node) return;
    // Scene nodes carry interaction metadata stamped by Viz.toScene.
    const nodeAny = pick.node as {
      interactionGroup?: string;
      shapeType?: string;
    };
    // Back-button panel: its d3-selection click listener never fires in the
    // scene path (it's a plain text node), so route its click here to pop
    // the drill-down history / step up a level.
    if (nodeAny.interactionGroup === "back") {
      if (event.type === "click") {
        const self = this;
        if (self._history.length) self.config(self._history.pop()).render();
        else self.depth(self._drawDepth - 1).filter(false).render();
      }
      return;
    }
    // Axis ticks/labels and the timeline are chrome — they carry data but
    // are not chart shapes, so they must not fire shape tooltips/handlers.
    if (
      nodeAny.interactionGroup === "axis" ||
      nodeAny.interactionGroup === "timeline"
    )
      return;
    // Prefer the node's stamped interaction group (set by Viz.toScene), so
    // legend swatches route to legend handlers on Canvas too — where the
    // single canvas element has no per-shape DOM to walk. Fall back to SVG
    // DOM ancestry for nodes the stamp didn't reach.
    const target =
      event.nativeEvent && (event.nativeEvent as Event).target;
    const isLegendNode =
      nodeAny.interactionGroup === "legend" ||
      (target && typeof (target as Element).closest === "function"
        ? !!(target as Element).closest('[data-key="viz-legend"]')
        : false);
    const suffix = isLegendNode ? "legend" : "shape";
    const handlerKey = `${event.type}.${suffix}`;
    // Resolve the datum + index this pick reports to handlers, ONCE, and reuse
    // it for every handler fired below so tooltip/click/user handlers agree on
    // which datum the pointer is over. The base unwraps the node's raw datum to
    // its source row; Plot overrides `_interactionDatum` to report the point
    // nearest the cursor for multi-point shapes (Line/Area).
    const {d: sourceDatum, i: sourceIndex, x: rawDatum} = this._interactionDatum(
      pick,
      event,
    );
    const shapeType =
      typeof nodeAny.shapeType === "string" ? nodeAny.shapeType : null;
    this._lastScenePick = {
      d: sourceDatum, i: sourceIndex, x: rawDatum, isLegend: isLegendNode, shapeType,
    };
    this._hoverDatum = rawDatum;
    fire(handlerKey, sourceDatum, sourceIndex, rawDatum);
    // Shape-class-scoped handlers (`"click.Bar"`, `"mousemove.Circle"`). The
    // emitting shape stamps its type onto the node; on the scene path this is
    // the only place these fire (compute-mode shapes wire no DOM listeners).
    // Legend nodes are excluded so a legend swatch's shape type can't
    // masquerade as a chart-shape handler.
    if (!isLegendNode && shapeType) {
      fire(`${event.type}.${shapeType}`, sourceDatum, sourceIndex, rawDatum);
    }
    // Also fire the un-suffixed handler (e.g. "mousemove") so user-registered
    // global handlers see the event too.
    fire(event.type, sourceDatum, sourceIndex, rawDatum);
  }

  /**
      Coalesces interaction-driven scene repaints (hover/active dimming) into a
      single paint per animation frame. A fast pointer sweep across a dense
      chart fires a hover transition per shape crossed; painting each one
      synchronously rebuilt the whole scene back-to-back, saturating the main
      thread (~200ms stalls) so the tooltip couldn't reposition and appeared
      stuck at its last spot. Only the latest hover state is visible, so the
      intermediate paints are wasted — collapse them to one rAF-scheduled draw.
  */
  _scheduleSceneRepaint(): void {
    if (!this._sceneRenderer) return;
    if (typeof requestAnimationFrame !== "function") {
      this._drawSceneToTarget(0);
      return;
    }
    if (this._sceneRepaintRAF != null) return;
    this._sceneRepaintRAF = requestAnimationFrame(() => {
      this._sceneRepaintRAF = undefined;
      this._drawSceneToTarget(0);
    });
  }

  /**
      Tears down the visualization: disconnects the ResizeObserver and removes DOM event listeners. Call this when unmounting to avoid memory leaks.
  */
  destroy(): this {
    this._resizeObserver?.disconnect();
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
    if (this._sceneRepaintRAF != null) {
      if (typeof cancelAnimationFrame === "function")
        cancelAnimationFrame(this._sceneRepaintRAF);
      this._sceneRepaintRAF = undefined;
    }
    if (this.schema.scrollContainer)
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
