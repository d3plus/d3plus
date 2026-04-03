/**
 * The default fallback font list used for all text labels as an Array of Strings.
 * @defaultValue `["Inter", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"]`
 */
export const fontFamily: string[] = [
  "Inter",
  "Helvetica Neue",
  "HelveticaNeue",
  "Helvetica",
  "Arial",
  "sans-serif",
];

/**
    Converts an Array of font-family names into a CSS font-family string.
    @param family A font family name or array of font family names.
*/
export function fontFamilyStringify(family: string | string[]): string {
  return (typeof family === "string" ? [family] : family)
    .map(d => (d.match(/^[a-z-_]{1,}$/) ? d : `'${d}'`))
    .join(", ");
}
