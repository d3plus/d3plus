import {fontFamilyStringify} from "@d3plus/text";

/** A family name without the quotes CSS lets it carry. */
const unquote = (family: string): string =>
  family.trim().replace(/^(['"])(.*)\1$/, "$2");

/**
    The CSS `font-family` a label is drawn with: the family its layout measured
    (the first one in the configured list that is installed), then the families
    listed after it. A renderer without the measured family then falls back
    down the same list rather than to its default font, as when a chart drawn
    on a server is opened in a browser that has different fonts.
    @param configured The label's configured families, as an Array or a CSS list.
    @param measured The family the layout measured with, from `fontExists`, or `false` when none was found.
*/
export function fontStack(
  configured: string | string[],
  measured: string | false,
): string {
  const list = (Array.isArray(configured) ? configured : configured.split(","))
    .map(unquote)
    .filter(Boolean);
  if (!measured) return fontFamilyStringify(list);
  const family = unquote(measured);
  const at = list.indexOf(family);
  return fontFamilyStringify(at < 0 ? [family, ...list] : list.slice(at));
}
