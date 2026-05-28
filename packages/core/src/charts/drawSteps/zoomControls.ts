import {select} from "d3-selection";
import {zoomTransform} from "d3-zoom";

import {attrize, stylize} from "@d3plus/dom";
import type Viz from "../Viz.js";

/** Mutable version of ZoomTransform for direct property manipulation. */
interface MutableTransform {
  k: number;
  x: number;
  y: number;
}

let brushing = false;

/**
    @name zoomControls
    Sets up initial zoom events and controls.

    Carve-out (RFC §3.4): this step is **intentionally not** ported to a
    `FeatureModule` in `../features.ts`. v4 introduced the `HtmlOverlayNode`
    scene type (so reason #1 below is gone) but the interaction-wiring half
    still doesn't fit the FeatureModule contract:

      1. ~~It emits an HTML `<div class="d3plus-zoom-control">` ...~~
         (RESOLVED in v4: HtmlOverlayNode supports HTML in the scene graph.)
      2. It does not claim margin. It positions itself *inside* the existing
         `this._margin.top` / `this._margin.left` and overlays the chart.
      3. It installs stateful D3 zoom + brush behaviors (`this._zoomBehavior`,
         `this._zoomBrush`) and wires `this._zoomToBounds` — d3-zoom binds to
         the SVG element directly via `this._container.call(zoomBehavior)`,
         not via a scene-graph event mechanism.
      4. It runs *after* `_draw()` (after the chart body is rendered) rather
         than during the margin negotiation phase that runLayout drives.

    The remaining migration step is a "post-draw interaction wiring" hook
    that lets HtmlOverlay nodes attach DOM event handlers in a way the
    serializable scene graph permits. Until that design lands, zoomControls
    stays as a `drawSteps/` free function invoked directly from `Viz._draw`.
    @private
*/
export default function (this: Viz): void {
  if (!this._container || !this._zoomGroup) return;

  const height =
      this._zoomHeight || this._height - this._margin.top - this._margin.bottom,
    that = this,
    width =
      this._zoomWidth || this._width - this._margin.left - this._margin.right;

  this._zoomBehavior
    .extent([
      [0, 0],
      [width, height],
    ])
    .scaleExtent([1, this._zoomMax])
    .translateExtent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", (event: {transform: unknown}) =>
      zoomed.bind(this)(event.transform),
    );

  this._zoomToBounds = zoomToBounds.bind(this);

  let control: ReturnType<typeof select> = select(
    this._select.node().parentNode,
  )
    .selectAll("div.d3plus-zoom-control")
    .data(this._zoom ? [0] : []) as unknown as ReturnType<typeof select>;
  const controlEnter = control
    .enter()
    .append("div")
    .attr("class", "d3plus-zoom-control");
  control.exit().remove();
  control = control
    .merge(controlEnter as unknown as ReturnType<typeof select>)
    .style("position", "absolute")
    .style("top", `${this._margin.top}px`)
    .style("left", `${this._margin.left}px`);

  controlEnter.append("div").attr("class", "zoom-control zoom-in");
  control
    .select(".zoom-in")
    .on("click", zoomMath.bind(this, this._zoomFactor))
    .html("&#65291;");

  controlEnter.append("div").attr("class", "zoom-control zoom-out");
  control
    .select(".zoom-out")
    .on("click", zoomMath.bind(this, 1 / this._zoomFactor))
    .html("&#65293;");

  controlEnter.append("div").attr("class", "zoom-control zoom-reset");
  control
    .select(".zoom-reset")
    .on("click", zoomMath.bind(this, 0))
    .html("&#8634");

  controlEnter.append("div").attr("class", "zoom-control zoom-brush");
  control
    .select(".zoom-brush")
    .on("click", function (_event: Event) {
      select(_event.currentTarget as Element)
        .classed("active", !brushing)
        .call(
          stylize,
          brushing
            ? that._zoomControlStyle || {}
            : that._zoomControlStyleActive || {},
        );
      zoomEvents.bind(that)(!brushing);
    })
    .html("&#164");

  control
    .selectAll(".zoom-control")
    .call(stylize, that._zoomControlStyle)
    .on("mouseenter", function (_event: Event) {
      select(_event.currentTarget as Element).call(stylize, that._zoomControlStyleHover || {});
    })
    .on("mouseleave", function (_event: Event) {
      const el = select(_event.currentTarget as Element);
      el.call(
        stylize,
        el.classed("active")
          ? that._zoomControlStyleActive || {}
          : that._zoomControlStyle || {},
      );
    });

  this._zoomBrush
    .extent([
      [0, 0],
      [width, height],
    ])
    .filter((event: MouseEvent) => !event.button && event.detail < 2)
    .handleSize(this._zoomBrushHandleSize)
    .on("start", brushStart.bind(this))
    .on("brush", brushBrush.bind(this))
    .on("end", brushEnd.bind(this));

  const brushGroup = this._container.selectAll("g.brush").data([0]);
  this._brushGroup = brushGroup
    .enter()
    .append("g")
    .attr("class", "brush")
    .merge(brushGroup)
    .call(this._zoomBrush);

  zoomEvents.bind(this)();
  if (this._renderTiles)
    this._renderTiles(zoomTransform(this._container.node()), 0);
}

/**
    @name zoomEvents
    Handles adding/removing zoom event listeners.
    @private
*/
function zoomEvents(this: Viz, brush: boolean = false): void {
  brushing = brush;

  if (brushing) this._brushGroup.style("display", "inline");
  else this._brushGroup.style("display", "none");

  if (!brushing && this._zoom) {
    this._container.call(this._zoomBehavior);
    if (!this._zoomScroll) {
      this._container.on("wheel.zoom", null);
    }
    if (!this._zoomPan) {
      this._container
        .on("mousedown.zoom mousemove.zoom", null)
        .on(
          "touchstart.zoom touchmove.zoom touchend.zoom touchcancel.zoom",
          null,
        );
    }
  } else {
    this._container.on(".zoom", null);
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
    t = zoomTransform(this._container.node()) as unknown as MutableTransform;

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

  zoomed.bind(this)(t, this._duration);
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
  duration: number = this._duration,
): void {
  const scaleExtent = this._zoomBehavior.scaleExtent(),
    t = zoomTransform(this._container.node()) as unknown as MutableTransform;

  if (bounds) {
    const [width, height] = this._zoomBehavior.translateExtent()[1],
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1];

    let k = Math.min(scaleExtent[1], 1 / Math.max(dx / width, dy / height));

    let xMod: number, yMod: number;
    if (dx / dy < width / height) {
      k *= (height - this._zoomPadding * 2) / height;
      xMod = (width - dx * k) / 2 / k;
      yMod = this._zoomPadding / k;
    } else {
      k *= (width - this._zoomPadding * 2) / width;
      yMod = (height - dy * k) / 2 / k;
      xMod = this._zoomPadding / k;
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
    .call(attrize, this._zoomBrushSelectionStyle || {});

  this._brushGroup
    .selectAll(".handle")
    .call(attrize, this._zoomBrushHandleStyle || {});
}
