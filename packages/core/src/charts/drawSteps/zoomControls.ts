import {zoomTransform} from "d3-zoom";

import {attrize} from "@d3plus/dom";
import {chartBounds} from "../features/chartGeometry.js";
import type {FeatureLayout, FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";
import {
  zoomControlStyleActiveDefault,
  zoomControlStyleDefault,
  zoomControlStyleHoverDefault,
} from "../viz/vizDefaults.js";

/** Mutable version of ZoomTransform for direct property manipulation. */
interface MutableTransform {
  k: number;
  x: number;
  y: number;
}

/**
    Brush mode is per-chart, not global. Previously a module-level
    `let brushing = false` was shared across all chart instances on the
    page — toggling brush on chart A silently flipped chart B's state.
    Now lives on `viz._brushing` and is read/written via helpers.
*/
function isBrushing(viz: Viz): boolean {
  return Boolean(viz._brushing);
}
function setBrushing(viz: Viz, value: boolean): void {
  viz._brushing = value;
}

/**
    Apply a plain key/value style object to a real DOM element. v4 uses
    HtmlOverlay nodes for the zoom-control buttons, so the d3-selection
    `stylize` helper isn't reachable from the scene-graph escape hook.
*/
function applyStyleObj(
  el: HTMLElement,
  styles: Record<string, string | number | undefined | null | false> | false | null | undefined,
): void {
  if (!styles) return;
  for (const k in styles) {
    const v = styles[k];
    if (v === undefined || v === null || v === false) continue;
    (el.style as unknown as Record<string, string>)[k] = String(v);
  }
}

type ZoomControlStyleValue = Parameters<typeof applyStyleObj>[1];

/**
    Resolves a `zoomControlStyle`/`Active`/`Hover` value for painting.
    Setting `zoomControlClassName` auto-disables whichever of the three is
    still the untouched built-in default (identified by reference — see
    `zoomControlStyleDefault` et al. in `vizDefaults.ts`) so a host page's own
    button styling can apply through the cascade without also requiring
    `.zoomControlStyle(false)` etc. An explicit custom style object (a
    different reference) always wins, className or not.
*/
function resolveZoomControlStyle(
  viz: Viz,
  value: ZoomControlStyleValue,
  defaultValue: ZoomControlStyleValue,
): ZoomControlStyleValue {
  if (viz.schema.zoomControlClassName && value === defaultValue) return false;
  return value;
}

/**
    Shared attributes for the four icon `<svg>`s below: one `viewBox`, one
    `stroke-width`, `currentColor` for the stroke (so the icon still follows
    `color` from `zoomControlStyle`/a host page's CSS, same as the glyph
    characters this replaced). Sizing and `vertical-align: middle` live in
    the `style` attribute rather than as `width`/`height` SVG attributes —
    plenty of CSS resets (Bulma's base stylesheet, for one) include a plain
    `svg { width: auto; height: auto }` rule, and *any* CSS declaration beats
    a presentation attribute. An SVG with only a `viewBox` and no definite
    CSS size can collapse to 0×0 inside a flex layout, which is exactly what
    happened here — an inline `style` has enough specificity that no host
    page's element-selector reset can strip it back out. `vertical-align:
    middle` matters because an inline `svg` defaults to `vertical-align:
    baseline` like text, which sits it a couple pixels off-center inside a
    host page's own button styling (Bootstrap/Tailwind/Bulma center *text*
    via their own line-height/padding, not a replaced element's baseline).
    `zoomControlClassName` intentionally drops our own `align-items`/
    `justify-content` centering so it doesn't fight a framework's layout —
    `vertical-align: middle` is what keeps the icon itself centered
    regardless of whose CSS is doing the centering. `flex-shrink: 0` guards
    against a different failure mode: if a host framework's own button
    (Bulma's `.button`, for one) is itself `display: flex` with padding wide
    enough to leave less than 12px of content room, the icon — a flex item
    of that button — would otherwise shrink to fit, quietly distorting it
    into a non-square sliver instead of keeping its aspect ratio.

    Text-glyph icons (`+`, `−`, a Unicode home/square symbol, …) come from
    different font fallback chains, and browsers apply synthetic bold to
    each inconsistently — no single font reliably bolds all of them to the
    same visual stroke thickness across OSes. Vector paths sidestep that
    entirely: every icon renders at the exact same stroke weight regardless
    of the visitor's font/OS/browser (and all four share the same 4–20
    bounding box within the 24x24 viewBox, so they also match in apparent
    size) — this is how icon sets like Feather/Lucide/Material Symbols do it.
*/
const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:12px;height:12px;vertical-align:middle;flex-shrink:0"';
const ZOOM_IN_ICON = `<svg ${ICON_ATTRS}><line x1="12" y1="4" x2="12" y2="20"/><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
const ZOOM_OUT_ICON = `<svg ${ICON_ATTRS}><line x1="4" y1="12" x2="20" y2="12"/></svg>`;
// A simple house outline — the conventional "reset to home view" icon.
const ZOOM_RESET_ICON = `<svg ${ICON_ATTRS}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
// A dashed square — a "marquee select" icon, reading as "drag a box".
const ZOOM_BRUSH_ICON = `<svg ${ICON_ATTRS} stroke-dasharray="4 3"><rect x="4" y="4" width="16" height="16" rx="1"/></svg>`;

/**
    Builds the four zoom-control buttons as an `htmlOverlay` scene-node
    panel. Split out of `zoomFeature.layout` purely to stay under the
    per-function line budget — see that function's doc for how the panel's
    pieces (styling, events, `onUpdate`) fit together.
    @private
*/
function buildZoomControlPanel(viz: Viz, width: number): FeatureLayout["panel"] {
  // Real <button>s (not <div>s) so a host page's own button styling
  // (Tailwind, Bootstrap, a design system's global `button` reset) can
  // apply through the cascade once a `zoomControlClassName` auto-disables
  // the inline defaults below (see `resolveZoomControlStyle`). `extraClass`
  // lets a consumer layer their own class (e.g. a Tailwind utility string)
  // onto each button without losing the fixed classes event delegation
  // depends on.
  const extraClass = viz.schema.zoomControlClassName
    ? ` ${viz.schema.zoomControlClassName}`
    : "";
  const baseOrActiveStyle = (active: boolean) =>
    resolveZoomControlStyle(
      viz,
      active ? viz.schema.zoomControlStyleActive : viz.schema.zoomControlStyle,
      active ? zoomControlStyleActiveDefault : zoomControlStyleDefault,
    ) || {};
  const hoverStyle = () =>
    resolveZoomControlStyle(
      viz,
      viz.schema.zoomControlStyleHover,
      zoomControlStyleHoverDefault,
    ) || {};
  const zoomButton = (
    cls: string,
    label: string,
    glyph: string,
    active = false,
  ) =>
    `<button type="button" class="zoom-control ${cls}${active ? " active" : ""}${extraClass}" aria-label="${viz.schema.translate(label)}">${glyph}</button>`;

  return {
    type: "htmlOverlay" as const,
    key: "viz-zoom-controls",
    // Spans the full chart width and right-aligns its (flex) button
    // content, rather than computing a pixel x-offset from an assumed
    // button-row width — that would have to be recomputed whenever
    // `zoomControlStyle`/`zoomControlClassName` changes each button's
    // size. This stays correct regardless of how wide the buttons end up.
    //
    // Spacing lives here, not on the buttons: per-button `margin` doesn't
    // collapse between inline/flex siblings, so two adjacent 4px margins
    // would add up to an 8px gap. A container `gap` gives exactly one 4px
    // gap between each pair, and `padding` (with `box-sizing: border-box`,
    // so it doesn't push the box past its own `width`) gives exactly one
    // 4px inset from the chart's top/right edge. This applies unconditionally
    // — unlike `zoomControlStyle`, it isn't part of the auto-disable that
    // `zoomControlClassName` triggers, so a host page never has to re-add
    // its own spacing utility (no more `mx-1`-style classes needed).
    x: viz._margin.left,
    y: viz._margin.top,
    width,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: "4px",
      boxSizing: "border-box",
      paddingTop: "4px",
      paddingRight: "4px",
    },
    className: "d3plus-zoom-control",
    // Depends on `zoomControlClassName`/the active locale/the current
    // brush state, so — unlike a truly static string — this CAN change
    // between draws (e.g. `.locale(...)` or `.zoomControlClassName(...)`
    // called after the initial render). `onUpdate` below (not `onMount`)
    // is what keeps freshly-swapped-in buttons styled + interactive.
    html:
      zoomButton("zoom-in", "Zoom In", ZOOM_IN_ICON) +
      zoomButton("zoom-out", "Zoom Out", ZOOM_OUT_ICON) +
      zoomButton("zoom-reset", "Reset Zoom", ZOOM_RESET_ICON) +
      zoomButton("zoom-brush", "Brush Zoom", ZOOM_BRUSH_ICON, isBrushing(viz)),
    // Declarative click wiring — clicks bubble, so the renderer's
    // delegated dispatcher can route them by selector. The four
    // handlers below are the single source of truth for what each
    // zoom button does. Hover styles can't be delegated (mouseenter
    // / mouseleave don't bubble), so they live in onUpdate below as
    // a per-button binding.
    events: {
      ".zoom-in": {
        click: () => zoomMath.bind(viz)(viz.schema.zoomFactor),
      },
      ".zoom-out": {
        click: () => zoomMath.bind(viz)(1 / viz.schema.zoomFactor),
      },
      ".zoom-reset": {
        click: () => zoomMath.bind(viz)(0),
      },
      ".zoom-brush": {
        click: (e: Event) => {
          // The overlay dispatches clicks via delegation, so `e.currentTarget`
          // is the host wrapper that encloses all four buttons — not the
          // clicked button. Styling/toggling the wrapper would paint the
          // active background around the whole control stack and offset it by
          // the base margin/border. Resolve the actual button from the event
          // target, the same way the dispatcher matches (`target.closest`).
          const btn = (e.target as Element).closest(".zoom-brush") as HTMLElement | null;
          if (!btn) return;
          const willBrush = !isBrushing(viz);
          const isActive = btn.classList.toggle("active", willBrush);
          applyStyleObj(btn, baseOrActiveStyle(isActive));
          zoomEvents.bind(viz)(willBrush);
        },
      },
    },
    // `onUpdate` (not `onMount`) because the html string above is no
    // longer a fixed constant — a `zoomControlClassName`/locale/brush
    // change replaces the button DOM nodes on the next draw, and only a
    // per-draw hook sees those fresh nodes. `onUpdate` fires after every
    // draw (including the first), so each `.zoom-control` is checked
    // here; the `data-zoom-bound` guard makes the actual work (base
    // style + hover binding) run exactly once per DOM node, so a
    // persisted (unchanged) button isn't restyled or double-bound on
    // every subsequent draw/zoom-tick.
    onUpdate: (host: HTMLElement) => {
      const buttons = host.querySelectorAll<HTMLElement>(".zoom-control");
      buttons.forEach(btn => {
        if (btn.dataset.zoomBound) return;
        btn.dataset.zoomBound = "1";
        applyStyleObj(btn, baseOrActiveStyle(btn.classList.contains("active")));
        // mouseenter/mouseleave don't bubble, so they can't ride the
        // declarative `events` map's delegated dispatch — bind directly.
        btn.addEventListener("mouseenter", () => {
          applyStyleObj(btn, hoverStyle());
        });
        btn.addEventListener("mouseleave", () => {
          applyStyleObj(btn, baseOrActiveStyle(btn.classList.contains("active")));
        });
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
    if (!viz._container || !viz._zoomGroup) return {panel: null, margin: {}};

    const bounds = chartBounds(viz as never);
    const height = viz._zoomHeight || bounds.height,
      width = viz._zoomWidth || bounds.width;

    viz._zoomBehavior
      .extent([
        [0, 0],
        [width, height],
      ])
      .scaleExtent([1, viz.schema.zoomMax])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event: {transform: unknown}) =>
        zoomed.bind(viz)(event.transform),
      );

    viz._zoomToBounds = zoomToBounds.bind(viz);

    const panel: FeatureLayout["panel"] = viz.schema.zoom
      ? buildZoomControlPanel(viz, width)
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

    const brushGroup = viz._container.selectAll("g.brush").data([0]);
    viz._brushGroup = brushGroup
      .enter()
      .append("g")
      .attr("class", "brush")
      .merge(brushGroup)
      .call(viz._zoomBrush);

    zoomEvents.bind(viz)();
    if (viz._renderTiles)
      viz._renderTiles(zoomTransform((viz._zoomEventTarget || viz._container).node()), 0);

    return {panel, margin: {}};
  },
};

/**
    @name zoomEvents
    Handles adding/removing zoom event listeners.
    @private
*/
function zoomEvents(this: Viz, brush: boolean = false): void {
  setBrushing(this, brush);

  if (brush) this._brushGroup.style("display", "inline");
  else this._brushGroup.style("display", "none");

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
    this._zoomTransform = {
      x: t.x ?? 0,
      y: t.y ?? 0,
      scale: t.k ?? 1,
    };
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

  if (this._renderTiles)
    this._renderTiles(zoomTransform((this._zoomEventTarget || this._container).node()), duration);
}

/**
    @name zoomMath
    Zooms in or out based on the provided multiplier.
    @param factor @private
*/
function zoomMath(this: Viz, factor: number = 0): void {
  if (!this._container) return;

  const center = this._zoomBehavior
      .extent()
      .bind(document)()[1]
      .map((d: number) => d / 2),
    scaleExtent = this._zoomBehavior.scaleExtent(),
    t = zoomTransform(
      (this._zoomEventTarget || this._container).node(),
    ) as unknown as MutableTransform;

  if (!factor) {
    t.k = scaleExtent[0];
    t.x = 0;
    t.y = 0;
  } else {
    const translate0 = [(center[0] - t.x) / t.k, (center[1] - t.y) / t.k];
    t.k = Math.min(scaleExtent[1], t.k * factor);
    if (t.k <= scaleExtent[0]) {
      t.k = scaleExtent[0];
      t.x = 0;
      t.y = 0;
    } else {
      t.x += center[0] - (translate0[0] * t.k + t.x);
      t.y += center[1] - (translate0[1] * t.k + t.y);
    }
  }

  zoomed.bind(this)(t, this.schema.duration);
}

/**
    @name zoomToBounds
    Zooms to given bounds.
    @param bounds
    @private
*/
function zoomToBounds(
  this: Viz,
  bounds: number[][] | null,
  duration: number = this.schema.duration,
): void {
  const scaleExtent = this._zoomBehavior.scaleExtent(),
    t = zoomTransform(
      (this._zoomEventTarget || this._container).node(),
    ) as unknown as MutableTransform;

  if (bounds) {
    const [width, height] = this._zoomBehavior.translateExtent()[1],
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1];

    let k = Math.min(scaleExtent[1], 1 / Math.max(dx / width, dy / height));

    let xMod: number, yMod: number;
    if (dx / dy < width / height) {
      k *= (height - this.schema.zoomPadding * 2) / height;
      xMod = (width - dx * k) / 2 / k;
      yMod = this.schema.zoomPadding / k;
    } else {
      k *= (width - this.schema.zoomPadding * 2) / width;
      yMod = (height - dy * k) / 2 / k;
      xMod = this.schema.zoomPadding / k;
    }

    t.x = (t.x - bounds[0][0] + xMod) * ((t.k * k) / t.k);
    t.y = (t.y - bounds[0][1] + yMod) * ((t.k * k) / t.k);
    t.k *= k;

    if (t.x > 0) t.x = 0;
    else if (t.x < width * -t.k + width) t.x = width * -t.k + width;
    if (t.y > 0) t.y = 0;
    else if (t.y < height * -t.k + height) t.y = height * -t.k + height;
  } else {
    t.k = scaleExtent[0];
    t.x = 0;
    t.y = 0;
  }

  zoomed.bind(this)(t, duration);
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
  zoomToBounds.bind(this)(event.selection);
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
