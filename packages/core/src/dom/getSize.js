import {select} from "d3-selection";

/**
  @desc Given an HTMLElement and a "width" or "height" string, this function returns the current calculated size for the DOM element.
  @private
*/
function _elementSize(element, s) {

  if (!element) return undefined;

  if (element.tagName === undefined || ["BODY", "HTML"].indexOf(element.tagName) >= 0) {

    let val  = window[`inner${s.charAt(0).toUpperCase() + s.slice(1)}`];
    const elem = select(element);

    if (s === "width") {
      val -= parseFloat(elem.style("margin-left"), 10);
      val -= parseFloat(elem.style("margin-right"), 10);
      val -= parseFloat(elem.style("padding-left"), 10);
      val -= parseFloat(elem.style("padding-right"), 10);
    }
    else {
      val -= parseFloat(elem.style("margin-top"), 10);
      val -= parseFloat(elem.style("margin-bottom"), 10);
      val -= parseFloat(elem.style("padding-top"), 10);
      val -= parseFloat(elem.style("padding-bottom"), 10);
    }

    return val;

  }
  else {

    const val = parseFloat(select(element).style(s), 10);
    if (typeof val === "number" && val > 0) return val;
    else return _elementSize(element.parentNode, s);

  }
}

/**
    @function getSize
    @desc Finds the available width and height for a specified HTMLElement, traversing it's parents until it finds something with constrained dimensions. Falls back to the inner dimensions of the browser window if none is found.
    @param {HTMLElement} elem The HTMLElement to find dimensions for.
    @private
*/
export default function(elem) {
  return [_elementSize(elem, "width"), _elementSize(elem, "height")];
}
