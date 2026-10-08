/**
    `sunburstEmit` — one Path SceneNode per laid-out arc (the focused node as a
    full disc at the center) plus a label TextNode wherever the label fits.
*/

import {arc as d3Arc} from "d3-shape";
import {colorContrast} from "@d3plus/color";
import {fontExists, textWidth} from "@d3plus/dom";
import {fontFamily} from "@d3plus/text";
import {formatAbbreviate} from "@d3plus/format";
import type {DataPoint} from "@d3plus/data";
import type {ArcGeometry, SceneNode} from "@d3plus/render";

import {emitLabels} from "../../shapes/emitLabels.js";
import {
  resolveAccessor,
  shapeConfigFor,
  textureFill,
  userLabelConfig,
} from "../features/emitHelpers.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

import {sunburstPadAngle} from "./geometry.js";
import type {SunburstArc} from "./geometry.js";
import {sunburstLabelBox, sunburstSplit} from "./labelFit.js";
import type {SunburstLabelBox, SunburstLabelMetrics} from "./labelFit.js";
import {
  sunburstShadeActive,
  sunburstShadeAmount,
  sunburstShadeFill,
} from "./shade.js";
import type {SunburstShadeConfig} from "./shade.js";
import type {SunburstNode} from "./partition.js";
import type {SunburstGhost} from "./applyLayout.js";

// The same arc generator the render layer tweens with, so a wedge's `d` and
// its animated frames trace identical geometry.
const arcPath = d3Arc<ArcGeometry>()
  .innerRadius(d => d.innerRadius)
  .outerRadius(d => d.outerRadius)
  .startAngle(d => d.startAngle)
  .endAngle(d => d.endAngle)
  .padAngle(d => d.padAngle ?? 0);

/** The polar geometry of one node, padded per the `padAngle`/`padPixel` config. */
export function sunburstArcGeometry(
  node: SunburstNode,
  padAngle: number,
  padPixel: number,
): ArcGeometry {
  const isDisc = node.depth === 0;
  return {
    innerRadius: node.innerRadius,
    outerRadius: node.outerRadius,
    startAngle: node.startAngle,
    endAngle: node.endAngle,
    padAngle: isDisc ? 0 : sunburstPadAngle(node, padAngle, padPixel),
  };
}

/** The label text for a node: its key at its own `groupBy` level. */
export function sunburstLabel(
  viz: {_drawLabel: (d: DataPoint, i: number, depth?: number) => string},
  node: SunburstNode,
): string {
  return viz._drawLabel(node.datum, node.i ?? 0, node.level);
}

/**
    A label's whole words measured at a 1px font size; `measure` returns the
    widths of the strings it's given at that size.
*/
export function sunburstLabelMetrics(
  text: string,
  measure: (strings: string[]) => number[],
): SunburstLabelMetrics {
  const words = sunburstSplit(text)
    .map(w => w.trim())
    .filter(Boolean);
  if (!words.length) return {words: [], space: 0};
  const [space, ...widths] = measure(["\u00a0", ...words]);
  return {words: widths, space};
}

/** Resolves a label style value that may be a per-datum accessor. */
function labelStyle(value: unknown, d: DataPoint, fallback: unknown): unknown {
  const v =
    typeof value === "function"
      ? (value as (d: DataPoint, i: number) => unknown)(d, 0)
      : value;
  return v ?? fallback;
}

type Fillable = Pick<SunburstNode, "datum" | "i" | "level">;

/** Resolves an arc's fill: the shape config's fill, shaded by ring on the default color path. */
function fillResolver(
  viz: Parameters<ChartEmit>[0]["viz"],
  sc: Record<string, unknown>,
): (node: Fillable) => string | undefined {
  const shade = sunburstShadeActive(viz.schema, {
    color: viz.ctx.sunburstDefaultColor,
    fill: viz.ctx.sunburstDefaultFill,
  });
  const shadeConfig = viz.schema.shadeConfig as Partial<SunburstShadeConfig>;
  return (node: Fillable): string | undefined => {
    const fill = resolveAccessor<unknown>(sc.fill, node.datum, node.i ?? 0);
    if (typeof fill !== "string") return undefined;
    return shade
      ? sunburstShadeFill(fill, sunburstShadeAmount(node.level, shadeConfig))
      : fill;
  };
}

/** Where each node's label fits, measured in the label font; nodes without room are left out. */
function labelBoxes(
  viz: Parameters<ChartEmit>[0]["viz"],
  nodes: SunburstNode[],
  labelConfig: Record<string, unknown>,
  options: {
    fontMin: number;
    fontMax: number;
    padAngle: number;
    padPixel: number;
  },
): Map<SunburstNode, SunburstLabelBox> {
  const {fontMin, fontMax, padAngle, padPixel} = options;
  const boxes = new Map<SunburstNode, SunburstLabelBox>();
  for (const node of nodes) {
    const style = {
      "font-family": fontExists(
        labelStyle(labelConfig.fontFamily, node.datum, fontFamily) as string[],
      ) as string,
      "font-size": 100,
      "font-weight": labelStyle(
        labelConfig.fontWeight,
        node.datum,
        400,
      ) as number,
    };
    const metrics = sunburstLabelMetrics(sunburstLabel(viz, node), strings =>
      (textWidth(strings, style) as number[]).map(w => w / 100),
    );
    const box = sunburstLabelBox(
      sunburstArcGeometry(node, padAngle, padPixel),
      metrics,
      {fontMin, fontMax},
    );
    if (box) boxes.set(node, box);
  }
  return boxes;
}

