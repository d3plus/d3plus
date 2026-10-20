import type {SceneNode} from "@d3plus/render";

/** The `(d, i, x)` an interaction handler receives. */
export interface HandlerDatum {
  d: unknown;
  i: number;
  x: unknown;
}

/** One shape-class-scoped dispatch: `"<event>.<shapeType>"` handlers get `(d, i, x)`. */
export interface ShapeClassTarget extends HandlerDatum {
  shapeType: string;
}

/**
    Unwraps a scene datum to the `(d, i, x)` handlers receive: a wrapped
    record `{data, i}` reports its `data` and `i`, anything else itself and
    `index`; `x` is always the datum as given.
*/
export function handlerDatum(raw: unknown, index: number): HandlerDatum {
  const wrapped = raw as {data?: unknown; i?: number} | null | undefined;
  return {
    d: wrapped && wrapped.data ? wrapped.data : wrapped,
    i: wrapped && typeof wrapped.i === "number" ? wrapped.i : index,
    x: raw,
  };
}

/**
    The shape classes a picked chart node fires `"<event>.<shapeType>"`
    handlers for: the shape that drew it, with the pick's own `(d, i, x)`, then
    each composite it is a part of (`owners`, innermost first), with that
    composite's datum. A Box's whisker line fires `.Line`, `.Whisker`, and
    `.Box`, once each.
*/
export function shapeClassTargets(node: SceneNode, own: HandlerDatum): ShapeClassTarget[] {
  const targets: ShapeClassTarget[] = [];
  if (typeof node.shapeType === "string") targets.push({shapeType: node.shapeType, ...own});
  for (const owner of node.owners ?? []) {
    if (targets.some(t => t.shapeType === owner.shapeType)) continue;
    targets.push({shapeType: owner.shapeType, ...handlerDatum(owner.datum, owner.index)});
  }
  return targets;
}
