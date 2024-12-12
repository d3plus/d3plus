/**
    @function isObject
    @desc Detects if a variable is a javascript Object.
    @param {*} item
*/
export default function(item) {
  return item &&
    typeof item === "object" &&
    (typeof window === "undefined" || item !== window && item !== window.document && !(item instanceof Element)) &&
    !Array.isArray(item)
    ? true : false;
}
