import {hsl} from "d3-color";

/**
    Strips a color's saturation while keeping its lightness and alpha, so a
    de-emphasized mark keeps the contrast it had (and a transparent fill stays
    transparent). Values d3-color can't parse, such as `"none"`, are returned
    unchanged.
    @param c A CSS color string.
*/
export default function (c: string): string {
  const h = hsl(c);
  if (Number.isNaN(h.l)) return c;
  h.s = 0;
  return `${h}`;
}
