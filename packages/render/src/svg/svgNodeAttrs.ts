/* eslint-disable @typescript-eslint/no-explicit-any */
import {interpolatePath} from "d3-interpolate-path";

import {areaPath, linePath} from "../paths.js";
import type {SceneNode, TextNode} from "../scene.js";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

/** Maps a scene node to the SVG element tag that realizes it. */
export function tagFor(node: SceneNode): string {
  switch (node.type) {
    case "rect": return "rect";
    case "circle": return "circle";
    case "line":
    case "area":
    case "path": return "path";
    case "image": return "image";
    case "text": return "text";
    case "group": return "g";
  }
}

/** Builds the SVG transform string for a node, or null when it has no transform. */
export function transformStr(node: SceneNode): string | null {
  const tr = node.transform;
  if (!tr) return null;
  const parts: string[] = [];
  if (tr.x !== undefined || tr.y !== undefined)
    parts.push(`translate(${tr.x ?? 0},${tr.y ?? 0})`);
  if (tr.scale !== undefined && tr.scale !== 1) parts.push(`scale(${tr.scale})`);
  if (tr.rotate)
    parts.push(
      tr.rotateAnchor
        ? `rotate(${tr.rotate},${tr.rotateAnchor[0]},${tr.rotateAnchor[1]})`
        : `rotate(${tr.rotate})`,
    );
  return parts.join(" ") || null;
}

/** Recursively records every node by its (stringified) key for hit-testing. */
export function buildIndex(node: SceneNode, index: Map<string, SceneNode>): void {
  index.set(String(node.key), node);
  if (node.type === "group") for (const c of node.children) buildIndex(c, index);
}

/** Applies non-animated attributes: classes, accessibility, pointer behavior, content. */
export function applyStatic(sel: any, node: SceneNode): void {
  sel
    .attr("class", `d3plus-render-node d3plus-render-${node.type}`)
    .attr("data-key", String(node.key))
    .attr("id", node.id ?? null)
    .attr("role", node.aria?.role ?? null)
    .attr("aria-label", node.aria?.label ?? null)
    .attr("aria-hidden", node.aria?.hidden ? "true" : null)
    .attr("pointer-events", node.interactive === false ? "none" : null);

  if (node.type === "image") {
    sel.attr("href", node.href);
    sel.attr("xlink:href", node.href).attr("xmlns:xlink", XLINK_NS);
  }
  if (node.type === "text") applyText(sel, node);
}

/** Rebuilds the tspans and font attributes of a text node (content is not animated). */
export function applyText(sel: any, node: TextNode): void {
  const f = node.font || {};
  sel
    .attr("font-family", f.family ?? null)
    .attr("font-size", f.size ?? null)
    .attr("font-weight", f.weight ?? null)
    .attr("font-style", f.style ?? null)
    .attr("text-anchor", f.anchor ?? null)
    .attr("dominant-baseline", f.baseline ?? null)
    .attr("dir", f.dir ?? null);
  sel.selectAll("tspan").remove();
  sel.text(null);

  for (const ln of node.lines) {
    const lineSpan = sel.append("tspan").attr("x", ln.x).attr("y", ln.y);
    if (!ln.runs || !ln.runs.length) {
      lineSpan.text(ln.text);
      continue;
    }
    for (const run of ln.runs) {
      if (run.style && (run.style.weight !== undefined || run.style.style !== undefined)) {
        const styleParts: string[] = [];
        if (run.style.weight !== undefined)
          styleParts.push(`font-weight: ${run.style.weight}`);
        if (run.style.style !== undefined)
          styleParts.push(`font-style: ${run.style.style}`);
        lineSpan
          .append("tspan")
          .attr("style", styleParts.join("; "))
          .text(run.text);
      } else {
        lineSpan.append("tspan").text(run.text);
      }
    }
  }
}

/** Applies paint attributes to a selection or transition. */
export function applyPaint(target: any, node: SceneNode, resolveFill: (f?: string) => string | null): void {
  const p = node.paint || {};
  target
    .attr("fill", resolveFill(p.fill))
    .attr("fill-opacity", p.fillOpacity ?? null)
    .attr("stroke", p.stroke ?? null)
    .attr("stroke-width", p.strokeWidth ?? null)
    .attr("stroke-opacity", p.strokeOpacity ?? null)
    .attr("stroke-dasharray", p.strokeDasharray ? p.strokeDasharray.join(" ") : null)
    .attr("stroke-linecap", p.strokeLinecap ?? null)
    .attr("vector-effect", p.vectorEffect ?? null)
    .attr("shape-rendering", p.shapeRendering ?? null)
    .attr("opacity", p.opacity ?? null);
}

/** Sets a path's `d`, morphing via interpolatePath when animating on a transition. */
export function setPath(target: any, d: string, animated: boolean): void {
  if (animated)
    target.attrTween("d", function (this: Element) {
      return interpolatePath(this.getAttribute("d") || d, d);
    });
  else target.attr("d", d);
}

/** Applies geometry + paint + transform to a selection (animated=false) or transition. */
export function applyGeometry(
  target: any,
  node: SceneNode,
  animated: boolean,
  resolveFill: (f?: string) => string | null,
): void {
  switch (node.type) {
    case "rect":
      target
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("width", node.width)
        .attr("height", node.height)
        .attr("rx", node.rx ?? null)
        .attr("ry", node.ry ?? null);
      break;
    case "circle":
      target.attr("cx", node.cx).attr("cy", node.cy).attr("r", node.r);
      break;
    case "line":
      setPath(target, linePath(node), animated);
      break;
    case "area":
      setPath(target, areaPath(node), animated);
      break;
    case "path":
      setPath(target, node.d, animated);
      break;
    case "image":
      target
        .attr("x", node.x)
        .attr("y", node.y)
        .attr("width", node.width)
        .attr("height", node.height);
      break;
    case "text":
      target.attr("x", node.x).attr("y", node.y);
      break;
    case "group":
      // Groups carry transform/paint here; the renderer's keyed join
      // recurses into `children` separately. Clip regions, when set,
      // are applied via `_applyGroupClip` (called from the merged.each
      // loop) which materializes a <clipPath> in <defs>.
      break;
  }
  applyPaint(target, node, resolveFill);
  target.attr("transform", transformStr(node));
}
