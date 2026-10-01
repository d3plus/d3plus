/**
 * Builds a story's data array from a self-contained JavaScript expression and
 * remembers that expression, so the "Show code" snippet prints the generator
 * instead of every generated row. The expression is the single source of
 * truth: it is what runs and exactly what the snippet shows.
 *
 * @param {string} code an expression that evaluates to the data array.
 */
export default function datafy(code) {
  // eslint-disable-next-line no-new-func
  const data = new Function(`return (${code});`)();
  Object.defineProperty(data, "__source", {value: code});
  return data;
}
