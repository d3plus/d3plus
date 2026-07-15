import type {DataPoint} from "@d3plus/data";
import type {SceneNode, Transform} from "@d3plus/render";

type HitArea =
  | ((d: DataPoint, i: number, aes: unknown) => Record<string, unknown>)
  | Record<string, unknown>
  | undefined;

/**
    Builds the invisible, interactive "hit area" rect for a shape datum — a
    transparent box that can extend past the shape's own geometry (e.g. a legend
    swatch reaching across the padding to its label) so the space between them
    stays one continuous hover target instead of firing mouseleave/mouseenter as
    the pointer crosses the gap. Carries the shape's `datum` (so pointer handlers
    treat it as the same item, and the `mouseleave` same-datum suppressor bridges
    the swatch↔hit-area crossing) but a DISTINCT `key`: the hit-area and the
    visible geometry are siblings, and the SVG keyed join can't hold two nodes
    under one key — sharing it made the geometry re-enter (collapse→grow) on every
    redraw (a "pulse" on e.g. every timeline step). Returns null when no hitArea
    is configured. A path-style hitArea (Line: a fat, transparent stroke) reuses
    the resolved geometry `d`/`transform` so the hover target overlaps the
    visible line exactly while extending past its ~1px stroke.
*/
export function hitAreaNode(
  hitArea: HitArea,
  d: DataPoint,
  i: number,
  aes: unknown,
  key: string | number,
  datum: DataPoint,
  name: string,
  transform: Transform,
  geomD?: string,
): SceneNode | null {
  const bounds = (
    typeof hitArea === "function" ? hitArea(d, i, aes) : hitArea
  ) as Record<string, unknown> | null | undefined;
  if (!bounds) return null;
  // Path-style hitArea (Line): widen the hover target to a fat transparent
  // stroke over the line's own geometry. `stroke: transparent` (not "none") is
  // painted, so it hit-tests across the full width on both backends.
  if (typeof bounds.width !== "number" && typeof geomD === "string") {
    const sw = typeof bounds["stroke-width"] === "number" ? (bounds["stroke-width"] as number) : 10;
    return {
      type: "path",
      d: geomD,
      key: `${key}::hit`,
      datum,
      index: i,
      shapeType: name,
      paint: {fill: "none", stroke: "transparent", strokeWidth: sw, vectorEffect: "non-scaling-stroke"},
      transform,
      aria: {hidden: true},
    } as unknown as SceneNode;
  }
  if (typeof bounds.width !== "number" || typeof bounds.height !== "number")
    return null;
  return {
    type: "rect",
    x: typeof bounds.x === "number" ? bounds.x : -bounds.width / 2,
    y: typeof bounds.y === "number" ? bounds.y : -bounds.height / 2,
    width: bounds.width,
    height: bounds.height,
    key: `${key}::hit`,
    datum,
    index: i,
    shapeType: name,
    paint: {fill: "transparent"},
    transform,
    aria: {hidden: true},
  } as unknown as SceneNode;
}
