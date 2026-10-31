import path from "node:path";
import {fileURLToPath} from "node:url";
import fs from "node:fs";

import preact from "@astrojs/preact";
import starlight from "@astrojs/starlight";
import {defineConfig} from "astro/config";

import {apiSidebar, loadApi} from "./src/lib/api";

const packagesDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

// The site renders the workspace packages from their TypeScript source, so a
// change to a package shows up without rebuilding it.
const workspaceAliases = fs
  .readdirSync(packagesDir, {withFileTypes: true})
  .filter(
    d =>
      d.isDirectory() &&
      fs.existsSync(path.join(packagesDir, d.name, "index.ts")),
  )
  .map(({name}) => ({
    find: new RegExp(`^@d3plus/${name}$`),
    replacement: path.join(packagesDir, name, "index.ts"),
  }));

// Filters a reference page's config table as the reader types.
const filterScript = `document.addEventListener("input", e => {
  const input = e.target.closest?.("[data-d3p-filter]");
  if (!input) return;
  const q = input.value.trim().toLowerCase();
  const items = input.closest(".d3p-reference").querySelectorAll(".d3p-item");
  for (const item of items) item.hidden = q !== "" && !item.textContent.toLowerCase().includes(q);
});`;

export default defineConfig({
  site: "https://d3plus.org",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "D3plus",
      description:
        "Data visualization made easy. A JavaScript library that extends D3.js to enable fast and beautiful visualizations.",
      favicon: "/favicon.ico",
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/d3plus/d3plus",
        },
      ],
      editLink: {
        baseUrl: "https://github.com/d3plus/d3plus/edit/main/packages/site/",
      },
      customCss: ["./src/styles/site.css"],
      components: {Hero: "./src/components/Hero/Hero.astro"},
      head: [
        {tag: "link", attrs: {rel: "apple-touch-icon", href: "/touchicon.png"}},
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://d3plus.org/share.png",
          },
        },
        {tag: "script", attrs: {type: "module"}, content: filterScript},
      ],
      sidebar: [
        {label: "Guides", items: [{autogenerate: {directory: "guides"}}]},
        ...apiSidebar(loadApi()),
      ],
    }),
    preact(),
  ],
  vite: {
    resolve: {alias: workspaceAliases},
  },
});
