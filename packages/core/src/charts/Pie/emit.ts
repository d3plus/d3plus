/**
    `pieEmit` — Path SceneNodes (one per slice) + label TextNodes.
*/

import type {Arc, PieArcDatum} from "d3-shape";
import {colorContrast} from "@d3plus/color";
import {largestRect, path2polygon} from "@d3plus/math";
import type {DataPoint} from "@d3plus/data";
import type {ArcGeometry, SceneNode, TextNode} from "@d3plus/render";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

function resolveAccessor<T>(
  val: unknown,
  d: DataPoint,
  i: number,
): T | undefined {
  if (typeof val === "function") {
    return (val as (d: DataPoint, i: number) => T)(d, i);
  }
  return val as T | undefined;
}

type Slice = PieArcDatum<DataPoint> & {__d3plus__?: true; i?: number};

/** d3.pie()'s default span (Pie/applyLayout.ts never overrides startAngle/endAngle) — the range every slice's own startAngle/endAngle is relative to. */
const FULL_TURN = Math.PI * 2;

/**
    Marks each label as eligible for the drill-down morph (isFlipEligible),
    so it moves along with its wedge instead of just fading in in place —
    distinct from every other text this chart (or any other) emits
    (title/subtitle/legend), which is never stamped this way and so never
    flip-morphs. When a drill-down click armed `flipSource` (the clicked
    parent's confined angular range), also gives each label a real
    `flipFromTransform` start: the label's own position is already somewhere
    within its wedge's angular span (that's how it got placed there) — so
    remapping its OWN angle linearly into the confined range, at its OWN
    radius, lands it proportionally in the same spot within the confined
    wedge, exactly mirroring `flipFromArc`'s remap of the wedge's
    start/endAngle. No need to look up the owning slice's angles separately.
*/
function stampLabelFlip(
  labelNodes: SceneNode[],
  flipSource: {start: number; span: number} | undefined,
): void {
  for (const n of labelNodes) {
    const tn = n as TextNode;
    tn.shapeType = "Label";
    if (!flipSource) continue;
    const tr = tn.transform ?? {};
    const x = tr.x ?? 0, y = tr.y ?? 0;
    const radius = Math.hypot(x, y);
    // d3's angle convention: 0 rad = straight up, increasing clockwise —
    // atan2(x, -y) inverts the x = r·sin(θ), y = -r·cos(θ) used below.
    const angle = Math.atan2(x, -y);
    const normalized = angle < 0 ? angle + FULL_TURN : angle;
    const mapped = flipSource.start + (normalized / FULL_TURN) * flipSource.span;
    tn.flipFromTransform = {x: radius * Math.sin(mapped), y: -radius * Math.cos(mapped)};
  }
}

