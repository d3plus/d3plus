import type Axis from "../../components/Axis/Axis.js";

/**
    An axis as it stands after this draw's render: its scales are copied, so
    the position accessors built from it keep mapping this draw's domain and
    range when the same axis instance renders again (each small-multiples
    panel renders the chart's one axis in turn).
*/
export function frozenAxis(axis: Axis): Axis {
  const frozen = Object.create(axis) as Axis;
  frozen._d3Scale = axis._d3Scale ? axis._d3Scale.copy() : null;
  frozen._d3ScaleNegative = axis._d3ScaleNegative ? axis._d3ScaleNegative.copy() : null;
  frozen.schema = {...axis.schema};
  return frozen;
}
