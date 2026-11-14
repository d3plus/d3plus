/**
    A chart's discrete axis: its `discrete` setting, else the axis a Plot
    inferred from its data (see `_discrete`).
*/

/** What `vizDiscrete` reads of a chart. */
interface DiscreteSource {
  schema: {discrete?: unknown};
  _discrete?: string;
}

/**
    The discrete axis a chart draws with: its `discrete` setting, else the
    one its last draw inferred (a Plot infers one from text values, see
    `Plot/inferDiscrete.ts`). Typed as the chart's `discrete` setting is.
    @param viz The chart.
*/
export const vizDiscrete = <V extends DiscreteSource>(
  viz: V,
): V["schema"]["discrete"] =>
  (viz.schema.discrete ?? viz._discrete) as V["schema"]["discrete"];
