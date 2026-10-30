# AGENTS.md — d3plus

Guidelines for AI agents working in this repository.

## Project Overview

d3plus is a JavaScript data visualization library that extends D3.js. It is organized as a **pnpm monorepo** with workspaces under `packages/`. Each package is independently publishable under the `@d3plus/` npm scope.

### Packages

| Package           | Purpose                                                |
| ----------------- | ------------------------------------------------------ |
| `@d3plus/color`   | Color utilities and defaults                           |
| `@d3plus/core`    | All chart types, components, and shapes                |
| `@d3plus/data`    | Data manipulation and filtering                        |
| `@d3plus/dom`     | DOM utilities                                          |
| `@d3plus/export`  | SVG/image export                                       |
| `@d3plus/format`  | Number and date formatting                             |
| `@d3plus/locales` | Translation dictionaries                               |
| `@d3plus/math`    | Math utilities                                         |
| `@d3plus/render`  | Scene-graph renderer abstraction + SVG/Canvas backends |
| `@d3plus/react`   | React component wrappers                               |
| `@d3plus/text`    | Text measurement and wrapping                          |
| `@d3plus/types`   | Unified TypeScript type definitions                    |
| `@d3plus/docs`    | Storybook documentation site (private, not published)  |
| `@d3plus/site`    | Astro Starlight docs site, trial replacement for docs  |

## Architecture (v4)

v4 is a scene-graph rewrite. A chart no longer mutates the DOM as it draws.
Instead it compiles to a **serializable scene graph** that a pluggable backend
paints:

```
config (fluent setters / config())
  → pipeline stages (pure-ish transforms over the viz)
    → scene graph (SceneNode tree from @d3plus/render)
      → renderer backend (SVG default, or Canvas)
```

**The public chart API is unchanged from v3** — fluent setters, `config()`, the
`RESET` token, chart classes, and event handlers all behave as before. The
rewrite is under the hood.

### BaseClass + the fluent API

All visualization classes ultimately inherit from `BaseClass`
(`packages/core/src/utils/BaseClass.ts`): a chainable API where each public
setter returns `this`, deep config merging via `config()`, the `RESET` token,
and locale/event management.

Fluent accessors are **schema-driven** in v4. A chart declares its configurable
properties as `ConfigField`s (see `packages/core/src/fluent.ts`); `installFluent`
installs them as `viz.<key>()` getter/setters backed by `viz.schema.<key>`.
Hand-written accessors still exist where behavior is non-trivial, but most
identity, const-wrapped, and deep-merged config properties come from the
schema: every chart's shared ones are listed in `charts/viz/vizFields.ts`
(keyed by `D3plusConfig`, which also types them on `VizBase`), and `VizBase`
keeps only the setters with real logic. A generated accessor has no method for
TypeDoc to read, so document it on its `D3plusConfig` property (or the
component's own config interface): the docs generator takes its description
and type from there for the API.md "Config accessors" tables and the Storybook
args. A chart def field on a `vizFields` key must coerce and merge the same way
(a test checks it).

### Charts are values: `ChartDefinition` + `makeChart`

A chart is a **def value**, not a hand-written class. Each chart lives in its own
folder:

```
packages/core/src/charts/<Chart>/
  index.ts        # the ChartDefinition + `export default makeChart(def)`
  applyLayout.ts  # chart-specific TransformStage (layout math)
  emit.ts         # pure: laid-out data → SceneNode[]
  …               # optional helpers (thresholdFunction.ts, etc.)
```

`ChartDefinition` (`charts/definition/ChartDefinition.ts`) is
`{name, fields?, ctx?, layoutStage?, emit?, thresholdFunction?,
chartTransform?, setup?, …}`. `makeChart(def, Base = Viz)`
(`charts/definition/makeChart.ts`) produces the class: its constructor runs
`applyDefinition(this, def)` (seeding `fields`/`ctx` and installing fluent
accessors), and its `_draw` runs the shared Viz pipeline then the chart's own
`layoutStage` via `runChartDraw`.

Two kinds of def:

- **Data-driven** (`emit(ctx) → SceneNode[]`): Treemap, Pack, Pie, Tree,
  Network, Sankey, Rings, Chord, Geomap, Matrix, RadialMatrix, Priestley, Radar.
- **Paint-driven** (`paintDriven: true`): the Plot family (BarChart, LinePlot,
  AreaPlot, StackedArea, BoxWhisker, BumpChart). `Plot._paint` (via `plotPaint`)
  builds `viz._chartScene`; there is no `emit` step.

`makeChart`'s `Base` argument lets a chart specialize another: e.g.
`makeChart(barChartDef, Plot)`, `makeChart(donutDef, Pie)`.

### Feature modules

Chart "chrome" (legend, color scale, timeline, title/subtitle/total, back
button, attribution, zoom controls) are **`FeatureModule`s**
(`charts/features/`), shared by every chart. `vizDraw`
(`charts/pipeline/vizDraw.ts`) lays out the margin-claiming ones (title,
subtitle, total, timeline, legend, colorScale) in order, and `runVizPipeline`
runs the post-draw overlays (zoom, minimap, top-left controls, attribution,
table view); `runLayout` runs each feature's `layout()`, which claims margin
and returns a panel to compose into the scene.

### Small multiples (`facet`)

`facet` splits any chart into a grid of panels (`charts/facet/`). `drawChart`
lays the chrome out once (`viz._facetStep = "chrome"`: `_draw` skips the body),
then runs the chart's own `_draw` once per panel (`"panel"`: `vizDraw` skips
the chrome) with that panel's rows and its chart area as the margins, and
composes the panels into `_chartScene` (keys prefixed per panel). At
interaction time `withFacetPanel` restores the hovered panel's state. A def can
tune this through `facet: FacetHooks` (panel `aspect`, shared scales, axis
labels); the Plot family's hooks live in `Plot/plotFacet.ts`. A data-driven
def needs nothing to support it.

