import {hsl} from "d3-color";

/**
    @function colorLighter
    @desc Similar to d3.color.brighter, except that this also reduces saturation so that colors don't appear neon.
    @param {String} c A valid CSS color string.
    @param {String} [i = 0.5] A value from 0 to 1 dictating the strength of the function.
    @returns {String}
*/
export default function(c, i = 0.5) {
  c = hsl(c);
  i *= 1 - c.l;
  c.l += i;
  c.s -= i;
  return c.toString();
}
