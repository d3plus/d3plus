/**
    `buildLabelData(opts)` — pure label-layout function extracted from
    `Shape._buildLabelData()`.

    Given the inputs that a Shape would otherwise hold as `this._label`/
    `this._labelBounds`/`this._x`/`this._y`/`this._aes`/`this._rotate`/
    `this._id`/`this._data`, produces the array of label-record DataPoints
    that a TextBox can render. No Shape instance required.

    Emit functions that would otherwise instantiate
    `new Rect().renderMode("compute").render()` only to read back the label
    compute via `_labelClass` can call this directly + emit their own text
    nodes — no Shape class needed for labels-only data flows. The Shape
    classes themselves reach it through `this._buildLabelData()`.
*/

import type {DataPoint} from "@d3plus/data";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Accessor<T = any> = (d: DataPoint, i: number) => T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AesFn = (d: DataPoint, i: number) => any;
type BoundsFn = (
  d: DataPoint,
  i: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  aesValue: any,
) => Record<string, unknown> | Record<string, unknown>[] | false | null | undefined;

export interface BuildLabelDataOpts {
  /** Source data array. */
  data: DataPoint[];
  /** Optional filter applied to `data` before iterating. */
  dataFilter?: (data: DataPoint[]) => DataPoint[];
  /** Returns the label text (or array of texts) for a datum. False/undefined skips. */
  label: Accessor;
  /** Returns the label bounds (or array of bounds per label) for a datum. Required for labels to surface. */
  labelBounds?: BoundsFn;
  /** Returns the x position for a datum. */
  x: Accessor<number>;
  /** Returns the y position for a datum. */
  y: Accessor<number>;
  /** Returns the aesthetic record for a datum (passed to `labelBounds`). */
  aes: AesFn;
  /** Returns the rotation angle (degrees) for a datum. */
  rotate: Accessor<number>;
  /** Returns the unique id for a datum. */
  id: Accessor<string | number>;
  /**
      Resolves the source row stored as each label record's `.data`. Defaults to
      the iterated datum itself. Charts whose `data` array is a layout/hierarchy
      node (e.g. Pack's d3-hierarchy nodes) pass `d => d.data` so the label
      resolves to the same source row its shape node carries — without it, the
      shape and its label unwrap to different objects and hover treats them
      separately (the shape highlights/raises while the label dims behind it).
  */
  datum?: (d: DataPoint, i: number) => DataPoint;
}

export function buildLabelData(opts: BuildLabelDataOpts): DataPoint[] {
  const {data, dataFilter, label, labelBounds, x, y, aes, rotate, id, datum: datumFn} = opts;
  const out: DataPoint[] = [];
  const src = dataFilter ? dataFilter(data) : data;

  src.forEach((datum: DataPoint, i: number) => {
    let d: DataPoint = datum;
    if (datum.nested && datum.key && datum.values) {
      d = (datum.values as unknown as DataPoint[])[0];
      i = data.indexOf(d);
    }

    let labels: unknown = label(d, i);

    if (
      labelBounds &&
      labels !== false &&
      labels !== undefined &&
      labels !== null
    ) {
      const bounds = labelBounds(d, i, aes(datum, i)) as Record<string, unknown>;
      if (!bounds) return;

      if ((labels as unknown[]).constructor !== Array) labels = [labels];

      const xPos: number = d.__d3plusShape__
        ? d.translate
          ? (d.translate as unknown as number[])[0]
          : (x(d.data as DataPoint, d.i as number) as number)
        : (x(d, i) as number);
      const yPos: number = d.__d3plusShape__
        ? d.translate
          ? (d.translate as unknown as number[])[1]
          : (y(d.data as DataPoint, d.i as number) as number)
        : (y(d, i) as number);

      if (d.__d3plusShape__) {
        d = d.data as DataPoint;
        i = d.i as number;
      }

      for (let l = 0; l < (labels as unknown[]).length; l++) {
        const b = (
          bounds.constructor === Array
            ? (bounds as unknown as Record<string, unknown>[])[l]
            : Object.assign({}, bounds)
        ) as Record<string, number>;
        const rot = rotate(d, i) as number;
        const labelConfig = d.labelConfig as DataPoint | undefined;
        let r: number =
          labelConfig && labelConfig.rotate
            ? (labelConfig.rotate as number)
            : bounds.angle !== undefined
              ? (bounds.angle as number)
              : 0;
        r += rot;
        const rotateAnchor =
          rot !== 0
            ? [b.x * -1 || 0, b.y * -1 || 0]
            : [b.width / 2, b.height / 2];

        out.push({
          __d3plus__: true,
          data: datumFn ? datumFn(d, i) : d,
          height: b.height,
          l,
          id: `${id(d, i)}_${l}`,
          r,
          rotateAnchor,
          text: (labels as unknown[])[l],
          width: b.width,
          x: xPos + b.x,
          y: yPos + b.y,
        } as unknown as DataPoint);
      }
    }
  });
  return out;
}
