/**
    Spreads a column of labels apart so none overlap, each as close to the
    position it labels as the others allow.

    @module
*/

/** A run of labels that touch, placed as one. */
interface Cluster {
  start: number;
  end: number;
  /** The center of the run's first label. */
  top: number;
}

/**
    Positions for labels centered on `desired` (sorted top to bottom), each
    `sizes[i]` tall, so that no two overlap and every label stays within
    `bounds` (the range its center may take). Touching labels move as a
    group, centered on where they want to be, so each moves as little as the
    others allow. Labels that need more room than `bounds` holds are packed
    from its top and run past its bottom.
*/
export function spreadLabelPositions(
  desired: number[],
  sizes: number[],
  bounds: number[],
): number[] {
  const n = desired.length;
  if (!n) return [];
  // offsets[i]: label i's center below the first label's, packed tight.
  const offsets = [0];
  for (let i = 1; i < n; i++)
    offsets.push(offsets[i - 1] + (sizes[i - 1] + sizes[i]) / 2);
  const offsetFrom = (c: Cluster, i: number) => offsets[i] - offsets[c.start];
  const bestTop = (c: Cluster) => {
    let sum = 0;
    for (let i = c.start; i <= c.end; i++) sum += desired[i] - offsetFrom(c, i);
    return sum / (c.end - c.start + 1);
  };

  const clusters: Cluster[] = [];
  for (let i = 0; i < n; i++) {
    let c: Cluster = {start: i, end: i, top: desired[i]};
    for (;;) {
      const prev = clusters[clusters.length - 1];
      if (!prev) break;
      const prevBottom = prev.top + offsetFrom(prev, prev.end);
      const gap = (sizes[prev.end] + sizes[c.start]) / 2;
      if (c.top >= prevBottom + gap) break;
      clusters.pop();
      c = {start: prev.start, end: c.end, top: 0};
      c.top = bestTop(c);
    }
    clusters.push(c);
  }

  const out: number[] = [];
  for (const c of clusters)
    for (let i = c.start; i <= c.end; i++) out.push(c.top + offsetFrom(c, i));

  // Keep the column inside the bounds: push down from the top, then up from
  // the bottom, then down again, so a column too tall to fit starts at the top.
  const [lo, hi] = [Math.min(...bounds), Math.max(...bounds)];
  out[0] = Math.max(out[0], lo);
  for (let i = 1; i < n; i++)
    out[i] = Math.max(out[i], out[i - 1] + (sizes[i - 1] + sizes[i]) / 2);
  out[n - 1] = Math.min(out[n - 1], hi);
  for (let i = n - 2; i >= 0; i--)
    out[i] = Math.min(out[i], out[i + 1] - (sizes[i] + sizes[i + 1]) / 2);
  out[0] = Math.max(out[0], lo);
  for (let i = 1; i < n; i++)
    out[i] = Math.max(out[i], out[i - 1] + (sizes[i - 1] + sizes[i]) / 2);
  return out;
}
