import type {DataPoint} from "./DataPoint.js";

/**
  Whether `parseFloat(v)` equals `+v` for a string whose `+v` is a number:
  true unless `v` is blank, starts with whitespace or `Infinity` (left to
  `parseFloat`), or is a `0x`, `0b` or `0o` literal (which `parseFloat` reads
  as 0).
  @private
*/
function plainDecimal(v: string): boolean {
  const c = v.charCodeAt(0);
  // 1-9, "+", "-", "."
  if ((c > 48 && c < 58) || c === 43 || c === 45 || c === 46) return true;
  if (c !== 48) return false;
  // "0" alone, or not followed by a radix letter (b, o, x in either case).
  const radix = v.charCodeAt(1) | 32;
  return radix !== 98 && radix !== 111 && radix !== 120;
}

/**
  The value a loaded string cell becomes: a number when `isNaN` accepts it
  (read with `parseFloat`), `true` or `false` for those words in any case,
  otherwise the string itself.
  @param v The cell.
  @private
*/
export function coerceCell(v: string): string | number | boolean {
  const n = +v;
  if (n === n) return plainDecimal(v) ? n : parseFloat(v);
  // toLowerCase never maps a longer or shorter string onto "true" or "false".
  if (v.length === 4) return v.toLowerCase() === "true" ? true : v;
  if (v.length === 5) return v.toLowerCase() === "false" ? false : v;
  return v;
}

/**
  Coerces stringified numbers and booleans in loaded rows into real values, in
  place. Anything other than an Array is returned unchanged.
  @param data The parsed payload.
  @private
*/
export default function validateData<T>(data: T): T {
  if (data && data instanceof Array) {
    for (let i = 0; i < data.length; i++) {
      const d = data[i] as DataPoint;
      for (const k in d) {
        const v = d[k];
        if (typeof v === "string") {
          const c = coerceCell(v);
          if (c !== v) d[k] = c;
        }
      }
    }
  }
  return data;
}
