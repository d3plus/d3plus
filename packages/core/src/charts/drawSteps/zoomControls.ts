import {select} from "d3-selection";
import {zoomIdentity, zoomTransform} from "d3-zoom";
import type {ZoomTransform} from "d3-zoom";

import {attrize} from "@d3plus/dom";
import {chartBounds} from "../features/chartGeometry.js";
import {ensureZoomDom} from "../features/ensureZoomDom.js";
import {autoZoomMax} from "../features/zoomExtent.js";
import type {FeatureLayout, FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";
import {
  isBrushing,
  mountCustomIcons,
  paintZoomButton,
  setBrushing,
  showsZoomControls,
  syncBrushButton,
  ZOOM_PANEL_STYLE,
  zoomControlsHtml,
} from "./zoomControlsMarkup.js";

/**
    Builds the four zoom-control buttons as an `htmlOverlay` scene-node
    panel, pinned to the top-right corner of the whole chart (not the
    margin-inset chart area) — top-positioned features leave room for it via
    `zoomControlsBox`. Clicks ride the declarative `events` map (the
    renderer delegates them from the host element, so they survive DOM
    churn); hover can't be delegated (mouseenter/mouseleave don't bubble), so
    `onUpdate` binds it per button. `onUpdate` (not `onMount`) because the
    html isn't a fixed constant — it bakes in `zoomControlClassName`, the
    locale's translated `aria-label`s, and the brush state, so those
    changes swap in fresh button nodes on the next draw. The
    `data-zoom-bound` guard styles, binds, and mounts each node's custom
    icon (`zoomControlIcons`, if set) exactly once.
    @private
*/
function buildZoomControlPanel(viz: Viz): FeatureLayout["panel"] {
  return {
    type: "htmlOverlay" as const,
    key: "viz-zoom-controls",
    x: 0,
    y: 0,
    width: viz.schema.width,
    style: ZOOM_PANEL_STYLE,
    className: "d3plus-zoom-control",
    html: zoomControlsHtml(viz),
    events: {
      ".zoom-in": {click: () => zoomMath.bind(viz)(viz.schema.zoomFactor)},
      ".zoom-out": {click: () => zoomMath.bind(viz)(1 / viz.schema.zoomFactor)},
      ".zoom-reset": {click: () => zoomMath.bind(viz)(0)},
      ".zoom-brush": {
        click: (e: Event) => {
          // Delegated dispatch: `e.currentTarget` is the host wrapper, so
          // resolve the actual button from the event target.
          const btn = (e.target as Element).closest(".zoom-brush") as HTMLElement | null;
          if (!btn) return;
          const willBrush = !isBrushing(viz);
          btn.classList.toggle("active", willBrush);
          btn.setAttribute("aria-pressed", String(willBrush));
          paintZoomButton(viz, btn, btn.matches(":hover"));
          zoomEvents.bind(viz)(willBrush);
        },
      },
    },
    onUpdate: (host: HTMLElement) => {
      host.querySelectorAll<HTMLElement>(".zoom-control").forEach(btn => {
        if (btn.dataset.zoomBound) return;
        btn.dataset.zoomBound = "1";
        paintZoomButton(viz, btn);
        btn.addEventListener("mouseenter", () => paintZoomButton(viz, btn, true));
        btn.addEventListener("mouseleave", () => paintZoomButton(viz, btn));
        mountCustomIcons(viz, btn);
      });
    },
  };
}

/**
    @name zoomFeature
    Sets up zoom + brush event behaviors and the zoom-control buttons.

    Runs as a post-draw `FeatureModule`: `runVizPipeline` invokes it via
    `runLayout` *after* `_draw()` has rendered the chart body and
    `ensureZoomDom` has mounted `viz._container` / `viz._zoomGroup`. It
    claims zero margin (positioning itself inside the existing
    `viz._margin`) and emits no layout panel — instead it does two things
    the margin-negotiation features don't:

      1. Installs stateful D3 zoom + brush behaviors (`viz._zoomBehavior`,
         `viz._zoomBrush`) and wires `viz._zoomToBounds`. d3-zoom binds to
         the SVG element directly via `viz._container.call(zoomBehavior)`.
      2. Returns the four control buttons (in/out/reset/brush) as an
         `htmlOverlay` scene-node panel; `runVizPipeline` appends it to
         `viz._featurePanels`. `onUpdate` is the scene's interactive-HTML
         escape hook: it wires the hover handlers + applies the user's
         zoomControl style configs, once per button DOM node (guarded by a
         `data-zoom-bound` marker). Click handling instead rides the
         declarative `events` map, which the renderer delegates from the
         host element, so it survives DOM churn with no extra bookkeeping.
         `onUpdate` (rather than `onMount`) matters because the html string
         below isn't a fixed constant — it bakes in `zoomControlClassName`,
         the active locale's translated `aria-label`s, and the current brush
         state, so a `.locale(...)` or `.zoomControlClassName(...)` call
         replaces the button nodes on the next draw. Renderers only rewrite
         `innerHTML` when the string actually differs from the last-written
         value, so the common case (nothing changed) is a cheap no-op.
*/
export const zoomFeature: FeatureModule = {
  name: "zoom",
  layout: ({viz}) => {
    if (!viz.schema.zoom) resetZoom(viz);
    else ensureZoomSurface(viz);
    if (!viz._container || !viz._zoomGroup) return {panel: null, margin: {}};

    const bounds = chartBounds(viz as never);
    const height = viz._zoomHeight || bounds.height,
      width = viz._zoomWidth || bounds.width;

    // The zoom behavior works in the coordinate space of the element it's
    // bound to — the outer <svg> (or the <canvas>, which shares its origin) —
    // so the extent is the chart area's rect in that space, not a
    // margin-relative [0, 0] → [width, height]. `Viz.toScene` applies the
    // resulting transform above each chart's own positioning transform.
    const {left, top} = viz._margin;
    const area: [[number, number], [number, number]] = [
      [left, top],
      [left + width, top + height],
    ];
    viz._zoomBehavior
      .filter((event: MouseEvent & TouchEvent) => zoomGestureFilter(viz, event))
      .wheelDelta(wheelDelta)
      .extent(area)
      .scaleExtent([1, zoomMax(viz, width, height)])
      .translateExtent(area)
      .on("zoom", (event: {transform: unknown}) =>
        zoomed.bind(viz)(event.transform),
      );

    viz._zoomToBounds = zoomToBounds.bind(viz);

    const panel: FeatureLayout["panel"] = showsZoomControls(viz)
      ? buildZoomControlPanel(viz)
      : null;

    viz._zoomBrush
      .extent([
        [0, 0],
        [width, height],
      ])
      .filter((event: MouseEvent) => !event.button && event.detail < 2)
      .handleSize(viz.schema.zoomBrushHandleSize)
      .on("start", brushStart.bind(viz))
      .on("brush", brushBrush.bind(viz))
      .on("end", brushEnd.bind(viz));

    // The brush mounts in the outer <svg> above the painted scene (see
    // `Viz._drawSceneToTarget`), not inside `_container` beneath it, so the
    // selection box stays visible over the shapes while dragging. It's
    // offset to the chart area, so selections come out chart-area-relative.
    const brushGroup = viz._select.selectAll(":scope > g.d3plus-zoom-brush").data([0]);
    viz._brushGroup = brushGroup
      .enter()
      .append("g")
      .attr("class", "d3plus-zoom-brush")
      .merge(brushGroup)
      .attr("transform", `translate(${left}, ${top})`)
      .call(viz._zoomBrush);

    zoomEvents.bind(viz)(isBrushing(viz));
    if (viz._renderTiles) viz._renderTiles(tileZoomTransform(viz), 0);

    return {panel, margin: {}};
  },
};

/**
    The maximum zoom scale: an explicit `zoomMax`, or — when unset — the scale
    at which the chart's smallest shape fills the chart area.
    @private
*/
function zoomMax(viz: Viz, width: number, height: number): number {
  if (typeof viz.schema.zoomMax === "number") return viz.schema.zoomMax;
  return autoZoomMax(
    viz._zoomShapes || viz._chartScene || [],
    width,
    height,
    viz.schema.zoomPadding,
    viz._chartTransform?.scale ?? 1,
  );
}

/**
    Mounts the DOM a zoomable chart needs: the `_container` <svg> hosting the
    zoom brush (every chart but Network/Geomap, which mount their own
    variants in `_draw`), and, on the SVG backend, points d3-zoom at the outer
    <svg>. The scene paints into that same outer <svg>, so it receives wheel/
    drag/dblclick both over painted shapes and over empty background. (The
    Canvas backend binds the <canvas> instead — see `bindCanvasZoom`.)
    @private
*/
function ensureZoomSurface(viz: Viz): void {
  if (!viz._select) return;
  if (!viz._ssr && (!viz._container || viz._container.classed("d3plus-zoom"))) {
    const {width, height} = chartBounds(viz as never);
    ensureZoomDom(viz as never, {kind: "generic", width, height, duration: viz.schema.duration});
  }
  if (viz._renderer !== "canvas") retargetZoom(viz, viz._select);
}

/**
    Moves the d3-zoom listeners onto a new element, clearing them from the
    previous target (and from `_container`, the default target) so a single
    gesture is never zoomed twice.
    @private
*/
function retargetZoom(viz: Viz, target: NonNullable<Viz["_zoomEventTarget"]>): void {
  const prev = viz._zoomEventTarget;
  if (prev && prev.node() === target.node()) return;
  if (prev) prev.on(".zoom", null);
  if (viz._container) viz._container.on(".zoom", null);
  viz._zoomEventTarget = target;
}

/**
    Canvas backend: once the scene is painted (so the <canvas> exists), bind
    d3-zoom to it. The compute <svg> overlaying the canvas is transparent to
    pointer events there, so the canvas is the sole interaction surface —
    CanvasRenderer's pick drives tooltips and d3-zoom drives pan/zoom on the
    same element. Called after every canvas paint; a no-op once bound.
*/
export function bindCanvasZoom(viz: Viz): void {
  if (!viz.schema.zoom || viz._ssr || !viz._zoomBehavior || !viz._brushGroup) return;
  const renderer = viz._sceneRenderer as {toCanvas?: () => HTMLCanvasElement | null} | undefined;
  const canvasNode = renderer && typeof renderer.toCanvas === "function" ? renderer.toCanvas() : null;
  if (!canvasNode || (viz._zoomEventTarget && viz._zoomEventTarget.node() === canvasNode)) return;
  retargetZoom(viz, select(canvasNode) as unknown as NonNullable<Viz["_zoomEventTarget"]>);
  zoomEvents.bind(viz)(isBrushing(viz));
}

/**
    Routes pointer events between the chart surface and the zoom brush.
    While brush mode is on, the outer <svg> goes transparent to pointer
    events and only the brush group opts back in, so a drag anywhere over the
    chart (shapes included) reaches the brush rather than a shape. On the
    Canvas backend the compute <svg> stays transparent otherwise, so the
    <canvas> beneath is the interaction surface.
*/
export function applyZoomPointerEvents(viz: Viz): void {
  const canvas = viz._renderer === "canvas";
  const brushing = isBrushing(viz);
  if (viz._select)
    viz._select.style("pointer-events", canvas || brushing ? "none" : null);
  if (viz._container) viz._container.style("pointer-events", canvas ? "none" : null);
  if (viz._brushGroup) viz._brushGroup.style("pointer-events", brushing ? "all" : null);
}

/**
    The current zoom transform re-expressed for content inside `_container`,
    which sits at the chart's margin offset rather than at the surface origin
    the zoom behavior measures from (Geomap's imperative tile layer).
*/
export function tileZoomTransform(viz: Viz): ZoomTransform {
  const t = zoomTransform((viz._zoomEventTarget || viz._container).node());
  const {left, top} = viz._margin;
  return zoomIdentity
    .translate(t.x + (t.k - 1) * left, t.y + (t.k - 1) * top)
    .scale(t.k);
}

/**
    Drops any zoom left over from before `zoom` was turned off, so the chart
    renders at its natural scale and a later re-enable starts from identity.
    @private
*/
function resetZoom(viz: Viz): void {
  viz._zoomTransform = undefined;
  const tgt = viz._zoomEventTarget || viz._container;
  if (tgt && tgt.node()) tgt.property("__zoom", zoomIdentity);
}

/**
    @name zoomEvents
    Handles adding/removing zoom event listeners.
    @private
*/
function zoomEvents(this: Viz, brush: boolean = false): void {
  setBrushing(this, brush);

  if (brush) this._brushGroup.style("display", "inline");
  else this._brushGroup.style("display", "none");
  applyZoomPointerEvents(this);

  // The element d3-zoom binds its pointer listeners to. Defaults to the compute
  // `<svg>` container; on the Canvas backend it's the <canvas> (see
  // `bindCanvasZoom`), because the canvas is the interaction surface there —
  // the svg is made pointer-events:none so hover events reach the canvas for
  // tooltip picking.
  const tgt = this._zoomEventTarget || this._container;

  if (!brush && this.schema.zoom) {
    tgt.call(this._zoomBehavior);
    if (!this.schema.zoomScroll) {
      tgt.on("wheel.zoom", null);
    }
    applyTouchAction(this);
    if (!this.schema.zoomPan) {
      tgt
        .on("mousedown.zoom mousemove.zoom", null)
        .on(
          "touchstart.zoom touchmove.zoom touchend.zoom touchcancel.zoom",
          null,
        );
    }
  } else {
    tgt.on(".zoom", null);
  }
}

/** Whether the chart is currently zoomed in (or panned) from its natural view. */
function isZoomedIn(viz: Viz): boolean {
  const tgt = viz._zoomEventTarget || viz._container;
  return Boolean(tgt && tgt.node() && zoomTransform(tgt.node()).k > 1);
}

/**
    Which gestures d3-zoom acts on. With `zoomScroll: "modifier"` (the default
    for charts embedded in a scrolling page), a chart doesn't capture the
    page's own scrolling: a plain wheel scrolls the page and only Ctrl/⌘ +
    wheel zooms (a trackpad pinch arrives as a Ctrl + wheel, so it zooms
    too), and a one-finger touch scrolls the page while a two-finger pinch
    zooms — until the chart is zoomed in, when one finger pans it. d3-zoom
    registers every current touch when a gesture starts, so skipping the
    first finger still gives a full pinch. Everything else follows d3-zoom's
    default filter (no Ctrl + drag, primary button only).
    @private
*/
function zoomGestureFilter(viz: Viz, event: MouseEvent & TouchEvent): boolean {
  const modifier = viz.schema.zoomScroll === "modifier";
  if (event.type === "wheel") return !modifier || event.ctrlKey || event.metaKey;
  if (event.type === "touchstart" && modifier)
    return (event.touches?.length ?? 0) > 1 || isZoomedIn(viz);
  return !event.ctrlKey && !event.button;
}

/**
    d3-zoom's wheel-to-zoom rate, except that its 10× boost for Ctrl + wheel
    only applies to a trackpad pinch (which browsers report as Ctrl + wheel
    with small deltas). Now that Ctrl + wheel is how a mouse zooms a chart, a
    mouse notch (~100px) held with Ctrl would otherwise jump 4× per notch.
    @private
*/
function wheelDelta(event: WheelEvent): number {
  const pinch = event.ctrlKey && event.deltaMode === 0 && Math.abs(event.deltaY) < 50;
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (pinch ? 10 : 1);
}

/**
    Lets the browser keep one-finger page scrolling over a chart while
    `zoomScroll` is "modifier" and the chart is at its natural view (a
    pinch still reaches d3-zoom), and hands every touch to the chart once
    it's zoomed in so one finger pans it.
    @private
*/
function applyTouchAction(viz: Viz): void {
  const tgt = viz._zoomEventTarget || viz._container;
  if (!tgt) return;
  const modifier = viz.schema.zoomScroll === "modifier" && viz.schema.zoomPan;
  tgt.style("touch-action", modifier ? (isZoomedIn(viz) ? "none" : "pan-x pan-y") : null);
}

/**
    @name zoomed
    Handles events dispatched from this._zoomBehavior
    @param transform
    @private
*/
function zoomed(
  this: Viz,
  transform: unknown = false,
  duration: number = 0,
): void {
  if (this._zoomGroup) {
    if (!duration) this._zoomGroup.attr("transform", transform);
    else
      this._zoomGroup
        .transition()
        .duration(duration)
        .attr("transform", transform);
  }

  // Thread the zoom transform into the scene graph so Network/Geomap
  // pan/zoom shows up under the scene renderer. The
  // `_zoomGroup.attr("transform", …)` write above remains for tests and
  // consumers reading the SVG directly; the scene-side update below is
  // what users see.
  const t = transform as {k?: number; x?: number; y?: number} | false | string;
  if (t && typeof t === "object" && "k" in t) {
    // Nullish-coalesce rather than `||` so a legitimate zero (a deliberate
    // collapse-to-zero scale, or pan transform at origin) doesn't get
    // silently rewritten to the default.
    const state = {k: t.k ?? 1, x: t.x ?? 0, y: t.y ?? 0};
    // A chart can zoom its own way (Plot rescales its axes); otherwise the
    // transform scales the rendered picture via `Viz.toScene`.
    if (this._zoomRescale && this._zoomRescale(state, duration)) this._zoomTransform = undefined;
    else this._zoomTransform = {x: state.x, y: state.y, scale: state.k};
  } else if (t === false) {
    this._zoomTransform = undefined;
  }
  // Repaint the scene so the new transform takes effect. Pass the
  // caller's `duration` through — d3-zoom dispatches `"zoom"` events
  // with duration=0 (per pixel of pan/wheel), so we MUST NOT use the
  // chart-level `_duration` (default 600 ms) for those: it would queue
  // a 600 ms transition per event, causing visible lag + setTimeout
  // accumulation. Programmatic zooms (zoomMath, zoomToBounds) pass an
  // explicit duration when they want animation.
  if (this._drawSceneToTarget && this._sceneRenderer) {
    this._drawSceneToTarget(duration);
  }
  applyTouchAction(this);

  if (this._renderTiles) this._renderTiles(tileZoomTransform(this), duration);
}

/**
    @name zoomMath
    Zooms in or out based on the provided multiplier.
    @param factor @private
*/
function zoomMath(this: Viz, factor: number = 0): void {
  if (!this._container) return;

  const [[x0, y0], [x1, y1]] = this._zoomBehavior.extent().bind(document)(),
    cx = (x0 + x1) / 2,
    cy = (y0 + y1) / 2,
    t = zoomTransform((this._zoomEventTarget || this._container).node());

  if (!factor) return zoomTo(this, 1, 0, 0);
  // Scale about the chart area's center: keep the content point currently at
  // the center fixed on screen.
  const k = t.k * factor;
  zoomTo(this, k, cx - ((cx - t.x) / t.k) * k, cy - ((cy - t.y) / t.k) * k);
}

/**
    Applies a programmatic zoom: clamps the scale to `scaleExtent` and the
    translate to `translateExtent` (the constraint d3-zoom enforces for
    pointer gestures), records it as the bound element's zoom state so the
    next wheel/drag continues from here, and paints it.
    @private
*/
function zoomTo(
  viz: Viz,
  scale: number,
  x: number,
  y: number,
  duration: number = viz.schema.duration,
): void {
  const [kMin, kMax] = viz._zoomBehavior.scaleExtent(),
    [[x0, y0], [x1, y1]] = viz._zoomBehavior.translateExtent(),
    k = Math.max(kMin, Math.min(kMax, scale));
  // Content must still cover the whole area: its left edge (x0·k + tx) can't
  // move right of x0, nor its right edge (x1·k + tx) left of x1.
  const tx = Math.max(x1 * (1 - k), Math.min(x0 * (1 - k), x)),
    ty = Math.max(y1 * (1 - k), Math.min(y0 * (1 - k), y));
  // A fresh transform, never a mutation of `zoomTransform(node)`'s result —
  // for an element d3-zoom hasn't stored state on yet, that's d3's shared
  // `zoomIdentity` constant.
  const t = zoomIdentity.translate(tx, ty).scale(k);
  (viz._zoomEventTarget || viz._container).property("__zoom", t);
  zoomed.bind(viz)(t, duration);
}

/**
    @name zoomToBounds
    Zooms so the given on-screen bounds (surface pixels, as currently
    displayed) fill the chart area, less `zoomPadding`. `null` resets.
    @param bounds
    @private
*/
function zoomToBounds(
  this: Viz,
  bounds: number[][] | null,
  duration: number = this.schema.duration,
): void {
  if (!bounds) return zoomTo(this, 1, 0, 0, duration);

  const [[x0, y0], [x1, y1]] = this._zoomBehavior.translateExtent(),
    pad = this.schema.zoomPadding,
    t = zoomTransform((this._zoomEventTarget || this._container).node()),
    // Un-apply the current transform: bounds → unzoomed surface space.
    bx0 = (bounds[0][0] - t.x) / t.k,
    by0 = (bounds[0][1] - t.y) / t.k,
    bx1 = (bounds[1][0] - t.x) / t.k,
    by1 = (bounds[1][1] - t.y) / t.k;

  const k = Math.min(
    (x1 - x0 - pad * 2) / (bx1 - bx0),
    (y1 - y0 - pad * 2) / (by1 - by0),
  );
  // Center the bounds in the chart area.
  zoomTo(
    this,
    k,
    (x0 + x1) / 2 - (k * (bx0 + bx1)) / 2,
    (y0 + y1) / 2 - (k * (by0 + by1)) / 2,
    duration,
  );
}

/**
    Triggered on brush "brush".
    @private
*/
function brushBrush(this: Viz): void {
  brushStyle.bind(this)();
}

/**
    Triggered on brush "end".
    @private
*/
function brushEnd(this: Viz, event: {selection: number[][] | null}): void {
  if (!event.selection) return; // Only transition after input.

  this._brushGroup.call(this._zoomBrush.move, null);
  // A selection is a one-shot zoom: leave brush mode so the chart takes
  // pointer events (hover, pan, wheel) again.
  zoomEvents.bind(this)(false);
  syncBrushButton(this);
  // The brush group is offset by the chart margin; shift its selection into
  // the surface space `zoomToBounds` expects.
  const {left, top} = this._margin;
  zoomToBounds.bind(this)(
    event.selection.map(([x, y]) => [x + left, y + top]),
  );
}

/**
    Triggered on brush "start".
    @private
*/
function brushStart(this: Viz): void {
  brushStyle.bind(this)();
}

/**
    Overrides the default brush styles.
    @private
*/
function brushStyle(this: Viz): void {
  this._brushGroup
    .selectAll(".selection")
    .call(attrize, this.schema.zoomBrushSelectionStyle || {});

  this._brushGroup
    .selectAll(".handle")
    .call(attrize, this.schema.zoomBrushHandleStyle || {});
}
