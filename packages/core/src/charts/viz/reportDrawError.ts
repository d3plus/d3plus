/**
    The name a chart reports itself by: its class's `_displayName` (kept
    through minification), else the constructor's name.
    @private
*/
export function chartName(viz: object): string {
  const ctor = (viz as {constructor?: {_displayName?: string; name?: string}})
    .constructor;
  return ctor?._displayName || ctor?.name || "chart";
}

/**
    Logs an error a chart threw while drawing, naming the chart. The error
    object is passed through, so the console shows its stack.
    @private
*/
export function reportDrawError(viz: object, error: unknown): void {
  console.error(`d3plus: ${chartName(viz)} could not draw.`, error);
}
