import {hsl} from "d3-color";

/**
    Adds two colors together.
    @param c1 The first color, a valid CSS color string.
    @param c2 The second color, also a valid CSS color string.
    @param o1 Value from 0 to 1 of the first color's opacity.
    @param o2 Value from 0 to 1 of the first color's opacity.
*/
export default function (
  c1: string,
  c2: string,
  o1: number = 1,
  o2: number = 1,
): string {
  const hsl1 = hsl(c1);
  const hsl2 = hsl(c2);
  let d: number = Math.abs(hsl2.h * o2 - hsl1.h * o1);
  if (d > 180) d -= 360;
  let h: number = (Math.min(hsl1.h, hsl2.h) + d / 2) % 360;
  const l: number = hsl1.l + (hsl2.l * o2 - hsl1.l * o1) / 2,
    s: number = hsl1.s + (hsl2.s * o2 - hsl1.s * o1) / 2;
  if (h < 0) h += 360;
  return hsl(`hsl(${h},${s * 100}%,${l * 100}%)`).toString();
}
