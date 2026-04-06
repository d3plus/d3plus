import {select} from "d3-selection";
import {transition} from "d3-transition";

import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

/**
    Creates SVG images based on an array of data.
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
  _duration: number;
  _height: AccessorFn;
  _id: AccessorFn;
  _opacity: AccessorFn;
  _pointerEvents: AccessorFn;
  _select: D3Selection;
  _url: AccessorFn;
  _width: AccessorFn;
  _x: AccessorFn;
  _y: AccessorFn;
  _data!: DataPoint[];

  /**
      Invoked when creating a new class instance, and sets any default parameters.
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
      Renders the current Image to the page. If a *callback* is specified, it will be called once the images are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    if (this._select === void 0)
      this.select(
        select("body")
          .append("svg")
          .style("width", `${window.innerWidth}px`)
          .style("height", `${window.innerHeight}px`)
          .style("display", "block")
          .node(),
      );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = (this._select as any)
      .selectAll(".d3plus-Image")
      .data(this._data, this._id);

    const enter = images
      .enter()
      .append("image")
      .attr("class", "d3plus-Image")
      .attr("opacity", 0)
      .attr("width", 0)
      .attr("height", 0)
      .attr(
        "x",
        (d: DataPoint, i: number) =>
          (this._x(d, i) as number) + (this._width(d, i) as number) / 2,
      )
      .attr(
        "y",
        (d: DataPoint, i: number) =>
          (this._y(d, i) as number) + (this._height(d, i) as number) / 2,
      );

    const t = transition().duration(this._duration),
      that = this,
      update = enter.merge(images);

    update
      .attr("xlink:href", this._url)
      .style("pointer-events", this._pointerEvents)
      .transition(t)
      .attr("opacity", this._opacity)
      .attr("width", (d: DataPoint, i: number) => this._width(d, i))
      .attr("height", (d: DataPoint, i: number) => this._height(d, i))
      .attr("x", (d: DataPoint, i: number) => this._x(d, i))
      .attr("y", (d: DataPoint, i: number) => this._y(d, i))
      .each(function (this: Element, d: DataPoint, i: number) {
        const image = select(this),
          link = that._url(d, i) as string;
        const fullAddress =
          link.indexOf("http://") === 0 || link.indexOf("https://") === 0;
        if (!fullAddress || link.indexOf(window.location.hostname) === 0) {
          const img = new (
            window as unknown as Record<string, unknown> & {
              Image: new () => HTMLImageElement;
            }
          ).Image();
          img.src = link;
          img.crossOrigin = "Anonymous";
          img.onload = function (this: HTMLImageElement) {
            const canvas = document.createElement("canvas");
            canvas.width = this.width;
            canvas.height = this.height;
            const context = canvas.getContext("2d")!;
            context.drawImage(this, 0, 0);
            image.attr("xlink:href", canvas.toDataURL("image/png"));
          };
        }
      });

    images
      .exit()
      .transition(t)
      .attr("width", (d: DataPoint, i: number) => this._width(d, i))
      .attr("height", (d: DataPoint, i: number) => this._height(d, i))
      .attr("x", (d: DataPoint, i: number) => this._x(d, i))
      .attr("y", (d: DataPoint, i: number) => this._y(d, i))
      .attr("opacity", 0)
      .remove();

    if (callback) setTimeout(callback, this._duration + 100);

    return this;
  }

  /**
      The data array used to create image shapes. An <image> tag will be drawn for each object in the array.
*/
  data(): DataPoint[];
  data(_: DataPoint[]): this;
  data(_?: DataPoint[]): DataPoint[] | this {
    return arguments.length ? ((this._data = _!), this) : this._data;
  }

  /**
      The animation duration in milliseconds.
*/
  duration(): number;
  duration(_: number): this;
  duration(_?: number): number | this {
    return arguments.length ? ((this._duration = _!), this) : this._duration;
  }

  /**
      The height accessor for each image.

@example
function(d) {
  return d.height;
}
*/
  height(): AccessorFn;
  height(_: AccessorFn | number): this;
  height(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._height = typeof _ === "function" ? _ : constant(_)), this)
      : this._height;
  }

  /**
      The unique id accessor for each image.

@example
function(d) {
  return d.id;
}
*/
  id(): AccessorFn;
  id(_: AccessorFn): this;
  id(_?: AccessorFn): AccessorFn | this {
    return arguments.length ? ((this._id = _!), this) : this._id;
  }

  /**
      The opacity of each image.
*/
  opacity(): AccessorFn;
  opacity(_: AccessorFn | number): this;
  opacity(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._opacity = typeof _ === "function" ? _ : constant(_)), this)
      : this._opacity;
  }

  /**
      The pointer-events.
*/
  pointerEvents(): AccessorFn;
  pointerEvents(_: AccessorFn | string): this;
  pointerEvents(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._pointerEvents = typeof _ === "function" ? _ : constant(_)),
        this)
      : this._pointerEvents;
  }

  /**
      The SVG container element as a d3 selector or DOM element.
*/
  select(): D3Selection;
  select(_: string | HTMLElement | SVGElement | null): this;
  select(_?: string | HTMLElement | SVGElement | null): D3Selection | this {
    return arguments.length
      ? ((this._select = select(_ as string) as unknown as D3Selection), this)
      : this._select;
  }

  /**
      Accessor function for the URL of each image.

@example
function(d) {
  return d.url;
}
*/
  url(): AccessorFn;
  url(_: AccessorFn): this;
  url(_?: AccessorFn): AccessorFn | this {
    return arguments.length ? ((this._url = _!), this) : this._url;
  }

  /**
      The width accessor for each image.

@example
function(d) {
  return d.width;
}
*/
  width(): AccessorFn;
  width(_: AccessorFn | number): this;
  width(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._width = typeof _ === "function" ? _ : constant(_)), this)
      : this._width;
  }

  /**
      The x position accessor for each image.

@example
function(d) {
  return d.x || 0;
}
*/
  x(): AccessorFn;
  x(_: AccessorFn | number): this;
  x(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._x = typeof _ === "function" ? _ : constant(_)), this)
      : this._x;
  }

  /**
      The y position accessor for each image.

@example
function(d) {
  return d.y || 0;
}
*/
  y(): AccessorFn;
  y(_: AccessorFn | number): this;
  y(_?: AccessorFn | number): AccessorFn | this {
    return arguments.length
      ? ((this._y = typeof _ === "function" ? _ : constant(_)), this)
      : this._y;
  }
}
