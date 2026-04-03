import {prepareWithSegments, layoutWithLines} from "@chenglou/pretext";

/**
 * Strips HTML and "un-escapes" escape characters.
 * @param {String} input
 */
function htmlDecode(input: string): string {
  if (input.replace(/\s+/g, "") === "") return input;
  const doc = new DOMParser().parseFromString(
    input.replace(/<[^>]+>/g, ""),
    "text/html",
  );
  return doc.documentElement ? doc.documentElement.textContent! : input;
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
