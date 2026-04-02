import type {Attrable} from "./D3Selection.js";

/**
    @function attrize
    @desc Applies each key/value in an object as an attr.
    @param {D3selection} elem The D3 element to apply the styles to.
    @param {Object} attrs An object of key/value attr pairs.
*/
export default function (
  e: Attrable,
  a: Record<string, string | number | boolean | null> = {},
): void {
  for (const k in a) if ({}.hasOwnProperty.call(a, k)) e.attr(k, a[k]);
}
