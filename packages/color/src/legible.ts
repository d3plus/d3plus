import {hsl} from "d3-color";

/**
    @function colorLegible
    @desc Darkens a color so that it will appear legible on a white background.
    @param {String} c A valid CSS color string.
    @returns {String}
*/
export default function (c: string): string {
  const hslColor = hsl(c);
  if (hslColor.l > 0.45) {
    if (hslColor.s > 0.8) hslColor.s = 0.8;
    hslColor.l = 0.45;
  }
  return hslColor.toString();
}
