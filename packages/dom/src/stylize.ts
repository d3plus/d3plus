import type {Stylable} from "./D3Selection.js";

/**
    Applies each key/value in an object as a style.
    @param e The d3 selection to apply styles to.
    @param s An object of key/value style pairs.
*/
export default function (
  e: Stylable,
  s: Record<string, string | number | boolean | null> = {},
): void {
  for (const k in s) if ({}.hasOwnProperty.call(s, k)) e.style(k, s[k]);
}
