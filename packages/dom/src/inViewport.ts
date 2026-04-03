/**
    Determines whether a given DOM element is visible within the current viewport, with an optional pixel buffer.
    @param elem The DOM element to check.
    @param buffer Extra pixel margin around the viewport boundary.
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