export const pieEmit: ChartEmit = ({viz, shapeData}) => {
  const slices = (shapeData ?? []) as Slice[];
  if (!slices.length) return [];

  const arcGen = viz.ctx.arcData as Arc<unknown, Slice>;
  const arcMaker = (d: Slice) => arcGen(d) ?? "";
  const resolveInnerRadius = arcGen.innerRadius();
  const resolveOuterRadius = arcGen.outerRadius();
  const sc = (viz.schema.shapeConfig ?? {}) as Record<string, unknown>;

  // A drill-down click armed this draw AND the clicked node was itself a Pie
  // wedge (parentStartAngle/parentEndAngle only ever come from this chart's
  // own click capture, via NodeBase.startAngle/endAngle below) — build each
  // entering wedge's real "confined to the parent's old angular slice, at
  // full final radius" start shape, using the actual arc generator (the
  // render layer has none of its own, so it can't reconstruct this).
  const origin = viz._pendingEnterOrigin as
    | {parentStartAngle?: number; parentEndAngle?: number}
    | undefined;
  const parentStart = origin?.parentStartAngle;
  const parentEnd = origin?.parentEndAngle;
  const flipSource = parentStart !== undefined && parentEnd !== undefined
    ? {start: parentStart, span: parentEnd - parentStart}
    : undefined;

  // A Back click armed this draw — every entering wedge gets a "full circle,
  // at my own real radii" start built here (the render layer has no arc
  // generator to build one itself); collapseTo only ever actually applies it
  // to the one wedge resolveDrillMorph later resolves as the reunion match,
  // so there's no need to know which slice that'll be yet.
  const isReunionDraw = Boolean(viz._pendingExitReunion);

  const value = viz.schema.value as (d: DataPoint, i: number) => number;
  const pathNodes: SceneNode[] = slices.map((d, rank) => {
    const fill = resolveAccessor<string>(sc.fill, d.data as DataPoint, d.i ?? 0);
    const stroke = resolveAccessor<string>(sc.stroke, d.data as DataPoint, d.i ?? 0);
    const strokeWidth = resolveAccessor<number>(sc.strokeWidth, d.data as DataPoint, d.i ?? 0);
    const arc: ArcGeometry = {
      innerRadius: resolveInnerRadius(d, d.i ?? 0),
      outerRadius: resolveOuterRadius(d, d.i ?? 0),
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      padAngle: d.padAngle,
    };
    const flipFromArc: ArcGeometry | undefined = flipSource
      ? {
          ...arc,
          startAngle: flipSource.start + (d.startAngle / FULL_TURN) * flipSource.span,
          endAngle: flipSource.start + (d.endAngle / FULL_TURN) * flipSource.span,
        }
      : undefined;
    const reunionFromArc: ArcGeometry | undefined = isReunionDraw
      ? {...arc, startAngle: 0, endAngle: FULL_TURN}
      : undefined;
    return {
      type: "path",
      key: `pie-${viz._ids(d.data as DataPoint, d.i ?? 0).join("-")}`,
      d: arcMaker(d),
      arc,
      flipFromArc,
      reunionFromArc,
      // Lets the render layer's drill-down morph collapse this wedge to/from
      // an external box (isFlipEligible/collapseTo) — the same mechanism
      // StackedArea's shapeType: "Area" bands use.
      shapeType: "Pie",
      // Explicit identity transform (not the field's usual `undefined`) so
      // the SVG backend's transition tweens the "transform" attribute from
      // collapse()/collapseTo()'s scaled-down start toward this real target
      // string — a `null` target attr removes immediately instead of
      // tweening (d3-transition can't interpolate "toward absent"), which
      // would otherwise skip the whole morph animation.
      transform: {x: 0, y: 0},
      // Carried for the NEXT click's capture (click.shape.ts, chart-agnostic)
      // to read off the clicked node — see `_pendingEnterOrigin.parentStartAngle`.
      startAngle: d.startAngle,
      endAngle: d.endAngle,
      datum: d.data,
      paint: {
        fill: typeof fill === "string" ? fill : undefined,
        stroke,
        strokeWidth,
        // Explicit (not the field's usual `undefined`) for the same reason
        // as `transform` above: a plain, non-morph sibling exit's opacity
        // fade (SvgRenderer's `reconcileExit` fast path,
        // `.attr("opacity", 0)`) tweens FROM whatever's already on the live
        // DOM element — an absent attribute reads back as `null`, and
        // d3-interpolate's string interpolator can't align "null" against
        // "0" (a different count of numeric tokens), so it snaps to the
        // target on the very first tick instead of fading. Stamping this
        // wedge's own steady-state opacity here gives every later exit a
        // real starting value to fade from.
        opacity: 1,
      },
      aria: {
        label: `${rank + 1}. ${viz._drawLabel(d.data as DataPoint, d.i ?? 0)}, ${value(d.data as DataPoint, d.i ?? 0)}.`,
      },
    } as SceneNode;
  });

  const labelNodes = emitLabels({
    data: slices as unknown as DataPoint[],
    label: (_d, i) => viz._drawLabel((slices[i].data as DataPoint), slices[i].i ?? i),
    // The largest inscribed rectangle is in chart-centered path coordinates,
    // so the anchor is the origin and labelBounds carries the absolute box.
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (_d, i) => `pie-label-${i}`,
    labelBounds: (_d, i) => {
      const r = largestRect(path2polygon(arcMaker(slices[i])), {angle: 0});
      if (!r) return false;
      return {
        angle: r.angle,
        width: r.width,
        height: r.height,
        x: r.cx - r.width / 2,
        y: r.cy - r.height / 2,
      };
    },
    labelConfig: {
      fontColor: (d: {data?: Slice}) => {
        const slice = (d.data ?? d) as Slice;
        const fill = resolveAccessor<string>(
          sc.fill,
          slice.data as DataPoint,
          slice.i ?? 0,
        );
        return colorContrast(typeof fill === "string" ? fill : "rgb(255, 255, 255)");
      },
      fontResize: true,
      textAnchor: "middle",
      verticalAlign: "middle",
    },
  });

  stampLabelFlip(labelNodes, flipSource);

  return [...pathNodes, ...labelNodes];
};
