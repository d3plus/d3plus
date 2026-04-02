import {hsl} from "d3-color";

/**
    @function colorLighter
    @desc Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.
    @param {String} c A valid CSS color string.
    @param {String} [i = 0.5] A value from 0 to 1 dictating the strength of the function.
    @returns {String}
*/
export default function (c: string, i: number = 0.5): string {
  const hslColor = hsl(c);
  i *= 1 - hslColor.l;
  hslColor.l += i;
  hslColor.s -= i;
  return hslColor.toString();
}
