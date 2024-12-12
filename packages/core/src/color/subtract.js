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
export default function(c1, c2, o1 = 1, o2 = 1) {
  c1 = hsl(c1);
  c2 = hsl(c2);
  let d = c2.h * o2 - c1.h * o1;
  if (Math.abs(d) > 180) d -= 360;
  let h = (c1.h - d) % 360;
  const l = c1.l - (c2.l * o2 - c1.l * o1) / 2,
        s = c1.s - (c2.s * o2 - c1.s * o1) / 2;
  // a = o1 - (o2 - o1) / 2;
  if (h < 0) h += 360;
  return hsl(`hsl(${h},${s * 100}%,${l * 100}%)`).toString();
  // return hsl(`hsl(${h},${s * 100}%,${l * 100}%,${a})`).toString();
}