### The pipeline

The draw flow exists as free functions so it can run without the class
lifecycle:

- `vizPreDraw` — data prep (draw depth, id/label closures, filtered/legend
  data, threshold); the filter + rollup steps live in `preDrawData.ts`, which
  small multiples reuse per panel.
- `vizDraw` — feature layout + margin/panel assembly; returns the margin it
  claimed and the panels.
- `runVizPipeline(viz)` — the full orchestrator (`_preDraw → _draw → features →
paint`).
- `resolveSpec(viz)` — frozen config/context snapshot (the config↔context
  boundary).

These write their results onto the viz they are given, so subclass overrides
reach them through `super._preDraw()` / `super._draw()`.

### Rendering backends (`@d3plus/render`)

`@d3plus/render` owns the scene graph (`SceneNode` union: rect/circle/line/area/
path/image/text/group/htmlOverlay), the diff/animate layer, and two backends:
`SvgRenderer` (default, most complete) and `CanvasRenderer` (dense, high-shape
charts; pointer hit-testing via `Path2D`). Every viz accepts
`.renderer("svg" | "canvas")`.

### Package anatomy

```
packages/<name>/
  index.ts          # Re-exports the package's public API from src/
  src/              # Source (TypeScript ES modules)
  es/               # Build output: transpiled ESM (gitignored, generated)
  umd/              # Build output: UMD bundles (gitignored, generated)
  types/            # Build output: .d.ts (gitignored, generated)
  test/             # Vitest tests (*-test.js; core's *.browser-test.js run in Chromium)
  dev/              # Dev HTML pages (committed — shared manual test harnesses)
  package.json
```

### Public vs. internal API surface

- `@d3plus/core` (the root entry) is the **stable, semver-tracked public API**:
  chart classes, components, shapes, utils, and config types.
- `@d3plus/core/internal` exposes the **v4 pipeline** (layout stages,
  ChartDefinitions, feature modules, `runVizPipeline`, `resolveSpec`,
  `installFluent`, axis measurement, …). It is **not** semver-stable — for
  parity tests and advanced consumers building on the def contract. Keep new
  pipeline exports here, not in `index.ts`.
- `@d3plus/types` re-exports the vanilla-JS types; React types live in the
  separate `@d3plus/types/react` entry so non-React consumers don't pull in
  React.

## Build Outputs

Each publishable package produces four UMD bundles plus the `es/` ESM tree and
`types/` declarations:

- `umd/<name>.js` — standalone (peers external)
- `umd/<name>.full.js` — all dependencies inlined
- `umd/<name>.min.js` / `umd/<name>.full.min.js` — minified

(`@d3plus/core` builds its UMD from `umd-entry.ts`, a superset that also exposes
the pipeline on the `window.d3plus` global; the typed ESM API stays curated.
`@d3plus/types` is types-only and ships no UMD.)

## Development Workflow

### Setup

```bash
pnpm install      # Install all workspace dependencies
```

### Development Server

Run from the repo root, targeting the package you want to work on:

```bash
pnpm --filter @d3plus/core run dev    # dev server on :4000 + Rollup watch
pnpm --filter @d3plus/react run dev   # Vite on :4000
pnpm --filter @d3plus/docs run dev    # Storybook on :4000
```

`scripts/dev.js` serves a package's `dev/` folder with Vite (`/umd/` is
`dev/umd/`, where Rollup's watch writes the bundles) and reloads open pages when
a bundle rebuilds or a dev page changes; it also rebuilds other packages' ESM
output when their source changes.

