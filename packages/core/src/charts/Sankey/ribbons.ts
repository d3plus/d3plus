/**
    Sankey bands as filled ribbons: the area between two edges, one each
    side of the band's center line. A ribbon keeps its thickness however
    steeply the band runs, where a thick stroke along the center line folds
    over itself on the inside of a tight curve.
*/

export type Point = [number, number];
/** One step of an edge: a straight run to `to`, or a cubic curve through `c1` and `c2`. */
export interface EdgeStep {
  to: Point;
  c1?: Point;
  c2?: Point;
}
/** A path from `start` through each step. */
export interface Edge {
  start: Point;
  steps: EdgeStep[];
}

const round = (n: number): number => Math.round(n * 100) / 100;
const at = (p: Point) => `${round(p[0])},${round(p[1])}`;

/** The steps of an edge as path commands (no `M`). */
function stepsD(steps: readonly EdgeStep[]): string {
  return steps
    .map(s =>
      s.c1 && s.c2 ? `C${at(s.c1)} ${at(s.c2)} ${at(s.to)}` : `L${at(s.to)}`,
    )
    .join("");
}

/** An edge as a path `d`. */
export function edgeD(edge: Edge): string {
  return `M${at(edge.start)}${stepsD(edge.steps)}`;
}

/** The same edge, run from its end back to its start. */
export function reverseEdge(edge: Edge): Edge {
  const points = [edge.start, ...edge.steps.map(s => s.to)];
  const steps: EdgeStep[] = [];
  for (let k = edge.steps.length - 1; k >= 0; k--) {
    const s = edge.steps[k];
    steps.push(
      s.c1 && s.c2 ? {to: points[k], c1: s.c2, c2: s.c1} : {to: points[k]},
    );
  }
  return {start: points[points.length - 1], steps};
}

/** An edge moved `dy` pixels down. */
export function shiftEdge(edge: Edge, dy: number): Edge {
  const move = (p: Point): Point => [p[0], p[1] + dy];
  return {
    start: move(edge.start),
    steps: edge.steps.map(s => ({
      to: move(s.to),
      ...(s.c1 && s.c2 ? {c1: move(s.c1), c2: move(s.c2)} : {}),
    })),
  };
}

/**
    The closed ribbon between two edges that both run from a band's source
    to its target: along `a`, across to the end of `b`, and back along `b`.
*/
export function ribbonD(a: Edge, b: Edge): string {
  const back = reverseEdge(b);
  return `${edgeD(a)}L${at(back.start)}${stepsD(back.steps)}Z`;
}

/**
    A band's ribbon from `[x0, y0]` (where it leaves its source) to
    `[x1, y1]` (where it enters its target), `half` its thickness each side
    of its center line: d3-sankey's horizontal link curve, its edges the
    curve moved up and down.
*/
export function bandRibbonD(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  half: number,
): string {
  const xm = (x0 + x1) / 2;
  const center: Edge = {
    start: [x0, y0],
    steps: [{c1: [xm, y0], c2: [xm, y1], to: [x1, y1]}],
  };
  return ribbonD(shiftEdge(center, -half), shiftEdge(center, half));
}
