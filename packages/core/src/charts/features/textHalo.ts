/**
    A halo for text drawn over marks: a stroke in the chart's background
    color, painted under the text's fill, that clears the marks just around
    each glyph.
*/
import type {SceneNode} from "@d3plus/render";

/**
    Copies of `nodes` with every text node (at any depth) haloed in `color`,
    `width` pixels wide (half of it past each glyph's edge).
    @param nodes The scene nodes.
    @param color The halo color, usually the chart's background.
    @param width The halo's stroke width.
*/
export function textHalo(
  nodes: SceneNode[],
  color: string,
  width: number,
): SceneNode[] {
  return nodes.map((node): SceneNode => {
    if (node.type === "group")
      return {...node, children: textHalo(node.children, color, width)};
    if (node.type !== "text") return node;
    return {
      ...node,
      halo: true,
      paint: {
        ...node.paint,
        stroke: color,
        strokeWidth: width,
        strokeOpacity: 1,
      },
    };
  });
}
