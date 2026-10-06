import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

/** Scene mark types that carry a datum hover/active/highlight/search apply to. */
export const MARK_TYPES = new Set(["rect", "circle", "line", "area", "path"]);

/**
    Calls `fn` once per painted data mark in `nodes`, with the mark's source
    row and index. The row is unwrapped one level (`datum.data ?? datum`) and
    the index resolved `node.index` → `row.i` → 0, the same way
    `applyInteractionOpacity` evaluates its predicates, so a predicate sees the
    same arguments here as it does when the scene is dimmed. Rows are de-duped
    by reference, so a mark's separate label node doesn't visit it twice.
*/
export function forEachSceneRow(
  nodes: SceneNode[],
  fn: (row: DataPoint, i: number, node: SceneNode) => void,
): void {
  const seen = new Set<unknown>();
  const walk = (node: SceneNode): void => {
    if (MARK_TYPES.has(node.type) && node.datum !== undefined) {
      const raw = node.datum as (DataPoint & {data?: DataPoint}) | undefined;
      const row = (raw && raw.data ? raw.data : raw) as DataPoint;
      if (row !== undefined && !seen.has(row)) {
        seen.add(row);
        const i =
          typeof node.index === "number"
            ? node.index
            : typeof (row as {i?: number}).i === "number"
              ? (row as {i: number}).i
              : 0;
        fn(row, i, node);
      }
    }
    const kids = (node as {children?: SceneNode[]}).children;
    if (kids) kids.forEach(walk);
  };
  nodes.forEach(walk);
}