### Dev pages

Each static package's `dev/` folder holds manual test pages, and
`http://localhost:4000/` is a generated `dev/index.html` listing them
(gitignored; the dev server writes it). Core's
pages mirror the source layout:

```
packages/core/dev/
  charts/<Chart>/<Topic>.html      # Plot family charts get their own folder;
  charts/Plot/<Topic>.html         #   Plot-wide and Viz-wide features live in
  charts/Viz/<Topic>.html          #   charts/Plot and charts/Viz
  components/<Component>/<Topic>.html
  shapes/<Shape>/<Topic>.html
  utils/<Topic>.html
```

- Name topics in PascalCase without the chart prefix; a chart's general page
  is named after its folder (`charts/Treemap/Treemap.html`).
- Give every page a `<title>` and a one-line
  `<meta name="description">`; `scripts/dev-index.js` builds the index from
  them (`pnpm run dev:index`, also run by the dev server).
- Load bundles from `/umd/d3plus-<pkg>.full.js` and, in core, follow it with
  `<script src="/dev.js"></script>` (index link + SVG/Canvas switch; any
  chart page accepts `?renderer=canvas`).
- Keep data local, next to the page that loads it. Pages must render with no
  console errors or warnings: `pnpm run test:dev-pages` loads every core page
  in Chromium (SVG and Canvas) and fails on any.

### Building

```bash
# Build ESM for all packages
pnpm -r --if-present run build:esm

# A single package's ESM / UMD / types
pnpm --filter @d3plus/core run build:esm
pnpm --filter @d3plus/core run build:umd
pnpm --filter @d3plus/core run build:types   # tsc (emits .d.ts)
```

### Testing

```bash
pnpm test                          # lint, then every Vitest project
pnpm --filter @d3plus/core test    # a single package
pnpm vitest run packages/core/test/charts/Treemap.browser-test.js  # one file
pnpm test:coverage                 # per-package coverage → packages/<pkg>/coverage/
pnpm test:built                    # a few suites against the built es/ output
pnpm test:dev-pages                # every core dev page in Chromium (minutes)
```

`pnpm lint` runs ESLint once over the whole repo (`eslint --cache .`); `pnpm
test` runs it, then `vitest run` with the root `vitest.config.ts`, which has
one project per package (core has two). Tests import TypeScript source
(`../src/x.ts`, and `@d3plus/*` resolves to each package's source through
`test/aliases.js`), so nothing needs building first.

- **Node tests** (`*-test.js`) import `vitest` explicitly. `useJsdom()` from
  `~test/jsdom.js` gives each test in a file a fresh JSDOM document (or
  `jsdomit()` for a single test); dom/text/render/core text measurement runs
  on `@napi-rs/canvas`.
