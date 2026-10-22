import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const packagesDir = path.join(root, "packages");

/**
 * Vite aliases that resolve every `@d3plus/*` import to its package's
 * TypeScript source, so tests run against `src/` without building `es/`,
 * plus `~test/` for the shared helpers in this folder.
 */
export const aliases = [
  {
    find: /^@d3plus\/core\/internal$/,
    replacement: path.join(packagesDir, "core", "internal.ts"),
  },
  {
    find: /^@d3plus\/types\/react$/,
    replacement: path.join(packagesDir, "types", "react.ts"),
  },
  ...fs
    .readdirSync(packagesDir, {withFileTypes: true})
    .filter(d => d.isDirectory() && d.name !== "docs")
    .flatMap(({name}) => {
      const entry = ["index.ts", "index.tsx"]
        .map(file => path.join(packagesDir, name, file))
        .find(file => fs.existsSync(file));
      return entry
        ? [{find: new RegExp(`^@d3plus/${name}$`), replacement: entry}]
        : [];
    }),
  {find: /^~test\//, replacement: `${path.join(root, "test")}/`},
];
