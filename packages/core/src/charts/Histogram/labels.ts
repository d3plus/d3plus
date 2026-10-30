/** The English labels Histogram translates for its y axis and tooltip rows. */
import {
  cumulativeNormalize,
  type BinCumulative,
  type BinNormalize,
} from "./binData.js";

const labels: Record<BinNormalize, string> = {
  count: "Count",
  density: "Density",
  relative: "Relative Frequency",
};

const cumulativeLabels: Record<BinNormalize, string> = {
  count: "Cumulative Count",
  density: "Cumulative Relative Frequency",
  relative: "Cumulative Relative Frequency",
};

/**
    The (untranslated) label for what a bar's height measures under
    `binNormalize` and `cumulative`, used as the default y-axis title.
*/
export function heightLabel(
  normalize: BinNormalize = "count",
  cumulative: BinCumulative = false,
): string {
  const n = cumulativeNormalize(
    labels[normalize] ? normalize : "count",
    cumulative,
  );
  return (cumulative ? cumulativeLabels : labels)[n];
}
