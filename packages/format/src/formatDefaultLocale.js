import format from "./format.js";
import {formatDefaultLocale} from "d3-format";

/**
    @function formatDefaultLocale
    @desc An extension to d3's [formatDefaultLocale](https://github.com/d3/d3-format#api-reference) function that allows setting the locale globally for formatters.
    @param {Object} definition The localization definition.
    @returns {Object}
*/
export default definition => {
  const locale = formatDefaultLocale(definition);
  locale.format = format;
  return locale;
};
