/* eslint-disable @typescript-eslint/no-explicit-any */
import {interpolatePath} from "d3-interpolate-path";
import {select} from "d3-selection";

import {areaPath, linePath} from "../paths.js";
import type {SceneNode, TextLine, TextNode, TextRun} from "../scene.js";

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
    // htmlOverlay nodes are realized by overlay.ts, not as an SVG tag; the
    // SvgRenderer filters them out before tagFor runs. This keeps the switch
    // exhaustive over SceneNode.
    case "htmlOverlay": return "g";
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

/** Direct-child <tspan> elements of an element (not nested run tspans). */
function childTspans(parent: Element): SVGTSpanElement[] {
  const out: SVGTSpanElement[] = [];
  for (let c = parent.firstElementChild; c; c = c.nextElementSibling)
    if (c.tagName.toLowerCase() === "tspan") out.push(c as SVGTSpanElement);
  return out;
}

/** Builds the inline style string for a styled run, or null when unstyled. */
function runStyle(run: TextRun): string | null {
  const s = run.style;
  if (!s || (s.weight === undefined && s.style === undefined)) return null;
  const parts: string[] = [];
  if (s.weight !== undefined) parts.push(`font-weight: ${s.weight}`);
  if (s.style !== undefined) parts.push(`font-style: ${s.style}`);
  return parts.join("; ");
}

/**
    Applies font attributes and reconciles the line/run <tspan>s of a text node.

    Lines and runs are index-keyed d3 joins, so an identical re-render updates
    the existing tspans in place rather than tearing them down and rebuilding
    (text content is set directly, not animated).
*/
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

  const lines = sel
    .selectAll(function (this: Element) {
      return childTspans(this);
    })
    .data(node.lines);
  lines.exit().remove();
  lines
    .enter()
    .append("tspan")
    .merge(lines)
    .attr("x", (d: TextLine) => d.x)
    .attr("y", (d: TextLine) => d.y)
    .each(function (this: Element, ln: TextLine) {
      const lineSel = select(this);
      if (!ln.runs || !ln.runs.length) {
        if (this.firstElementChild) lineSel.selectAll("tspan").remove();
        if (this.textContent !== ln.text) this.textContent = ln.text;
        return;
      }
      // Styled line: drop any stray direct text, then index-key the run tspans.
      for (let n = this.firstChild; n; ) {
        const next = n.nextSibling;
        if (n.nodeType === 3) this.removeChild(n);
        n = next;
      }
      const runs = lineSel
        .selectAll<SVGTSpanElement, TextRun>(function (this: Element) {
          return childTspans(this);
        })
        .data(ln.runs);
      runs.exit().remove();
      runs
        .enter()
        .append("tspan")
        .merge(runs)
        .attr("style", (r: TextRun) => runStyle(r))
        .text((r: TextRun) => r.text);
    });
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
