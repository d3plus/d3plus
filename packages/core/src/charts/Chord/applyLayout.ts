/**
    `applyChordLayout` — Chord's chart-specific layout stage. Resolves nodes +
    links into a square flow matrix, runs the d3-chord layout (directed by
    default), builds the arc (group) + ribbon (chord) path generators, computes
    per-node label geometry, and stashes `chordCtx` + `nodeLookup` + `adjacency`
    on `viz.ctx`.

    Geometry is generated at the origin (0,0), like Pie/Donut — the chart is
    centered by `chordDef.chartTransform`.
*/

import {descending} from "d3-array";
import {chord, chordDirected, ribbon, ribbonArrow} from "d3-chord";
import type {Chord, ChordGroup, ChordSubgroup, Chords} from "d3-chord";
import {arc} from "d3-shape";

import type {DataPoint} from "@d3plus/data";

import {chartBounds} from "../features/chartGeometry.js";
import type {TransformStage} from "../pipeline/stages.js";

/** A single laid-out Chord node (group), accreted across the layout passes. */
export interface ChordNode {
  __d3plus__: true;
  data: DataPoint;
  node: DataPoint;
  i: number;
  id: string | number;
  shape: string;
  /** The d3-chord group for this node, set once the layout runs. */
  group?: ChordGroup;
  /** Label anchor point (on the outer radius, centered coords). */
  labelX?: number;
  labelY?: number;
  labelRotate?: number;
  labelAnchor?: "start" | "end";
  labelBounds?: {x: number; y: number; width: number; height: number};
}

/** Everything `chordEmit` needs, stashed on `viz.ctx.chordCtx`. */
export interface ChordCtx {
  nodes: ChordNode[];
  chords: Chords;
  arcFn: (d: ChordGroup) => string;
  ribbonFn: (d: Chord) => string;
}

/** A raw link record keyed by the configured source/target/value fields. */
type RawLink = Record<string, unknown>;

/**
    Compute each node's label geometry — a tangential label just outside the
    outer arc, rotated to read radially, flipped upright on the left half
    (mirrors Rings' label placement). Mutates each node in place.
*/
function applyChordLabelGeometry(
  nodes: ChordNode[],
  outer: number,
  labelWidth: number,
): void {
  const lineHeight = 15;
  const pad = 4;
  nodes.forEach(node => {
    const g = node.group;
    if (!g) return;
    const mid = (g.startAngle + g.endAngle) / 2;
    const a = mid - Math.PI / 2;
    node.labelX = Math.cos(a) * outer;
    node.labelY = Math.sin(a) * outer;
    let deg = (mid * 180) / Math.PI - 90;
    if (mid > Math.PI) {
      // Left half: flip the text upright and extend it inward (−x) in the box's
      // local frame so it still reads outward from the arc.
      deg += 180;
      node.labelBounds = {x: -(labelWidth + pad), y: -lineHeight / 2, width: labelWidth, height: lineHeight};
      node.labelAnchor = "end";
    } else {
      node.labelBounds = {x: pad, y: -lineHeight / 2, width: labelWidth, height: lineHeight};
      node.labelAnchor = "start";
    }
    node.labelRotate = deg;
  });
}

