import isData from "./isData.js";
import load from "./load.js";

import type {DataPoint} from "./DataPoint.js";

type DataFormatter = (
  data: DataPoint[],
) => DataPoint[] | Record<string, unknown>;
type QueueEntry = [
  typeof load,
  (string | Record<string, unknown>)[],
  DataFormatter | undefined,
  string,
];

interface VizContext {
  _queue: QueueEntry[];
  [key: string]: unknown;
}

/**
  Adds the provided value to the internal queue to be loaded, if necessary. This is used internally in new d3plus visualizations that fold in additional data sources, like the nodes and links of Network or the topojson of Geomap.
  @param f Optional formatter function applied to the loaded data.
  @param key The property name on the instance to store the loaded data.
*/
export default function (
  this: VizContext,
  _: DataPoint[] | string | Record<string, unknown>,
  f: DataFormatter | undefined,
  key: string,
): void {
  const paths = _ instanceof Array ? _ : [_];
  const needToLoad = paths.find(isData);
  if (needToLoad) {
    const prev = this._queue.find((q: QueueEntry) => q[3] === key);
    const d: QueueEntry = [
      load.bind(this as unknown as Parameters<typeof load>[0]) as typeof load,
      paths as (string | Record<string, unknown>)[],
      f,
      key,
    ];
    if (prev) this._queue[this._queue.indexOf(prev)] = d;
    else this._queue.push(d);
  } else {
    this[`_${key}`] = _;
  }
}
