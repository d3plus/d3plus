/**
    Paints each shape's labels together with the shape, so a shape drawn
    later covers the labels drawn inside the shapes beneath it, as it covers
    the shapes themselves; labels drawn outside their shapes stay over every
    shape. Every chart's emit runs through it (`runChartDraw`,
    `collectComputed`, and the Plot shape emitters).

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {Bounds} from "@d3plus/math";
import type {SceneNode} from "@d3plus/render";

import {markBoxes} from "./sceneBounds.js";

/** Suffix of a label hitbox's key (see `textBoxHitbox`). */
const HIT = "::hit";

/** The data rows a label's datum stands for, nearest first (`d`, `d.data`, …). */
function datumChain(datum: unknown): DataPoint[] {
  const out: DataPoint[] = [];
  let cur = datum as DataPoint | undefined;
  while (cur && typeof cur === "object" && !out.includes(cur)) {
    out.push(cur);
    cur = cur.data as DataPoint | undefined;
  }
  return out;
}

/**
    Whether `label` is a text node naming `mark`: its datum is the mark's, or
    wraps it.
    @param label A scene node.
    @param mark The mark it may name.
*/
export function namesMark(label: SceneNode, mark: SceneNode): boolean {
  return (
    label.type === "text" &&
    !!mark.datum &&
    datumChain(label.datum).includes(mark.datum as DataPoint)
  );
}

/** z that floats a hovered, active or highlighted node above its (z-less, i.e. 0) siblings. */
export const RAISE_Z = 1e6;

/** z that keeps a label drawn outside its shape over every shape, raised ones too. */
export const OUTSIDE_LABEL_Z = RAISE_Z + 1;

/** Slack (px) for a label's glyphs sitting on its shape's edge. */
const EDGE = 1;

/** The box around a list of boxes, or null for none. */
function union(boxes: Bounds[]): Bounds | null {
  if (!boxes.length) return null;
  const x0 = Math.min(...boxes.map(b => b.x)),
    y0 = Math.min(...boxes.map(b => b.y)),
    x1 = Math.max(...boxes.map(b => b.x + b.width)),
    y1 = Math.max(...boxes.map(b => b.y + b.height));
  return {x: x0, y: y0, width: x1 - x0, height: y1 - y0};
}

/** Whether every line of a label lies in `box`. */
function drawnInside(label: SceneNode, box: Bounds | null): boolean {
  if (!box) return true;
  return markBoxes([label], undefined, undefined, true).every(
    b =>
      b.x >= box.x - EDGE &&
      b.y >= box.y - EDGE &&
      b.x + b.width <= box.x + box.width + EDGE &&
      b.y + b.height <= box.y + box.height + EDGE,
  );
}

/**
    Moves each label drawn inside its shape (a text node, with the hitbox
    keyed to it) to just after the last shape node that carries its datum
    (or a row its datum wraps), taking that node's `z`, so the backends'
    stable `z` sort keeps the two together and a shape drawn later covers
    it. A label drawn outside its shape's bounds stays in place, over every
    shape (`OUTSIDE_LABEL_Z`), even a raised one. Shapes keep their order; a
    label with no shape in `nodes` stays in place, and when the shapes are
    layered by `z`, it goes over the top one.
    @param nodes One group's shapes and labels.
*/
export function labelsWithShapes(nodes: SceneNode[]): SceneNode[] {
  const texts = new Map<string, SceneNode>();
  for (const n of nodes) if (n.type === "text") texts.set(String(n.key), n);
  if (!texts.size) return nodes;
  const labelKey = (n: SceneNode): string | null => {
    if (n.type === "text") return String(n.key);
    const key = String(n.key);
    if (!key.endsWith(HIT)) return null;
    const base = key.slice(0, -HIT.length);
    return texts.has(base) ? base : null;
  };

  const shapeAt = new Map<DataPoint, number>();
  const parts = new Map<DataPoint, SceneNode[]>();
  let top = -Infinity;
  nodes.forEach((n, i) => {
    if (labelKey(n) !== null) return;
    if (typeof n.z === "number") top = Math.max(top, n.z);
    if (!n.datum) return;
    const datum = n.datum as DataPoint;
    shapeAt.set(datum, i);
    if (String(n.key).endsWith(HIT)) return;
    const list = parts.get(datum);
    if (list) list.push(n);
    else parts.set(datum, [n]);
  });
  const ownerOf = (n: SceneNode): number | undefined => {
    for (const d of datumChain(n.datum)) {
      const at = shapeAt.get(d);
      if (at !== undefined) return at;
    }
    return undefined;
  };

  const after = new Map<number, SceneNode[]>();
  const owners = new Map<string, number | undefined>();
  const outside = new Set<string>();
  const moved = new Set<SceneNode>();
  for (const n of nodes) {
    const key = labelKey(n);
    if (key === null) continue;
    if (!owners.has(key)) {
      const text = texts.get(key)!;
      const owner = ownerOf(text);
      owners.set(key, owner);
      const datum = owner === undefined ? undefined : nodes[owner].datum;
      const shape = datum && parts.get(datum as DataPoint);
      if (
        shape &&
        !drawnInside(text, union(markBoxes(shape, undefined, undefined, true)))
      )
        outside.add(key);
    }
    const owner = owners.get(key);
    if (owner === undefined || outside.has(key)) continue;
    const z = nodes[owner].z;
    const node = (z === undefined ? n : {...n, z}) as SceneNode;
    const list = after.get(owner);
    if (list) list.push(node);
    else after.set(owner, [node]);
    moved.add(n);
  }

  const out: SceneNode[] = [];
  nodes.forEach((n, i) => {
    if (moved.has(n)) return;
    const key = labelKey(n);
    if (key !== null && outside.has(key))
      out.push({...n, z: OUTSIDE_LABEL_Z} as SceneNode);
    // An unpaired label goes over every shape when they are layered by `z`.
    else if (key !== null && top !== -Infinity)
      out.push({...n, z: top + 1} as SceneNode);
    else out.push(n);
    const labels = after.get(i);
    if (labels) out.push(...labels);
  });
  return out;
}
