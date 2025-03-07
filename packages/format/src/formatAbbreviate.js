import {formatLocale} from "d3-format";
import {formatLocale as defaultLocale} from "@d3plus/locales";

const round = (x, n) =>
  parseFloat(Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toFixed(n);

/**
 * @private
*/
function formatSuffix(str, precision, suffixes) {
  let i = 0;
  let value = parseFloat(str.replace("−", "-"), 10);
  if (value) {
    if (value < 0) value *= -1;
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  const d = suffixes[8 + i / 3];

  return {
    number: round(d.scale(value), precision),
    symbol: d.symbol
  };
}

/**
 * @private
*/
function parseSuffixes(d, i) {
  const k = Math.pow(10, Math.abs(8 - i) * 3);
  return {
    scale: i > 8 ? d => d / k : d => d * k,
    symbol: d
  };
}


/**
    @function formatAbbreviate
    @desc Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).
    @param {Number|String} n The number to be formatted.
    @param {Object|String} locale The locale config to be used. If *value* is an object, the function will format the numbers according the object. The object must include `suffixes`, `delimiter` and `currency` properties.
    @returns {String}
*/
export default function(n, locale = "en-US", precision = undefined) {
  if (isFinite(n)) n *= 1;
  else return "N/A";

  const negative = n < 0;

  const length = n.toString().split(".")[0].replace("-", "").length,
        localeConfig = typeof locale === "object" ? locale : defaultLocale[locale] || defaultLocale["en-US"],
        suffixes = localeConfig.suffixes.map(parseSuffixes);

  const decimal = localeConfig.delimiters.decimal || ".",
        separator = localeConfig.separator || "",
        thousands = localeConfig.delimiters.thousands || ",";

  const d3plusFormatLocale = formatLocale({
    currency: localeConfig.currency || ["$", ""],
    decimal,
    grouping: localeConfig.grouping || [3],
    thousands
  });

  let val;
  if (precision) val = d3plusFormatLocale.format(precision)(n);
  else if (n === 0) val = "0";
  else if (length >= 3) {
    const f = formatSuffix(d3plusFormatLocale.format(".3r")(n), 2, suffixes);
    const num = parseFloat(f.number).toString().replace(".", decimal);
    const char = f.symbol;
    val = `${num}${separator}${char}`;
  }
  else if (length === 3) val = d3plusFormatLocale.format(",f")(n);
  else if (n < 1 && n > -1) val = d3plusFormatLocale.format(".2g")(n);
  else val = d3plusFormatLocale.format(".3g")(n);

  return `${negative && val.charAt(0) !== "−" ? "−" : ""}${val}`
    .replace(/−/g, "-") // replace new d3 default minus sign (−) to hyphen-minus (-)
    .replace(/(\.[0]*[1-9]*)[0]*$/g, "$1") // removes any trailing zeros
    .replace(/\.[0]*$/g, ""); // removes any trailing decimal point

}
