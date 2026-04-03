import type {Attrable} from "./D3Selection.js";

/**
    Applies each key/value in an object as an attr.
    @param e The d3 selection to apply attributes to.
    @param a An object of key/value attr pairs.
*/
export default function (
  e: Attrable,
  a: Record<string, string | number | boolean | null> = {},
): void {
  for (const k in a) if ({}.hasOwnProperty.call(a, k)) e.attr(k, a[k]);
}
