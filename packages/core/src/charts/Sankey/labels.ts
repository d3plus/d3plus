/**
    `sankeyLabels` — node labels drawn beside each node: to the right of it,
    over its outgoing links, except in the last column, where they sit to the
    left, over the incoming links.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {
  drawNodeLabel,
  resolveAccessor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";

type SankeyNode = DataPoint & {
  data?: DataPoint;
  i?: number;
  id: string | number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

/** The gap between a node and its label, in pixels. */
const gap = 5;
/** The default label font size, in pixels. */
const fontSize = 12;

export function sankeyLabels(
  viz: VizInstance,
  nodes: SankeyNode[],
  cfg: Record<string, unknown>,
  width: number,
  height: number,
): SceneNode[] {
  if (!nodes.length || cfg.label === false) return [];

  const columns = Array.from(new Set(nodes.map(d => d.x0))).sort(
    (a, b) => a - b,
  );
  const last = columns.length > 1 ? columns[columns.length - 1] : undefined;
  const rowOf = (d: SankeyNode) => (d.data ?? d) as DataPoint;
  const leftward = new Set(nodes.filter(d => d.x0 === last).map(rowOf));

  // How far each node's label may reach above and below the node's middle:
  // to halfway to its neighbors in the column (or to the chart's edge), so
  // neighboring labels never overlap. A label too tall for this is hidden.
  const reach = new Map<SankeyNode, number>();
  for (const x0 of columns) {
    const column = nodes.filter(d => d.x0 === x0).sort((a, b) => a.y0 - b.y0);
    column.forEach((d, i) => {
      const above = i ? (d.y0 + column[i - 1].y1) / 2 : 0;
      const below =
        i < column.length - 1 ? (d.y1 + column[i + 1].y0) / 2 : height;
      const middle = (d.y0 + d.y1) / 2;
      reach.set(d, Math.min(middle - above, below - middle));
    });
  }

  // The label's box, relative to the node's top-left corner: centered on the
  // node, and spanning the space between it and the next column over.
  const bounds = (d: SankeyNode) => {
    const c = columns.indexOf(d.x0);
    const nodeWidth = d.x1 - d.x0;
    const r = reach.get(d) ?? (d.y1 - d.y0) / 2;
    const y = (d.y1 - d.y0) / 2 - r;
    if (d.x0 === last) {
      const space = d.x0 - (columns[c - 1] + nodeWidth) - gap * 2;
      return {x: -gap - space, y, width: space, height: r * 2};
    }
    const next = c < columns.length - 1 ? columns[c + 1] : width;
    const space = next - d.x1 - gap * 2;
    return {x: nodeWidth + gap, y, width: space, height: r * 2};
  };

  return emitLabels({
    data: nodes,
    datum: d => rowOf(d as SankeyNode),
    label: (d, i) => {
      const node = d as SankeyNode;
      const text = resolveAccessor<unknown>(
        cfg.label,
        rowOf(node),
        node.i ?? i,
      );
      if (text === false) return false;
      return text === undefined ? drawNodeLabel(viz, node, i) : text;
    },
    x: d => (d as SankeyNode).x0,
    y: d => (d as SankeyNode).y0,
    aes: () => ({}),
    rotate: constant(0),
    id: d => `sankey-label-${(d as SankeyNode).id}`,
    labelBounds: d => bounds(d as SankeyNode),
    labelConfig: {
      fontColor: () => backgroundInk(viz),
      fontResize: false,
      fontSize,
      padding: 0,
      textAnchor: (d: {data: DataPoint}) =>
        leftward.has(d.data) ? "end" : "start",
      verticalAlign: "middle",
      ...userLabelConfig(viz, "Rect"),
    },
  });
}
