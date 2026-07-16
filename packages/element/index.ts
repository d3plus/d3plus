import {
  AreaPlot,
  BarChart,
  BoxWhisker,
  BumpChart,
  Donut,
  Geomap,
  LinePlot,
  Matrix,
  Network,
  Pack,
  Pie,
  Plot,
  Priestley,
  Radar,
  RadialMatrix,
  Rings,
  Sankey,
  StackedArea,
  Tree,
  Treemap,
  Viz,
  Axis,
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
  ColorScale,
  Legend,
  Message,
  TextBox,
  Timeline,
  Tooltip,
  Area,
  Bar,
  Box,
  Circle,
  Image,
  Line,
  Path,
  Rect,
  Shape,
  Whisker,
  BaseClass,
} from "@d3plus/core";

import {D3plusElement} from "./src/D3plusElement.js";

export {D3plusElement, globalConfig, setGlobalConfig} from "./src/D3plusElement.js";

/**
    Every d3plus class exposed as a custom element, keyed by its PascalCase name.
    The registered tag is `<prefix>-<kebab-case-name>` (default prefix `d3plus`),
    e.g. `BarChart` → `d3plus-bar-chart`, `Treemap` → `d3plus-treemap`.

    Typed loosely (`=> any`) like the React wrapper's constructor prop: a few
    classes (`Message`, `BaseClass`) don't structurally satisfy `D3plusInstance`
    in their public types but expose the needed methods at runtime.
*/
export const CLASSES: Record<string, new (...args: any[]) => any> = {
  AreaPlot,
  BarChart,
  BoxWhisker,
  BumpChart,
  Donut,
  Geomap,
  LinePlot,
  Matrix,
  Network,
  Pack,
  Pie,
  Plot,
  Priestley,
  Radar,
  RadialMatrix,
  Rings,
  Sankey,
  StackedArea,
  Tree,
  Treemap,
  Viz,
  Axis,
  AxisBottom,
  AxisLeft,
  AxisRight,
  AxisTop,
  ColorScale,
  Legend,
  Message,
  TextBox,
  Timeline,
  Tooltip,
  Area,
  Bar,
  Box,
  Circle,
  Image,
  Line,
  Path,
  Rect,
  Shape,
  Whisker,
  BaseClass,
};

/**
    Converts a PascalCase class name to a kebab-case custom-element suffix.
    @param name A d3plus class name (e.g. `RadialMatrix`).
    @private
*/
function kebab(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
    Registers a custom element for every entry in {@link CLASSES}. Idempotent
    (skips tags already defined) and a no-op where `customElements` is absent
    (e.g. server-side rendering), so it is safe to call once at startup.
    @param prefix Tag-name prefix; defaults to `d3plus`.
    @returns A map of PascalCase class name → registered tag name.
*/
export function defineElements(prefix = "d3plus"): Record<string, string> {
  const tags: Record<string, string> = {};
  for (const [name, Ctor] of Object.entries(CLASSES)) {
    const tag = `${prefix}-${kebab(name)}`;
    tags[name] = tag;
    if (typeof customElements === "undefined" || customElements.get(tag)) continue;
    const cls = class extends D3plusElement {};
    cls.viz = Ctor;
    customElements.define(tag, cls);
  }
  return tags;
}
