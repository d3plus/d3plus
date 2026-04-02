/**
  @module inViewport
  @desc Returns a *Boolean* denoting whether or not a given DOM element is visible in the current window.
  @param {DOMElement} elem The DOM element to analyze.
  @param {Number} [buffer = 0] A pixel offset from the edge of the top and bottom of the screen. If a positive value, the element will be deemed visible when it is that many pixels away from entering the viewport. If negative, the element will have to enter the viewport by that many pixels before being deemed visible.
  @private
*/
export default function (elem: Element, buffer: number = 0): boolean {
  const pageX: number =
    window.pageXOffset !== undefined
      ? window.pageXOffset
      : (
          (document.documentElement ||
            document.body.parentNode ||
            document.body) as Element
        ).scrollLeft;

  const pageY: number =
    window.pageYOffset !== undefined
      ? window.pageYOffset
      : (
          (document.documentElement ||
            document.body.parentNode ||
            document.body) as Element
        ).scrollTop;

  const bounds = elem.getBoundingClientRect();
  const height = bounds.height,
    left = bounds.left + pageX,
    top = bounds.top + pageY,
    width = bounds.width;

  return (
    pageY + window.innerHeight > top + buffer &&
    pageY + buffer < top + height &&
    pageX + window.innerWidth > left + buffer &&
    pageX + buffer < left + width
  );
}
