import {select} from "d3-selection";
import {zoomTransform} from "d3-zoom";

import {attrize, stylize} from "../../dom/index.js";

let brushing = false;

/**
    @name zoomControls
    @desc Sets up initial zoom events and controls.
    @private
*/
export default function() {

  if (!this._container || !this._zoomGroup) return;

  const height = this._zoomHeight || this._height - this._margin.top - this._margin.bottom,
        that = this,
        width = this._zoomWidth || this._width - this._margin.left - this._margin.right;

  this._zoomBehavior
    .extent([[0, 0], [width, height]])
    .scaleExtent([1, this._zoomMax])
    .translateExtent([[0, 0], [width, height]])
    .on("zoom", event => zoomed.bind(this)(event.transform));

  this._zoomToBounds = zoomToBounds.bind(this);

  let control = select(this._select.node().parentNode).selectAll("div.d3plus-zoom-control").data(this._zoom ? [0] : []);
  const controlEnter = control.enter().append("div").attr("class", "d3plus-zoom-control");
  control.exit().remove();
  control = control.merge(controlEnter)
    .style("position", "absolute")
    .style("top", `${this._margin.top}px`)
    .style("left", `${this._margin.left}px`);

  controlEnter.append("div").attr("class", "zoom-control zoom-in");
  control.select(".zoom-in")
    .on("click", zoomMath.bind(this, this._zoomFactor))
    .html("&#65291;");

  controlEnter.append("div").attr("class", "zoom-control zoom-out");
  control.select(".zoom-out")
    .on("click", zoomMath.bind(this, 1 / this._zoomFactor))
    .html("&#65293;");

  controlEnter.append("div").attr("class", "zoom-control zoom-reset");
  control.select(".zoom-reset")
    .on("click", zoomMath.bind(this, 0))
    .html("&#8634");

  controlEnter.append("div").attr("class", "zoom-control zoom-brush");
  control.select(".zoom-brush")
    .on("click", function() {
      select(this)
        .classed("active", !brushing)
        .call(stylize, brushing ? that._zoomControlStyle || {} : that._zoomControlStyleActive || {});
      zoomEvents.bind(that)(!brushing);
    })
    .html("&#164");

  control.selectAll(".zoom-control")
    .call(stylize, that._zoomControlStyle)
    .on("mouseenter", function() {
      select(this).call(stylize, that._zoomControlStyleHover || {});
    })
    .on("mouseleave", function() {
      select(this).call(stylize, select(this).classed("active") ? that._zoomControlStyleActive || {} : that._zoomControlStyle || {});
    });

  this._zoomBrush
    .extent([[0, 0], [width, height]])
    .filter(event => !event.button && event.detail < 2)
    .handleSize(this._zoomBrushHandleSize)
    .on("start", brushStart.bind(this))
    .on("brush", brushBrush.bind(this))
    .on("end", brushEnd.bind(this));

  const brushGroup = this._container.selectAll("g.brush").data([0]);
  this._brushGroup = brushGroup.enter().append("g")
      .attr("class", "brush")
    .merge(brushGroup)
    .call(this._zoomBrush);

  zoomEvents.bind(this)();
  if (this._renderTiles) this._renderTiles(zoomTransform(this._container.node()), 0);

}

/**
    @name zoomEvents
    @desc Handles adding/removing zoom event listeners.
    @private
*/
function zoomEvents(brush = false) {

  brushing = brush;

  if (brushing) this._brushGroup.style("display", "inline");
  else this._brushGroup.style("display", "none");

  if (!brushing && this._zoom) {
    this._container.call(this._zoomBehavior);
    if (!this._zoomScroll) {
      this._container
        .on("wheel.zoom", null);
    }
    if (!this._zoomPan) {
      this._container
        .on("mousedown.zoom mousemove.zoom", null)
        .on("touchstart.zoom touchmove.zoom touchend.zoom touchcancel.zoom", null);
    }
  }
  else {
    this._container.on(".zoom", null);
  }

}

