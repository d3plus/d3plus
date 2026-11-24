/**
    Where a draggable reference annotation's setting lives, so a drag can
    read it and write the moved value back: an entry of the chart's
    `referenceLines`, `referenceBands`, or `annotations`, its `quadrants`,
    or a chart's own line (Pareto's threshold, Gantt's "today"). An
    expanded annotation carries its source under `DRAG_SOURCE`.
*/
import type {AnnotationAxis} from "./annotationFrame.js";

/** The kinds of draggable annotation, which name their events (`drag.<kind>`, `end.<kind>`). */
export type DragKind = "referenceLine" | "referenceBand" | "quadrants";

/** A draggable annotation's setting: how to read it and write it back. */
export interface DragSource {
  kind: DragKind;
  /** Unique among the chart's sources: keys its handles. */
  key: string;
  /** The index its events report: its position in its list, or the setting's name. */
  index: number | string;
  /** The setting's entry as it stands. */
  entry(): Record<string, unknown> | undefined;
  /** Stores a changed entry. */
  write(entry: Record<string, unknown>): void;
  /** The value its events report for a changed entry (default: the entry's value on `axis`). */
  payload?(entry: Record<string, unknown>, axis: AnnotationAxis): unknown;
}

/** The internal key an annotation carries its drag source under. */
export const DRAG_SOURCE = "_dragSource";

/** A setting that holds a list (or one entry) as a list. */
export const asList = (setting: unknown): unknown[] =>
  Array.isArray(setting) ? setting : setting ? [setting] : [];

/** An object entry, or undefined. */
const record = (d: unknown): Record<string, unknown> | undefined =>
  d && typeof d === "object" ? (d as Record<string, unknown>) : undefined;

/**
    The source of entry `i` of a list setting.
    @param kind The annotation kind.
    @param key Its handles' key prefix.
    @param read Reads the list's setting.
    @param store Stores a new list.
    @param i The entry's position.
*/
export function listSource(
  kind: DragKind,
  key: string,
  read: () => unknown,
  store: (list: unknown[]) => void,
  i: number,
): DragSource {
  return {
    kind,
    key: `${key}-${i}`,
    index: i,
    entry: () => record(asList(read())[i]),
    write: entry => {
      const list = asList(read()).slice();
      list[i] = entry;
      store(list);
    },
  };
}

/**
    The source of a single setting: the chart's `quadrants`, or one of a
    chart's own lines.
    @param kind The annotation kind.
    @param key The setting's name, its handles' key and its events' index.
    @param read Reads the entry.
    @param write Stores a changed entry.
    @param payload The value its events report.
*/
export function settingSource(
  kind: DragKind,
  key: string,
  read: () => unknown,
  write: (entry: Record<string, unknown>) => void,
  payload?: DragSource["payload"],
): DragSource {
  return {
    kind,
    key,
    index: key,
    entry: () => record(read()),
    write,
    ...(payload ? {payload} : {}),
  };
}
