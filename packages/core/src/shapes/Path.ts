import type {DataPoint} from "@d3plus/data";
import type {D3Selection} from "@d3plus/dom";
import {largestRect, path2polygon} from "@d3plus/math";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import Shape, {type ShapeAes} from "./Shape.js";

/**
    Creates SVG Paths based on an array of data.
*/
export default class Path extends Shape {
  _d: AccessorFn;
  declare _labelBounds:
    | ((
        d: DataPoint,
        i: number,
        aes: Record<string, unknown>,
      ) => Record<string, unknown> | null | false)
    | null;
  declare _name: string;
  declare _labelConfig: Record<string, unknown>;

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("path");
    this._d = accessor("path");
    this._labelBounds = (
      d: DataPoint,
      i: number,
      aes: Record<string, unknown>,
    ) => {
      const r = largestRect(aes.points as unknown as [number, number][], {
        angle: (this._labelConfig as Record<string, unknown>).rotate
          ? ((
              (this._labelConfig as Record<string, unknown>)
                .rotate as AccessorFn
            )(d, i) as number)
          : 0,
      });
      return r
        ? {
            angle: r.angle,
            width: r.width,
            height: r.height,
            x: r.cx - r.width / 2,
            y: r.cy - r.height / 2,
          }
        : false;
    };
    this._name = "Path";
    this._labelConfig = Object.assign(this._labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {points: path2polygon(this._d(d, i) as string)};
  }

  /**
      Draws the paths.
    @param callback Optional callback invoked after rendering completes.
*/
  render(callback?: () => void): this {
    super.render(callback);

    const enter = this._enter
      .attr("d", this._d as never)
      .call(this._applyStyle.bind(this));

    let update: D3Selection = this._update;

    if (this._duration) {
      enter.attr("opacity", 0).transition(this._transition).attr("opacity", 1);
      update = update.transition(this._transition) as unknown as D3Selection;
      this._exit.transition(this._transition).attr("opacity", 0);
    }

    update.call(this._applyStyle.bind(this)).attr("d", this._d as never);

    return this;
  }

  /**
      The "d" attribute.

@example
function(d) {
  return d.path;
}
*/
  d(): AccessorFn;
  d(_: AccessorFn | string): this;
  d(_?: AccessorFn | string): AccessorFn | this {
    return arguments.length
      ? ((this._d = typeof _ === "function" ? _ : constant(_)), this)
      : this._d;
  }
}
