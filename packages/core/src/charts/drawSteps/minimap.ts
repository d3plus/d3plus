import {zoomIdentity, zoomTransform} from "d3-zoom";
import type {ZoomTransform} from "d3-zoom";

import {chartBounds} from "../features/chartGeometry.js";
import type {FeatureLayout, FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";
import {zoomTo} from "./zoomControls.js";
import {
  MINIMAP_GAP,
  MINIMAP_RIGHT_INSET,
  formatZoomLabel,
  minimapHtml,
  minimapStyles,
  paintMinimapStyle,
} from "./minimapMarkup.js";
import {showsZoomControls, zoomControlsBox} from "./zoomControlsMarkup.js";

type MinimapStyles = ReturnType<typeof minimapStyles>;

/** Drag state shared between the viewport box's event handlers and `paint`. */
interface DragState {
  dragging: boolean;
  /** The pointer that started the current drag — a second finger/pointer is ignored until it ends. */
  dragPointerId: number | null;
  dragStart: {x: number; y: number; tx: number; ty: number; k: number};
}

/**
    The element d3-zoom's transform is read from — the same fallback
    `zoomControls.ts` uses throughout (`_zoomEventTarget` on the Canvas
    backend, `_container` otherwise).
    @private
*/
function zoomTarget(viz: Viz): Viz["_zoomEventTarget"] {
  return viz._zoomEventTarget || viz._container;
}

/** The live d3-zoom transform — NOT `viz._zoomTransform`, which the Plot family clears to `undefined` for its own axis-rescale zoom (`zoomControls.ts`'s `zoomed()`). Reading it straight from d3-zoom works uniformly across every chart type. */
function liveTransform(viz: Viz): ZoomTransform {
  const node = zoomTarget(viz)?.node();
  return node ? zoomTransform(node) : zoomIdentity;
}

/** A keyboard nudge step, in minimap pixels — Shift takes a bigger step. */
const KEY_STEP = 10;
const KEY_STEP_SHIFT = 40;
const ARROW_KEYS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
};

/** Re-centers the chart, at scale `k`, on a content-space point — the shared math behind click-to-jump and wheel-zoom. @private */
function centerOn(viz: Viz, px: number, py: number, k: number, duration: number): void {
  const [[ax0, ay0], [ax1, ay1]] = viz._zoomBehavior.translateExtent();
  zoomTo(viz, k, (ax0 + ax1) / 2 - px * k, (ay0 + ay1) / 2 - py * k, duration);
}

/** Maps a pointer position local to the minimap's outer box into content-space. @private */
function contentPointFromLocal(viz: Viz, mmW: number, mmH: number, localX: number, localY: number): [number, number] {
  const [[ax0, ay0], [ax1, ay1]] = viz._zoomBehavior.translateExtent();
  return [ax0 + (localX / mmW) * (ax1 - ax0), ay0 + (localY / mmH) * (ay1 - ay0)];
}

