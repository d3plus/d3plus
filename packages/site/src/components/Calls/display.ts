/** A call's value as shown beside it. */
export interface Shown {
  text: string;
  /** Colors to draw as swatches, when the value is a color or a list of them. */
  swatches?: string[];
}

const COLOR =
  /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla|lab|lch|oklab|oklch)\(.*\))$/i;

/** Whether a string is a CSS color written as hex or a color function. */
export const isColor = (value: unknown): value is string =>
  typeof value === "string" && COLOR.test(value.trim());

/** Collections this short, of plain values, print on one line. */
const INLINE = 72;

const isElement = (value: unknown): value is Element =>
  typeof Element !== "undefined" && value instanceof Element;

/** A value that isn't a container: printed the same wherever it sits. */
function scalar(value: unknown): string | undefined {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "function") return `ƒ ${value.name || "anonymous"}`;
  if (value instanceof Date) return value.toString();
  if (isElement(value)) return value.outerHTML;
  return undefined;
}

/**
 * A value as indented text: short arrays and objects on one line, longer
 * ones one entry per line. A class instance (a chart, a scale) reads as its
 * class name rather than its internals; a value inside itself, as `[Circular]`.
 */
function print(value: unknown, depth: number, ancestors: object[]): string {
  const plain = scalar(value);
  if (plain !== undefined) return plain;
  const object = value as object;
  if (ancestors.includes(object)) return "[Circular]";
  if (object instanceof Map)
    return print(Object.fromEntries(object), depth, ancestors);
  if (object instanceof Set) return print([...object], depth, ancestors);
  const isArray = Array.isArray(object);
  const proto = Object.getPrototypeOf(object);
  if (!isArray && proto !== Object.prototype && proto !== null)
    return `${proto.constructor?.name || "Object"} {…}`;
  const inner = [...ancestors, object];
  const entries = isArray
    ? (object as unknown[]).map(v => print(v, depth + 1, inner))
    : Object.entries(object).map(
        ([k, v]) =>
          `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${print(v, depth + 1, inner)}`,
      );
  const [open, close] = isArray ? ["[", "]"] : ["{", "}"];
  if (!entries.length) return `${open}${close}`;
  const line = `${open}${entries.join(", ")}${close}`;
  if (line.length <= INLINE && !line.includes("\n")) return line;
  const pad = "  ".repeat(depth + 1);
  return `${open}\n${entries.map(e => pad + e).join(",\n")}\n${"  ".repeat(depth)}${close}`;
}

/** How a call's value is shown: as text, with swatches for colors. */
export function display(value: unknown): Shown {
  // A d3 selection reads as the element it selects.
  const node = (value as {node?: () => unknown} | null)?.node;
  if (typeof node === "function") {
    const el = node.call(value);
    if (isElement(el)) return {text: el.outerHTML};
  }
  const text = print(value, 0, []);
  if (isColor(value)) return {text, swatches: [value]};
  if (Array.isArray(value) && value.length && value.every(isColor))
    return {text, swatches: value};
  return {text};
}
