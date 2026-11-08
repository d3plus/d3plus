/** The value each function `constant` returns. */
const constants = new WeakMap<object, {value: unknown}>();

/**
    Wraps non-function variables in a simple return function.
    @param value The value to wrap in a return function.
    @example <caption>this</caption>
constant(42);
    @example <caption>returns this</caption>
function() {
  return 42;
}
*/
export default function <T>(value: T): () => T {
  const fn = function constant(): T {
    return value;
  };
  constants.set(fn, {value});
  return fn;
}

/**
    The value `fn` returns whatever it is called with, when `fn` came from
    `constant`; undefined otherwise.
    @param fn The function to look up.
*/
export function constantValue(fn: unknown): {value: unknown} | undefined {
  return typeof fn === "function" ? constants.get(fn) : undefined;
}
