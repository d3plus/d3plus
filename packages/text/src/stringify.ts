/**
    @function stringify
    @desc Coerces value into a String.
    @param {String} value
*/
export default function (value: unknown): string {
  if (value === void 0) return "undefined";
  if (typeof value === "string" || value instanceof String)
    return value as string;
  return JSON.stringify(value);
}