/**
    @name zoomed
    @desc Handles events dispatched from this._zoomBehavior
    @param {Object} [*transform* = event.transform]
    @param {Number} [*duration* = 0]
    @private
*/
function zoomed(transform = false, duration = 0) {

  if (this._zoomGroup) {
    if (!duration) this._zoomGroup.attr("transform", transform);
    else this._zoomGroup.transition().duration(duration).attr("transform", transform);
  }

  if (this._renderTiles) this._renderTiles(zoomTransform(this._container.node()), duration);

}

/**
    @name zoomMath
    @desc Zooms in or out based on the provided multiplier.
    @param {Number} [*factor* = 0]
    @private
*/
function zoomMath(factor = 0) {

  if (!this._container) return;

  const center = this._zoomBehavior.extent().bind(document)()[1].map(d => d / 2),
        scaleExtent = this._zoomBehavior.scaleExtent(),
        t = zoomTransform(this._container.node());

  if (!factor) {
    t.k = scaleExtent[0];
    t.x = 0;
    t.y = 0;
  }
  else {
    const translate0 = [(center[0] - t.x) / t.k, (center[1] - t.y) / t.k];
    t.k = Math.min(scaleExtent[1], t.k * factor);
    if (t.k <= scaleExtent[0]) {
      t.k = scaleExtent[0];
      t.x = 0;
      t.y = 0;
    }
    else {
      t.x += center[0] - (translate0[0] * t.k + t.x);
      t.y += center[1] - (translate0[1] * t.k + t.y);
    }

  }

  zoomed.bind(this)(t, this._duration);

}

/**
    @name zoomToBounds
    @desc Zooms to given bounds.
    @param {Array} *bounds*
    @param {Number} [*duration* = 0]
    @private
*/
function zoomToBounds(bounds, duration = this._duration) {

  const scaleExtent = this._zoomBehavior.scaleExtent(),
        t = zoomTransform(this._container.node());

  if (bounds) {

    const [width, height] = this._zoomBehavior.translateExtent()[1],
          dx = bounds[1][0] - bounds[0][0],
          dy = bounds[1][1] - bounds[0][1];

    let k = Math.min(scaleExtent[1], 1 / Math.max(dx / width, dy / height));

    let xMod, yMod;
    if (dx / dy < width / height) {
      k *= (height - this._zoomPadding * 2) / height;
      xMod = (width - dx * k) / 2 / k;
      yMod = this._zoomPadding / k;
    }
    else {
      k *= (width - this._zoomPadding * 2) / width;
      yMod = (height - dy * k) / 2 / k;
      xMod = this._zoomPadding / k;
    }

    t.x = (t.x - bounds[0][0] + xMod) * (t.k * k / t.k);
    t.y = (t.y - bounds[0][1] + yMod) * (t.k * k / t.k);
    t.k *= k;

    if (t.x > 0) t.x = 0;
    else if (t.x < width * -t.k + width) t.x = width * -t.k + width;
    if (t.y > 0) t.y = 0;
    else if (t.y < height * -t.k + height) t.y = height * -t.k + height;

  }
  else {

    t.k = scaleExtent[0];
    t.x = 0;
    t.y = 0;

  }

  zoomed.bind(this)(t, duration);

}

/**
    @desc Triggered on brush "brush".
    @private
*/
function brushBrush() {
  brushStyle.bind(this)();
}

/**
    @desc Triggered on brush "end".
    @private
*/
function brushEnd(event) {

  if (!event.selection) return; // Only transition after input.

  this._brushGroup.call(this._zoomBrush.move, null);
  zoomToBounds.bind(this)(event.selection);

}

/**
    @desc Triggered on brush "start".
    @private
*/
function brushStart() {
  brushStyle.bind(this)();
}

/**
    @desc Overrides the default brush styles.
    @private
*/
function brushStyle() {

  this._brushGroup.selectAll(".selection")
    .call(attrize, this._zoomBrushSelectionStyle || {});

  this._brushGroup.selectAll(".handle")
    .call(attrize, this._zoomBrushHandleStyle || {});

}
