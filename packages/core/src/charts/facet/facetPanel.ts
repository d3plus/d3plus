/**
    Small multiples at interaction time: finding the panel under the pointer
    and temporarily restoring that panel's chart state, so hover, tooltip,
    and click code written for a single chart reads the panel it's over.

    @module
*/
import type {VizInstance} from "../viz/vizTypes.js";
import type {FacetPanelState} from "./facetConfig.js";

type Slots = Record<string, unknown>;

/**
    The drawn panel whose cell contains `point` (surface pixels, before any
    zoom transform), or undefined over the gaps between panels or when the
    chart isn't faceted.
*/
export function facetPanelAt(
  viz: Pick<VizInstance, "_facetPanels" | "_zoomTransform">,
  point: [number, number] | undefined,
): FacetPanelState | undefined {
  const panels = viz._facetPanels;
  if (!panels || !panels.length || !point) return undefined;
  const t = viz._zoomTransform;
  const k = t && t.scale ? t.scale : 1;
  const x = (point[0] - (t?.x ?? 0)) / k, y = (point[1] - (t?.y ?? 0)) / k;
  return panels.find(p => {
    const c = p.cell;
    return x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height;
  });
}

/** The chart slots a panel restores: its scene and transform, plus whatever the chart captured. */
function panelSlots(panel: FacetPanelState): Slots {
  return {
    _chartScene: panel.scene,
    _chartTransform: panel.chartTransform,
    ...panel.state,
  };
}

/**
    Runs `fn` with `panel`'s chart state in place of the composed chart's,
    then puts the composed state back — except in slots `fn` itself
    reassigned (a handler that redraws the chart keeps its new draw).
    Without a panel, just runs `fn`.
*/
export function withFacetPanel<T>(viz: VizInstance, panel: FacetPanelState | undefined, fn: () => T): T {
  if (!panel) return fn();
  const target = viz as unknown as Slots;
  const slots = panelSlots(panel);
  const saved: Slots = {};
  for (const key of Object.keys(slots)) {
    saved[key] = target[key];
    target[key] = slots[key];
  }
  try {
    return fn();
  }
  finally {
    for (const key of Object.keys(slots)) {
      if (target[key] === slots[key]) target[key] = saved[key];
    }
  }
}

/** Clears the per-panel slots on the composed chart, so nothing reads one panel's state as the whole chart's. */
export function clearPanelSlots(viz: VizInstance, panels: FacetPanelState[]): void {
  const target = viz as unknown as Slots;
  for (const panel of panels) {
    for (const key of Object.keys(panel.state)) target[key] = undefined;
  }
}
