/**
    `pieEmit` — Path SceneNodes (one per slice) + label TextNodes.
*/

import type {Arc} from "d3-shape";
import type {DataPoint} from "@d3plus/data";
import {FULL_TURN} from "@d3plus/render";
import type {ArcGeometry, SceneNode, TextNode} from "@d3plus/render";

import {
  textureFill,
  shapeConfigFor,
  resolveAccessor,
} from "../features/emitHelpers.js";
import {backgroundImageNodes} from "../features/backgroundImageEmit.js";
import type {ChartEmit} from "../definition/ChartDefinition.js";

import {sweepFraction} from "./arcFit.js";
import type {PieSweep} from "./arcFit.js";
import {pieOutsideLabels} from "./outsideNodes.js";
import {pieLabelPlan, pieSharePct} from "./pieLabels.js";
import type {PieSlice} from "./pieLabels.js";

const isDefaultSweep = (s: PieSweep) => s.start === 0 && s.end === FULL_TURN;

type Slice = PieSlice;

/** Shared, per-draw context `buildPathNode` needs for every slice — bundled to keep its own parameter list short. */
interface PathNodeCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- VizContext.viz is deliberately `any` (see ChartEmit's definition); threaded through unchanged.
  viz: any;
  arcMaker: (d: Slice) => string;
  resolveInnerRadius: (d: Slice, i: number) => number;
  resolveOuterRadius: (d: Slice, i: number) => number;
  sc: Record<string, unknown>;
  value: (d: DataPoint, i: number) => number;
  sharePct: (d: Slice) => string;
  /** The clicked parent's confined angular range (a forward drill click), if this draw is one. */
  flipSource: {start: number; span: number} | undefined;
  /** Whether a Back click armed this draw (see `pieEmit`'s own comment on `isReunionDraw`). */
  isReunionDraw: boolean;
  /** The angular range the slices fill. */
  sweep: PieSweep;
}

/**
    Builds one wedge's Path SceneNode — pulled out of `pieEmit` to keep that
    function under the file's max-lines-per-function limit. See `pieEmit`'s
    own comments for what `flipFromArc`/`reunionFromArc` are and why.
*/
function buildPathNode(d: Slice, rank: number, ctx: PathNodeCtx): SceneNode {
  const {
    viz,
    arcMaker,
    resolveInnerRadius,
    resolveOuterRadius,
    sc,
    value,
    sharePct,
    flipSource,
    isReunionDraw,
    sweep,
  } = ctx;
  const fill = resolveAccessor<string>(sc.fill, d.data as DataPoint, d.i ?? 0);
  const stroke = resolveAccessor<string>(
    sc.stroke,
    d.data as DataPoint,
    d.i ?? 0,
  );
  const strokeWidth = resolveAccessor<number>(
    sc.strokeWidth,
    d.data as DataPoint,
    d.i ?? 0,
  );
  const arc: ArcGeometry = {
    innerRadius: resolveInnerRadius(d, d.i ?? 0),
    outerRadius: resolveOuterRadius(d, d.i ?? 0),
    startAngle: d.startAngle,
    endAngle: d.endAngle,
    padAngle: d.padAngle,
  };
  const span = sweep.end - sweep.start || FULL_TURN;
  const confine = (a: number, src: {start: number; span: number}) =>
    src.start + ((a - sweep.start) / span) * src.span;
  const flipFromArc: ArcGeometry | undefined = flipSource
    ? {
        ...arc,
        startAngle: confine(d.startAngle, flipSource),
        endAngle: confine(d.endAngle, flipSource),
      }
    : undefined;
  const reunionFromArc: ArcGeometry | undefined = isReunionDraw
    ? {...arc, startAngle: sweep.start, endAngle: sweep.end}
    : undefined;
  return {
    type: "path",
    key: `pie-${viz._ids(d.data as DataPoint, d.i ?? 0).join("-")}`,
    d: arcMaker(d),
    arc,
    flipFromArc,
    reunionFromArc,
    // A wedge entering or leaving without a drill shrinks toward the nearer
    // end of a sweep other than the default full turn from 12 o'clock.
    ...(isDefaultSweep(sweep)
      ? {}
      : {sweep: {startAngle: sweep.start, endAngle: sweep.end}}),
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
      fill: textureFill(sc, d.data as DataPoint, d.i ?? 0, fill),
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
      label: `${rank + 1}. ${viz._drawLabel(d.data as DataPoint, d.i ?? 0)}, ${value(d.data as DataPoint, d.i ?? 0)}, ${sharePct(d)}.`,
    },
  } as SceneNode;
}

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
  sweep: PieSweep,
): void {
  for (const n of labelNodes) {
    const tn = n as TextNode;
    tn.shapeType = "Label";
    if (!flipSource) continue;
    const tr = tn.transform ?? {};
    const x = tr.x ?? 0,
      y = tr.y ?? 0;
    const radius = Math.hypot(x, y);
    // d3's angle convention: 0 rad = straight up, increasing clockwise —
    // atan2(x, -y) inverts the x = r·sin(θ), y = -r·cos(θ) used below.
    const angle = Math.atan2(x, -y);
    const mapped =
      flipSource.start + sweepFraction(angle, sweep) * flipSource.span;
    tn.flipFromTransform = {
      x: radius * Math.sin(mapped),
      y: -radius * Math.cos(mapped),
    };
  }
}