/**
    Repaints the outer box, viewport box, and label from the LIVE zoom
    transform. Called from `onUpdate` (every repaint) and directly from the
    drag handlers (pointerdown/up need to flip the active style immediately,
    before any transform change triggers a repaint of their own).

    Each element's user-configurable style (`minimapStyle`/etc.) is painted
    in its own call, BEFORE the internal, non-configurable geometry/
    visibility styles this feature owns — so a user-supplied `opacity`,
    `position`, or `left`/`top`/`width`/`height` can't accidentally break the
    1x-hide gate or the live viewport-box positioning; the internal call
    always wins for the handful of properties it manages, leaving every
    other property (background, border, border-radius, …) up to the user.
    @private
*/
function paint(viz: Viz, mmW: number, mmH: number, styles: MinimapStyles, state: DragState, viewportEl: HTMLElement): void {
  const el = viewportEl.parentElement;
  const labelEl = el?.querySelector<HTMLElement>(".d3plus-minimap-label");
  if (!el || !labelEl) return;

  const t = liveTransform(viz);
  const zoomedIn = t.k > 1;

  paintMinimapStyle(el, styles.outer);
  // Faded (not `display:none`) so crossing the 1x threshold — via any of
  // the minimap's own gestures, a zoom button, or the wheel — animates
  // rather than popping. `pointer-events` still gates interaction while
  // hidden. Tied to `viz.schema.duration` like the chart's other
  // non-per-pixel transitions (button clicks, reset) — `0` (as every test
  // in this suite sets) makes it an instant, assertion-friendly toggle.
  paintMinimapStyle(el, {
    position: "absolute",
    "box-sizing": "border-box",
    overflow: "hidden",
    opacity: zoomedIn ? "1" : "0",
    "pointer-events": zoomedIn ? "auto" : "none",
    transition: `opacity ${viz.schema.duration}ms`,
  });
  if (!zoomedIn) return;

  const [[ax0, ay0], [ax1, ay1]] = viz._zoomBehavior.translateExtent();
  const areaW = ax1 - ax0, areaH = ay1 - ay0;
  const frac = Math.min(1, 1 / t.k);
  // Un-apply the current transform — the same algebra `zoomToBounds`
  // uses to go from displayed bounds back to unzoomed surface space.
  const contentX0 = (ax0 - t.x) / t.k, contentY0 = (ay0 - t.y) / t.k;
  const fracX = Math.max(0, Math.min(1 - frac, areaW ? (contentX0 - ax0) / areaW : 0));
  const fracY = Math.max(0, Math.min(1 - frac, areaH ? (contentY0 - ay0) / areaH : 0));

  paintMinimapStyle(viewportEl, styles.viewport, state.dragging ? styles.viewportActive : {});
  paintMinimapStyle(viewportEl, {
    position: "absolute",
    "box-sizing": "border-box",
    "touch-action": "none",
    left: `${fracX * mmW}px`,
    top: `${fracY * mmH}px`,
    width: `${Math.max(1, frac * mmW)}px`,
    height: `${Math.max(1, frac * mmH)}px`,
  });

  paintMinimapStyle(labelEl, styles.label);
  paintMinimapStyle(labelEl, {position: "absolute"});
  labelEl.textContent = formatZoomLabel(t.k);
}

/**
    Drag-to-pan + keyboard-nudge events for the viewport box. Guards every
    pointer event by `pointerId` against the one that started the drag, so a
    second finger/pointer touching the box mid-drag (or a stray pointerup
    for an unrelated pointer) can't hijack or prematurely end it.
    @private
*/
function viewportEvents(
  viz: Viz,
  mmW: number,
  styles: MinimapStyles,
  state: DragState,
  paintFrom: (viewportEl: HTMLElement) => void,
): Record<string, (e: Event) => void> {
  const closestViewport = (e: Event): HTMLElement | null =>
    (e.target as Element | null)?.closest(".d3plus-minimap-viewport") as HTMLElement | null;

  const endDrag = (e: Event): void => {
    if ((e as PointerEvent).pointerId !== state.dragPointerId) return;
    state.dragging = false;
    const el = closestViewport(e);
    if (el) paintFrom(el);
  };

  return {
    pointerdown: (e: Event) => {
      const pe = e as PointerEvent;
      const el = closestViewport(e);
      if (!el) return;
      // Keeps pointermove/pointerup targeting this element even once the
      // cursor leaves the small minimap during a fast drag. Not critical
      // if it throws (an untrusted pointerId, an old browser) — a slower
      // drag that stays over the element still works without it.
      try {
        el.setPointerCapture(pe.pointerId);
      } catch {
        /* not critical, see above */
      }
      state.dragging = true;
      state.dragPointerId = pe.pointerId;
      const t = liveTransform(viz);
      state.dragStart = {x: pe.clientX, y: pe.clientY, tx: t.x, ty: t.y, k: t.k};
      paintFrom(el);
      e.preventDefault();
    },
    pointermove: (e: Event) => {
      const pe = e as PointerEvent;
      if (!state.dragging || pe.pointerId !== state.dragPointerId) return;
      const [[ax0], [ax1]] = viz._zoomBehavior.translateExtent();
      const scaleFactor = (ax1 - ax0) / mmW;
      const dx = (pe.clientX - state.dragStart.x) * scaleFactor * state.dragStart.k;
      const dy = (pe.clientY - state.dragStart.y) * scaleFactor * state.dragStart.k;
      // duration 0 — 1:1 responsiveness, matching every other per-pixel
      // pan/zoom tick (`zoomed()`'s own reasoning: a queued transition
      // per pointermove would visibly lag).
      zoomTo(viz, state.dragStart.k, state.dragStart.tx - dx, state.dragStart.ty - dy, 0);
    },
    pointerup: endDrag,
    pointercancel: endDrag,
    // Arrow keys nudge the pan (Shift for a bigger step) — the keyboard
    // equivalent of dragging, for the `tabindex`-focusable viewport box
    // `minimapHtml` marks up.
    keydown: (e: Event) => {
      const ke = e as KeyboardEvent;
      const dir = ARROW_KEYS[ke.key];
      if (!dir) return;
      ke.preventDefault();
      const [[ax0], [ax1]] = viz._zoomBehavior.translateExtent();
      const scaleFactor = (ax1 - ax0) / mmW;
      const step = ke.shiftKey ? KEY_STEP_SHIFT : KEY_STEP;
      const t = liveTransform(viz);
      const dx = dir[0] * step * scaleFactor * t.k;
      const dy = dir[1] * step * scaleFactor * t.k;
      // A discrete step, not a per-pixel drag tick — animates like the
      // zoom buttons' own clicks rather than jumping instantly.
      zoomTo(viz, t.k, t.x - dx, t.y - dy, viz.schema.duration);
    },
  };
}

