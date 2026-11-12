/**
    What an axis's title and tick labels carry for a chart's axis tooltips
    (see `charts/features/axisTooltip.ts`): each label's scene nodes are
    stamped with the label's value, its whole text, whether it is drawn cut
    short, and the axis's `titleTooltip` or `tickTooltip`. A label no tooltip
    could show for is left unstamped.
*/
import type {SceneNode} from "@d3plus/render";

/** The label a pointer can show an axis tooltip for. */
export interface AxisTooltipTarget {
  /** Which part of the axis the label is. */
  part: "title" | "tick";
  /** The tick's value, or the title. */
  value: unknown;
  /** The tick's index among the axis's labels, from the start of its domain (0 for a title). */
  index: number;
  /** The label's whole text. */
  text: string;
  /** Whether the label is drawn cut short. */
  truncated: boolean;
  /** The axis's `titleTooltip` or `tickTooltip`. */
  option: unknown;
}

type Stamped = SceneNode & {axisTooltip?: AxisTooltipTarget};
type Parent = SceneNode & {children?: SceneNode[]};

/**
    The axis label a scene node was stamped as, if any.
    @param node A picked scene node.
*/
export function axisTooltipTarget(
  node: SceneNode | null | undefined,
): AxisTooltipTarget | undefined {
  return (node as Stamped | null | undefined)?.axisTooltip;
}

/** `text` without its whitespace, which a wrap moves between lines. */
const solid = (text: string): string => text.replace(/\s+/g, "");

/**
    Whether a text node draws less than `text`: its layout cut it short (see
    `TextNode.truncated`) and its lines don't spell the whole text.
    @param node A label's scene node.
    @param text The label's whole text.
*/
export function labelCut(node: SceneNode, text: string): boolean {
  if (node.type !== "text" || !node.truncated) return false;
  return solid(node.lines.map(line => line.text).join("")) !== solid(text);
}

/** Whether a label with `option` for its tooltip option could show one. */
const canShow = (option: unknown, truncated: boolean): boolean =>
  option !== false && (truncated || (option !== undefined && option !== null));

/** Every node of a scene subtree, depth-first. */
function flatten(nodes: SceneNode[]): SceneNode[] {
  return nodes.flatMap(node => [
    node,
    ...flatten((node as Parent).children ?? []),
  ]);
}

/** A tick label's record: its tick's config sits on `data`. */
interface TickRecord {
  data?: {id?: unknown; text?: unknown; tick?: unknown};
}

/** The tick config a label node's datum wraps, if the node is a tick label. */
function tickOf(node: SceneNode): TickRecord["data"] {
  const tick = (node.datum as TickRecord | undefined)?.data;
  return tick && typeof tick === "object" && "tick" in tick && "id" in tick
    ? tick
    : undefined;
}

/** The scales whose domain lists categories. */
const CATEGORICAL = ["band", "ordinal", "point"];

/** What `tickRank` reads of an axis. */
export interface RankedAxis {
  schema: {scale?: unknown};
  _domainEndFirst?: boolean;
  _givenDomain(): unknown[];
}

/** A category as a map key: a date by its time. */
const category = (value: unknown): unknown =>
  value instanceof Date ? +value : value;

/**
    Where a tick's value falls along an axis's domain, counted from the
    domain's start: the lowest value of a value or time axis, the first
    category of a categorical one (its last when the axis holds its domain
    end first). Neither `reverse` nor a descending domain moves a value's
    place.
    @param axis A laid-out axis.
*/
export function tickRank(axis: RankedAxis): (value: unknown) => number {
  if (!CATEGORICAL.includes(`${axis.schema.scale}`))
    return value => Number(value);
  const domain = axis._givenDomain().slice();
  if (axis._domainEndFirst) domain.reverse();
  const places = new Map(domain.map((d, i) => [category(d), i]));
  return value => places.get(category(value)) ?? domain.length;
}

/**
    Stamps an axis's tick label nodes (each label's text, and its hitbox when
    it has one) with their tooltip target.
    @param nodes The tick labels' scene nodes.
    @param option The axis's `tickTooltip`.
    @param rank Each tick value's place along the axis (see `tickRank`):
    labels are indexed in that order, or in the order of `nodes` without it.
*/
export function stampTickTooltips(
  nodes: SceneNode[],
  option: unknown,
  rank?: (value: unknown) => number,
): void {
  if (option === false) return;
  const all = flatten(nodes);
  const targets = new Map<unknown, AxisTooltipTarget>();
  for (const node of all) {
    const tick = tickOf(node);
    if (node.type !== "text" || !tick || targets.has(node.datum)) continue;
    const text = `${tick.text}`;
    targets.set(node.datum, {
      part: "tick",
      value: tick.id,
      index: 0,
      text,
      truncated: labelCut(node, text),
      option,
    });
  }
  const ordered = Array.from(targets.values());
  if (rank) ordered.sort((a, b) => rank(a.value) - rank(b.value));
  ordered.forEach((target, index) => (target.index = index));
  for (const node of all) {
    const target = targets.get(node.datum);
    if (target && canShow(option, target.truncated))
      (node as Stamped).axisTooltip = target;
  }
}

/**
    Stamps an axis's title nodes with their tooltip target.
    @param nodes The title's scene nodes.
    @param title The axis's title.
    @param option The axis's `titleTooltip`.
*/
export function stampTitleTooltip(
  nodes: SceneNode[],
  title: unknown,
  option: unknown,
): void {
  if (option === false) return;
  const all = flatten(nodes);
  const text = `${title}`;
  const truncated = all.some(node => labelCut(node, text));
  if (!canShow(option, truncated)) return;
  const target: AxisTooltipTarget = {
    part: "title",
    value: title,
    index: 0,
    text,
    truncated,
    option,
  };
  for (const node of all)
    if (node.datum !== undefined) (node as Stamped).axisTooltip = target;
}

/**
    An axis's scene as chrome under a chart's marks: every node takes the
    "axis" interaction group, and each one that draws leaves hit-testing
    unless it is stamped with a tooltip target, so the pointer reaches the
    axis only on a label with a tooltip to show.
    @param node An axis's scene, or a node in it.
*/
export function inertAxis(node: SceneNode): SceneNode {
  const next = {...node, interactionGroup: "axis"} as Stamped;
  if (next.type === "group") next.children = next.children.map(inertAxis);
  else if (!next.axisTooltip) next.interactive = false;
  return next;
}
