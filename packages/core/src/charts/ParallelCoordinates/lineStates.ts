/**
    ParallelCoordinates paint-time line states, applied to the composed scene
    on every paint (so brushing and hover repaint without a new layout):

    - a line outside any brush turns gray, fades (to `inactiveOpacity`, or
      by default to `INACTIVE_SHARE` of its own opacity, so dense and sparse
      data fade alike), and stops taking the pointer;
    - a single hovered line is drawn fully opaque, however faint the lines
      are drawn for dense data.
*/

import {colorGrayscale} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {hasBrushes, rowPasses} from "./brushFilter.js";
import type {BrushSelection} from "./brushFilter.js";
import {HIT_SUFFIX, LINE_KEY} from "./emit.js";

/** The share of its own opacity a line outside the brushes keeps by default. */
export const INACTIVE_SHARE = 0.3;

export interface LineStateOptions {
  brushes?: BrushSelection;
  /** Stroke opacity of the lines outside the brushes (default: `INACTIVE_SHARE` of each line's own). */
  inactiveOpacity?: number;
}

const isLine = (node: SceneNode): boolean =>
  typeof node.key === "string" && node.key.includes(LINE_KEY);
const isHit = (node: SceneNode): boolean =>
  typeof node.key === "string" && node.key.endsWith(HIT_SUFFIX);
const isRaised = (node: SceneNode): boolean =>
  typeof node.z === "number" && node.z > 0;

function mapLines(
  node: SceneNode,
  fn: (line: SceneNode) => SceneNode,
): SceneNode {
  if (isLine(node)) return fn(node);
  const kids = (node as {children?: SceneNode[]}).children;
  if (!kids || !kids.length) return node;
  return {...node, children: kids.map(k => mapLines(k, fn))} as SceneNode;
}

function countRaised(node: SceneNode): number {
  if (isLine(node)) return !isHit(node) && isRaised(node) ? 1 : 0;
  const kids = (node as {children?: SceneNode[]}).children;
  return kids ? kids.reduce((n, k) => n + countRaised(k), 0) : 0;
}

/** Applies the brush and hover line states to a scene tree (see the module comment). */
export function applyLineStates(
  root: SceneNode,
  opts: LineStateOptions,
): SceneNode {
  const brushed = hasBrushes(opts.brushes);
  const single = countRaised(root) === 1;
  if (!brushed && !single) return root;
  return mapLines(root, node => {
    const paint = {...(node.paint ?? {})};
    if (brushed && !rowPasses(node.datum as DataPoint, opts.brushes)) {
      if (!isHit(node)) {
        const own =
          typeof paint.strokeOpacity === "number" ? paint.strokeOpacity : 1;
        paint.strokeOpacity = opts.inactiveOpacity ?? own * INACTIVE_SHARE;
        if (typeof paint.stroke === "string")
          paint.stroke = colorGrayscale(paint.stroke);
      }
      const next = {...node, paint, interactive: false} as SceneNode;
      delete next.z;
      return next;
    }
    if (single && isRaised(node) && !isHit(node)) {
      paint.strokeOpacity = 1;
      return {...node, paint} as SceneNode;
    }
    return node;
  });
}
