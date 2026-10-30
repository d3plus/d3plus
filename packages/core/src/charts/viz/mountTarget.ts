/**
    Resolves the element a renderer mounts into. A `<canvas>` cannot paint inside
    an `<svg>`, so when the scene target is the compute svg, the canvas mounts
    into that svg's parent (the user's element); the emptied, position:absolute
    compute svg overlays the same top-left box. SVG mounts into the target as-is.
*/
export function mountTargetFor(kind: string, target: Element): Element {
  if (
    kind === "canvas" &&
    typeof Element !== "undefined" &&
    target instanceof Element &&
    target.tagName.toLowerCase() === "svg"
  )
    return (target.parentNode as Element | null) ?? target;
  return target;
}
