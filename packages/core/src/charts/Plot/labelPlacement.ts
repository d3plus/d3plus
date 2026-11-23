/**
    Plot label/size placement helpers. Both are invoked bound to a Plot
    instance (`fn.bind(this)`), so they read the live axis scales +
    accessors off `this`.
*/
import type {DataPoint} from "@d3plus/data";

import type {VizInstance} from "../viz/vizTypes.js";
import {vizDiscrete} from "../viz/discrete.js";
import {growFromValue} from "./baselineDomain.js";

/**
    Default shape size, routed through the chart's internal sizeScale.
*/
export function defaultSize(this: VizInstance, d: DataPoint): number {
  // When `_size` is unset, `_sizeScaleD3` is the constant `() => sizeMin`,
  // so the `null` argument is ignored (cast to satisfy the scale signature).
  return this._sizeScaleD3!(
    this._size ? this._size(d) : (null as unknown as number),
  );
}

/**
    Whether a bar grows back along its value axis: a value below where bars
    grow from (`0`, or `growFrom`), or one above it on a `reverse` axis (down
    a y axis, left along an x axis).
*/
export function growsBack(
  viz: VizInstance,
  valueAxis: string,
  d: DataPoint,
  i: number,
): boolean {
  const value = (valueAxis === "y" ? viz._y! : viz._x!)(d, i) as number;
  const axis = valueAxis === "y" ? viz._yAxis : viz._xAxis;
  // A stacked band grows from the band below it, so only its sign counts.
  const from = viz.schema?.stacked ? 0 : (growFromValue(viz) ?? 0);
  return value < from !== Boolean(axis?.schema?.reverse);
}

/**
    Determines if a Bar label should be placed outside of the Bar.
*/
export function outside(this: VizInstance, d: DataPoint, i: number): boolean {
  // Force all Stacked Bars to use "inside" labels.
  if (this.schema.stacked) return false;

  // Detect user "outside" or "inside" override.
  const labelPosition = this.schema.labelPosition(d, i);
  if (labelPosition === "outside") return true;
  else if (labelPosition === "inside") return false;

  // Run "auto" logic based on available space, against the non-discrete axis.
  const other = vizDiscrete(this).charAt(0) === "x" ? "y" : "x";
  const nonDiscrete = vizDiscrete(this).replace(
    vizDiscrete(this).charAt(0),
    other,
  );
  const axis = nonDiscrete === "y" ? this._yAxis! : this._xAxis!;
  const accessor = nonDiscrete === "y" ? this._y! : this._x!;
  const range = axis._d3Scale!.range();
  const value = accessor(d, i) as number;
  const negative = growsBack(this, nonDiscrete, d, i);
  const zero = axis._getPosition(growFromValue(this) ?? 0);
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
