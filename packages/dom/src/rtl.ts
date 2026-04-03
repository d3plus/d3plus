import {select} from "d3-selection";

/**
    Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".
*/
export default function (): boolean {
  return select("html").attr("dir") === "rtl" ||
    select("body").attr("dir") === "rtl" ||
    select("html").style("direction") === "rtl" ||
    select("body").style("direction") === "rtl";
}
