import {hsl} from "d3-color";

/**
    @function colorAdd
    @desc Adds two colors together.
    @param {String} c1 The first color, a valid CSS color string.
    @param {String} c2 The second color, also a valid CSS color string.
    @param {String} [o1 = 1] Value from 0 to 1 of the first color's opacity.
    @param {String} [o2 = 1] Value from 0 to 1 of the first color's opacity.
    @returns {String}
*/
export default function(c1, c2, o1 = 1, o2 = 1) {
  c1 = hsl(c1);
  c2 = hsl(c2);
  let d = Math.abs(c2.h * o2 - c1.h * o1);
  if (d > 180) d -= 360;
  let h = (Math.min(c1.h, c2.h) + d / 2) % 360;
  const l = c1.l + (c2.l * o2 - c1.l * o1) / 2,
        s = c1.s + (c2.s * o2 - c1.s * o1) / 2;
  // a = o1 + (o2 - o1) / 2;
  if (h < 0) h += 360;
  return hsl(`hsl(${h},${s * 100}%,${l * 100}%)`).toString();
  // return hsl(`hsl(${h},${s * 100}%,${l * 100}%,${a})`).toString();
}
