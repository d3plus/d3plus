import {select} from "d3-selection";

/**
    @function rtl
    @desc Returns `true` if the HTML or body element has either the "dir" HTML attribute or the "direction" CSS property set to "rtl".
*/
export default () =>
  select("html").attr("dir") === "rtl" ||
  select("body").attr("dir") === "rtl" ||
  select("html").style("direction") === "rtl" ||
  select("body").style("direction") === "rtl";
