/**
    `alluvialEmit` — a filled ribbon per band, a rect per node with its label
    beside it (Sankey's node labels), and the column titles.
*/

import type {DataPoint} from "@d3plus/data";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";

import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {VizInstance} from "../viz/vizTypes.js";
import {sankeyLabels} from "../Sankey/labels.js";

import type {AlluvialCtx} from "./applyLayout.js";
import {alluvialRibbon} from "./layout.js";
import {alluvialMeta} from "./meta.js";
import {alluvialTitleNodes} from "./titles.js";

/** A value as the chart prints it. */
export function formatAlluvialValue(viz: VizInstance, value: number): string {
  return formatAbbreviate(value, viz.schema.locale as string);
}

/** A node's label: its category, unless `shapeConfig.Rect.label` says otherwise. */
function nodeLabel(cfg: Record<string, unknown>) {
  return (d: DataPoint, i: number): unknown => {
    const custom = resolveAccessor<unknown>(cfg.label, d, i);
    if (custom !== undefined) return custom;
    const meta = alluvialMeta(d);
    return meta?.kind === "node" ? meta.node.label : undefined;
  };
}

export const alluvialEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.alluvial as AlluvialCtx | undefined;
  if (!c) return [];
  const v = viz as VizInstance;
  const out: SceneNode[] = [];

  const pathCfg = shapeConfigFor(v, "Path");
  const fillOpacity = Number(v.schema.bandOpacity ?? 0.5);
  c.bands.forEach(({band, datum, text}, i) => {
    const paint = paintFromShapeConfig(pathCfg, datum, i);
    out.push({
      type: "path",
      shapeType: "Path",
      key: `alluvial-band-${band.id}`,
      d: alluvialRibbon(band),
      datum,
      index: i,
      paint: {...paint, fillOpacity, opacity: paint.opacity ?? 1},
      aria: {label: `${text}, ${formatAlluvialValue(v, band.value)}.`},
    } as SceneNode);
  });

  const rectCfg = shapeConfigFor(v, "Rect");
  for (const d of c.nodes) {
    const title = c.dims[d.node.column]?.title;
    const name = title ? `${title}: ${d.node.label}` : d.node.label;
    out.push({
      type: "rect",
      shapeType: "Rect",
      key: `alluvial-node-${d.id}`,
      x: d.x0,
      y: d.y0,
      width: d.x1 - d.x0,
      height: d.y1 - d.y0,
      datum: d.data,
      index: d.i,
      paint: paintFromShapeConfig(rectCfg, d.data, d.i),
      aria: {label: `${name}, ${formatAlluvialValue(v, d.node.value)}.`},
    } as SceneNode);
  }
  out.push(
    ...sankeyLabels(
      v,
      c.nodes as unknown as Parameters<typeof sankeyLabels>[1],
      {...rectCfg, label: nodeLabel(rectCfg)},
      c.width,
      c.height,
    ),
  );

  out.push(
    ...alluvialTitleNodes(
      c.titles,
      c.titleStyle,
      v.schema.locale as string | undefined,
    ),
  );
  return out;
};
