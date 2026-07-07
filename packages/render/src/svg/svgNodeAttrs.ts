import {interpolatePath} from "d3-interpolate-path";
import {select, type Selection} from "d3-selection";
import type {Transition} from "d3-transition";

import {areaPath, linePath} from "../paths.js";
import {textVisualCenter} from "../scene.js";
import type {SceneNode, TextLine, TextNode, TextRun} from "../scene.js";

export const SVG_NS = "http://www.w3.org/2000/svg";
export const XLINK_NS = "http://www.w3.org/1999/xlink";

/**
    A d3 selection over a single DOM element — exactly what `select(node)`
    produces, which is how every call site here is built.
*/
export type SvgSelection = Selection<Element, unknown, null, undefined>;
/** The transition counterpart of {@link SvgSelection}. */
export type SvgTransition = Transition<Element, unknown, null, undefined>;
/**
    The chainable attribute-writing surface shared by d3 `Selection` and
    `Transition` — just enough for the SVG node writers. A structural type
    (rather than `SvgSelection | SvgTransition`) so chained `.attr(...)` calls
    keep returning the sink instead of collapsing to the read-only `.attr`
    getter overload. Only transitions carry `.attrTween`, so {@link setPath}
    narrows to {@link SvgTransition} for the animated branch.
*/
export interface AttrTarget {
  attr(name: string, value: null | string | number | boolean): this;
}

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

/**
    Builds an `attrTween` interpolator for a text label whose font-size changed
    between renders, so it eases into its new size/place instead of snapping.

    The text layout (tspans) is already at the NEW size; the tween layers a
    `scale(old/new → 1)` on top so the painted glyphs grow/shrink into place,
    while the label's CENTER glides from where it was to where it's going and the
    rotation glides too.

    The scale pivots about the NEW visual center (`textVisualCenter`, which
    reflects text-anchor/alignment) — the glyphs are already laid out there, so
    that's the point that must stay put as they scale; using the box center or
    the old center instead parks the shrunk label off to one side and it visibly
    jumps at the start. We track the visual center's position in the parent frame
    (`pos = origin + center`), glide it old→new, and place the origin at
    `pos − scale·center`. At k=0 this lands exactly on the previous label —
    even across an anchor flip — and at k=1 reduces to the node's own `translate`.
*/
export function textFontTween(
  prev: TextNode,
  node: TextNode,
): () => (k: number) => string {
  const pt = prev.transform || {};
  const nt = node.transform || {};
  const orot = pt.rotate ?? 0, nrot = nt.rotate ?? 0;
  const [nvcx, nvcy] = textVisualCenter(node);
  const [ovcx, ovcy] = textVisualCenter(prev);
  // Visual-center positions in the parent frame (origin + visual center).
  const oldCx = (pt.x ?? 0) + ovcx, oldCy = (pt.y ?? 0) + ovcy;
  const newCx = (nt.x ?? 0) + nvcx, newCy = (nt.y ?? 0) + nvcy;
  const s0 = (prev.font?.size ?? 1) / (node.font?.size ?? 1);
  const ra = nt.rotateAnchor;
  return () => (k: number): string => {
    const sc = s0 + (1 - s0) * k;
    const px = oldCx + (newCx - oldCx) * k;
    const py = oldCy + (newCy - oldCy) * k;
    const rot = orot + (nrot - orot) * k;
    let str = `translate(${px - sc * nvcx},${py - sc * nvcy}) scale(${sc})`;
    if (rot) str += ra ? ` rotate(${rot},${ra[0]},${ra[1]})` : ` rotate(${rot})`;
    return str;
  };
}

/** Recursively records every node by its (stringified) key for hit-testing. */
export function buildIndex(node: SceneNode, index: Map<string, SceneNode>): void {
  index.set(String(node.key), node);
  if (node.type === "group") for (const c of node.children) buildIndex(c, index);
}

/** Applies non-animated attributes: classes, accessibility, pointer behavior, content. */
export function applyStatic(sel: SvgSelection, node: SceneNode): void {
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
export function applyText(sel: SvgSelection, node: TextNode): void {
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
export function applyPaint(target: AttrTarget, node: SceneNode, resolveFill: (f?: string) => string | null): void {
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
export function setPath(target: AttrTarget, d: string, animated: boolean): void {
  if (animated)
    (target as unknown as SvgTransition).attrTween("d", function (this: Element) {
      return interpolatePath(this.getAttribute("d") || d, d);
    });
  else target.attr("d", d);
}

/** Applies geometry + paint + transform to a selection (animated=false) or transition. */
export function applyGeometry(
  target: AttrTarget,
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
