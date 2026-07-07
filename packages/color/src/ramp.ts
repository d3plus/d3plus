import {colorToOklch, oklchToColor} from "./oklab.js";

/** Options for {@link colorRamp}. */
export interface ColorRampOptions {
  /**
      Build an ordered/ordinal ramp rather than a continuous sequential one.
      Ordinal ramps hold the palest step darker (so it still reads against the
      surface) and keep more chroma across the range, since every step is a
      discrete mark a reader must tell apart. Continuous ramps let the light
      end fade nearly into the surface (it means "near zero").
  */
  ordinal?: boolean;
}

/**
    Builds an `n`-step single-hue ramp from a pale tint to the given base color,
    stepped evenly in OKLab so each step looks equally far from the next.

    This replaces lightening in HSL (which desaturates toward pure white and
    shifts hue, so the pale end loses its identity and can render as white). In
    OKLab the hue is held fixed and lightness/chroma taper together, so the ramp
    reads as one hue getting lighter.

    Returned lightest→darkest; the darkest step is the base color itself for a
    continuous ramp.
    @param base The saturated dark anchor of the ramp — a valid CSS color.
    @param n How many steps to produce.
    @param options Ramp shaping options.
*/
export default function colorRamp(
  base: string,
  n: number,
  options: ColorRampOptions = {},
): string[] {
  if (n <= 0) return [];
  if (n === 1) return [base];

  const {ordinal = false} = options;
  const {l: l0, c: c0, h} = colorToOklch(base);

  // Dark end is the base hue; light end is a pale, low-chroma tint of it.
  // The ordinal light end stays around L 0.72 so the palest step still clears
  // ~2:1 on a light surface (a continuous ramp may fade further into it).
  let darkL = ordinal ? Math.min(l0, 0.42) : l0;
  const darkC = c0;
  let lightL = ordinal ? 0.72 : 0.95;
  const lightC = c0 * (ordinal ? 0.5 : 0.15);
  // Keep a real light→dark span even if the base is unusually light.
  if (lightL <= darkL + 0.08) {
    darkL = Math.min(darkL, 0.55);
    lightL = Math.min(0.95, darkL + 0.3);
  }

  const steps: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1); // 0 = lightest, 1 = darkest
    steps.push(
      oklchToColor({l: lightL + (darkL - lightL) * t, c: lightC + (darkC - lightC) * t, h}),
    );
  }
  // A continuous ramp ends exactly on the base color (no round-trip drift).
  if (!ordinal) steps[n - 1] = base;
  return steps;
}
