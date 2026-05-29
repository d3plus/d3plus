import type {DataPoint} from "@d3plus/data";
import {largestRect, path2polygon} from "@d3plus/math";
import {accessor, constant} from "../utils/index.js";
import type {AccessorFn} from "../utils/index.js";

import type {PathConfig} from "./shapeConfig.js";
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
        aes: ShapeAes,
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
      aes: ShapeAes,
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
      Returns the path geometry for a data point (the raw "d" string).
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    return {type: "path", d: String(this._d(d, i))};
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {points: path2polygon(this._d(d, i) as string)};
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

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
      ? ((this._d = typeof _ === "function" ? _ : constant(_) as unknown as AccessorFn), this)
      : this._d;
  }

  /**
      Narrowed `.config()` for Path. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): PathConfig;
  config(_: Partial<PathConfig>): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config(_?: Partial<PathConfig>): PathConfig | this {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (arguments.length ? super.config(_ as any) : super.config()) as any;
  }
}
