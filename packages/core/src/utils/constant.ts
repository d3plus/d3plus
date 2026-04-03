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
  return function constant(): T {
    return value;
  };
}
