import {hsl} from "d3-color";

/**
    @function colorSubtract
    @desc Subtracts one color from another.
    @param {String} c1 The base color, a valid CSS color string.
    @param {String} c2 The color to remove from the base color, also a valid CSS color string.
    @param {String} [o1 = 1] Value from 0 to 1 of the first color's opacity.
    @param {String} [o2 = 1] Value from 0 to 1 of the first color's opacity.
    @returns {String}
*/
export default function (
  c1: string,
  c2: string,
  o1: number = 1,
  o2: number = 1,
): string {
  const hsl1 = hsl(c1);
  const hsl2 = hsl(c2);
  let d: number = hsl2.h * o2 - hsl1.h * o1;
  if (Math.abs(d) > 180) d -= 360;
  let h: number = (hsl1.h - d) % 360;
  const l: number = hsl1.l - (hsl2.l * o2 - hsl1.l * o1) / 2,
    s: number = hsl1.s - (hsl2.s * o2 - hsl1.s * o1) / 2;
  // a = o1 - (o2 - o1) / 2;
  if (h < 0) h += 360;
  return hsl(`hsl(${h},${s * 100}%,${l * 100}%)`).toString();
  // return hsl(`hsl(${h},${s * 100}%,${l * 100}%,${a})`).toString();
}
