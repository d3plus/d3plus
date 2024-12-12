/**
    @function stringify
    @desc Coerces value into a String.
    @param {String} value
*/
export default function(value) {
  if (value === void 0) value = "undefined";
  else if (!(typeof value === "string" || value instanceof String)) value = JSON.stringify(value);
  return value;
}
