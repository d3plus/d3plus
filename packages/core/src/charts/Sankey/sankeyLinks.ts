/**
    What Sankey lays out: the links it can draw (both ends name a node, and
    the two are different nodes), and the value each node without a drawn
    link is sized by.
*/

/** A link's resolved ends, as indices into the nodes. */
export interface SankeyLinkEnds {
  source: number | undefined;
  target: number | undefined;
}

/**
    Splits links into the ones Sankey draws and the ones it leaves out: a
    link with an end that names no node, or a link from a node to itself
    (a flow can't loop back into the node it leaves).
*/
export function sankeyDrawableLinks<L extends SankeyLinkEnds>(
  links: readonly L[],
): {
  drawn: (L & {source: number; target: number})[];
  unresolved: L[];
  selfLinks: L[];
} {
  const drawn: (L & {source: number; target: number})[] = [];
  const unresolved: L[] = [];
  const selfLinks: L[] = [];
  for (const l of links) {
    if (l.source === undefined || l.target === undefined) unresolved.push(l);
    else if (l.source === l.target) selfLinks.push(l);
    else drawn.push(l as L & {source: number; target: number});
  }
  return {drawn, unresolved, selfLinks};
}

/**
    The value a node no drawn link touches is sized by: `own` (the `value`
    accessor read from the node's own row) when it is a positive number,
    else the smallest positive value among the drawn links, else 1.
*/
export function unlinkedNodeValue(
  own: unknown,
  linkValues: readonly number[],
): number {
  const n = typeof own === "number" ? own : Number(own);
  if (own !== null && own !== "" && Number.isFinite(n) && n > 0) return n;
  const positive = linkValues.filter(v => Number.isFinite(v) && v > 0);
  return positive.length ? Math.min(...positive) : 1;
}

/** How many left-out links a loop warning names before summing up the rest. */
const namedLoops = 10;

/**
    The warning Sankey logs when it leaves out links that loop back into a
    node they left (a link from a node to itself, or one that closes a loop
    through several nodes), naming each link once as "source → target".
    @param ends Each left-out link's source and target node ids.
*/
export function sankeyLoopWarning(
  ends: readonly (readonly [unknown, unknown])[],
): string {
  const count = ends.length === 1 ? "1 link" : `${ends.length} links`;
  const names = Array.from(new Set(ends.map(([s, t]) => `${s} → ${t}`)));
  const rest = names.length - namedLoops;
  const list = names.slice(0, namedLoops).join(", ");
  const more = rest > 0 ? `, and ${rest} more` : "";
  return `Sankey can't draw a flow that loops back into a node it left, so it leaves out ${count} (${list}${more}).`;
}
