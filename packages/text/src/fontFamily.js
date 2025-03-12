/**
    @const fontFamily
    @desc The default fallback font list used for all text labels as an Array of Strings.
    @returns {Array<string>}
*/
export const fontFamily = ["Inter", "Helvetica Neue", "HelveticaNeue", "Helvetica", "Arial", "sans-serif"];

/**
    @const fontFamilyStringify
    @desc Converts an Array of font-family names into a CSS font-family string.
    @param {String|Array<string>} *family*
    @returns {String}
*/
export const fontFamilyStringify = family => 
  (typeof family === "string" ? [family] : family)
    .map(d => d.match(/^[a-z-_]{1,}$/) ? d : `'${d}'`)
    .join(", ");