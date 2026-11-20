/** What `showsNoData` reads from a chart. */
export interface NoDataHost {
  schema: {noDataMessage?: unknown};
  _filteredData?: unknown[];
}

/**
    Whether the chart shows its no-data message: `noDataMessage` is on and
    nothing is left to draw once the data has been filtered. The chart hides
    its zoom controls and its top-left controls meanwhile (all but the back
    button, the way out of a drill-down that left nothing to draw).
    @param viz The chart.
*/
export function showsNoData(viz: NoDataHost): boolean {
  return (
    Boolean(viz.schema.noDataMessage) &&
    Array.isArray(viz._filteredData) &&
    !viz._filteredData.length
  );
}
