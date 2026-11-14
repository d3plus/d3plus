import type {DataPoint} from "@d3plus/data";

import {constant} from "../utils/index.js";
import {installFluent} from "../fluent.js";
import type {ConfigField} from "../fluent.js";

import type {TickConfig} from "./shapeConfig.js";
import Rect from "./Rect.js";

/** The pixel size a Tick's hover target reaches across its thin side. */
const TICK_HIT_SIZE = 8;

/** Tick's own fluent accessor schema, layered on top of Rect's. */
const tickSchema: ConfigField[] = [
  {key: "length", coerce: "const", default: constant(20)},
  {key: "orient", coerce: "const", default: constant("horizontal")},
  {key: "thickness", coerce: "const", default: constant(2)},
];

/**
    Creates short line marks: a `thickness`-wide bar `length` pixels long,
    centered on each point, running across it (`orient` `"horizontal"`) or
    along it (`"vertical"`). A barcode plot draws one at each value.
*/
export default class Tick extends Rect {
  static readonly _displayName: string = "Tick";

  /**
      Invoked when creating a new class instance, and overrides any default parameters inherited from Rect.
      @private
*/
  constructor() {
    super();
    installFluent(this, tickSchema);
    this._name = "Tick";
    const size = (d: DataPoint, i: number, side: "width" | "height") => {
      const vertical = this.schema.orient(d, i) === "vertical";
      const long = vertical ? side === "height" : side === "width";
      return Number(this.schema[long ? "length" : "thickness"](d, i)) || 0;
    };
    this.schema.width = (d: DataPoint, i: number) => size(d, i, "width");
    this.schema.height = (d: DataPoint, i: number) => size(d, i, "height");
    this.schema.hitArea = (d: DataPoint, i: number) => ({
      width: Math.max(TICK_HIT_SIZE, size(d, i, "width")),
      height: Math.max(TICK_HIT_SIZE, size(d, i, "height")),
    });
    this.schema.label = constant(false);
  }

  /**
      Narrowed `.config()` for Tick.
  */
  config(): TickConfig;
  config(_: Partial<TickConfig>): this;
  config(_?: Partial<TickConfig>): TickConfig | this {
    if (!arguments.length) return super.config() as TickConfig;
    super.config(_!);
    return this;
  }
}
