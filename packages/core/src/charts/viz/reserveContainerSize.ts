import type Viz from "./Viz.js";

const SPACER_CLASS = "d3plus-viz-spacer";
const XHTML = "http://www.w3.org/1999/xhtml";

/** A size the user set, as opposed to one measured from the container. */
function explicitSize(
  size: number | undefined,
  auto: boolean | undefined,
): number | undefined {
  return size !== undefined && !auto ? size : undefined;
}

/**
    Reserves the chart's explicit width and height in its container's layout.
    The chart's svg is absolutely positioned, so an auto-sized chart never props
    open the container it measures; but that leaves a container with no size of
    its own collapsed to its padding when the chart's size is set explicitly,
    and whatever follows it on the page draws over the chart. An invisible,
    in-flow spacer sized to the explicit dimensions gives the container that
    size. Being ordinary content, it never overrides a size the container gets
    from CSS or from its layout. The canvas renderer's `<canvas>` is already in
    flow, so it needs none. Runs on every render, so a new size updates the
    spacer and a size returned to automatic removes it.
    @private
*/
export function reserveContainerSize(viz: Viz): void {
  const svg = viz._select?.node() as Element | null | undefined;
  const parent = svg?.parentNode as HTMLElement | null | undefined;
  if (!svg || !parent || parent.namespaceURI !== XHTML) return;

  let spacer = Array.from(parent.children).find(child =>
    child.classList.contains(SPACER_CLASS),
  ) as HTMLElement | undefined;
  const width = explicitSize(viz.schema.width, viz._autoWidth);
  const height = explicitSize(viz.schema.height, viz._autoHeight);
  if (
    viz._renderer === "canvas" ||
    (width === undefined && height === undefined)
  ) {
    spacer?.remove();
    return;
  }

  if (!spacer) {
    spacer = parent.ownerDocument.createElement("div");
    spacer.className = SPACER_CLASS;
    spacer.setAttribute("aria-hidden", "true");
    const style = spacer.style;
    style.display = "block";
    style.flex = "none";
    style.boxSizing = "content-box";
    style.margin = "0";
    style.padding = "0";
    style.border = "0";
    style.visibility = "hidden";
    style.pointerEvents = "none";
    parent.insertBefore(spacer, svg);
  }
  spacer.style.width = `${width ?? 0}px`;
  spacer.style.height = `${height ?? 0}px`;
}
