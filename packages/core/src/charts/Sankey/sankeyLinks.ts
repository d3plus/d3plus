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

/**
    The warning Sankey logs when it leaves out links from a node to itself,
    naming the nodes (each once).
*/
export function sankeySelfLinkWarning(ids: readonly unknown[]): string {
  const count = ids.length === 1 ? "1 link" : `${ids.length} links`;
  const names = Array.from(new Set(ids.map(String))).join(", ");
  return `Sankey can't draw a flow from a node back into itself, so it leaves out ${count} (${names}).`;
}
