/**
    `funnelEmit` — Funnel's scene: the necks between stages and their
    background images (behind), one path per stage painted from
    `shapeConfig` and its background image, then each stage's label.
*/

import type {DataPoint} from "@d3plus/data";
import type {SceneNode} from "@d3plus/render";

import type {ChartEmit} from "../definition/ChartDefinition.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import {
  paintFromShapeConfig,
  resolveAccessor,
  shapeConfigFor,
  textureFill,
} from "../features/emitHelpers.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {FunnelShared, FunnelStage} from "./applyLayout.js";
import {funnelLabelNodes} from "./labelNodes.js";
import {slicePath} from "./funnelGeometry.js";

/**
    The shape config a neck paints from: the stage's own (`sc`), with
    `connectorConfig` over it. So a neck inherits its stage's `texture` and
    `backgroundImage`, and `connectorConfig.texture` /
    `connectorConfig.backgroundImage` (or `false`) override them.
*/
export function neckConfig(
  viz: VizInstance,
  sc: Record<string, unknown> = {},
): Record<string, unknown> {
  const cfg = (viz.schema.connectorConfig ?? {}) as Record<string, unknown>;
  return {...sc, ...cfg};
}

/**
    The paint a neck takes from `connectorConfig` over its stage's shape
    config (`sc`), its fill defaulting to the stage's fill (textured when a
    texture applies).
*/
export function neckPaint(
  viz: VizInstance,
  stage: FunnelStage,
  stageFill: string | undefined,
  sc: Record<string, unknown> = {},
): {fill?: string; opacity?: number; stroke?: string; strokeWidth?: number} {
  const cfg = (viz.schema.connectorConfig ?? {}) as Record<string, unknown>;
  const d = stage.data,
    i = stage.i;
  const fill = resolveAccessor<string>(cfg.fill, d, i) ?? stageFill;
  return {
    fill: textureFill(neckConfig(viz, sc), d, i, fill),
    opacity: resolveAccessor<number>(cfg.opacity, d, i),
    stroke: resolveAccessor<string>(cfg.stroke, d, i),
    strokeWidth: resolveAccessor<number>(cfg.strokeWidth, d, i),
  };
}

/** A stage's accessible description: its rank, name, and value. */
export function stageAria(viz: VizInstance, stage: FunnelStage): string {
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const value = Number.isFinite(stage.value)
    ? `, ${valueFormat(stage.value, stage.data)}`
    : "";
  return `${stage.i + 1}. ${viz._drawLabel(stage.data, stage.i)}${value}.`;
}

export const funnelEmit: ChartEmit = ({viz, shapeData}) => {
  const stages = (shapeData ?? []) as unknown as FunnelStage[];
  const shared = viz.ctx.funnel as FunnelShared | undefined;
  if (!stages.length || !shared) return [];
  const sc = shapeConfigFor(viz, "Path");
  const keyOf = (s: FunnelStage): string =>
    `funnel-${viz._ids(s.data, s.i).join("-")}`;

  const stageNodes: SceneNode[] = [];
  const neckNodes: SceneNode[] = [];
  const neckStages: FunnelStage[] = [];
  for (const s of stages) {
    const paint = paintFromShapeConfig(sc, s.data, s.i);
    stageNodes.push({
      type: "path",
      key: keyOf(s),
      d: slicePath(s.points, shared.center, shared.orient),
      datum: s.data,
      index: s.i,
      shapeType: "Path",
      paint,
      aria: {label: stageAria(viz, s)},
    } as SceneNode);
    const neck = slicePath(s.neck, shared.center, shared.orient);
    if (viz.schema.connector !== false && neck) {
      const fill = resolveAccessor<unknown>(sc.fill, s.data, s.i);
      neckNodes.push({
        type: "path",
        key: `${keyOf(s)}-neck`,
        d: neck,
        datum: s.data,
        index: s.i,
        interactive: false,
        aria: {hidden: true},
        paint: neckPaint(
          viz,
          s,
          typeof fill === "string" ? fill : undefined,
          sc,
        ),
      } as SceneNode);
      neckStages.push(s);
    }
  }

  const neckImages = backgroundImageNodes(neckConfig(viz, sc), neckNodes, k => [
    neckStages[k].data,
    neckStages[k].i,
  ]);
  const imageNodes = backgroundImageNodes(sc, stageNodes, k => [
    stages[k].data,
    stages[k].i,
  ]);
  const userShape = (viz.schema.shapeConfig ?? {}) as {label?: unknown};
  const labelNodes =
    userShape.label === false ? [] : funnelLabelNodes(viz, stages, shared);
  return [
    ...neckNodes,
    ...neckImages,
    ...stageNodes,
    ...imageNodes,
    ...labelNodes,
  ];
};
