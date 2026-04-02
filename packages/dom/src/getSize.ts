import {select} from "d3-selection";

/**
  @desc Given an HTMLElement and a "width" or "height" string, this function returns the current calculated size for the DOM element.
  @private
*/
function _elementSize(
  element: HTMLElement | null,
  s: "width" | "height",
): number | undefined {
  if (!element) return undefined;

  if (
    (element as HTMLElement).tagName === undefined ||
    ["BODY", "HTML"].indexOf((element as HTMLElement).tagName) >= 0
  ) {
    let val = (window as any)[
      `inner${s.charAt(0).toUpperCase() + s.slice(1)}`
    ] as number;
    const elem = select(element);

    if (s === "width") {
      val -= parseFloat(elem.style("margin-left"));
      val -= parseFloat(elem.style("margin-right"));
      val -= parseFloat(elem.style("padding-left"));
      val -= parseFloat(elem.style("padding-right"));
    } else {
      val -= parseFloat(elem.style("margin-top"));
      val -= parseFloat(elem.style("margin-bottom"));
      val -= parseFloat(elem.style("padding-top"));
      val -= parseFloat(elem.style("padding-bottom"));
    }

    return val;
  } else {
    let val: number = element.getBoundingClientRect()[s];
    if (typeof val === "number" && val > 0) {
      if (s === "height") {
        val -= parseFloat(select(element).style("padding-top"));
        val -= parseFloat(select(element).style("padding-bottom"));
        val -= parseFloat(select(element).style("border-top"));
        val -= parseFloat(select(element).style("border-bottom"));
      } else {
        val -= parseFloat(select(element).style("padding-left"));
        val -= parseFloat(select(element).style("padding-right"));
        val -= parseFloat(select(element).style("border-left"));
        val -= parseFloat(select(element).style("border-right"));
      }
      return val;
    } else return _elementSize(element.parentNode as HTMLElement | null, s);
  }
}

/**
    @function getSize
    @desc Finds the available width and height for a specified HTMLElement, traversing it's parents until it finds something with constrained dimensions. Falls back to the inner dimensions of the browser window if none is found.
    @param {HTMLElement} elem The HTMLElement to find dimensions for.
    @private
*/
export default function (
  elem: HTMLElement,
): [number | undefined, number | undefined] {
  return [_elementSize(elem, "width"), _elementSize(elem, "height")];
}
