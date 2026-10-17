/**
    Whether hovering a chart shape hovers it: always on charts that outline
    the hovered shape (`_hoverOutline`), otherwise unless `hoverOpacity` is
    1 (set by the chart, or by `dataCutoff` on large data), which turns
    shape hover off.
*/
export function shapeHoverEnabled(viz: {
  schema: Record<string, unknown>;
  _hoverOutline?: boolean;
}): boolean {
  const shapeConfig = viz.schema.shapeConfig as {hoverOpacity?: number} | undefined;
  return Boolean(viz._hoverOutline) || shapeConfig?.hoverOpacity !== 1;
}
