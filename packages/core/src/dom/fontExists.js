import {default as textWidth} from "./textWidth";
import {trim} from "../text/trim";

const alpha = "abcdefghiABCDEFGHI_!@#$%^&*()_+1234567890",
      checked = {},
      height = 32;

let dejavu, macos, monospace, proportional;

/**
    @function fontExists
    @desc Given either a single font-family or a list of fonts, returns the name of the first font that can be rendered, or `false` if none are installed on the user's machine.
    @param {String|Array} font Can be either a valid CSS font-family string (single or comma-separated names) or an Array of string names.
*/
const fontExists = font => {

  if (!dejavu) {
    dejavu = textWidth(alpha, {"font-family": "DejaVuSans", "font-size": height});
    macos = textWidth(alpha, {"font-family": "-apple-system", "font-size": height});
    monospace = textWidth(alpha, {"font-family": "monospace", "font-size": height});
    proportional = textWidth(alpha, {"font-family": "sans-serif", "font-size": height});
  }

  if (!(font instanceof Array)) font = font.split(",");
  font = font.map(f => trim(f));

  for (let i = 0; i < font.length; i++) {
    const fam = font[i];
    if (checked[fam] || ["-apple-system", "monospace", "sans-serif", "DejaVuSans"].includes(fam)) return fam;
    else if (checked[fam] === false) continue;
    const width = textWidth(alpha, {"font-family": fam, "font-size": height});
    checked[fam] = width !== monospace;
    if (checked[fam]) checked[fam] = width !== proportional;
    if (macos && checked[fam]) checked[fam] = width !== macos;
    if (dejavu && checked[fam]) checked[fam] = width !== dejavu;
    if (checked[fam]) return fam;
  }

  return false;

};


export default fontExists;