/** Click-to-jump / double-click-reset / Cmd+wheel-zoom events for the outer box. @private */
function outerEvents(viz: Viz, mmW: number, mmH: number): Record<string, (e: Event) => void> {
  return {
    // A click on the outer box (not the viewport box itself, which
    // `viewportEvents`'s `pointerdown` already claims for dragging)
    // re-centers the chart on the clicked point without changing scale —
    // the "jump" complement to dragging the viewport box.
    click: (e: Event) => {
      const target = e.target as Element | null;
      if (target?.closest(".d3plus-minimap-viewport")) return;
      const outerEl = target?.closest(".d3plus-minimap") as HTMLElement | null;
      if (!outerEl) return;
      const me = e as MouseEvent;
      const rect = outerEl.getBoundingClientRect();
      const [px, py] = contentPointFromLocal(viz, mmW, mmH, me.clientX - rect.left, me.clientY - rect.top);
      centerOn(viz, px, py, liveTransform(viz).k, viz.schema.duration);
    },
    // Double-clicking anywhere on the minimap resets the chart, like the
    // zoom-reset button.
    dblclick: (e: Event) => {
      e.preventDefault();
      zoomTo(viz, 1, 0, 0);
    },
    // Cmd/Ctrl + scroll zooms the whole chart, centered on the content
    // point under the cursor's position within the minimap — mirrors
    // the main chart's own modifier-gated wheel zoom (`zoomGestureFilter`)
    // and `zoomToBounds`'s centering math.
    wheel: (e: Event) => {
      const we = e as WheelEvent;
      if (!we.ctrlKey && !we.metaKey) return;
      we.preventDefault();
      const outerEl = (e.target as Element | null)?.closest(".d3plus-minimap") as HTMLElement | null;
      if (!outerEl) return;
      const rect = outerEl.getBoundingClientRect();
      const [px, py] = contentPointFromLocal(viz, mmW, mmH, we.clientX - rect.left, we.clientY - rect.top);
      const factor = we.deltaY < 0 ? viz.schema.zoomFactor : 1 / viz.schema.zoomFactor;
      centerOn(viz, px, py, liveTransform(viz).k * factor, 0);
    },
  };
}

