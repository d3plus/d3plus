/**
    Paints each shape's labels together with the shape, so a shape drawn
    later covers the labels of the shapes beneath it, as it covers the
    shapes themselves. Used where a chart's marks can overlap (Plot points,
    Network nodes, Pack circles, Geomap points).

    @module
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

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

/**
    Moves each label (a text node, with the hitbox keyed to it) to just after
    the last shape node that carries its datum (or a row its datum wraps),
    taking that node's `z`, so the backends' stable `z` sort keeps the two
    together. Shapes keep their order; a label with no shape in `nodes`
    stays in place, and when the shapes are layered by `z`, it goes over the
    top one.
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
  let top = -Infinity;
  nodes.forEach((n, i) => {
    if (typeof n.z === "number") top = Math.max(top, n.z);
    if (labelKey(n) === null && n.datum) shapeAt.set(n.datum as DataPoint, i);
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
  const moved = new Set<SceneNode>();
  for (const n of nodes) {
    const key = labelKey(n);
    if (key === null) continue;
    if (!owners.has(key)) owners.set(key, ownerOf(texts.get(key)!));
    const owner = owners.get(key);
    if (owner === undefined) continue;
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
    // An unpaired label goes over every shape when they are layered by `z`.
    if (labelKey(n) !== null && top !== -Infinity)
      out.push({...n, z: top + 1} as SceneNode);
    else out.push(n);
    const labels = after.get(i);
    if (labels) out.push(...labels);
  });
  return out;
}
