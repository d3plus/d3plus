import {select} from "d3-selection";
import {transition} from "d3-transition";

import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import type {GroupNode, ImageNode, SceneNode} from "@d3plus/render";

import {accessor, constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

/** Image's fluent accessor schema. Config storage lives on `this.schema.<key>`. */
const imageSchema: ConfigField[] = [
  {key: "duration", coerce: "identity", default: 600},
  {key: "height", coerce: "const", default: accessor("height")},
  {key: "id", coerce: "identity", default: accessor("id")},
  {key: "opacity", coerce: "const", default: constant(1)},
  {key: "pointerEvents", coerce: "const", default: constant("auto")},
  {key: "renderMode", coerce: "identity", default: "full"},
  {key: "url", coerce: "identity", default: accessor("url")},
  {key: "width", coerce: "const", default: accessor("width")},
  {key: "x", coerce: "const", default: accessor("x", 0)},
  {key: "y", coerce: "const", default: accessor("y", 0)},
];

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
  // installFluent generates the config accessors (width, x, url, …) at
  // runtime; the index signature lets callers reach them through the type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema!: Record<string, any>;
  _select!: D3Selection;
  _data!: DataPoint[];

  /**
      Invoked when creating a new class instance, and sets any default parameters.
      @private
*/
  constructor() {
    installFluent(this, imageSchema);
  }

  /**
      Renders the current Image to the page. If a *callback* is specified, it will be called once the images are done drawing.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    // Compute mode is a no-op for DOM emission — the caller will read
    // `toScene()` to get a SceneNode tree, no need to mount.
    if (this.schema.renderMode === "compute") {
      if (callback) setTimeout(callback, 0);
      return this;
    }
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
      .data(this._data, this.schema.id);

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
          (this.schema.x(d, i) as number) + (this.schema.width(d, i) as number) / 2,
      )
      .attr(
        "y",
        (d: DataPoint, i: number) =>
          (this.schema.y(d, i) as number) + (this.schema.height(d, i) as number) / 2,
      );

    const t = transition().duration(this.schema.duration),
      that = this,
      update = enter.merge(images);

    update
      .attr("xlink:href", this.schema.url)
      .style("pointer-events", this.schema.pointerEvents)
      .transition(t)
      .attr("opacity", this.schema.opacity)
      .attr("width", (d: DataPoint, i: number) => this.schema.width(d, i))
      .attr("height", (d: DataPoint, i: number) => this.schema.height(d, i))
      .attr("x", (d: DataPoint, i: number) => this.schema.x(d, i))
      .attr("y", (d: DataPoint, i: number) => this.schema.y(d, i))
      .each(function (this: Element, d: DataPoint, i: number) {
        const image = select(this),
          link = that.schema.url(d, i) as string;
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
          img.onload = function () {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const context = canvas.getContext("2d")!;
            context.drawImage(img, 0, 0);
            image.attr("xlink:href", canvas.toDataURL("image/png"));
          };
        }
      });

    images
      .exit()
      .transition(t)
      .attr("width", (d: DataPoint, i: number) => this.schema.width(d, i))
      .attr("height", (d: DataPoint, i: number) => this.schema.height(d, i))
      .attr("x", (d: DataPoint, i: number) => this.schema.x(d, i))
      .attr("y", (d: DataPoint, i: number) => this.schema.y(d, i))
      .attr("opacity", 0)
      .remove();

    if (callback) setTimeout(callback, this.schema.duration + 100);

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
      Compute-mode scene emission. Mirrors Shape.toScene's shape — a
      keyed GroupNode wrapping per-datum ImageNodes. Used by chart
      compositors (Shape._backgroundImageClass, plotPaint) that need
      Image to participate in the scene graph rather than emit
      d3-selection DOM.
  */
  toScene(): GroupNode {
    const children: SceneNode[] = (this._data || []).map(
      (d: DataPoint, i: number) => {
        const node: ImageNode = {
          type: "image",
          key: `${this.schema.id(d, i)}`,
          x: this.schema.x(d, i) as number,
          y: this.schema.y(d, i) as number,
          width: this.schema.width(d, i) as number,
          height: this.schema.height(d, i) as number,
          href: this.schema.url(d, i) as string,
          paint: {opacity: this.schema.opacity(d, i) as number},
          datum: d,
          index: i,
        };
        return node;
      },
    );
    return {type: "group", key: "d3plus-Image", children};
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
}
