/**
    Dashboard: lining up the plot areas of charts that share a grid line.

    @module
*/
import type {DashboardSlot} from "./dashboardGrid.js";

/** A distance from each side of a box. */
export interface DashboardSides {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/** No distance on any side. */
export const NO_SIDES: DashboardSides = {top: 0, right: 0, bottom: 0, left: 0};

/** What `plotInsets` reads from a chart. */
export interface PlotInsetHost {
  schema: {width?: number; height?: number};
  _plotArea?: {x: number; y: number; width: number; height: number};
  _chartTransform?: {x?: number; y?: number};
  _letterbox?: {width: number; offset: number; drawn: number};
}

/**
    How far a chart's plot area sits in from each edge of its surface, or
    undefined for a chart without one (anything outside the Plot family) or
    one that hasn't drawn yet.
*/
export function plotInsets(viz: PlotInsetHost): DashboardSides | undefined {
  const area = viz._plotArea,
    t = viz._chartTransform;
  const height = viz.schema.height;
  const box = viz._letterbox;
  const width =
    box && box.width === viz.schema.width ? box.drawn : viz.schema.width;
  if (!area || !t || !width || !height) return undefined;
  const x = area.x + (t.x ?? 0),
    y = area.y + (t.y ?? 0);
  return {
    top: y,
    right: width - x - area.width,
    bottom: height - y - area.height,
    left: x,
  };
}

/**
    How far to shrink each chart's cell, per side, so that the plot areas of
    charts sharing a grid line meet it at the same place: charts starting in
    the same column share a left edge, ending in the same column a right
    edge, and likewise for rows. On each line, every chart's inset grows to
    the largest among them. A chart without insets (undefined) is left as it
    is and doesn't move the others.
*/
export function alignCells(
  slots: DashboardSlot[],
  insets: (DashboardSides | undefined)[],
): DashboardSides[] {
  const out = slots.map(() => ({...NO_SIDES}));
  const lines: [keyof DashboardSides, (s: DashboardSlot) => number][] = [
    ["left", s => s.column],
    ["right", s => s.column + s.columnSpan],
    ["top", s => s.row],
    ["bottom", s => s.row + s.rowSpan],
  ];
  for (const [side, line] of lines) {
    const groups = new Map<number, number[]>();
    slots.forEach((slot, i) => {
      if (!insets[i]) return;
      const key = line(slot);
      const group = groups.get(key);
      if (group) group.push(i);
      else groups.set(key, [i]);
    });
    for (const members of groups.values()) {
      if (members.length < 2) continue;
      const target = Math.max(...members.map(i => insets[i]![side]));
      for (const i of members) out[i][side] = target - insets[i]![side];
    }
  }
  return out;
}

/** Whether two sets of sides differ by more than half a pixel anywhere. */
export function sidesChanged(a: DashboardSides, b: DashboardSides): boolean {
  return (["top", "right", "bottom", "left"] as const).some(
    k => Math.abs(a[k] - b[k]) > 0.5,
  );
}
