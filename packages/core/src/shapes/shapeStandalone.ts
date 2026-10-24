/**
    The standalone `Shape.render()` path: paints a shape (and its labels)
    into a caller's element through its own SvgRenderer, outside any Viz.
*/
import {getSize} from "@d3plus/dom";
import {SvgRenderer} from "@d3plus/render";
import type {GroupNode, SceneNode} from "@d3plus/render";

import {applyClassName} from "../utils/className.js";
import type Shape from "./Shape.js";

/**
    Paints `shape`'s scene and label text into `node`, sized to the node (or
    its first measurable ancestor), reusing and replacing the shape's previous
    renderer.
*/
export function paintStandalone(shape: Shape, node: Element): void {
  const tag = (node.tagName || "").toLowerCase();
  const isSvg = tag === "svg";
  // Explicit numeric size first: an <svg>'s width/height attribute, or a
  // non-svg container's client box.
  const rawW = isSvg
    ? Number(node.getAttribute("width"))
    : (node as HTMLElement).clientWidth;
  const rawH = isSvg
    ? Number(node.getAttribute("height"))
    : (node as HTMLElement).clientHeight;
  // When that isn't a usable number — e.g. width="100%" (Number → NaN)
  // or a 0-size box — measure the container's real rendered size,
  // walking up to the first constrained ancestor. Only fall back to the
  // static 400x300 when nothing is measurable (e.g. no layout in jsdom).
  const [measuredW, measuredH] =
    rawW && rawH ? [rawW, rawH] : getSize(node as HTMLElement);
  const width = rawW || measuredW || 400;
  const height = rawH || measuredH || 300;
  // Combine the shape's scene + label children. toScene() deliberately
  // omits labels (collectComputed is the canonical aggregator for the
  // chart pipeline); for the standalone render() path we add them here
  // so `new Rect().data(...).render()` still produces label text.
  const shapeGroup = shape.toScene();
  const labelChildren: SceneNode[] = [];
  if (
    shape._labelClass &&
    typeof (shape._labelClass as {toScene?: unknown}).toScene === "function" &&
    shape._labelClass._data &&
    shape._labelClass._data.length
  ) {
    labelChildren.push(
      ...(shape._labelClass.toScene().children as SceneNode[]),
    );
  }
  const root: GroupNode = {
    ...shapeGroup,
    children: [...shapeGroup.children, ...labelChildren],
  };
  const scene = {root, width, height};
  // Tear down any previous SvgRenderer so its DOM listeners + timers
  // are cleared instead of leaking on every re-render.
  const prev = shape._sceneRenderer;
  if (prev && typeof prev.destroy === "function") prev.destroy();
  // Caller's element is preserved (downstream selectors still find it);
  // we mount SvgRenderer INSIDE it. When `node` is a <g> the result is
  // a nested <svg>-in-<g>, which is valid SVG but visually unusual —
  // chart code reaches this path only via the Box/Whisker full-mode
  // fallback, which is not the recommended flow (compute mode is).
  // Only wipe children when this is the FIRST time we're mounting
  // here — re-renders into the same node would otherwise destroy any
  // labels/auxiliary DOM the caller put alongside.
  if (!prev) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  const renderer = new SvgRenderer();
  renderer.mount({container: node, width, height});
  renderer.drawScene(scene);
  shape._sceneRenderer = renderer;
  applyClassName(shape);
}
