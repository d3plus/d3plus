/**
    Enter starts for the density charts' marks: each shape grows out of the
    line it is drawn from (a Violin's center line, a Ridgeline's baseline)
    instead of fading in where it lands.
*/
import {flattenPath, type SceneNode, type Transform} from "@d3plus/render";

/** A node's own coordinate for `value`, given in its parent's frame; null under a rotation. */
function local(value: number, axis: "x" | "y", transform?: Transform): number | null {
  if (!transform) return value;
  if (transform.rotate) return null;
  return (value - (transform[axis] ?? 0)) / (transform.scale ?? 1);
}

/** A hit-area twin's key without its `::hit` suffix. */
function baseKey(key: string | number): string {
  return `${key}`.replace(/::hit$/, "");
}

/**
    Sets `enterD` on every path under `nodes` whose key `lines` names: its own
    `d` flattened onto the line where its `axis` coordinate equals that value,
    so it grows outward from that line. Values are in the frame `nodes` are
    drawn in; a path under a rotation keeps the default enter.
    @param nodes The emitted scene nodes.
    @param axis The coordinate each path collapses on.
    @param lines Each path key's line, by key (a `::hit` twin shares its mark's).
*/
export function growFromLine(nodes: SceneNode[], axis: "x" | "y", lines: Map<string, number>): void {
  const visit = (node: SceneNode, line: (value: number) => number | null): void => {
    if (node.type === "group") {
      const inner = (value: number) => {
        const outer = line(value);
        return outer === null ? null : local(outer, axis, node.transform);
      };
      node.children.forEach(child => visit(child, inner));
      return;
    }
    if (node.type !== "path") return;
    const value = lines.get(baseKey(node.key));
    if (value === undefined) return;
    const outer = line(value);
    const at = outer === null ? null : local(outer, axis, node.transform);
    if (at !== null && Number.isFinite(at)) node.enterD = flattenPath(node.d, axis, at);
  };
  nodes.forEach(node => visit(node, value => value));
}

/**
    Sets `enterRect` on every rect under `nodes`: the rect at zero breadth
    along `axis`, on its own center line, so it widens out of that line.
    @param nodes The emitted scene nodes.
    @param axis The rects' breadth axis: `"x"` for width, `"y"` for height.
*/
export function growRectsFromCenter(nodes: SceneNode[], axis: "x" | "y"): void {
  nodes.forEach(node => {
    if (node.type === "group") growRectsFromCenter(node.children, axis);
    else if (node.type === "rect") {
      const {x, y, width, height} = node;
      node.enterRect = axis === "x"
        ? {x: x + width / 2, y, width: 0, height}
        : {x, y: y + height / 2, width, height: 0};
    }
  });
}
