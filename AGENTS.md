# AGENTS.md — d3plus

Guidelines for AI agents working in this repository.

## Project Overview

d3plus is a JavaScript data visualization library that extends D3.js. It is organized as a **pnpm monorepo** with workspaces under `packages/`. Each package is independently publishable under the `@d3plus/` npm scope.

### Packages

| Package | Purpose |
|---|---|
| `@d3plus/color` | Color utilities and defaults |
| `@d3plus/core` | All chart types, components, and shapes |
| `@d3plus/data` | Data manipulation and filtering |
| `@d3plus/dom` | DOM utilities |
| `@d3plus/export` | SVG/image export |
| `@d3plus/format` | Number and date formatting |
| `@d3plus/locales` | Translation dictionaries |
| `@d3plus/math` | Math utilities |
| `@d3plus/render` | Scene-graph renderer abstraction + SVG/Canvas backends |
| `@d3plus/react` | React component wrappers |
| `@d3plus/text` | Text measurement and wrapping |
| `@d3plus/types` | Unified TypeScript type definitions |
| `@d3plus/docs` | Storybook documentation site (private, not published) |

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
identity-coerce properties come from the schema.

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
`{name, features, fields?, ctx?, layoutStage?, emit?, thresholdFunction?,
chartTransform?, setup?, …}`. `makeChart(def, Base = Viz)`
(`charts/definition/makeChart.ts`) produces the class: its constructor runs
`applyDefinition(this, def)` (seeding `fields`/`ctx` and installing fluent
accessors), and its `_draw` runs the shared Viz pipeline then the chart's own
`layoutStage` via `runChartDraw`.

Two kinds of def:

- **Data-driven** (`emit(ctx) → SceneNode[]`): Treemap, Pack, Pie, Tree,
  Network, Sankey, Rings, Geomap, Matrix, RadialMatrix, Priestley, Radar.
- **Paint-driven** (`paintDriven: true`): the Plot family (BarChart, LinePlot,
  AreaPlot, StackedArea, BoxWhisker, BumpChart). `Plot._paint` (via `plotPaint`)
  builds `viz._chartScene`; there is no `emit` step.

`makeChart`'s `Base` argument lets a chart specialize another: e.g.
`makeChart(barChartDef, Plot)`, `makeChart(donutDef, Pie)`.

### Feature modules

Chart "chrome" (legend, color scale, timeline, title/subtitle/total, back
button, attribution, zoom controls) are **opt-in `FeatureModule`s**
(`charts/features/`). A def lists the features it composes in
(`features: [backFeature, titleFeature, …]`); `runLayout` runs each feature's
`layout()`, which claims margin and returns a panel to compose into the scene.

### The pipeline

The draw flow exists as free functions so it can run without the class
lifecycle:

- `vizPreDraw` / `vizPreDrawPure` — data prep (draw depth, filtered/legend data,
  threshold).
- `vizDraw` / `vizDrawPure` — feature layout + margin/panel assembly.
- `runVizPipeline(viz)` — the full orchestrator (`_preDraw → _draw → features →
  paint`).
- `resolveSpec(viz)` — frozen config/context snapshot (the config↔context
  boundary).

These operate on returned values rather than mutating `this` at the outer layer.

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
  test/             # Mocha tests (*-test.js, run against es/)
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

The `scripts/dev.js` watcher rebuilds ESM and UMD outputs when source changes.

### Building

```bash
# Build ESM for all packages (run before testing)
pnpm -r --if-present run build:esm

# A single package's ESM / UMD / types
pnpm --filter @d3plus/core run build:esm
pnpm --filter @d3plus/core run build:umd
pnpm --filter @d3plus/core run build:types   # tsc (emits .d.ts)
```

### Testing

```bash
pnpm test                          # all packages (pretest builds ESM first)
pnpm --filter @d3plus/core test    # a single package
```

Each package's test script runs ESLint on `index.ts`/`src/**` (core also lints
`internal.ts`/`umd-entry.ts`), then Mocha on `test/**/*-test.js`. Tests import
from `es/` (generated) and use JSDOM; some core tests drive a real browser via
Playwright/Chromium (visual-regression snapshots, render parity).

### Documentation

```bash
pnpm run docs      # Generates markdown docs + Storybook args from TypeDoc
```

`scripts/docs/docs.js` also propagates the root `package.json` version into every
workspace package — the release flow relies on this.

## Code Conventions

- **File format:** ES modules everywhere (`type: "module"`). Named exports.
- **TypeScript:** all source is `.ts` (`.tsx` for React). Strict mode on; the
  chart pipeline is `any`-free — keep it that way.
- **Private properties:** prefixed with `_` (e.g. `this._color`).
- **Getter/setter methods:** same method name handles both — no argument returns
  the stored value, an argument stores and returns `this`.
- **Formatting:** Prettier with `arrowParens: "avoid"` and `bracketSpacing:
  false`.
- **Linting:** ESLint flat config (`eslint.config.js`). Fix lint before
  committing; `max-lines` rules are enforced — split oversized files.
- **TypeDoc:** add TypeDoc comments to public methods; `pnpm run docs` reads
  them.

## Adding a New Chart Type

1. Create `packages/core/src/charts/MyChart/`:
   - `applyLayout.ts` — export a `TransformStage` (`applyMyChartLayout`) that
     reads the viz and attaches laid-out `shapeData`.
   - `emit.ts` — export a pure `emit(ctx) → SceneNode[]` (use the helpers in
     `charts/features/emitHelpers.ts`). Skip this for a paint-driven chart.
   - `index.ts` — declare the `ChartDefinition` (`name`, `features`, `fields`,
     `layoutStage`, `emit`, …) and `export default makeChart(def[, Base])`.
     Put `ctx` + `fields` last in the def object.
2. Export the class from `packages/core/src/charts/index.ts`.
3. Export the class from `packages/core/index.ts`. Export any reusable
   stage/def from `packages/core/internal.ts` (not `index.ts`).
4. Add a Storybook story under `packages/docs/`.
5. Add a Mocha test in `packages/core/test/` (`*-test.js`).

To specialize an existing chart, pass a `Base` to `makeChart` (e.g.
`makeChart(myDef, Plot)`).

## Common Pitfalls

- **Always build ESM before running tests.** Tests import from `es/` (generated).
  The root `pretest` does this; for a single isolated package run
  `pnpm --filter @d3plus/<pkg> run build:esm` first.
- **`es/`, `umd/`, and `types/` are gitignored.** Do not commit build output.
- **`dev/` HTML pages are committed** as shared manual test harnesses — unlike
  build output, they are tracked.
- **New pipeline exports go in `internal.ts`, not `index.ts`** — keep the public
  API surface curated.
- **Circular dependency warnings from Rollup are suppressed** in the build
  config. Don't introduce new cross-package circular dependencies.
- **Releases require `GITHUB_TOKEN`.** Don't run `pnpm run release` without it.

## Running a Release

Releases are automated. Do not run this unless you are the maintainer and have
confirmed all tests pass:

```bash
GITHUB_TOKEN=<token> node scripts/release.js
```

The script prompts for the new version, runs tests/builds/docs (which writes the
version into every package), then commits, tags, publishes all packages to npm
with `--access=public`, and creates a GitHub release.
