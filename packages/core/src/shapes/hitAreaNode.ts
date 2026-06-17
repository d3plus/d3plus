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
    the pointer crosses the gap. Shares the shape's key + datum so the renderer
    reads it as the same item. Returns null when no rect-style hitArea is
    configured; Line's path-style hitArea is covered by its own geometry.
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
): SceneNode | null {
  const bounds = (
    typeof hitArea === "function" ? hitArea(d, i, aes) : hitArea
  ) as Record<string, unknown> | null | undefined;
  if (!bounds || typeof bounds.width !== "number" || typeof bounds.height !== "number")
    return null;
  return {
    type: "rect",
    x: typeof bounds.x === "number" ? bounds.x : -bounds.width / 2,
    y: typeof bounds.y === "number" ? bounds.y : -bounds.height / 2,
    width: bounds.width,
    height: bounds.height,
    key,
    datum,
    index: i,
    shapeType: name,
    paint: {fill: "transparent"},
    transform,
    aria: {hidden: true},
  } as unknown as SceneNode;
}
