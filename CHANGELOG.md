# Changelog

All notable changes to D3plus are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## 4.3.0

### Added

- **Official framework wrappers — Vue, Svelte, Web Components, and Angular.** Alongside the existing `@d3plus/react`, four new packages drop a d3plus chart into any framework: `@d3plus/vue` (Vue 3 components), `@d3plus/svelte` (a `use:d3plus` action), `@d3plus/element` (framework-agnostic custom elements via `defineElements`), and `@d3plus/angular` (a standalone `D3plusVizComponent`). All five share a renderer core extracted into `@d3plus/dom`, so they behave identically: each reuses its chart instance across config changes (so charts tween instead of tearing down and re-entering), no-ops on a structurally-identical config, supports `forceUpdate` and a global config baseline, and destroys on teardown. (#716) [Frameworks guide ↗](https://d3plus.org/?path=/docs/guides-frameworks--docs)
- **Server-side rendering — `@d3plus/ssr`.** Render any chart to an SVG string or a PNG buffer in Node, with no browser: `renderToStaticSVG`, `renderToStaticPNG`, `renderToCanvas`, plus `installDom`/`withDom` helpers. Geomap works headless too — basemap tiles are fetched server-side and inlined into the scene graph, so the output is self-contained — as does the Canvas backend. `jsdom` and `@napi-rs/canvas` are optional peer dependencies. `Viz` gains `toSVGString()` and `toCanvas()`; `@d3plus/render` exposes a pluggable `setCanvasBackend()` and `CanvasRenderer.whenSettled()`; and `@d3plus/react` now emits the `"use client"` directive for the Next.js App Router. (#375) [Server-Side Rendering guide ↗](https://d3plus.org/?path=/docs/guides-server-side-rendering--docs)

### Fixed

- **Multi-point shapes (`Line`/`Area`) now report a single, consistent datum.** They had no "representative datum," so different accessors disagreed and interactions reported the wrong point. Every paint accessor now sees the same merged aggregate that drives the scene node, id, and aria (#785). Mouse events on `Plot` charts now report the point **nearest the cursor** along the discrete axis — un-zoomed and defined-points-only — instead of the whole-series aggregate, so stacked-area and line tooltips finally name the point under the pointer (#786). This branch also **restores `Line`'s fat invisible hit area** (dropped in the v4 scene rewrite) so hovering anywhere along a line registers — with stroke-aware path hit-testing on the Canvas backend — and fixes two paint regressions it exposed: hovered hit areas rendering solid black, and `LinePlot` confidence bands rendering grey instead of the line's color.
- **Non-plottable (`NaN`/`null`) values are filtered out of `Plot` data.** A `NaN` on an axis previously coerced to `0` (a phantom mark at the baseline) on the aggregated path, or emitted a broken `…L268.75,NaN` coordinate the browser rejects on the raw-leaves `Line` path. `formatPlotData` now drops rows whose `x`/`y` — or a defined `x2`/`y2` — aren't plottable, before domains, stacking, and paint read the data, so a `NaN` measure no longer widens a domain, stacks as `0`, or breaks the path; the point is simply absent. A bare `undefined` is left alone (that's how an unused secondary axis reports "no value"), so charts without `x2`/`y2` are unaffected. (#776)

### Developer & tooling

- `@d3plus/react` was refactored onto the shared `@d3plus/dom` core (config merge/diff + loader routing), with behavior unchanged. Vite dev harnesses were added for each wrapper (`@d3plus/angular` via `@analogjs/vite-plugin-angular`), and the release script builds ESM once up front and tests via `pnpm -r run test` to avoid a double build.

## 4.2.0

### Added

- **Value- and field-based stack ordering.** `stackOrder("ascending" | "descending")` now orders stacked series by their summed value (d3-aligned), the most-requested control on stacked charts (#527). You can also order by any data field — pass a value accessor, or a `{value, order}` config — with values aggregated by sum, not just the plotted measure. Explicit `string[]` orders and d3's `"insideOut"`/`"appearance"`/`"reverse"` still work. [Order by value ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#stack-order-by-value) · [Order by field ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#stack-order-by-field) · [Streamgraph ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#streamgraph)
- **`backgroundImageFit` for shape background images** (`shapeConfig`). `"cover"` (the default) fills the shape's bounding box and clips to its outline; `"contain"` fits the whole image inside the shape's largest inscribed rectangle, centered. Aspect ratio is preserved in both, on both the SVG and Canvas backends. [Path example ↗](https://d3plus.org/?path=/docs/core-shapes-path--d3plus#background-image) · [Stacked area icons ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#shape-background-images)
- **DOM-free path geometry in `@d3plus/math`.** A new SVG path parser (`pathParse`, handling every command including arcs and glued flags) and `pathBounds` (exact bounds from Bézier/arc extrema, validated to <0.03px against the browser's `getBBox`). `path2polygon` was rewritten to use them, so it no longer depends on the DOM.

### Fixed

- **Shape background images were broken for `Path` (and `Area`/`Line`).** The scene emitter sized and positioned images from `width`/`height`/`cx`/`cy`/`r` fields that path geometry doesn't have, so every image collapsed to 0×0 at the origin; `Rect`/`Bar` images were also offset by half their size. Images are now emitted around each shape's real bounding box and clipped to its actual outline (path, rect, rounded-rect, circle, or area polygon), positioned in the shape's local space. Background-image groups also carry the shape's datum and a paint opacity, so hover dimming, the hover z-raise, and enter/exit fades apply to the image together with its shape, and the image no longer overwrites the shape in the pointer hit-test index. (#757)
- **Pie labels now work in SSR/Node.** The DOM-free `path2polygon` replaces the old `getTotalLength` path that returned `[]` outside a browser.
- **`.legend(false)`, `.shape("Circle")`, and `.label("x")` no longer crash.** Charts that declare these in their def `fields` generated a fluent accessor that stored raw primitives, shadowing the hand-written setter's `constant()` wrapping; readers that invoke the value as a function (e.g. `featuresLegend`) then threw on `false.bind`. The colliding fields now coerce as constants, matching the setters.
- Unknown `stackOrder`/`stackOffset` names now warn and fall back to a sensible default instead of silently resolving to `undefined` and changing or breaking the layout. `"none"`/`"data"` honor input order.

### Developer & tooling

- Upgraded to pnpm v11; workspace configuration moved from `package.json` into `pnpm-workspace.yaml`.

### Breaking changes

- **`stackOrder` `"ascending"`/`"descending"` now order by summed value**, not alphabetically by series key, and the default stack order changed from alphabetical to largest-total-on-baseline (`"descending"`). The old alphabetical behavior is available as `"key"`/`"keyReverse"` — charts relying on the previous default should set `stackOrder("key")`. (#527)

## 4.1.0

### Added

- **Text wrapping inside circles.** `textWrap` (`@d3plus/text`) gains a `shape` option (`"square"`, the default, or `"circle"`). In circle mode each line is sized to the circle's chord at its vertical position, so the text fills the interior — narrower near the top and bottom, full width through the middle — and the block stays vertically centered. The line-count search settles on the fewest lines whose real rendered widths fit within the chords, reporting truncation otherwise so a resizing `TextBox` shrinks to fit. Circle labels opt in automatically. (#736) [Example ↗](https://d3plus.org/?path=/docs/core-shapes-circle--d3plus#text-wrapping)
- Eleven previously-undeclared `D3plusConfig` fields are now typed, each matching its setter: `colorScalePadding`, `hiddenColor`, `hiddenOpacity`, `legendFilterInvert`, `legendPadding`, `noDataHTML`, `subtitle`, `subtitlePadding`, `timelinePadding`, `titlePadding`, and `totalPadding`.

### Changed

- Six `D3plusConfig` fields are widened to accept an accessor in addition to a constant — `legend`, `tooltip`, `legendPosition`, `colorScalePosition`, `thresholdName`, and `loadingHTML`. The setters already coerced these through `constant()` at runtime, so valid `.config({ … })` usage that the runtime fully supports now type-checks instead of being rejected.
- The boolean toggle accessors — the six `*Padding` fields and `legendFilterInvert` — now receive the `viz` instance when invoked as functions, matching how `loadingHTML` and `noDataHTML` already worked. Existing no-argument callbacks and plain boolean values are unaffected.

### Fixed

- `textWrap` no longer crashes when the first word is wider than its line and overflow is allowed; the first word now stays on the first line instead of advancing past an empty line buffer and reading an undefined previous line.

### Developer & tooling

- CI now tests on Node 22 and 24 (both required checks) and runs Node 26 as a non-blocking forward-compat canary; the coverage, Storybook, and codecov steps stay pinned to 22 so they run exactly once.
- CI: the Playwright browser download and system-dependency install steps now retry up to three times with a 15s backoff, so a transient apt/network hiccup on the runner retries instead of failing the job.

### Breaking changes

- **Node 20 is no longer supported.** Node 20 (Iron) reached end-of-life on 2026-04-30, so every package's `engines.node` floor is raised to `>=22`. Node 22 (Jod) and 24 (Krypton) — the Active LTS lines — are the supported and tested versions.

## 4.0.0

v4 is a ground-up re-architecture of the rendering engine. Charts now compile to a serializable **scene graph** that is painted by a pluggable backend, rather than mutating the DOM directly as they draw. **SVG remains the default backend and the rendered output is intended to match v3** — the public chart API (fluent setters, `config()`, the chart classes) is unchanged. Most users upgrade with no code changes. See [MIGRATION.md](MIGRATION.md) for details.

### Added

- **`@d3plus/render`** — a new package providing the renderer abstraction. It diffs and paints the scene graph and owns the SVG and Canvas backends.
- **Canvas backend.** Every visualization accepts `.renderer("svg" | "canvas")` (default `"svg"`). The Canvas backend paints dense, high-shape-count charts more efficiently and supports pointer hit-testing via `Path2D`. [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#rendering-to-canvas)
- **`Viz.destroy()`** disconnects the `ResizeObserver` and removes the body `touchstart` listener, preventing leaks when a chart is torn down. The React wrapper calls it automatically on unmount.
- **`@d3plus/types`** — a unified package that re-exports every d3plus type from a single import for typing config objects and parameters. React component types are in a separate `@d3plus/types/react` entry so non-React projects don't pull in React.
- **`@d3plus/core/internal`** — an opt-in entry point exposing the v4 pipeline (layout stages, `ChartDefinition`s, feature modules, `runVizPipeline`, `resolveSpec`, `installFluent`, axis measurement, …) for parity tests and advanced consumers building custom charts. The root `@d3plus/core` entry stays curated to the stable public API; the `internal` surface is not semver-stable.
- Share-of-total percentages in Pie and Donut tooltips. [Example ↗](https://d3plus.org/?path=/docs/core-charts-pie--d3plus#basic-example)
- Sankey link enter/exit animations (stroke-width grows from zero). [Example ↗](https://d3plus.org/?path=/docs/core-charts-sankey--d3plus#basic-example)
- **Motion trails.** Points that move between frames (Timeline play) sweep a tapering "cone" from their previous position to the current one, fading from the mark's color at the head to transparent at the tail. Each cone traces the mark's swept silhouette — a circle capped with a rounded tail, a rect as the convex hull of its corners (corner-to-corner off-axis). On by default for scatter `Circle`/`Rect` marks and Geomap points (opt out with `shapeConfig.Circle.trail: false`); parity across the SVG and Canvas backends. `shapeConfig.Circle.trailPersist` keeps past moves visible too — a number of step-segments, or `true` for a long fading snail-trail. Persistent trails follow the timeline's direction (growing forward, retracting on scrub-back) — a multi-period jump traces through the skipped periods rather than cutting a straight line — and draw as a single shape so overlapping turns don't darken. Setting `trailPersist` automatically switches the chart to a single-period timeline (`brushing: false`) and fixed axes (`axisPersist: true`) — the two conditions a persistent trail needs to stay coherent — so it works with the one option. [Circles ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#motion-trails) · [Squares ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#square-motion-trails) · [Persistent ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#persistent-motion-trails)
- Visual-regression, pipeline-parity, and v3↔v4 chart-compare test harnesses.
- **`colorValidate`** (`@d3plus/color`) — validates a palette against the checks that can be computed from color alone: OKLCH lightness band, chroma floor, colorblind (Machado-2009 protan/deutan/tritan ΔE) separation, and WCAG contrast vs the surface; plus an ordinal-ramp mode. The default categorical palette is now gated against it. [Example ↗](https://d3plus.org/?path=/docs/color-colorvalidate--d3plus#default-palette)
- **`colorRamp`** (`@d3plus/color`) — builds an even single-hue light→dark ramp in OKLab (holds the hue, so the pale end keeps its identity instead of drifting to white). Continuous color scales now step through it. [Example ↗](https://d3plus.org/?path=/docs/color-colorramp--d3plus#basic-example)
- **`highlight(predicate)`** — a standing emphasis: the matching marks keep their color while every other mark is de-emphasized to a neutral gray (highlight one series, gray the rest). Unlike `hover`/`active` it survives pointer movement. [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#highlighting-a-series)
- **`colorOrdinal(true)`** — treats a discrete color field as *ordered*, coloring it with a single-hue light→dark ramp instead of nominal categorical hues. [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#ordinal-color)
- OKLab/OKLCH conversions and a WCAG `contrastRatio` helper back the above.
- **Locale-aware `titleCase`.** `titleCase(str, locale)` accepts a locale code (or a `TitleCaseRules` object) and normalizes case in *both* directions — it lowercases ALL-CAPS "shouting" input and minor words, force-uppercases known acronyms (with automatic plurals, e.g. `tvs` → `TVs`), and preserves genuine mixed-case (`McDonald`, `iOS`). Per-language rule sets and a `{style: "sentence"}` mode ship as the new `titleCaseLocale` dictionary (and a `TitleCaseRules` type), exported from `@d3plus/locales`. [Example ↗](https://d3plus.org/?path=/docs/text-titlecase--d3plus)
- **Animated text font-size.** Labels whose font-size changes between renders now ease into the new size, position, and rotation (pivoted on the anchor-aware visual center) instead of snapping — in both the SVG and Canvas backends.
- **Plot circles auto-layer by size.** When a `size` accessor is set, scatter circles paint largest-behind so smaller marks stay visible on top (override with `shapeConfig.Circle.sort`).

### Changed

- **Scene-graph rendering pipeline.** Charts are declarative `ChartDefinition`s fed through a pure draw pipeline (`runVizPipeline`) composed of stages and opt-in **feature modules** (legend, color scale, timeline, zoom controls, title/subtitle/total, back button). Drawing no longer mutates instance state mid-pass.
- **Full, strict TypeScript.** The chart pipeline is now `any`-free; types are generated by `tsc` and shipped with every package.
- Per-chart folder structure (`charts/<Chart>/{index,applyLayout,emit}.ts`), with instance state namespaced under `schema`/`ctx`.
- `@d3plus/data` grouping now builds on `d3-array` (`groups`/`rollups`); the deprecated `d3-collection` dependency has been removed. `nest()` / `nestGroups()` remain exported.
- **Default color palette re-stepped for colorblind safety.** The eight primary categorical slots are new open-color steps chosen to sit inside the OKLCH lightness band, clear the chroma floor, and stay distinct under protanopia and deuteranopia (the slot order — the CVD-safety mechanism — is unchanged). Marks shift hue slightly as a result. [Example ↗](https://d3plus.org/?path=/docs/color-colorvalidate--d3plus#default-palette)
- **Continuous color scales default to a single blue hue** (magnitude reads as one hue getting darker) and diverging scales default to blue↔gray↔red (warm/cool poles that stay distinct under CVD), replacing the previous multi-hue ramp and red↔green diverging. `on`/`off` (green/red) still color boolean data. [Example ↗](https://d3plus.org/?path=/docs/core-components-colorscale--d3plus#linear-scale)
- **`colorContrast` now picks text color by WCAG contrast**, not the YIQ approximation — it returns whichever of the two text tokens has the higher contrast ratio against the background (so e.g. bright greens/teals correctly get dark text). [Example ↗](https://d3plus.org/?path=/docs/color-colorcontrast--d3plus#basic-example)
- **`.sort()` / `shapeConfig.sort` drives paint order.** A sort comparator now stamps a stable per-datum paint depth (`z`) rather than reordering the data array, so mark layering no longer disturbs the data join, layout, or enter/exit animations.
- **Timeline auto-play cadence follows the transition `duration`.** Each period fully animates before the next advances; `playButtonInterval` is the fallback cadence only when `duration` is `0` (v3 advanced on a fixed interval regardless of the transition).

### Fixed

- React charts tween between config/prop changes: the chart instance now persists across updates (`destroy()` runs only on unmount) instead of tearing down and re-entering from scratch on each render.

### Documentation & website

The documentation site (Storybook, published at [d3plus.org](https://d3plus.org)) was substantially rebuilt:

- Every example now carries a prose description, and the **"Show code" panel is live** — it rebuilds the `<Chart config={…}/>` snippet from the current control values on each change instead of showing a frozen snapshot.
- Storybook **argTypes are generated from the charts themselves.** The generator instantiates each class and reads its runtime `installFluent`/`config()` accessor surface, enriched with types and descriptions mined from the typed config interfaces — so the full configuration surface (width, domain, ticks, title, …) now appears as interactive controls.
- The sidebar was reorganized under a **Guides** root (Migration, Configuration, Rendering, Data, Interactivity, Theming, Accessibility) ahead of the Core API.
- Utility-function docs (`@d3plus/color`, `data`, `format`, `text`) render as side-by-side input → output blocks with a matching, drift-proof code snippet.
- **New example content:** motion trails (circle / square / persistent), Canvas rendering (BarChart, Geomap), interactivity (events, custom tooltip, download button, RTL locale), `highlight()` and ordinal color, five color-scale types, the CVD-color utilities (`colorRamp`, `colorValidate`), first-time example pages for every shape and axis primitive, and function-call demos for the color/data/format/text utilities.

### Developer & tooling

- **Testing.** New real-Chromium **visual-regression** snapshots (a structural fingerprint per chart, regenerated with `UPDATE_SNAPSHOTS=1`), jsdom **pipeline-parity** snapshots, DOM-vs-scene **render-parity** checks, a full `@d3plus/render` unit suite, and dev harnesses (`chart-compare` for v3 / v4-SVG / v4-Canvas contact sheets, `chart-screenshots`, and `story-render-check`). Playwright/Chromium is now a test dependency, and CI runs a `build:types` declaration-emit typecheck across every package.
- **Docs generation** was rebuilt for the v4 charts: README config tables and Storybook argTypes are derived from each `ChartDefinition`'s fields, the runtime `installFluent` accessors, and the typed config interfaces (not just JSDoc); README source links pin to `main` so regeneration no longer churns every "Defined in" link.
- **Build & packaging.** Every root entry file (`index`, `internal`, `react`, `umd-entry`) is transpiled to ESM; `@d3plus/core`'s UMD/CDN global exposes the v4 pipeline via a `umd-entry.ts` superset while the typed ESM entry stays curated; the release script syncs all workspace versions so none ship pinned to a stale version; `@d3plus/types` ships types-only (no UMD) with `@d3plus/react` as an optional peer so non-React projects don't pull in React.
- **Lint.** `max-lines` (500) and `max-lines-per-function` (100) are now enforced (data dictionaries exempt), which drove several oversized modules to be split.
- **Dev server** live-reload is scoped per tab — editing one chart's dev page reloads only the tabs viewing it, and each tab drops its SSE connection while hidden, so many open dev pages no longer exhaust the browser's per-host connection limit.
- **Contributor docs** (`AGENTS.md`, `CONTRIBUTING.md`) were rewritten for the v4 architecture and the TypeScript / TypeDoc / Storybook toolchain.

### Breaking changes

- **React `forceUpdate` is now a top-level prop**, not a `config` key. Use `<Treemap forceUpdate />` instead of `config={{forceUpdate: true}}`.
- Code that reached into a chart's intermediate DOM/d3-selection internals during the draw pass, or subclassed `Viz` and overrode private `_draw` internals, may need updating — drawing now flows through the scene-graph pipeline. The public fluent/`config()` API is unchanged.

### Known limitations

- The **SVG backend remains the default**; both backends paint shapes, gradients, and texture/pattern fills. The Canvas backend is optimized for dense, high-shape-count charts where paint performance matters.
