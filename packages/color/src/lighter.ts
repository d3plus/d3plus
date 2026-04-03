import {hsl} from "d3-color";

/**
    Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.
    @param c A valid CSS color string.
    @param i Strength of the lightening effect, from 0 to 1.
*/
export default function (c: string, i: number = 0.5): string {
  const hslColor = hsl(c);
  i *= 1 - hslColor.l;
  hslColor.l += i;
  hslColor.s -= i;
  return hslColor.toString();
}
