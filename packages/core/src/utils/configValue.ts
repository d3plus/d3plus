/**
    The value of a config property that takes either a constant or a function
    (such as a label's `fontSize` or a shape's `lineHeight`): calls a function
    `value` with `args`, and returns any other `value` as it is.
    @param value A constant, or a function returning the value.
    @param args The arguments a function `value` is called with.
*/
export default function configValue<T, A extends unknown[]>(
  value: T | ((...args: A) => T),
  ...args: A
): T {
  return typeof value === "function"
    ? (value as (...args: A) => T)(...args)
    : value;
}
