/**
    `applyInteractionOpacity` — recomputes node alpha for hover/active state.

    v4 expresses hover/active dimming as `paint.opacity` on the scene node
    (see the `Paint` docs in @d3plus/render), not via DOM surgery. When a
    hover or active predicate is set, this walks the chart-cell nodes and
    returns clones of the non-matching ones with a reduced opacity, leaving
    the originals (and the un-dimmed nodes) untouched. With no predicate set
    it returns the input array unchanged, so normal renders pay nothing.
*/

import {color, hsl} from "d3-color";

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {activeBucketColors} from "../features/colorScaleBucket.js";
import type {VizInstance} from "./vizTypes.js";

type Predicate = (d: DataPoint, i: number) => boolean;

/** z value that floats a hovered/highlighted node above its (z-less, i.e. 0) siblings. */
const HOVER_RAISE_Z = 1e6;

/**
    De-emphasizes a paint color for `highlight` by stripping its chroma while
    keeping its lightness and alpha — so the highlighted series is the only
    color on the chart. Keeping lightness (rather than flattening to one gray)
    means a mark's label keeps the same contrast it was given, and a transparent
    fill (e.g. a legend hit-area rect) stays transparent instead of becoming a
    solid gray box. Unparseable values (`"none"`) are left untouched.
*/
function deemphasize(c: string): string {
  const h = hsl(c);
  if (Number.isNaN(h.l)) return c;
  h.s = 0;
  return `${h}`;
}

/** Scene mark types that carry a fill/stroke a hover/active emphasis applies to. */
const MARK_TYPES = new Set(["rect", "circle", "line", "area", "path"]);

/**
    Emphasizes a matched mark's stroke on hover/active — the v3 `hoverStyle` /
    `activeStyle` look (a thicker, darker outline). v4 paints from the scene
    graph, so this reapplies it here: darken the fill by `darken` for the stroke
    and multiply the stroke width by `widthMult` (treating a 0/absent width as 1,
    matching the shape defaults). Non-mark nodes (labels, groups) are untouched.
*/
function emphasizeStroke(node: SceneNode, darken: number, widthMult: number): SceneNode {
  const paint = {...((node.paint ?? {}) as Record<string, unknown>)};
  let base = typeof paint.fill === "string" ? paint.fill : undefined;
  if (!base || base === "transparent" || base === "none")
    base = typeof paint.stroke === "string" ? paint.stroke : undefined;
  // No visible paint to emphasize (e.g. an invisible hit-area node): leave it
  // untouched — darkening `transparent`/`none` would format to opaque black.
  if (!base || base === "transparent" || base === "none") return node;
  const c = color(base);
  if (c) paint.stroke = c.darker(darken).formatHex();
  const w = typeof paint.strokeWidth === "number" && paint.strokeWidth ? paint.strokeWidth : 1;
  paint.strokeWidth = w * widthMult;
  return {...node, paint} as SceneNode;
}

/**
    Reads the interaction predicate + treatment off a viz, or null when nothing
    is set. Precedence: transient `hover`, then `active`, then the standing
    `highlight`. `hover`/`active` dim non-matching marks by opacity; `highlight`
    grays them (the emphasis form), signalled by `gray`.
*/
function dimSettings(viz: VizInstance): {
  predicate: Predicate;
  dimOpacity: number;
  isHover: boolean;
  gray: boolean;
  kind: "hover" | "active" | "highlight";
  activePredicate: Predicate | null;
} | null {
  const hover = typeof viz._hover === "function" ? (viz._hover as Predicate) : null;
  const active = typeof viz._active === "function" ? (viz._active as Predicate) : null;
  const highlight =
    typeof viz._highlight === "function" ? (viz._highlight as Predicate) : null;
  if (!hover && !active && !highlight) return null;
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;
  let hoverOpacity = typeof sc.hoverOpacity === "number" ? sc.hoverOpacity : 0.5;
  const activeOpacity = typeof sc.activeOpacity === "number" ? sc.activeOpacity : 0.25;
  const gray = !hover && !active;
  // A colorScale bucket hover must dim the non-matching marks to read as a
  // highlight, even on charts (Geomap) that set hoverOpacity:1 to keep a plain
  // shape hover from dimming the map. Fall back to the default dim there.
  if (hover && viz._hoverBucket && hoverOpacity >= 1) hoverOpacity = 0.5;
  return {
    predicate: (hover ?? active ?? highlight) as Predicate,
    dimOpacity: hover ? hoverOpacity : active ? activeOpacity : 1,
    isHover: !!hover,
    gray,
    kind: hover ? "hover" : active ? "active" : "highlight",
    // The active predicate is exposed even when hover wins the dim pass, so a
    // node that is BOTH active and hovered keeps its (stronger) active stroke
    // instead of dropping to the thinner hover stroke.
    activePredicate: active,
  };
}