export const applyChordLayout: TransformStage = ({viz}) => {
  const v = viz;
  const {width, height} = chartBounds(v);

  const hasNodes = Array.isArray(v.schema.nodes) && v.schema.nodes.length > 0;
  const hasLinks = Array.isArray(v.schema.links) && v.schema.links.length > 0;
  if (!hasNodes && !hasLinks) {
    v.ctx.nodeLookup = {};
    v.ctx.adjacency = {};
    return {viz};
  }

  // Resolve the node set — explicit, or inferred (ordered-distinct) from the
  // link endpoints, mirroring Sankey.
  let rawNodes: DataPoint[];
  if (hasNodes) {
    rawNodes = v.schema.nodes as DataPoint[];
  } else {
    const seen = new Set<unknown>();
    const ids: unknown[] = [];
    for (const link of v.schema.links as RawLink[]) {
      const src = link[v.schema.linksSource as string];
      if (!seen.has(src)) {
        seen.add(src);
        ids.push(src);
      }
      const tgt = link[v.schema.linksTarget as string];
      if (!seen.has(tgt)) {
        seen.add(tgt);
        ids.push(tgt);
      }
    }
    rawNodes = ids.map(id => ({id}) as DataPoint);
  }

  const nodes: ChordNode[] = rawNodes.map((n, i) => ({
    __d3plus__: true,
    data: n,
    node: n,
    i,
    id: v.schema.nodeId(n, i) as string | number,
    shape: "Path",
  }));

  const nodeLookup: Record<string, number> = {};
  nodes.forEach((d, i) => {
    nodeLookup[String(d.id)] = i;
  });
  v.ctx.nodeLookup = nodeLookup;

  // Build the n×n flow matrix. Fresh inner arrays (not `Array(n).fill(shared)`).
  const n = nodes.length;
  const matrix: number[][] = Array.from({length: n}, () => new Array(n).fill(0));
  const adjacency: Record<string, (string | number)[]> = {};
  const addAdj = (a: string | number, b: string | number) => {
    (adjacency[String(a)] ??= []).push(b);
  };

  (v.schema.links as RawLink[]).forEach((link, i) => {
    const si = nodeLookup[String(link[v.schema.linksSource as string])];
    const ti = nodeLookup[String(link[v.schema.linksTarget as string])];
    // A link may name an endpoint that isn't in the node set — drop it rather
    // than write `matrix[undefined]` (mirrors Rings dropping unplaceable links).
    if (si == null || ti == null) return;
    matrix[si][ti] += (v.schema.value(link, i) as number) || 0;
    addAdj(nodes[si].id, nodes[ti].id);
    addAdj(nodes[ti].id, nodes[si].id);
  });
  v.ctx.adjacency = adjacency;

  // Polar geometry, reserving an outer band for labels.
  const radius = Math.min(width, height) / 2;
  const labelWidth = Math.min(radius * 0.28, 90);
  const outer = Math.max(0, radius - labelWidth);
  const arcThickness = Math.min(v.schema.arcThickness as number, outer);
  const inner = Math.max(0, outer - arcThickness);
  const padAngle =
    v.schema.padAngle != null
      ? (v.schema.padAngle as number)
      : (v.schema.padPixel as number) / (outer || 1);

  // `chord()`'s own group-sizing sums only outgoing matrix entries (row `i`);
  // `chordDirected()` sums both row and column. So with `.directed(false)`, a
  // node with links only ever pointing INTO it — never OUT of it — gets a
  // zero-width arc even though it has real incoming flow. Give every node at
  // least one outgoing link to avoid this (d3-chord's convention, not ours).
  const layout = (v.schema.directed ? chordDirected() : chord())
    .padAngle(padAngle)
    .sortSubgroups(descending);
  const chords = layout(matrix);
  // Attach each group to its node by index — `sortGroups` can reorder groups.
  chords.groups.forEach(g => {
    const node = nodes[g.index];
    if (node) node.group = g;
  });

  const arcGen = arc<ChordGroup>().innerRadius(inner).outerRadius(outer);
  const arcFn = (d: ChordGroup): string => arcGen(d) ?? "";

  // Any truthy `arrows` value (except "source", which ribbonArrow can't express)
  // puts an arrowhead on the target end of every ribbon. The d3 ribbon
  // generators return the path string when no canvas context is set; their type
  // union includes `void`, so coerce.
  const arrows = v.schema.arrows;
  const useArrows =
    typeof arrows === "function" ? true : !!arrows && arrows !== "source";
  const arrowSize =
    typeof v.schema.arrowSize === "number" ? (v.schema.arrowSize as number) : undefined;
  let ribbonFn: (d: Chord) => string;
  if (useArrows) {
    const gen = ribbonArrow<Chord, ChordSubgroup>()
      .radius(inner)
      .headRadius(arrowSize ?? Math.max(10, arcThickness * 0.75));
    ribbonFn = (d: Chord): string => (gen(d) as unknown as string) ?? "";
  } else {
    const gen = ribbon<Chord, ChordSubgroup>().radius(inner);
    ribbonFn = (d: Chord): string => (gen(d) as unknown as string) ?? "";
  }

  applyChordLabelGeometry(nodes, outer, labelWidth);

  v.ctx.chordCtx = {nodes, chords, arcFn, ribbonFn} satisfies ChordCtx;
  v.ctx.chordWidth = width;
  v.ctx.chordHeight = height;

  return {shapeData: nodes as unknown as DataPoint[]};
};
