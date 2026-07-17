import {prepareWithSegments, layoutWithLines} from "@chenglou/pretext";

/** Common named HTML entities for the DOM-free decode fallback. */
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", copy: "©",
  reg: "®", trade: "™", deg: "°", middot: "·",
  bull: "•", laquo: "«", raquo: "»", times: "×",
  divide: "÷", lsquo: "‘", rsquo: "’", ldquo: "“",
  rdquo: "”", euro: "€", pound: "£", cent: "¢",
  yen: "¥", sect: "§", para: "¶", plusmn: "±",
};

/**
 * Decodes HTML entities without a DOM, for headless/server-side rendering where
 * `DOMParser` may be absent. Handles numeric (`&#160;`/`&#xA0;`) and the common
 * named entities above; unknown or out-of-range entities are left as-is.
 * Exported for testing; not part of the package's public API.
 * @param {String} input tag-stripped text
 */
export function decodeEntities(input: string): string {
  return input.replace(
    /&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g,
    (match, code: string) => {
      if (code[0] === "#") {
        const cp =
          code[1] === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        // Reject code points outside the Unicode range — String.fromCodePoint
        // throws on them; leave the raw entity in place instead.
        return cp <= 0x10ffff ? String.fromCodePoint(cp) : match;
      }
      const named = NAMED_ENTITIES[code];
      return named !== undefined ? named : match;
    },
  );
}

/**
 * Strips HTML and "un-escapes" escape characters. Uses `DOMParser` when present
 * (browser / jsdom) for full entity coverage, falling back to a DOM-free decode
 * so text measurement works in any headless environment.
 * @param {String} input
 */
function htmlDecode(input: string): string {
  if (input.replace(/\s+/g, "") === "") return input;
  const stripped = input.replace(/<[^>]+>/g, "");
  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(stripped, "text/html");
    return doc.documentElement ? doc.documentElement.textContent! : input;
  }
  return decodeEntities(stripped);
}

/**
 * Builds a CSS font shorthand string from a style object.
 * @param {Object} styleObj
 */
function buildFont(styleObj: Record<string, string | number>): string {
  const style = styleObj["font-style"] || "normal";
  const variant = styleObj["font-variant"] || "normal";
  const weight = styleObj["font-weight"] || 400;
  const size =
    typeof styleObj["font-size"] === "string"
      ? styleObj["font-size"]
      : `${styleObj["font-size"] || 10}px`;
  const family = styleObj["font-family"] || "sans-serif";
  return `${style} ${variant} ${weight} ${size} ${family}`;
}

/**
 * Measures the width of a single text string using pretext.
 * @param {String} text
 * @param {String} font CSS font shorthand
 */
function measureWidth(text: string, font: string): number {
  if (!text) return 0;
  const prepared = prepareWithSegments(text, font);
  const result = layoutWithLines(prepared, Infinity, 20);
  return result.lines.length ? result.lines[0].width : 0;
}

/**
    Given a text string, returns the predicted pixel width of the string when placed into DOM.
    @param text The text string to measure.
    @param style CSS style properties to apply when measuring.
*/
export default function (
  text: string,
  style?: Record<string, string | number>,
): number;
export default function (
  text: string[],
  style?: Record<string, string | number>,
): number[];
export default function (
  text: string | string[],
  style: Record<string, string | number> = {},
): number | number[] {
  const font = buildFont(style);

  if (text instanceof Array)
    return text.map(t => measureWidth(htmlDecode(t), font));
  return measureWidth(htmlDecode(text), font);
}
