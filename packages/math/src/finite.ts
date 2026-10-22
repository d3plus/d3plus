/**
    Whether a value is a finite number: not `NaN`, `±Infinity`, or a
    non-number such as a numeric string, `null`, or an array.
    @param value The value to check.
*/
export default function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}
