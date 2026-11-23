/**
    A chart mark's label is a text node of its own, whose datum wraps the
    mark's (a shape label's record is `{__d3plus__, data: <the mark's datum>}`).
    The pointer bridge reads a pick on a label as a pick on the mark it labels,
    so hover, tooltips, and handlers get the mark's `(d, i, x)` either way.

    @module
*/

import type {PickResult, Scene, SceneNode} from "@d3plus/render";

import {MARK_TYPES} from "./sceneRows.js";

/** The root group that holds a chart's marks and their labels. */
const CHART_CELLS = "viz-chart-cells";

/** How many `.data` levels a label's datum is followed down to its mark's. */
const MAX_DEPTH = 4;

/** Whether a node is a mark a label can belong to. */
function isMark(node: SceneNode): boolean {
  return (
    MARK_TYPES.has(node.type) &&
    node.datum !== undefined &&
    node.interactive !== false &&
    !String(node.key).endsWith("::hit") &&
    (node as {interactionGroup?: string}).interactionGroup === undefined
  );
}

/** The label owners of one chart-cells group, by label key. */
function ownerIndex(cells: SceneNode): Map<string, SceneNode> {
  const byDatum = new Map<unknown, SceneNode>();
  const byRow = new Map<unknown, SceneNode>();
  const labels: SceneNode[] = [];
  const walk = (node: SceneNode): void => {
    if (node.type === "text") {
      if (node.datum !== undefined && node.datum !== null) labels.push(node);
    } else if (isMark(node)) {
      const datum = node.datum as {data?: unknown};
      if (!byDatum.has(datum)) byDatum.set(datum, node);
      if (datum && datum.data && !byRow.has(datum.data))
        byRow.set(datum.data, node);
      // A line's label names one of its points (its first or last).
      for (const p of node.interactionPoints ?? [])
        if (!byDatum.has(p.datum)) byDatum.set(p.datum, node);
    }
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(walk);
  };
  walk(cells);
  const owners = new Map<string, SceneNode>();
  for (const label of labels) {
    const owner = ownerOf(label.datum, byDatum, byRow);
    if (owner) owners.set(String(label.key), owner);
  }
  return owners;
}

/**
    The mark whose datum a label's datum is, or wraps: each `.data` level
    down from the label's datum is matched against the marks' datums, then
    against the rows those datums wrap.
*/
function ownerOf(
  datum: unknown,
  byDatum: Map<unknown, SceneNode>,
  byRow: Map<unknown, SceneNode>,
): SceneNode | undefined {
  let v = datum as {data?: unknown} | null | undefined;
  for (
    let depth = 0;
    depth < MAX_DEPTH && v && typeof v === "object";
    depth++
  ) {
    const owner = byDatum.get(v) ?? byRow.get(v);
    if (owner) return owner;
    v = v.data as typeof v;
  }
  return undefined;
}

/**
    The mark a chart label belongs to: the first mark in `cells` (a chart's
    `viz-chart-cells` group) whose datum the label's datum is or wraps.
    Undefined when `label` is not a text node in `cells` or labels no mark.
*/
export function labelOwner(
  cells: SceneNode,
  label: SceneNode,
): SceneNode | undefined {
  if (label.type !== "text") return undefined;
  return ownerIndex(cells).get(String(label.key));
}

/** Each painted scene's label owners, by label key, built on first lookup. */
const cache = new WeakMap<Scene, Map<string, SceneNode>>();

/**
    The pick a pointer event over `pick` acts on: the mark a picked chart
    label belongs to, else `pick` itself. Labels outside the chart's marks
    (axes, legend, titles) are kept as picked.
    @param scene The painted scene `pick` was read from.
*/
export function labelOwnerPick(
  scene: Scene | undefined,
  pick: PickResult | null,
): PickResult | null {
  if (!scene || !pick || !pick.node || pick.node.type !== "text") return pick;
  if (pick.node.datum === undefined || pick.node.datum === null) return pick;
  let owners = cache.get(scene);
  if (!owners) {
    const cells = scene.root.children.find(n => n.key === CHART_CELLS);
    owners = cells ? ownerIndex(cells) : new Map<string, SceneNode>();
    cache.set(scene, owners);
  }
  const owner = owners.get(String(pick.node.key));
  return owner ? {node: owner, datum: owner.datum, index: owner.index} : pick;
}
