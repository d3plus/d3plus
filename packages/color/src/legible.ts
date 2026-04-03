import {hsl} from "d3-color";

/**
    Darkens a color so that it will appear legible on a white background.
    @param c A valid CSS color string.
*/
export default function (c: string): string {
  const hslColor = hsl(c);
  if (hslColor.l > 0.45) {
    if (hslColor.s > 0.8) hslColor.s = 0.8;
    hslColor.l = 0.45;
  }
  return hslColor.toString();
}
