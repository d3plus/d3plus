import {default as textWidth} from "./textWidth.js";
import {trim} from "@d3plus/text";

const alpha: string = "abcdefghiABCDEFGHI_!@#$%^&*()_+1234567890",
  checked: Record<string, boolean> = {},
  height: number = 32;

let dejavu: number, macos: number, monospace: number, proportional: number;

/**
    Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.
    @param font Can be either a valid CSS font-family string (single or comma-separated names) or an Array of string names.
*/
const fontExists = (font: string | string[]): string | false => {
  if (!dejavu) {
    dejavu = textWidth(alpha, {
      "font-family": "DejaVuSans",
      "font-size": height,
    }) as number;
    macos = textWidth(alpha, {
      "font-family": "-apple-system",
      "font-size": height,
    }) as number;
    monospace = textWidth(alpha, {
      "font-family": "monospace",
      "font-size": height,
    }) as number;
    proportional = textWidth(alpha, {
      "font-family": "sans-serif",
      "font-size": height,
    }) as number;
  }

  if (!(font instanceof Array)) font = font.split(",");
  font = font.map(f => trim(f));

  for (let i = 0; i < font.length; i++) {
    const fam = font[i];
    if (
      checked[fam] ||
      ["-apple-system", "monospace", "sans-serif", "DejaVuSans"].includes(fam)
    )
      return fam;
    else if (checked[fam] === false) continue;
    const width = textWidth(alpha, {
      "font-family": fam,
      "font-size": height,
    }) as number;
    checked[fam] = width !== monospace;
    if (checked[fam]) checked[fam] = width !== proportional;
    if (macos && checked[fam]) checked[fam] = width !== macos;
    if (dejavu && checked[fam]) checked[fam] = width !== dejavu;
    if (checked[fam]) return fam;
  }

  return false;
};

export default fontExists;