/**
    `applyColorScaleBucketOpacity` — dims the colorScale's sibling swatches on
    hover, the way `applyInteractionOpacity` dims chart marks and legend
    swatches. A swatch (and its label) is a `_isColorScaleBucket` node matched
    by its bucket COLOR, not by id/value — so this only touches those nodes and
    leaves the colorScale title/axis/gradient at full opacity. A swatch stays
    bright when its color is "active" (its range contains a datum matching the
    current hover); every other swatch dims. No-op when nothing is hovered.
*/
export function applyColorScaleBucketOpacity(
  nodes: SceneNode[],
  viz: VizInstance,
): SceneNode[] {
  const settings = dimSettings(viz);
  if (!settings) return nodes;
  const activeColors = activeBucketColors(viz, settings.predicate);
  if (!activeColors) return nodes;

  const walk = (node: SceneNode): SceneNode => {
    let next = node;
    // Unwrap the node's datum to the source row: the swatch label is a
    // double-wrapped TextBox node (label → shape-row → bucket).
    let src = node.datum as
      | (DataPoint & {__d3plus__?: boolean; data?: DataPoint; _isColorScaleBucket?: boolean; color?: unknown})
      | undefined;
    while (src && src.__d3plus__ && src.data) src = src.data as typeof src;
    if (src && src._isColorScaleBucket && !activeColors.has(src.color)) {
      const base =
        node.paint && typeof node.paint.opacity === "number" ? node.paint.opacity : 1;
      next = {...node, paint: {...(node.paint ?? {}), opacity: base * settings.dimOpacity}};
    }
    const kids = (next as {children?: SceneNode[]}).children;
    if (kids && kids.length) next = {...next, children: kids.map(walk)} as SceneNode;
    return next;
  };
  return nodes.map(walk);
}

export function applyInteractionOpacity(
  nodes: SceneNode[],
  viz: VizInstance,
): SceneNode[] {
  // Precedence (hover → active → highlight) and the dim-vs-gray treatment are
  // resolved once in dimSettings; picking one source avoids ambiguous
  // compounding when several are momentarily set.
  const settings = dimSettings(viz);
  if (!settings) return nodes;
  const {predicate, dimOpacity, isHover, gray, kind, activePredicate} = settings;

  const walk = (node: SceneNode): SceneNode => {
    // Axes and the timeline are chrome, not data marks — they keep full
    // opacity when a shape is hovered/selected (the whole subtree is tagged).
    const group = (node as {interactionGroup?: string}).interactionGroup;
    if (group === "axis" || group === "timeline") return node;
    let next = node;
    const datum = node.datum as (DataPoint & {data?: DataPoint; i?: number}) | undefined;
    if (datum) {
      // Mirror the renderer→handler bridge's one-level unwrap
      // (`rawDatum.data ?? rawDatum`) so the predicate sees the same row the
      // hover predicate was built from — for shape nodes the datum is already
      // the row; for label nodes it's the layout node whose `.data` is the row.
      const row = (datum.data ?? datum) as DataPoint;
      const i =
        typeof node.index === "number"
          ? node.index
          : typeof (row as {i?: number}).i === "number"
            ? (row as {i: number}).i
            : 0;
      if (!predicate!(row, i)) {
        const paint = (node.paint ?? {}) as Record<string, unknown>;
        if (gray) {
          // highlight: recolor the mark to the de-emphasis gray so the
          // highlighted series keeps the only color on the chart.
          const next2: Record<string, unknown> = {...paint};
          if (typeof paint.fill === "string") next2.fill = deemphasize(paint.fill);
          if (typeof paint.stroke === "string") next2.stroke = deemphasize(paint.stroke);
          next = {...node, paint: next2} as SceneNode;
        } else {
          const base = typeof paint.opacity === "number" ? paint.opacity : 1;
          next = {...node, paint: {...paint, opacity: base * dimOpacity}};
        }
      } else {
        // Matched (hovered / active / highlighted) mark. Restore the v3
        // hover/active emphasis — a thicker, darker stroke — on the mark shapes
        // (not labels/groups). Highlight keeps its color-vs-gray treatment and
        // adds no outline. An active node keeps the stronger active stroke even
        // while hovered, rather than dropping to the thinner hover stroke.
        if (kind !== "highlight" && MARK_TYPES.has(node.type)) {
          const active = kind === "active" || (activePredicate?.(row, i) ?? false);
          next = active ? emphasizeStroke(node, 1, 3) : emphasizeStroke(node, 0.5, 2);
        }
        if (isHover) {
          // Raise the hovered node above its siblings. Both renderers paint by
          // ascending `z`; restore is automatic — the next repaint rebuilds the
          // scene with no `z`. Only for hover: a matched mark's data label is a
          // separate (un-raised) node, so raising the mark would paint it over
          // its own label. Highlight relies on color-vs-gray, not z-order.
          next = {...next, z: HOVER_RAISE_Z} as SceneNode;
        }
      }
    }
    const kids = (next as {children?: SceneNode[]}).children;
    if (kids && kids.length) {
      next = {...next, children: kids.map(walk)} as SceneNode;
    }
    return next;
  };

  return nodes.map(walk);
}
