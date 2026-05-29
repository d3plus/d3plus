/**
    Plot label/size placement helpers. Both are invoked bound to a Plot
    instance (`fn.bind(this)`), so they read the live axis scales +
    accessors off `this`.
*/
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
    Default shape size, routed through the chart's internal sizeScale.
*/
export function defaultSize(this: any, d: any) {
  return this._sizeScaleD3(this._size ? this._size(d) : null);
}

/**
    Determines if a Bar label should be placed outside of the Bar.
*/
export function outside(this: any, d: any, i: any) {
  // Force all Stacked Bars to use "inside" labels.
  if (this.schema.stacked) return false;

  // Detect user "outside" or "inside" override.
  const labelPosition = this._labelPosition(d, i);
  if (labelPosition === "outside") return true;
  else if (labelPosition === "inside") return false;

  // Run "auto" logic based on available space.
  const other = this.schema.discrete.charAt(0) === "x" ? "y" : "x";
  const nonDiscrete = this.schema.discrete.replace(this.schema.discrete.charAt(0), other);
  const range = (this as any)[`_${nonDiscrete}Axis`]._d3Scale.range();
  const value = (this as any)[`_${nonDiscrete}`](d, i);
  const negative = value < 0;
  const zero = (this as any)[`_${nonDiscrete}Axis`]._getPosition(0);
  const space =
    nonDiscrete === "y"
      ? negative
        ? range[1] - zero
        : zero - range[0]
      : negative
        ? zero - range[0]
        : range[1] - zero;
  const pos = (this as any)[`_${nonDiscrete}Axis`]._getPosition(value);
  const size = Math.abs(negative ? zero - pos : pos - zero);
  return size < space / 2;
}
