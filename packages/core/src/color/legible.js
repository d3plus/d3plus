import {hsl} from "d3-color";

/**
    @function colorLegible
    @desc Darkens a color so that it will appear legible on a white background.
    @param {String} c A valid CSS color string.
    @returns {String}
*/
export default function(c) {
  c = hsl(c);
  if (c.l > 0.45) {
    if (c.s > 0.8) c.s = 0.8;
    c.l = 0.45;
  }
  return c.toString();
}
