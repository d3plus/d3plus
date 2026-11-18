/**
 * Small decisions the chooser's components make about how things look,
 * kept here so they can be tested without a page.
 */
import type {Column} from "./columns.js";
import type {NodeState} from "./states.js";

/** Whether `key` is `target` or one of its ancestors. */
export const onPath = (key: string, target: string | null) =>
  !!target && (target === key || target.startsWith(`${key}/`));

/** A tree node's classes: lit or dim (or idle before data), selected, hovered. */
export function nodeClasses(
  key: string,
  state: NodeState | undefined,
  flags: {idle: boolean; selected: string | null; active: string | null},
): string {
  return [
    flags.idle ? "is-idle" : state?.lit ? "is-lit" : "is-dim",
    onPath(key, flags.selected) ? "is-selected" : "",
    onPath(key, flags.active) ? "is-active" : "",
  ].join(" ");
}

/** The width of a tree tip, in pixels (18rem). */
export const TIP_WIDTH = 288;

/**
 * Where a tree tip floats: left of a dendrogram's leaf (the leaves are the
 * rightmost column), hanging from its row so it never rises above the tree
 * into the page's header; else beneath its node, kept inside the tree.
 */
export function tipStyle(
  {
    x,
    y,
    width,
    outline,
  }: {x: number; y: number; width: number; outline: boolean},
  leaf: boolean,
): Record<string, string> {
  if (leaf && !outline)
    return {
      top: `${Math.max(0, y - 14)}px`,
      left: `${Math.max(0, x - TIP_WIDTH - 12)}px`,
    };
  return {
    top: `${y + 16}px`,
    left: `${Math.max(0, Math.min(x, width - TIP_WIDTH))}px`,
  };
}

/** A column's kind, which colors its swatch in the summary. */
export function columnKind(column: Column): string {
  return column.geo || column.coord ? "geo" : column.type;
}

/** A Markdown description's first sentence, as plain text. */
export function firstSentence(markdown: string): string {
  return markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .split(/(?<=\.)\s/)[0];
}

/**
 * A drawn chart's height for the width of its column: about half as tall as
 * it is wide, from 360px up to 560px, in steps of 40px (so a resize only
 * redraws it at a step).
 */
export function chartHeight(width: number): number {
  const height = Math.min(Math.max(360, width * 0.45), 560);
  return Math.round(height / 40) * 40;
}

/**
 * Whether the page's back link should return through history, rather than
 * follow its link to the guides: the visitor came from another page of this
 * site (`referrer`, against the page's own `href`) and has a page to return
 * to.
 */
export function goesBack(
  referrer: string,
  href: string,
  historyLength: number,
): boolean {
  if (!referrer || historyLength < 2) return false;
  try {
    const from = new URL(referrer);
    const here = new URL(href);
    return from.origin === here.origin && from.pathname !== here.pathname;
  } catch {
    return false;
  }
}
