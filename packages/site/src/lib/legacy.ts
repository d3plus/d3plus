import {entryId, loadApi} from "./api";

/**
 * The Storybook site's guide ids, as its `?path=/docs/guides-…` links name
 * them, and each guide's page here.
 */
const GUIDES: Record<string, string> = {
  "guides-accessibility": "/guides/accessibility/",
  "guides-animation": "/guides/animation/",
  "guides-color": "/guides/color/",
  "guides-configuration": "/guides/configuration/",
  "guides-data": "/guides/data/",
  "guides-exporting": "/guides/exporting/",
  "guides-frameworks": "/guides/frameworks/",
  "guides-interactivity": "/guides/interactivity/",
  "guides-legends": "/guides/legends/",
  // Storybook kept the arrow of "Migration (v3 → v4)" in the id.
  "guides-migration-v3-→-v4": "/guides/migration/",
  "guides-migration-v3-v4": "/guides/migration/",
  "guides-rendering": "/guides/rendering/",
  "guides-server-side-rendering": "/guides/server-side-rendering/",
  "guides-small-multiples": "/guides/small-multiples/",
  "guides-theming": "/guides/theming/",
  "guides-typescript": "/guides/typescript/",
};

/**
 * Every Storybook page id and the page it moved to: the home page, the
 * guides, and one per documented export (`core-charts-treemap`,
 * `format-formatabbreviate`).
 */
export function legacyPages(): Record<string, string> {
  const pages: Record<string, string> = {introduction: "/", ...GUIDES};
  for (const entry of loadApi()) {
    const id = [entry.package, entry.category, entry.name.toLowerCase()]
      .filter(Boolean)
      .join("-");
    pages[id] = `/${entryId(entry)}/`;
  }
  return pages;
}

/**
 * Where a Storybook URL's query (`?path=/docs/core-charts-treemap--docs`,
 * `?path=/story/core-charts-treemap--basic-example`, or the iframe's
 * `?id=core-charts-treemap--basic-example`) now lives: its page, and a
 * story's example by its heading. Undefined for any other query, or an id
 * that has no page here.
 *
 * Runs in the browser as well, inlined into the page head, so it is
 * self-contained.
 */
export function legacyTarget(
  search: string,
  pages: Record<string, string>,
): string | undefined {
  const query = new URLSearchParams(search);
  const id = query.get("id");
  const path = query.get("path") ?? (id ? `/story/${id}` : null);
  const match = path?.match(/^\/(docs|story)\/([^/]+?)--([a-z0-9-]+)$/);
  if (!match) return undefined;
  const [, kind, page, view] = match;
  if (!(page in pages)) return undefined;
  return kind === "story" ? `${pages[page]}#${view}` : pages[page];
}
