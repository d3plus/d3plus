/**
    Given a DOM element, returns its background color by walking up the
    ancestor chain until a non-transparent background is found. Falls back
    to "rgb(255, 255, 255)" (white) if every ancestor is transparent.
    @param elem The DOM element to check.
*/
export default function (
  elem: import("d3-selection").BaseType | null | undefined,
): string {
  let node: Element | null = elem instanceof Element ? elem : null;
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)") return bg;
    node = node.parentElement;
  }
  return "rgb(255, 255, 255)";
}
