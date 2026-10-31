import colorGray from "./gray.js";
import {colorToOklch, oklchToColor} from "./oklab.js";

/** Options for {@link colorRampDark}. */
export interface ColorRampDarkOptions {
  /**
      The dark surface the ramp is drawn on. The ramp's dim end sits a fixed
      step of OKLab lightness above it, so the lowest step still reads as a
      mark rather than as empty background. Defaults to `#212529` (gray 900).
  */
  background?: string;
  /**
      Build an ordered/ordinal ramp rather than a continuous sequential one.
      Ordinal ramps lift the dim end further off the background and keep more
      chroma across the range, since every step is a discrete mark a reader
      must tell apart.
  */
  ordinal?: boolean;
}

/**
    Builds an `n`-step single-hue ramp for a dark background: from a deep,
    low-chroma tint of the base just above the background up to the bright base
    color, stepped evenly in OKLab. Low values recede into the background and
    high values glow, the mirror of {@link colorRamp} on a light background.

    Returned dimmest→brightest (low→high), so it swaps in for `colorRamp`
    wherever a ramp maps low values to its first step. The brightest step is
    the base color itself for a continuous ramp.
    @param base The bright anchor of the ramp — a valid CSS color.
    @param n How many steps to produce.
    @param options Ramp shaping options.
*/
export default function colorRampDark(
  base: string,
  n: number,
  options: ColorRampDarkOptions = {},
): string[] {
  if (n <= 0) return [];
  if (n === 1) return [base];

  const {background = colorGray[900], ordinal = false} = options;
  const {l: l0, c: c0, h} = colorToOklch(base);
  const floor = colorToOklch(background).l;

  let highL = l0;
  let lowL = floor + (ordinal ? 0.2 : 0.14);
  const lowC = c0 * (ordinal ? 0.6 : 0.42);
  // Ordinal steps keep a real span even from a dim base.
  if (ordinal) highL = Math.max(l0, lowL + 0.25);
  // A dim continuous base pulls the dim end down toward the background,
  // never past the base itself.
  else if (lowL > l0 - 0.15)
    lowL = Math.min(l0, Math.max(floor + 0.04, l0 - 0.15));

  const steps: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = dimmest, 1 = brightest
    steps.push(
      oklchToColor({
        l: lowL + (highL - lowL) * t,
        c: lowC + (c0 - lowC) * t,
        h,
      }),
    );
  }
  // A continuous ramp ends exactly on the base color (no round-trip drift).
  if (!ordinal) steps[n - 1] = base;
  return steps;
}
