/**
    Funnel's stage labels: the stage's name, its value, and any conversion
    rates `conversion` asks for. Each label goes inside its stage when it
    fits there, otherwise beside it (to the right of a vertical funnel,
    below a horizontal one), dropping trailing lines until it fits. Every
    label in a funnel shares one font size (see `planFunnelLabels`).
*/

import {colorContrast} from "@d3plus/color";
import type {DataPoint} from "@d3plus/data";
import {textWidth} from "@d3plus/dom";
import {formatAbbreviate} from "@d3plus/format";
import type {SceneNode} from "@d3plus/render";
import {fontFamilyStringify} from "@d3plus/text";

import constant from "../../utils/constant.js";
import {emitLabels} from "../../shapes/emitLabels.js";
import {
  resolveAccessor,
  shapeConfigFor,
  userLabelConfig,
} from "../features/emitHelpers.js";
import {backgroundInk} from "../viz/backgroundInk.js";
import type {VizInstance} from "../viz/vizTypes.js";
import type {FunnelShared, FunnelStage} from "./applyLayout.js";
import {
  conversionModes,
  lineBoxes,
  planFunnelLabels,
} from "./funnelLabels.js";
import type {
  FunnelConversionOption,
  LabelBox,
  LabelPlan,
  LabelSizing,
  StageLabelInput,
} from "./funnelLabels.js";

/** Line height as a multiple of the font size. */
export const LINE_HEIGHT = 1.2;
/** Space between a stage's edge and a label drawn beside it. */
export const OUTSIDE_GAP = 6;
/** Space kept between a label and its box's edges. */
const LABEL_PADDING = 4;

/** A conversion rate as a percentage, e.g. `"42.5%"`. */
export function percentText(viz: VizInstance, rate: number): string {
  return `${formatAbbreviate(rate * 100, viz.schema.locale)}%`;
}

/**
    A stage's label lines: its name, its value, then each conversion rate
    `conversion` asks for (left off the first stage, where every rate is
    100%).
*/
export function stageLines(viz: VizInstance, stage: FunnelStage): string[] {
  const valueFormat = viz.schema.valueFormat as (
    v: number,
    d: DataPoint,
  ) => string;
  const lines = [viz._drawLabel(stage.data, stage.i)];
  if (Number.isFinite(stage.value))
    lines.push(`${valueFormat(stage.value, stage.data)}`);
  if (!stage.i) return lines;
  const modes = conversionModes(
    viz.schema.conversion as FunnelConversionOption | undefined,
  );
  for (const mode of modes) {
    const rate = mode === "first" ? stage.first : stage.previous;
    if (!Number.isFinite(rate)) continue;
    const suffix = viz.schema.translate(
      mode === "first" ? "of first" : "of previous",
    );
    lines.push(`${percentText(viz, rate)} ${suffix}`);
  }
  return lines;
}

/** The box inside a stage, and the box beside it, in chart-area coordinates. */
export function stageBoxes(
  stage: FunnelStage,
  shared: FunnelShared,
): {inside: LabelBox; outside: LabelBox} {
  const size = stage.end - stage.start;
  const across = shared.center + stage.max / 2 + OUTSIDE_GAP;
  const room = Math.max(0, (shared.breadth - stage.max) / 2 - OUTSIDE_GAP);
  if (shared.orient === "horizontal")
    return {
      inside: {
        x: stage.start,
        y: shared.center - stage.min / 2,
        width: size,
        height: stage.min,
      },
      outside: {x: stage.start, y: across, width: size, height: room},
    };
  return {
    inside: {
      x: shared.center - stage.min / 2,
      y: stage.start,
      width: stage.min,
      height: size,
    },
    outside: {x: across, y: stage.start, width: room, height: size},
  };
}

/** Shrinks a box by `pad` on every side. */
function inset(box: LabelBox, pad: number): LabelBox {
  return {
    x: box.x + pad,
    y: box.y + pad,
    width: Math.max(0, box.width - pad * 2),
    height: Math.max(0, box.height - pad * 2),
  };
}

/** The label sizing, honoring a numeric `fontMin`/`fontMax` in the user's label config. */
function labelSizing(
  label: Record<string, unknown>,
  d: DataPoint,
  i: number,
): LabelSizing {
  const num = (v: unknown, fallback: number): number => {
    const n = resolveAccessor<unknown>(v, d, i);
    return typeof n === "number" && n > 0 ? n : fallback;
  };
  return {
    fontMin: num(label.fontMin, 10),
    fontMax: num(label.fontMax, 16),
    padding: LABEL_PADDING,
    lineHeight: LINE_HEIGHT,
  };
}

interface Placed {
  stage: FunnelStage;
  plan: LabelPlan;
  boxes: LabelBox[];
}

/** What `planStageLabels` decides for one funnel. */
export interface StageLabels {
  /** Each stage's label plan, by row (stages with no label are left out). */
  plans: Map<DataPoint, LabelPlan>;
  /** The font size every label without a fixed size shares (0 when none is drawn). */
  fontSize: number;
  sizing: LabelSizing;
  /** The user's label config for stage paths. */
  user: Record<string, unknown>;
}

