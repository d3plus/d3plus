import {select} from "d3-selection";
import {transition} from "d3-transition";

import {accessor, constant} from "../utils/index.js";

/**
    @class Image
    @desc Creates SVG images based on an array of data.
    @example <caption>a sample row of data</caption>
var data = {"url": "file.png", "width": "100", "height": "50"};
@example <caption>passed to the generator</caption>
new Image().data([data]).render();
@example <caption>creates the following</caption>
<image class="d3plus-Image" opacity="1" href="file.png" width="100" height="50" x="0" y="0"></image>
@example <caption>this is shorthand for the following</caption>
image().data([data])();
@example <caption>which also allows a post-draw callback function</caption>
image().data([data])(function() { alert("draw complete!"); })
*/
export default class Image {

  /**
      @memberof Image
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    this._duration = 600;
    this._height = accessor("height");
    this._id = accessor("id");
    this._opacity = constant(1);
    this._pointerEvents = constant("auto");
    this._select;
    this._url = accessor("url");
    this._width = accessor("width");
    this._x = accessor("x", 0);
    this._y = accessor("y", 0);
  }

  /**
      @memberof Image
      @desc Renders the current Image to the page. If a *callback* is specified, it will be called once the images are done drawing.
      @param {Function} [*callback*]
      @chainable
  */
  render(callback) {

    if (this._select === void 0) this.select(select("body").append("svg").style("width", `${window.innerWidth}px`).style("height", `${window.innerHeight}px`).style("display", "block").node());

    const images = this._select.selectAll(".d3plus-Image").data(this._data, this._id);

    const enter = images.enter().append("image")
      .attr("class", "d3plus-Image")
      .attr("opacity", 0)
      .attr("width", 0)
      .attr("height", 0)
      .attr("x", (d, i) => this._x(d, i) + this._width(d, i) / 2)
      .attr("y", (d, i) => this._y(d, i) + this._height(d, i) / 2);

    const t = transition().duration(this._duration),
          that = this,
          update = enter.merge(images);

    update
      .attr("xlink:href", this._url)
      .style("pointer-events", this._pointerEvents)
      .transition(t)
      .attr("opacity", this._opacity)
      .attr("width", (d, i) => this._width(d, i))
      .attr("height", (d, i) => this._height(d, i))
      .attr("x", (d, i) => this._x(d, i))
      .attr("y", (d, i) => this._y(d, i))
      .each(function(d, i) {
        const image = select(this), link = that._url(d, i);
        const fullAddress = link.indexOf("http://") === 0 || link.indexOf("https://") === 0;
        if (!fullAddress || link.indexOf(window.location.hostname) === 0) {
          const img = new Image();
          img.src = link;
          img.crossOrigin = "Anonymous";
          img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            const context = canvas.getContext("2d");
            context.drawImage(this, 0, 0);
            image.attr("xlink:href", canvas.toDataURL("image/png"));
          };
        }
      });

    images.exit().transition(t)
      .attr("width", (d, i) => this._width(d, i))
      .attr("height", (d, i) => this._height(d, i))
      .attr("x", (d, i) => this._x(d, i))
      .attr("y", (d, i) => this._y(d, i))
      .attr("opacity", 0).remove();

    if (callback) setTimeout(callback, this._duration + 100);

    return this;

  }

  /**
      @memberof Image
      @desc If *data* is specified, sets the data array to the specified array and returns the current class instance. If *data* is not specified, returns the current data array. An <image> tag will be drawn for each object in the array.
      @param {Array} [*data* = []]
      @chainable
  */
  data(_) {
    return arguments.length ? (this._data = _, this) : this._data;
  }

  /**
      @memberof Image
      @desc If *ms* is specified, sets the animation duration to the specified number and returns the current class instance. If *ms* is not specified, returns the current animation duration.
      @param {Number} [*ms* = 600]
      @chainable
  */
  duration(_) {
    return arguments.length ? (this._duration = _, this) : this._duration;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the height accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.height;
}
  */
  height(_) {
    return arguments.length ? (this._height = typeof _ === "function" ? _ : constant(_), this) : this._height;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the id accessor to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
      @example
function(d) {
  return d.id;
}
  */
  id(_) {
    return arguments.length ? (this._id = _, this) : this._id;
  }

  /**
      @memberof Image
      @desc Sets the opacity of the image.
      @param {Number} [*value* = 1]
      @chainable
  */
  opacity(_) {
    return arguments.length ? (this._opacity = typeof _ === "function" ? _ : constant(_), this) : this._opacity;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the pointer-events accessor to the specified function or string and returns the current class instance.
      @param {Function|String} [*value* = "auto"]
      @chainable
  */
  pointerEvents(_) {
    return arguments.length ? (this._pointerEvents = typeof _ === "function" ? _ : constant(_), this) : this._pointerEvents;
  }

  /**
      @memberof Image
      @desc If *selector* is specified, sets the SVG container element to the specified d3 selector or DOM element and returns the current class instance. If *selector* is not specified, returns the current SVG container element.
      @param {String|HTMLElement} [*selector* = d3.select("body").append("svg")]
      @chainable
  */
  select(_) {
    return arguments.length ? (this._select = select(_), this) : this._select;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the URL accessor to the specified function and returns the current class instance.
      @param {Function} [*value*]
      @chainable
      @example
function(d) {
  return d.url;
}
  */
  url(_) {
    return arguments.length ? (this._url = _, this) : this._url;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the width accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.width;
}
  */
  width(_) {
    return arguments.length ? (this._width = typeof _ === "function" ? _ : constant(_), this) : this._width;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the x accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.x || 0;
}
  */
  x(_) {
    return arguments.length ? (this._x = typeof _ === "function" ? _ : constant(_), this) : this._x;
  }

  /**
      @memberof Image
      @desc If *value* is specified, sets the y accessor to the specified function or number and returns the current class instance.
      @param {Function|Number} [*value*]
      @chainable
      @example
function(d) {
  return d.y || 0;
}
  */
  y(_) {
    return arguments.length ? (this._y = typeof _ === "function" ? _ : constant(_), this) : this._y;
  }

}
