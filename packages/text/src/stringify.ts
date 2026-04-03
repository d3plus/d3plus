/**
    Coerces value into a String.
    @param value The value to convert to a string.
*/
export default function (value: unknown): string {
  if (value === void 0) return "undefined";
  if (typeof value === "string" || value instanceof String)
    return value as string;
  return JSON.stringify(value);
}
