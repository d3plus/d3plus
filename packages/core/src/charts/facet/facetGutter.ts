/**
    Small multiples: keeping every panel's plot area the same size when only
    some panels label their axes. Pure layout math over measured insets.

    A panel that labels an axis needs room for those labels (and for tick
    labels that overhang the plot's ends) that a bare panel doesn't. The grid
    reserves that room on its outer edges (the gutter), every panel gets the
    same base area, and a panel drawing labels takes a chart area grown past
    its base by exactly the room its labels need, so its plot area lands on
    the base area's plot area.

    @module
*/
import type {FacetCell} from "./facetConfig.js";
import type {FacetArea} from "./facetGrid.js";

/** A pixel amount for each side of a box. */
export interface FacetSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** Which axes a panel labels. */
export interface FacetLabels {
  x: boolean;
  y: boolean;
}

/** No room on any side. */
export const NO_SIDES: FacetSides = {top: 0, right: 0, bottom: 0, left: 0};

/** Every combination of labeled axes a panel can draw. */
export const LABEL_COMBOS: FacetLabels[] = [
  {x: true, y: true},
  {x: true, y: false},
  {x: false, y: true},
  {x: false, y: false},
];

/** A label combination as a lookup key. */
export function labelKey(labels: FacetLabels): string {
  return `${labels.x ? "x" : ""}${labels.y ? "y" : ""}`;
}

/**
    How far each label combination's plot insets (measured from probe panels,
    keyed by `labelKey`) exceed the bare panel's, per side, never negative.
*/
export function labelExpansions(insets: Record<string, FacetSides>): Record<string, FacetSides> {
  const bare = insets[labelKey({x: false, y: false})] ?? NO_SIDES;
  const out: Record<string, FacetSides> = {};
  for (const [key, sides] of Object.entries(insets)) {
    out[key] = {
      top: Math.max(0, sides.top - bare.top),
      right: Math.max(0, sides.right - bare.right),
      bottom: Math.max(0, sides.bottom - bare.bottom),
      left: Math.max(0, sides.left - bare.left),
    };
  }
  return out;
}

/**
    The room the grid reserves on its outer edges: the y-labeled panels'
    extra room on the left, the x-labeled panels' on the bottom, and the most
    any panel needs above and to the right (tick labels overhanging the
    plot's top and right ends).
*/
export function labelGutter(expansions: Record<string, FacetSides>): FacetSides {
  const all = Object.values(expansions);
  const pick = (side: keyof FacetSides, test: (labels: FacetLabels) => boolean): number =>
    Math.max(0, ...LABEL_COMBOS.filter(test).map(l => expansions[labelKey(l)]?.[side] ?? 0));
  return {
    top: Math.max(0, ...all.map(s => s.top)),
    right: Math.max(0, ...all.map(s => s.right)),
    bottom: pick("bottom", l => l.x),
    left: pick("left", l => l.y),
  };
}

/**
    A panel's base area, the same size for every panel: its cell below the
    title band, less the gutter the grid added to the cell's outer edges.
*/
export function panelBase(cell: FacetCell, titleHeight: number, gutter: FacetSides, columns: number): FacetArea {
  const left = cell.column === 0 ? gutter.left : 0;
  const right = cell.column === columns - 1 ? gutter.right : 0;
  const top = titleHeight + gutter.top;
  const bottom = cell.edges.bottom ? gutter.bottom : 0;
  return {
    x: cell.x + left,
    y: cell.y + top,
    width: Math.max(0, cell.width - left - right),
    height: Math.max(0, cell.height - top - bottom),
  };
}

/** `area` grown by `sides`. */
export function expandArea(area: FacetArea, sides: FacetSides): FacetArea {
  return {
    x: area.x - sides.left,
    y: area.y - sides.top,
    width: area.width + sides.left + sides.right,
    height: area.height + sides.top + sides.bottom,
  };
}
