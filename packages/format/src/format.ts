import abbreviate from "./formatAbbreviate.js";
import {format} from "d3-format";

/**
    An extension to d3's [format](https://github.com/d3/d3-format#api-reference) function that adds more string formatting types and localizations.
    @param specifier The string specifier used by the format function.
*/
export default function (
  specifier: string,
): ((n: number | string | {valueOf(): number}) => string) {
  if (specifier === ".3~a") return abbreviate;
  return format(specifier);
}
