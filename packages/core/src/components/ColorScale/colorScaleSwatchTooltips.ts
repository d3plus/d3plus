/**
    The axis tooltips of a color scale drawn as swatches: the legend's title
    takes the scale's `axisConfig.titleTooltip`, and each swatch label its
    `axisConfig.tickTooltip`, given the same value and index as the label at
    that bucket's start on a `bucketAxis` bar. A label drawn cut short shows
    its whole text. The swatches keep their bucket's tooltip and highlight,
    and a label showing its tooltip lights its bucket too (see
    `handleSwatchLabelHover`).
*/
import type {SceneNode} from "@d3plus/render";

import {
  canShow,
  inertAxis,
  labelCut,
  stampTitleTooltip,
} from "../Axis/axisTooltipTargets.js";
import type {AxisTooltipTarget} from "../Axis/axisTooltipTargets.js";

/** The bucket a swatch stands for. */
export interface SwatchBucket {
  /** The tick the bucket starts at. */
  value: number;
  /** The bucket's place from the lowest. */
  index: number;
}

/** What a swatch-drawn scale's labels take their tooltips from. */
export interface SwatchTooltipOptions {
  /** The legend's title. */
  title: unknown;
  /** The datum the legend's title nodes carry. */
  titleDatum: unknown;
  /** The scale's `axisConfig.titleTooltip`. */
  titleTooltip: unknown;
  /** The scale's `axisConfig.tickTooltip`. */
  tickTooltip: unknown;
  /** Each swatch's legend row, with its bucket. */
  buckets: Map<unknown, SwatchBucket>;
}

type Stamped = SceneNode & {axisTooltip?: AxisTooltipTarget};

/** What a swatch label's datum wraps: the swatch's datum, which wraps its legend row. */
interface SwatchLabelDatum {
  data?: {data?: unknown; id?: unknown; label?: unknown};
}

/** The legend row a swatch label draws, if `node` is one. */
const rowOf = (node: SceneNode): unknown =>
  (node.datum as SwatchLabelDatum | undefined)?.data?.data;

/**
    Stamps swatch label nodes with their tooltip target: the bucket's tick for
    the value, its place from the lowest for the index, and the label's whole
    text. A label no tooltip could show for is left unstamped.
    @param nodes The swatch labels' text nodes.
    @param option The scale's `axisConfig.tickTooltip`.
    @param buckets Each swatch's legend row, with its bucket.
*/
export function stampSwatchLabels(
  nodes: SceneNode[],
  option: unknown,
  buckets: Map<unknown, SwatchBucket>,
): void {
  if (option === false) return;
  for (const node of nodes) {
    const bucket = buckets.get(rowOf(node));
    if (node.type !== "text" || !bucket) continue;
    const swatch = (node.datum as SwatchLabelDatum).data;
    const text = `${swatch?.label ?? swatch?.id ?? ""}`;
    const truncated = labelCut(node, text);
    if (canShow(option, truncated))
      (node as Stamped).axisTooltip = {
        part: "tick",
        value: bucket.value,
        index: bucket.index,
        text,
        truncated,
        option,
      };
  }
}

/** A copy of a scene subtree, each node copied. */
const copy = (node: SceneNode): SceneNode =>
  node.type === "group"
    ? {...node, children: node.children.map(copy)}
    : {...node};

/**
    A swatch-drawn scale's legend scene with its axis tooltips: the title is
    chrome (see `inertAxis`) that takes the pointer only to show its tooltip,
    a swatch label with a tooltip to show takes the pointer as axis chrome,
    and every other node is left as the legend drew it.
    @param scene The legend's scene.
    @param options What the labels take their tooltips from.
*/
export function swatchTooltips(
  scene: SceneNode,
  options: SwatchTooltipOptions,
): SceneNode {
  const next = copy(scene);
  const titles = new Set<SceneNode>();
  const labels: SceneNode[] = [];
  const collect = (node: SceneNode): void => {
    if (node.type === "group") node.children.forEach(collect);
    else if (node.type !== "text") return;
    else if (
      options.titleDatum !== undefined &&
      node.datum === options.titleDatum
    )
      titles.add(node);
    else if (options.buckets.has(rowOf(node))) labels.push(node);
  };
  collect(next);
  stampTitleTooltip([...titles], options.title, options.titleTooltip);
  stampSwatchLabels(labels, options.tickTooltip, options.buckets);
  const finish = (node: SceneNode): SceneNode => {
    if (node.type === "group")
      return {...node, children: node.children.map(finish)};
    if (titles.has(node)) return inertAxis(node);
    return (node as Stamped).axisTooltip
      ? {...node, interactive: true, interactionGroup: "axis"}
      : node;
  };
  return finish(next);
}
