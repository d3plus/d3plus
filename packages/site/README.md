# @d3plus/site

The d3plus.org documentation site, built with [Astro Starlight](https://starlight.astro.build).
It is private and not published to npm.

- **Guides** are MDX pages in `src/content/docs/guides/`.
- **Every documented export gets a page** at `/<package>/<category>/<name>/`.
  A hand-written page in `src/content/docs/` (examples, then
  `<ApiReference name="…" />`) replaces the generated one, which shows only
  the description and API reference.
- **Examples** are `<Playground chart="…" code={…} />` blocks. Their code lives
  in `src/examples/` as plain JavaScript ending in `const config = {…};`,
  imported with `?raw`, so it is linted and formatted like the rest of the repo.
- **The API reference** comes from a manifest the docs generator writes
  (`src/data/api.json`, not committed).

## Running it

Astro needs Node 22.23 or later.

```sh
pnpm -r --if-present run build:esm       # the generator reads the built packages
pnpm -r --if-present run build:types
pnpm --filter @d3plus/site run manifest  # writes src/data/api.json
pnpm --filter @d3plus/site run dev       # http://localhost:4000
```

`pnpm --filter @d3plus/site run build` writes the static site to `dist/`, and
`pnpm test:site` (from the repo root) builds it and loads every page in
Chromium, failing on any console error or warning, then does the same for a
few pages on the dev server, which compiles the playground differently.
