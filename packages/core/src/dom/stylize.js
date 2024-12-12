/**
    @function stylize
    @desc Applies each key/value in an object as a style.
    @param {D3selection} elem The D3 element to apply the styles to.
    @param {Object} styles An object of key/value style pairs.
*/
export default function(e, s = {}) {
  for (const k in s) if ({}.hasOwnProperty.call(s, k)) e.style(k, s[k]);
}
