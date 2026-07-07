/**
    Structural type for the d3 scales d3plus builds dynamically via
    `scales[name]()`. A single field (`Axis._d3Scale`, `ColorScale._colorScale`,
    a plot buffer scale) can hold a linear / log / time / band / point /
    ordinal / threshold scale, whose concrete generic signatures are mutually
    incompatible (`domain()` takes `number[]` vs `string[]` vs `Date[]`). This
    captures the shared call surface instead, with scale-specific methods marked
    optional — guard (`if (scale.ticks)`) before calling them.

    `Out` is the scale's output: pixel positions (`number`) for axes and plot
    buffers, color strings for color scales.

    @module
*/
export interface D3Scale<Out = number> {
  /** Maps a domain value to its output (pixel position or color). */
  (value: number | string | Date): Out;
  /** Current domain. */
  domain(): unknown[];
  /** Sets the domain. */
  domain(domain: Iterable<number | string | Date>): D3Scale<Out>;
  /** Current range. */
  range(): Out[];
  /** Sets the range. */
  range(range: Iterable<Out>): D3Scale<Out>;
  /** Returns an independent copy of the scale. */
  copy(): D3Scale<Out>;

  /** Continuous scales only: representative tick values. */
  ticks?(count?: number): number[];
  /** Continuous scales only: inverts an output value back to the domain. */
  invert?(value: number): number;
  /** Continuous scales only: get/set output clamping. */
  clamp?(): boolean;
  clamp?(clamp: boolean): D3Scale<Out>;

  /** Band / point scales only: width of one band. */
  bandwidth?(): number;
  /** Band / point scales only: distance between band starts. */
  step?(): number;
  /** Band / point scales only: get/set padding. */
  padding?(): number;
  padding?(padding: number): D3Scale<Out>;
  /** Band scales only: get/set inner padding. */
  paddingInner?(): number;
  paddingInner?(padding: number): D3Scale<Out>;
  /** Band scales only: get/set outer padding. */
  paddingOuter?(): number;
  paddingOuter?(padding: number): D3Scale<Out>;
}