- **Browser tests** (core's `*.browser-test.js`) run in Vitest browser mode
  (Playwright Chromium, 1280×720). `render(bodyHtml, fn, arg)` from
  `~test/browser/render.js` resets the page and runs `fn` with d3plus on
  `window.d3plus`; `openPage`/`withPage` from `~test/browser/page.js` give a
  fresh page with a real mouse and an optional fake clock. Use
  `~test/browser/assert.js` in place of `node:assert`.
- **Snapshots**: `vitest run -u` regenerates the pipeline and visual
  snapshots under `packages/core/test/snapshots/`.
- **CI** tests a pull request's affected packages only:
  `scripts/affected.js` lists the packages it changes plus their dependents,
  or all of them when it touches anything outside `packages/` other than
  Markdown. Pushes to `main` test everything.

### Documentation

```bash
pnpm run docs      # Generates markdown docs + Storybook args from TypeDoc
```

The generated docs (each package's `API.md`, `packages/docs/args/`, and the
generated top of each `*.stories.jsx`) are regenerated and committed by
`pnpm run release`, and the Storybook site deploys only on a release. Don't
regenerate them in a pull request: every PR that adds a config option touches
the same tables, so committing them makes open PRs conflict with each other.
The exception is a PR that adds a public class or function: run `pnpm run
docs` and commit only the new `*.args.jsx` and `*.stories.jsx` files it
creates, since the story imports its args file and the Storybook build fails
without it.

Pass `VERBOSE=1` to any build script for per-file output; by default piped
(`pnpm -r`) and CI runs print one line per step.

## Code Conventions

- **File format:** ES modules everywhere (`type: "module"`). Named exports.
- **TypeScript:** all source is `.ts` (`.tsx` for React). Strict mode on; the
  chart pipeline is `any`-free — keep it that way.
- **Private properties:** prefixed with `_` (e.g. `this._color`).
- **Getter/setter methods:** same method name handles both — no argument returns
  the stored value, an argument stores and returns `this`.
- **Formatting:** Prettier with `arrowParens: "avoid"` and `bracketSpacing:
false`. `pnpm format` rewrites the repo and `pnpm format:check` (run in CI)
  verifies it; `.prettierignore` skips generated data, snapshots and MDX. The
  docs generator formats what it writes.
- **Linting:** ESLint flat config (`eslint.config.js`). Fix lint before
  committing; `max-lines` rules are enforced — split oversized files.
  Package entry points (`index.ts`, core's `internal.ts` and `umd-entry.ts`)
  are export lists, exempt from `max-lines`, and may hold only imports and
  re-exports.
- **TypeDoc:** add TypeDoc comments to public methods; `pnpm run docs` reads
  them.

## Adding a New Chart Type

1. Create `packages/core/src/charts/MyChart/`:
   - `applyLayout.ts` — export a `TransformStage` (`applyMyChartLayout`) that
     reads the viz and attaches laid-out `shapeData`.
   - `emit.ts` — export a pure `emit(ctx) → SceneNode[]` (use the helpers in
     `charts/features/emitHelpers.ts`). Skip this for a paint-driven chart.
   - `index.ts` — declare the `ChartDefinition` (`name`, `fields`,
     `layoutStage`, `emit`, …) and `export default makeChart(def[, Base])`.
     Put `ctx` + `fields` last in the def object.
2. Export the class from `packages/core/src/charts/index.ts`.
3. Export the class from `packages/core/index.ts`. Export any reusable
   stage/def from `packages/core/internal.ts` (not `index.ts`).
4. Add a Storybook story under `packages/docs/`.
5. Add a Vitest test in `packages/core/test/` (`*-test.js`, or
   `*.browser-test.js` when it needs a real layout engine).

To specialize an existing chart, pass a `Base` to `makeChart` (e.g.
`makeChart(myDef, Plot)`).

## Common Pitfalls

- **`es/`, `umd/`, and `types/` are gitignored.** Do not commit build output.
- **`dev/` HTML pages are committed** as shared manual test harnesses — unlike
  build output, they are tracked. The generated `dev/index.html` is not.
- **Don't commit regenerated docs in a PR** — the release regenerates them
  (see Documentation).
- **New pipeline exports go in `internal.ts`, not `index.ts`** — keep the public
  API surface curated.
- **Circular dependency warnings from Rollup are suppressed** in the build
  config. Don't introduce new cross-package circular dependencies.
- **Releases need the GitHub CLI.** `pnpm run release` checks
  `gh auth status` before changing anything. npm publishing runs in CI, with
  no npm login or token.

## Running a Release

Releases are automated. Do not run this unless you are the maintainer and have
confirmed all tests pass:

```bash
pnpm run release
```

The script checks that `main` is clean and in sync with origin, prompts for the
new version, writes it into every package, rebuilds everything and the docs,
optionally runs the tests, then commits, tags, pushes, and creates the GitHub
release with `gh`. CHANGELOG.md's `## Unreleased` section is retitled with the
new version in the release commit and becomes the release notes. Each step
prints one line; a failing step prints its captured output, and a failure or
abort before the commit restores the working tree.

Publishing the GitHub release starts the **Publish to npm** workflow
(`.github/workflows/publish.yml`). It rebuilds the tagged commit and publishes
every public package through npm trusted publishing (OIDC, with provenance;
`--tag next` for a prerelease), dependencies first, skipping versions already
on npm. If it fails, fix the cause and run the workflow again by hand with the
release tag.

npm trusts the workflow per package. Setting that up takes npm 11.15+, 2FA and
write access to every package, and a new trust expires unless it publishes
within 2 days, so set it up right before a release:

```bash
for pkg in $(node -e 'const fs = require("fs");
for (const d of fs.readdirSync("packages")) {
  const file = `./packages/${d}/package.json`;
  if (!fs.existsSync(file)) continue;
  const p = require(file);
  if (!p.private) console.log(p.name);
}'); do
  npm trust github "$pkg" --repo d3plus/d3plus --file publish.yml --allow-publish --yes
  sleep 2
done
```

npm asks for 2FA on the first package (a one-time password or a browser
login), then skips it for about five minutes, long enough for the rest. Keep
the loop reading from the terminal: piping the package names into it leaves
npm no terminal to ask on, and it fails with `EOTP`. A package that already
trusts the workflow fails the same command harmlessly; `npm trust list <pkg>`
shows what a package trusts.

A brand-new package has to be published once by hand before npm can trust a
workflow for it.
