/**
    `chordEmit` — ribbon Paths (chords) + arc Paths (groups) + rotated group
    labels, from `chordCtx` stashed on `viz.ctx`. Emits flat SceneNodes directly.

    Ribbons are emitted first so the arcs paint on top of their attach points.
    Ribbon fill is resolved against the *source* node so each flow reads as
    leaving its origin; arc fill is the node's own color.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {paintFromShapeConfig, resolveAccessor, shapeConfigFor} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";
import type {ChordCtx, ChordNode} from "./applyLayout.js";

export const chordEmit: ChartEmit = ({viz}) => {
  const c = viz.ctx.chordCtx as ChordCtx | undefined;
  if (!c) return [];
  const out: SceneNode[] = [];

  const pathCfg = shapeConfigFor(viz, "Path");
  const chordOpacity = (viz.schema.chordOpacity as number) ?? 0.6;

  // Ribbons (chords) first.
  for (let i = 0; i < c.chords.length; i++) {
    const ch = c.chords[i];
    const src = c.nodes[ch.source.index];
    const tgt = c.nodes[ch.target.index];
    if (!src || !tgt) continue;
    const fill = resolveAccessor<unknown>(pathCfg.fill, src.data, src.i);
    const color = typeof fill === "string" ? fill : undefined;
    // An explicit `opacity` is what the enter/exit transition fades: the SVG
    // backend tweens the `opacity` attribute from collapse()'s 0 to this value,
    // and an undefined target clears the attribute at once, so the ribbon
    // would pop in while the arcs fade.
    const opacity = resolveAccessor<number>(pathCfg.opacity, src.data, src.i);
    out.push({
      type: "path",
      shapeType: "Chord",
      key: `chord-ribbon-${src.id}-${tgt.id}`,
      d: c.ribbonFn(ch),
      // A chord accumulates duplicate links into one matrix cell, so bind a
      // synthesized flat link datum (source/target ids + flow) — the tooltip
      // title and hover predicates read `.source.id`/`.target.id`.
      datum: {source: {id: src.id}, target: {id: tgt.id}, value: ch.source.value} as unknown as DataPoint,
      index: i,
      paint: {
        fill: color,
        fillOpacity: chordOpacity,
        stroke: color,
        strokeOpacity: 1,
        opacity: typeof opacity === "number" ? opacity : 1,
      },
      aria: {
        label: `${viz._drawLabel(src.data, src.i)} to ${viz._drawLabel(tgt.data, tgt.i)}, ${ch.source.value}.`,
      },
    } as SceneNode);
  }

  // Arcs (groups).
  for (const node of c.nodes) {
    if (!node.group) continue;
    const paint = paintFromShapeConfig(pathCfg, node.data, node.i);
    out.push({
      type: "path",
      key: `chord-arc-${node.id}`,
      d: c.arcFn(node.group),
      datum: node.data,
      index: node.i,
      paint,
      aria: {
        label: `${viz._drawLabel(node.data, node.i)}, ${node.group.value}.`,
      },
    } as SceneNode);
  }

  // Group labels, positioned + rotated by the layout stage.
  const labelData = c.nodes.filter(nd => nd.group);
  if (labelData.length) {
    const labelNodes = emitLabels({
      data: labelData as unknown as DataPoint[],
      label: d => {
        const nd = d as unknown as ChordNode;
        return viz._drawLabel(nd.data, nd.i);
      },
      x: d => (d as unknown as ChordNode).labelX ?? 0,
      y: d => (d as unknown as ChordNode).labelY ?? 0,
      aes: () => ({}),
      rotate: d => (d as unknown as ChordNode).labelRotate ?? 0,
      id: d => `chord-label-${(d as unknown as ChordNode).id}`,
      labelBounds: d => (d as unknown as ChordNode).labelBounds ?? false,
      labelConfig: {
        fontResize: false,
        padding: 0,
        textAnchor: (d: DataPoint) =>
          ((d.data ?? d) as unknown as ChordNode).labelAnchor ?? "start",
        verticalAlign: "middle",
      },
    });
    out.push(...labelNodes);
  }

  return out;
};