export const pieEmit: ChartEmit = ({viz, shapeData}) => {
  const slices = (shapeData ?? []) as Slice[];
  if (!slices.length) return [];

  const arcGen = viz.ctx.arcData as Arc<unknown, Slice>;
  const arcMaker = (d: Slice) => arcGen(d) ?? "";
  const resolveInnerRadius = arcGen.innerRadius();
  const resolveOuterRadius = arcGen.outerRadius();
  const sc = shapeConfigFor(viz, "Path");

  // A drill-down click armed this draw AND the clicked node was itself a Pie
  // wedge (parentStartAngle/parentEndAngle only ever come from this chart's
  // own click capture, via NodeBase.startAngle/endAngle below) — build each
  // entering wedge's real "confined to the parent's old angular slice, at
  // full final radius" start shape, using the actual arc generator (the
  // render layer has none of its own, so it can't reconstruct this).
  const origin = viz._pendingEnterOrigin as
    {parentStartAngle?: number; parentEndAngle?: number} | undefined;
  const parentStart = origin?.parentStartAngle;
  const parentEnd = origin?.parentEndAngle;
  const flipSource =
    parentStart !== undefined && parentEnd !== undefined
      ? {start: parentStart, span: parentEnd - parentStart}
      : undefined;

  // A Back click armed this draw — every entering wedge gets a "full circle,
  // at my own real radii" start built here (the render layer has no arc
  // generator to build one itself); collapseTo only ever actually applies it
  // to the one wedge resolveDrillMorph later resolves as the reunion match,
  // so there's no need to know which slice that'll be yet.
  const isReunionDraw = Boolean(viz._pendingExitReunion);
  const sweep = (viz.ctx.pieSweep as PieSweep | undefined) ?? {
    start: 0,
    end: FULL_TURN,
  };

  const value = viz.schema.value as (d: DataPoint, i: number) => number;
  const sharePct = pieSharePct(viz);
  const pathCtx: PathNodeCtx = {
    viz,
    arcMaker,
    resolveInnerRadius,
    resolveOuterRadius,
    sc,
    value,
    sharePct,
    flipSource,
    isReunionDraw,
    sweep,
  };
  const pathNodes: SceneNode[] = slices.map((d, rank) =>
    buildPathNode(d, rank, pathCtx),
  );

  // Each slice keeps its label inside the ring (straight, or curved along
  // its arc), or takes one outside it when that leaves its name whole.
  const plan = pieLabelPlan(viz, slices);
  const outside = pieOutsideLabels(viz, slices);
  const named = new Set(Array.from(outside.named, d => d.data));
  const straight = plan.straight.filter(n => {
    const slice = (n.datum as {data?: Slice} | undefined)?.data;
    return !slice || !outside.named.has(slice);
  });
  const curved = plan.curved.filter(n => !named.has(n.datum as DataPoint));

  stampLabelFlip(straight, flipSource, sweep);

  const imageNodes = backgroundImageNodes(sc, pathNodes, k => [
    slices[k].data as DataPoint,
    slices[k].i ?? 0,
  ]);

  return [
    ...pathNodes,
    ...imageNodes,
    ...straight,
    ...curved,
    ...outside.nodes,
  ];
};