/**
    Builds the minimap's `htmlOverlay` panel: a static skeleton (outer box +
    draggable viewport box + zoom-level label) sized and positioned once per
    full draw, whose `onUpdate` repaints the live geometry/label/visibility
    on every repaint — including every pan/zoom/drag/wheel tick, none of
    which re-run `layout()`. Mirrors `buildZoomControlPanel`'s shape.
    @private
*/
function buildMinimapPanel(viz: Viz, mmW: number, mmH: number, controlsHeight: number): FeatureLayout["panel"] {
  const styles = minimapStyles(viz);
  const state: DragState = {dragging: false, dragPointerId: null, dragStart: {x: 0, y: 0, tx: 0, ty: 0, k: 1}};
  const paintFrom = (viewportEl: HTMLElement): void => paint(viz, mmW, mmH, styles, state, viewportEl);
  const extraClass = viz.schema.minimapClassName ? ` ${viz.schema.minimapClassName}` : "";

  return {
    type: "htmlOverlay",
    key: "viz-minimap",
    x: viz.schema.width - MINIMAP_RIGHT_INSET - mmW,
    y: controlsHeight + MINIMAP_GAP,
    width: mmW,
    height: mmH,
    className: `d3plus-minimap${extraClass}`,
    html: minimapHtml(viz),
    events: {
      ".d3plus-minimap-viewport": viewportEvents(viz, mmW, styles, state, paintFrom),
      ".d3plus-minimap": outerEvents(viz, mmW, mmH),
    },
    onUpdate: (host: HTMLElement) => {
      const viewportEl = host.querySelector<HTMLElement>(".d3plus-minimap-viewport");
      if (viewportEl) paintFrom(viewportEl);
    },
  };
}

/**
    @name minimapFeature
    A small overview of the full scene, underneath the zoom-control panel,
    with a draggable box showing the current viewport and a zoom-level
    label — hidden at the chart's natural 1x view, shown once zoomed in.

    Runs as a post-draw `FeatureModule` right after `zoomFeature` (needs its
    `_zoomBehavior.translateExtent()`/`scaleExtent()` already configured for
    this draw). Claims zero margin, like `zoomFeature` — it floats over the
    existing chart area rather than pushing content around. The panel is
    ALWAYS mounted whenever zoom + minimap are both enabled, regardless of
    the current zoom level: the "hidden at 1x" gate lives inside the panel's
    `onUpdate`, reading the LIVE transform on every repaint, so it hides/
    shows correctly during any live pan/zoom gesture — not just on the next
    full `.render()` (dragging the minimap itself, wheel-zooming, clicking a
    zoom button, and brush-zooming all repaint outside the layout pipeline).
*/
export const minimapFeature: FeatureModule = {
  name: "minimap",
  layout: ({viz}) => {
    if (!viz.schema.zoom || !viz.schema.minimap || !viz._container || !viz._zoomBehavior || !showsZoomControls(viz))
      return {panel: null, margin: {}};

    const box = zoomControlsBox(viz);
    if (!box) return {panel: null, margin: {}};

    // The same width/height `zoomFeature` sizes `translateExtent` from —
    // `_zoomWidth`/`_zoomHeight` are an escape hatch no chart sets today,
    // but if one ever does, the minimap's aspect ratio (and its viewport-box
    // math, which reads `translateExtent` directly) must track it rather
    // than `chartBounds` alone.
    const bounds = chartBounds(viz as never);
    const height = viz._zoomHeight || bounds.height, width = viz._zoomWidth || bounds.width;
    if (!width || !height) return {panel: null, margin: {}};

    // `box.width` measures the WHOLE button panel, including its own
    // `paddingRight` (`ZOOM_PANEL_STYLE`) — the same inset this panel adds
    // again below to sit flush with the panel's right edge. Subtracting it
    // once here keeps the minimap's visible width equal to the buttons'
    // own footprint instead of double-counting that padding.
    const mmW = box.width - MINIMAP_RIGHT_INSET;
    const mmH = mmW * (height / width);

    return {panel: buildMinimapPanel(viz, mmW, mmH, box.height), margin: {}};
  },
};
