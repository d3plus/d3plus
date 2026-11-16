/**
    A uniform grid of buckets for boxes, so overlap tests only look at the
    items near a box.

    @module
*/

/** An axis-aligned box: its top-left corner and size. */
export interface GridBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A uniform grid of buckets, so overlap tests only look at nearby items. */
export class BoxGrid<T> {
  private cells = new Map<string, T[]>();
  /** @param size The side of each bucket. */
  constructor(readonly size: number) {}
  /** The buckets a box touches. */
  private keys(box: GridBox): string[] {
    const s = this.size;
    const out: string[] = [];
    for (
      let i = Math.floor(box.x / s);
      i <= Math.floor((box.x + box.width) / s);
      i++
    )
      for (
        let j = Math.floor(box.y / s);
        j <= Math.floor((box.y + box.height) / s);
        j++
      )
        out.push(`${i},${j}`);
    return out;
  }
  /** Files an item in every bucket its box touches. */
  add(box: GridBox, item: T): void {
    for (const k of this.keys(box)) {
      const list = this.cells.get(k);
      if (list) list.push(item);
      else this.cells.set(k, [item]);
    }
  }
  /** Takes an item, filed under `box`, back out of the grid. */
  remove(box: GridBox, item: T): void {
    for (const k of this.keys(box)) {
      const list = this.cells.get(k);
      const at = list ? list.indexOf(item) : -1;
      if (at >= 0) list!.splice(at, 1);
    }
  }
  /** The items filed in any bucket a box touches: every item that may overlap it. */
  near(box: GridBox): Set<T> {
    const out = new Set<T>();
    for (const k of this.keys(box))
      for (const item of this.cells.get(k) ?? []) out.add(item);
    return out;
  }
}
