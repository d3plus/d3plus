import {zoomTransform} from "d3-zoom";

import {attrize} from "@d3plus/dom";
import {chartBounds} from "../features/chartGeometry.js";
import type {FeatureLayout, FeatureModule} from "../features/features.js";
import type Viz from "../viz/Viz.js";

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
         `viz._featurePanels`. `onMount` is
         the scene's interactive-HTML escape hook: it wires the click/hover
         handlers + applies the user's zoomControl style configs. `onMount`
         fires ONCE per host element (after innerHTML is written, so the
         `.zoom-in` / `.zoom-out` querySelectors below resolve), not per
         draw — the html string is constant, so listeners attached here
         survive every subsequent draw (renderers only rewrite innerHTML
         when it differs from the current value).
*/
export const zoomFeature: FeatureModule = {
  name: "zoom",
  layout: ({viz}) => {
    if (!viz._container || !viz._zoomGroup) return {panel: null, margin: {}};

    const bounds = chartBounds(viz as never);
    const height = viz._zoomHeight || bounds.height,
      that = viz,
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

    let panel: FeatureLayout["panel"] = null;
    if (viz.schema.zoom) {
      panel = {
        type: "htmlOverlay" as const,
        key: "viz-zoom-controls",
        x: viz._margin.left,
        y: viz._margin.top,
        className: "d3plus-zoom-control",
        html:
          '<div class="zoom-control zoom-in">&#65291;</div>' +
          '<div class="zoom-control zoom-out">&#65293;</div>' +
          '<div class="zoom-control zoom-reset">&#8634;</div>' +
          '<div class="zoom-control zoom-brush">&#164;</div>',
        // Declarative click wiring — clicks bubble, so the renderer's
        // delegated dispatcher can route them by selector. The four
        // handlers below are the single source of truth for what each
        // zoom button does. Hover styles can't be delegated (mouseenter
        // / mouseleave don't bubble), so they live in onMount below as
        // a per-button binding.
        events: {
          ".zoom-in": {
            click: () => zoomMath.bind(that)(that.schema.zoomFactor),
          },
          ".zoom-out": {
            click: () => zoomMath.bind(that)(1 / that.schema.zoomFactor),
          },
          ".zoom-reset": {
            click: () => zoomMath.bind(that)(0),
          },
          ".zoom-brush": {
            click: (e: Event) => {
              const btn = e.currentTarget as HTMLElement;
              const willBrush = !isBrushing(that);
              const isActive = btn.classList.toggle("active", willBrush);
              applyStyleObj(
                btn,
                isActive
                  ? that.schema.zoomControlStyleActive || {}
                  : that.schema.zoomControlStyle || {},
              );
              zoomEvents.bind(that)(willBrush);
            },
          },
        },
        // onMount fires AFTER innerHTML is written so the querySelectorAll
        // matches. Applies base styles + binds non-delegable hover events
        // per button (mouseenter/mouseleave don't bubble through
        // delegated event listeners).
        onMount: (host: HTMLElement) => {
          const buttons = host.querySelectorAll<HTMLElement>(".zoom-control");
          buttons.forEach(btn => {
            applyStyleObj(btn, that.schema.zoomControlStyle || {});
            btn.addEventListener("mouseenter", () => {
              applyStyleObj(btn, that.schema.zoomControlStyleHover || {});
            });
            btn.addEventListener("mouseleave", () => {
              applyStyleObj(
                btn,
                btn.classList.contains("active")
                  ? that.schema.zoomControlStyleActive || {}
                  : that.schema.zoomControlStyle || {},
              );
            });
          });
        },
      };
    }

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
      viz._renderTiles(zoomTransform(viz._container.node()), 0);

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
    this._renderTiles(zoomTransform(this._container.node()), duration);
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
