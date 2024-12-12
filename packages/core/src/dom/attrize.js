/**
    @function attrize
    @desc Applies each key/value in an object as an attr.
    @param {D3selection} elem The D3 element to apply the styles to.
    @param {Object} attrs An object of key/value attr pairs.
*/
export default function(e, a = {}) {
  for (const k in a) if ({}.hasOwnProperty.call(a, k)) e.attr(k, a[k]);
}