/**
    Arcs a zoom-in removed stay for this frame, folding to zero width beneath
    the arcs that grow into their place; they carry no datum, so they take no
    part in hover or picking, and drop out on the next draw.
*/
function ghostNodes(
  viz: Parameters<ChartEmit>[0]["viz"],
  fillOf: (node: Fillable) => string | undefined,
): SceneNode[] {
  return ((viz.ctx.sunburstGhosts ?? []) as SunburstGhost[]).map(g => {
    const arc = {...g.arc, padAngle: 0};
    return {
      type: "path",
      key: `sunburst-${g.id}`,
      d: arcPath(arc) ?? "",
      arc,
      paint: {
        fill: fillOf(g),
        opacity: 1,
      },
    } as SceneNode;
  });
}

export const sunburstEmit: ChartEmit = ({viz, shapeData}) => {
  const nodes = (shapeData ?? []) as unknown as SunburstNode[];
  if (!nodes.length) return [];

  const sc = shapeConfigFor(viz, "Path");
  const padAngle = Number(viz.schema.padAngle) || 0;
  const padPixel = Number(viz.schema.padPixel) || 0;
  const sumFn = viz.schema.sum as (d: DataPoint) => number;
  const locale = viz.schema.locale;
  const fillOf = fillResolver(viz, sc);

  const enterArcs = (viz.ctx.sunburstEnterArcs ?? new Map()) as Map<
    string,
    SunburstArc
  >;
  const pathNodes: SceneNode[] = nodes.map(node => {
    const i = node.i ?? 0;
    const arc = sunburstArcGeometry(node, padAngle, padPixel);
    const fill = fillOf(node);
    return {
      type: "path",
      key: `sunburst-${node.id}`,
      d: arcPath(arc) ?? "",
      arc,
      // A zoom-out sweeps a returning arc in from where it folded away.
      enterArc: enterArcs.has(node.id)
        ? {...enterArcs.get(node.id)!, padAngle: 0}
        : undefined,
      datum: node.datum,
      paint: {
        fill: textureFill(sc, node.datum, i, fill),
        stroke: resolveAccessor<string>(sc.stroke, node.datum, i),
        strokeWidth: resolveAccessor<number>(sc.strokeWidth, node.datum, i),
        // Explicit, so an exiting arc fades from a real starting opacity.
        opacity: resolveAccessor<number>(sc.opacity, node.datum, i) ?? 1,
      },
      aria: {
        label: `${viz._drawLabel(node.datum, i, node.level)}, ${sumFn(node.datum)}, ${formatAbbreviate(node.share * 100, locale)}%`,
      },
    } as SceneNode;
  });

  const ghosts = ghostNodes(viz, fillOf);

  const labelConfig = (userLabelConfig(viz, "Path") ?? {}) as Record<
    string,
    unknown
  >;
  const fontMin =
    typeof labelConfig.fontMin === "number" ? labelConfig.fontMin : 8;
  const fontMax =
    typeof labelConfig.fontMax === "number" ? labelConfig.fontMax : 24;
  const boxes = labelBoxes(viz, nodes, labelConfig, {
    fontMin,
    fontMax,
    padAngle,
    padPixel,
  });
  const held = (viz.ctx.sunburstHeldLabels ?? new Set()) as Set<string>;
  const labeled = nodes.filter(n => boxes.has(n) && !held.has(n.id));

  const labelNodes = emitLabels({
    data: labeled as unknown as DataPoint[],
    label: d => sunburstLabel(viz, d as unknown as SunburstNode),
    x: d => boxes.get(d as unknown as SunburstNode)!.x,
    y: d => boxes.get(d as unknown as SunburstNode)!.y,
    rotate: d => boxes.get(d as unknown as SunburstNode)!.rotate,
    aes: () => ({}),
    id: d => `sunburst-${(d as unknown as SunburstNode).id}`,
    datum: d => (d as unknown as SunburstNode).datum,
    labelBounds: d => {
      const {width, height} = boxes.get(d as unknown as SunburstNode)!;
      return {x: -width / 2, y: -height / 2, width, height};
    },
    labelConfig: {
      fontMax,
      fontMin,
      // Words wrap only at spaces; the label box was sized for whole words.
      split: sunburstSplit,
      fontResize: true,
      padding: 0,
      textAnchor: "middle",
      verticalAlign: "middle",
      fontColor: (d: DataPoint) => {
        let row = d;
        while (row && row.__d3plus__ && row.data) row = row.data as DataPoint;
        const node = (
          viz.ctx.sunburstNodes as Map<DataPoint, SunburstNode>
        ).get(row);
        const fill = node ? fillOf(node) : undefined;
        return colorContrast(
          fill ?? "rgb(255, 255, 255)",
          viz.schema.colorDefaults,
        );
      },
      ...labelConfig,
    },
  });

  return [...ghosts, ...pathNodes, ...labelNodes];
};
