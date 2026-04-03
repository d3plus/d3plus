import {formatLocale} from "d3-format";
import {formatLocale as defaultLocale} from "@d3plus/locales";
import type {FormatLocaleDefinition} from "@d3plus/locales";

interface SuffixEntry {
  scale: (d: number) => number;
  symbol: string;
}

const round = (x: number, n: number): string =>
  parseFloat(
    (Math.round(x * Math.pow(10, n)) / Math.pow(10, n)).toString(),
  ).toFixed(n);

/**
 * @private
 */
function formatSuffix(
  str: string,
  precision: number,
  suffixes: SuffixEntry[],
): {number: string; symbol: string} {
  let i = 0;
  let value = parseFloat(str.replace("\u2212", "-"));
  if (value) {
    if (value < 0) value *= -1;
    i = 1 + Math.floor(1e-12 + Math.log(value) / Math.LN10);
    i = Math.max(-24, Math.min(24, Math.floor((i - 1) / 3) * 3));
  }
  const d = suffixes[8 + i / 3];

  return {
    number: round(d.scale(value), precision),
    symbol: d.symbol,
  };
}

/**
 * @private
 */
function parseSuffixes(d: string, i: number): SuffixEntry {
  const k = Math.pow(10, Math.abs(8 - i) * 3);
  return {
    scale: i > 8 ? (d: number) => d / k : (d: number) => d * k,
    symbol: d,
  };
}

/**
    Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. `1200000` to `"1.2M"`).
    @param n The number to be formatted.
    @param locale The locale config to be used. If an object is provided, the function will format the numbers according to the object. The object must include `suffixes`, `delimiter` and `currency` properties.
    @param precision Number of significant digits to display.
*/
export default function formatAbbreviate(
  n: number | string,
  locale: string | FormatLocaleDefinition = "en-US",
  precision?: string,
): string {
  if (isFinite(n as number)) n = (n as number) * 1;
  else return "N/A";

  const negative = (n as number) < 0;

  const length = n.toString().split(".")[0].replace("-", "").length,
    localeConfig: FormatLocaleDefinition =
      typeof locale === "object"
        ? locale
        : defaultLocale[locale] || defaultLocale["en-US"],
    suffixes = localeConfig.suffixes.map(parseSuffixes);

  const decimal = localeConfig.delimiters.decimal || ".",
    separator = localeConfig.separator || "",
    thousands = localeConfig.delimiters.thousands || ",";

  const d3plusFormatLocale = formatLocale({
    currency: localeConfig.currency || ["$", ""],
    decimal,
    grouping: localeConfig.grouping || [3],
    thousands,
  });

  let val: string;
  if (precision) val = d3plusFormatLocale.format(precision)(n as number);
  else if (n === 0) val = "0";
  else if (length >= 3) {
    const f = formatSuffix(
      d3plusFormatLocale.format(".3r")(n as number),
      2,
      suffixes,
    );
    const num = parseFloat(f.number).toString().replace(".", decimal);
    const char = f.symbol;
    val = `${num}${separator}${char}`;
  } else if (length === 3) val = d3plusFormatLocale.format(",f")(n as number);
  else if ((n as number) < 1 && (n as number) > -1)
    val = d3plusFormatLocale.format(".2g")(n as number);
  else val = d3plusFormatLocale.format(".3g")(n as number);

  return `${negative && val.charAt(0) !== "\u2212" ? "\u2212" : ""}${val}`
    .replace(/\u2212/g, "-") // replace new d3 default minus sign (\u2212) to hyphen-minus (-)
    .replace(/(\.[0]*[1-9]*)[0]*$/g, "$1") // removes any trailing zeros
    .replace(/\.[0]*$/g, ""); // removes any trailing decimal point
}
