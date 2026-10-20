import type {SceneNode, ShapeOwner} from "@d3plus/render";

/** A composite's datum and index for one of its records. */
export type Owned = Omit<ShapeOwner, "shapeType">;

/**
    The composite record that drew `datum`: the first object along its
    `.data` chain that `records` names. Inner shapes wrap what a composite hands
    them (a Line merges its points, an endpoint wraps its whisker), so the walk
    climbs those wrappers back to the composite's own record.
*/
function ownerOf(datum: unknown, records: Map<object, Owned>): Owned | undefined {
  const seen = new Set<object>();
  for (let d = datum; d && typeof d === "object" && !seen.has(d); d = (d as {data?: unknown}).data) {
    const owned = records.get(d);
    if (owned) return owned;
    seen.add(d);
  }
  return undefined;
}

/**
    Appends the composite `shapeType` to the `owners` of each node it drew
    (descending into groups), returning new nodes. `records` maps every record
    the composite handed its inner shapes to the composite datum and index that
    record belongs to.
*/
export function stampOwners(
  nodes: SceneNode[],
  shapeType: string,
  records: Map<object, Owned>,
): SceneNode[] {
  const stamp = (node: SceneNode): SceneNode => {
    const out = {...node} as SceneNode;
    const owned = ownerOf(node.datum, records);
    if (owned) out.owners = [...(node.owners ?? []), {shapeType, ...owned}];
    if (node.type === "group") (out as {children: SceneNode[]}).children = node.children.map(stamp);
    return out;
  };
  return nodes.map(stamp);
}
