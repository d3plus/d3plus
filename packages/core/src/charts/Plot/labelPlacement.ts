/**
    Plot label/size placement helpers. Both are invoked bound to a Plot
    instance (`fn.bind(this)`), so they read the live axis scales +
    accessors off `this`.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";

/**
    Default shape size, routed through the chart's internal sizeScale.
*/
export function defaultSize(this: VizInstance, d: DataPoint): number {
  // When `_size` is unset, `_sizeScaleD3` is the constant `() => sizeMin`,
  // so the `null` argument is ignored (cast to satisfy the scale signature).
  return this._sizeScaleD3!(this._size ? this._size(d) : (null as unknown as number));
}

/**
    Determines if a Bar label should be placed outside of the Bar.
*/
export function outside(this: VizInstance, d: DataPoint, i: number): boolean {
  // Force all Stacked Bars to use "inside" labels.
  if (this.schema.stacked) return false;

  // Detect user "outside" or "inside" override.
  const labelPosition = this._labelPosition!(d, i);
  if (labelPosition === "outside") return true;
  else if (labelPosition === "inside") return false;

  // Run "auto" logic based on available space, against the non-discrete axis.
  const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
  const nonDiscrete = this.schema.discrete.replace(this.schema.discrete.charAt(0), other);
  const axis = nonDiscrete === "y" ? this._yAxis! : this._xAxis!;
  const accessor = nonDiscrete === "y" ? this._y! : this._x!;
  const range = axis._d3Scale!.range();
  const value = accessor(d, i) as number;
  const negative = value < 0;
  const zero = axis._getPosition(0);
  const space =
    nonDiscrete === "y"
      ? negative
        ? range[1] - zero
        : zero - range[0]
      : negative
        ? zero - range[0]
        : range[1] - zero;
  const pos = axis._getPosition(value);
  const size = Math.abs(negative ? zero - pos : pos - zero);
  return size < space / 2;
}
