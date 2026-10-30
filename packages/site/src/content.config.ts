import {docsLoader, i18nLoader} from "@astrojs/starlight/loaders";
import {docsSchema, i18nSchema} from "@astrojs/starlight/schema";
import {defineCollection} from "astro:content";
import type {Loader} from "astro/loaders";

import {entryId, loadApi} from "./lib/api.js";
import {markdown} from "./lib/markdown.js";
import {referenceHeading, renderReference} from "./lib/reference.js";

/**
 * Starlight's docs loader, plus a generated page for every documented export
 * that has no hand-written page in `src/content/docs/` yet: its description
 * and API reference. A hand-written page at the same id replaces it.
 */
function docsWithReference(): Loader {
  const docs = docsLoader();
  return {
    name: "d3plus-docs-loader",
    async load(context) {
      await docs.load(context);
      const {store, parseData, generateDigest} = context;
      for (const entry of loadApi()) {
        const id = entryId(entry);
        if (store.has(id)) continue;
        // Where its hand-written page would go; Starlight's sidebar reads it.
        const filePath = `src/content/docs/${id}.mdx`;
        const heading = referenceHeading(entry);
        const html = [
          markdown(entry.description),
          `<h2 id="${heading.toLowerCase()}">${heading}</h2>`,
          renderReference(entry),
        ].join("\n");
        const data = await parseData({
          id,
          filePath,
          data: {
            title: entry.name,
            editUrl: false,
            description: entry.description
              .split("\n\n")[0]
              .replace(/\s+/g, " "),
          },
        });
        store.set({
          id,
          data,
          filePath,
          digest: generateDigest(html),
          rendered: {
            html,
            metadata: {
              headings: [
                {depth: 2, slug: heading.toLowerCase(), text: heading},
              ],
            },
          },
        });
      }
    },
  };
}

export const collections = {
  docs: defineCollection({loader: docsWithReference(), schema: docsSchema()}),
  // Starlight's UI strings; `en.json` is empty, keeping Starlight's English.
  i18n: defineCollection({loader: i18nLoader(), schema: i18nSchema()}),
};
