import type {DataPoint} from "@d3plus/data";
import {largestRect, path2polygon} from "@d3plus/math";
import {accessor} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {PathConfig} from "./shapeConfig.js";
import Shape, {type ShapeAes} from "./Shape.js";

/** Path's own fluent accessor schema, layered on top of Shape's. */
const pathSchema: ConfigField[] = [
  {key: "d", coerce: "const", default: accessor("path")},
];

/**
    Creates SVG Paths based on an array of data.
*/
export default class Path extends Shape {
  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Shape.
      @private
*/
  constructor() {
    super("path");
    installFluent(this, pathSchema);
    this._name = "Path";
    this.schema.labelBounds = (d: DataPoint, i: number, aes: ShapeAes) => {
      const rotate = this.schema.labelConfig.rotate;
      const r = largestRect(aes.points as unknown as [number, number][], {
        angle: rotate ? (rotate(d, i) as number) : 0,
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
    this.schema.labelConfig = Object.assign(this.schema.labelConfig, {
      textAnchor: "middle",
      verticalAlign: "middle",
    });
  }

  /**
      Returns the path geometry for a data point (the raw "d" string).
      @private
*/
  _sceneGeometry(d: DataPoint, i: number): Record<string, unknown> {
    return {type: "path", d: String(this.schema.d(d, i))};
  }

  /**
      Given a specific data point and index, returns the aesthetic properties of the shape.
      @param data point*
      @param index @private
*/
  _aes(d: DataPoint, i: number): ShapeAes {
    return {points: path2polygon(this.schema.d(d, i) as string)};
  }

  // v4: render() is inherited from Shape — the scene path handles drawing.

  /**
      Narrowed `.config()` for Path. Inherited surface from
      `BaseClass.config()`; the override exists only to surface per-shape
      keys (e.g. `width`/`height` for Rect) in autocomplete + type checks.
  */
  config(): PathConfig;
  config(_: Partial<PathConfig>): this;
  config(_?: Partial<PathConfig>): PathConfig | this {
    if (!arguments.length) return super.config() as PathConfig;
    super.config(_!);
    return this;
  }
}