/**
    Plans one funnel's stage labels with `planFunnelLabels`: every label
    shares one font size, at most `cap` (a size shared across small
    multiples). A numeric `fontSize` in the user's label config fixes that
    stage's size instead.
*/
export function planStageLabels(
  viz: VizInstance,
  stages: FunnelStage[],
  shared: FunnelShared,
  cap = Infinity,
): StageLabels {
  const user = userLabelConfig(viz, "Path");
  const first = stages[0];
  const sizing = first
    ? labelSizing(user, first.data, first.i)
    : labelSizing({}, {}, 0);
  const family = fontFamilyStringify(
    (first
      ? resolveAccessor<string | string[]>(user.fontFamily, first.data, first.i)
      : undefined) ?? (viz.schema.fontFamily as string | string[]),
  );
  const measure = (text: string, size: number): number =>
    Number(
      textWidth(text, {
        "font-family": family,
        "font-size": size,
        "font-weight": 600,
      }),
    ) || 0;
  const inputs: StageLabelInput[] = stages.map(stage => {
    const {inside, outside} = stageBoxes(stage, shared);
    const fixed = resolveAccessor<unknown>(user.fontSize, stage.data, stage.i);
    return {
      lines: stageLines(viz, stage),
      inside,
      outside,
      fixed: typeof fixed === "number" && fixed > 0 ? fixed : undefined,
    };
  });
  const {plans, fontSize} = planFunnelLabels(inputs, measure, sizing, cap);
  const byRow = new Map<DataPoint, LabelPlan>();
  plans.forEach((plan, k) => {
    if (plan) byRow.set(stages[k].data, plan);
  });
  return {plans: byRow, fontSize, sizing, user};
}

/**
    The font size every label in one funnel shares (see `planStageLabels`),
    or 0 when no label is drawn without a fixed size.
*/
export function stageLabelSize(
  viz: VizInstance,
  stages: FunnelStage[],
  shared: FunnelShared,
): number {
  return stages.length ? planStageLabels(viz, stages, shared).fontSize : 0;
}

/**
    The cap on a funnel's shared label size: the size shared across small
    multiples (see `funnelFacet.ts`), when there is one.
*/
export function labelSizeCap(viz: VizInstance): number {
  const size = Number(viz.ctx.funnelLabelSize);
  return Number.isFinite(size) && size > 0 ? size : Infinity;
}

export function funnelLabelNodes(
  viz: VizInstance,
  stages: FunnelStage[],
  shared: FunnelShared,
): SceneNode[] {
  const sc = shapeConfigFor(viz, "Path");
  const {plans, sizing, user} = planStageLabels(
    viz,
    stages,
    shared,
    labelSizeCap(viz),
  );
  const horizontal = shared.orient === "horizontal";

  const placed = new Map<DataPoint, Placed>();
  for (const stage of stages) {
    const plan = plans.get(stage.data);
    if (!plan) continue;
    const {inside, outside} = stageBoxes(stage, shared);
    const box = plan.position === "inside" ? inside : outside;
    const align = plan.position === "outside" && horizontal ? "top" : "middle";
    const boxes = lineBoxes(
      inset(box, LABEL_PADDING),
      plan.lines.length,
      plan.fontSize * LINE_HEIGHT,
      align,
    );
    placed.set(stage.data, {stage, plan, boxes});
  }
  const at = (d: DataPoint): Placed | undefined =>
    placed.get(((d && d.data) ?? d) as DataPoint);

  return emitLabels({
    data: stages.map(s => s.data),
    datum: d => d,
    label: d => placed.get(d)?.plan.lines ?? false,
    // Each line's box gets a pixel of slack above and below, since TextBox
    // drops a line exactly as tall as its box.
    labelBounds: d => {
      const boxes = placed.get(d)?.boxes;
      return boxes
        ? boxes.map(b => ({...b, y: b.y - 1, height: b.height + 2}))
        : false;
    },
    x: () => 0,
    y: () => 0,
    aes: () => ({}),
    rotate: constant(0),
    id: (d, i) => `funnel-label-${viz._ids(d, i).join("-")}`,
    labelConfig: {
      fontResize: false,
      padding: 0,
      lineHeight: (d: DataPoint) =>
        (at(d)?.plan.fontSize ?? sizing.fontMin) * LINE_HEIGHT,
      fontWeight: (d: DataPoint) => (d && d.l === 0 ? 600 : 400),
      textAnchor: (d: DataPoint) =>
        at(d)?.plan.position === "outside" && !horizontal ? "start" : "middle",
      verticalAlign: "top",
      fontColor: (d: DataPoint) => {
        const p = at(d);
        if (!p || p.plan.position === "outside") return backgroundInk(viz);
        const fill = resolveAccessor<unknown>(sc.fill, p.stage.data, p.stage.i);
        return typeof fill === "string"
          ? colorContrast(fill, viz.schema.colorDefaults)
          : backgroundInk(viz);
      },
      ...user,
      // After the user's config, so a function `fontSize` is read per stage
      // (as planned) rather than per line.
      fontSize: (d: DataPoint) => at(d)?.plan.fontSize ?? sizing.fontMin,
    },
  });
}
