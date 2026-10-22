# Changelog

All notable changes to D3plus are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## Unreleased

### Added

- **`colorGray`** (`@d3plus/color`): the gray scale d3plus uses for neutral ink, keyed 50–900.
- `finite`, `clamp`, and `pathCommands` in `@d3plus/math`, `colorGrayscale` in `@d3plus/color`, and `softHyphen` in `@d3plus/text`. [finite ↗](https://d3plus.org/?path=/docs/math-finite--d3plus) · [clamp ↗](https://d3plus.org/?path=/docs/math-clamp--d3plus) · [pathCommands ↗](https://d3plus.org/?path=/docs/math-pathcommands--d3plus) · [colorGrayscale ↗](https://d3plus.org/?path=/docs/color-colorgrayscale--d3plus) · [softHyphen ↗](https://d3plus.org/?path=/docs/text-softhyphen--d3plus)

### Changed

- **Smaller installs.** Published packages no longer include source maps, and each package's README links to its full API reference (`API.md` on GitHub) instead of embedding it. `@d3plus/core` drops from ~8.3 MB to ~2.8 MB gzipped. The CDN entry (`jsdelivr`/`unpkg`) now serves the minified `.full.min.js` bundle; the `browser` field is gone.
- **Fewer dependencies.** `open-color` and `file-saver` are no longer dependencies, and `@d3plus/data`, `@d3plus/render`, and `@d3plus/text` drop dependencies they didn't use. `@d3plus/export` loads `html-to-image` only when saving an HTML element. `@d3plus/types` re-exports types only.
- **`findLocale`** resolves from a 122-entry table instead of the full LCID and ISO 639 lists (~8,400 lines). Chechen (`ce`) now resolves to `ce-RU`.
- **`unique`** keeps one `NaN` instead of dropping every `NaN`.
- **`strip`** keeps the base letter of any accented letter (`Č` → `C`, `ğ` → `g`); it used to drop letters outside Latin-1. Its output for Latin-1 is unchanged.
- **Sankey** lays out with a TypeScript port of d3-sankey, so `d3-sankey` and its older copies of `d3-array`, `d3-shape`, and `d3-path` are no longer installed. Layouts are identical; link paths are written with 3 decimal places, like every other d3plus shape.
- **`@d3plus/ssr`** fetches map tiles with Node's `http`/`https` modules instead of `undici`. Private and loopback addresses are still refused at connect time.
- **No Node `engines` requirement on the browser packages.** Only `@d3plus/ssr`, which runs in Node, declares `node >= 22`.
- **ES2022 modules.** The `es/` builds are compiled to ES2022 instead of ES5, so they keep classes, `?.` and `??` as written instead of shipping down-leveled helpers. The UMD bundles were already modern. A bundler that targets older browsers must transpile `@d3plus/*`.
- **Smaller minified bundles.** The `.min.js` bundles keep license comments only: `d3plus-core.full.min.js` goes from 2.19 MB to 1.38 MB (425 KB gzipped).
- **Text no longer breaks after `/` before a letter** (`USA/Canada`, `and/or`), matching Chrome and Safari. `@d3plus/dom` and `@d3plus/text` measure and segment text with `@chenglou/pretext` 1.0.
- **Dependencies:** `@d3plus/core` uses `d3-composite-projections` 2 (same projections, now with TypeScript types).

### Fixed

- `flattenPath` in `@d3plus/render` reads compact arc flags (`a1 1 0 011 1`) as two flags instead of one number.
- The standalone (non-`.full`) UMD bundles read their dependencies from the globals those libraries define (`d3` for the `d3-*` modules, `d3plus` for `@d3plus/*`, `topojson`, `FloatingUIDOM`, …). They looked for names like `d3Color` that nothing defines.
- A Plot too small for its title, timeline, axes or facet panels no longer draws bars, hover areas and forecast regions with negative sizes.
- Shape background images in a Plot stay above the circles they belong to; clipping them to the plot area had moved them below.
- On d3plus.org, the examples that set `fill`, `stroke` or `color` to an accessor function (Area, Line, TextBox) render again, and the Geomap, Matrix, RadialMatrix and shape-background-image examples load their data.

### Removed

- **Geomap projection names outside the built-in set.** `projection` accepts the d3-geo projections plus `geoAlbersUsaTerritories`, `geoMiller`, `geoRobinson`, and `geoWinkel3` by name; pass any other projection as a function (e.g. `.projection(geoBertin1953())`). An unknown name warns and falls back to Mercator.
- `Viz.renderScene()` and `Viz.renderMode()`. Use `select(target).renderer("svg" | "canvas").render(callback)` instead.
- `backConfig()`, which had no effect. Style the back button with `backControlStyle` and `backControlClassName`.
- `domToScene` from `@d3plus/render`.

### Developer & tooling

- **Tests run on Vitest.** `pnpm test` lints, then runs every package's tests in one Vitest run against the TypeScript source, so nothing is built first. Core's browser tests run in Vitest browser mode (Playwright Chromium), and node tests measure text with `@napi-rs/canvas` instead of node-canvas. `pnpm test:built` checks the built `es/` output, and the release script runs it.
- **Pull requests test only what they affect.** CI runs the tests and coverage of the packages a pull request changes plus their dependents, or of every package when it changes shared config, test helpers, scripts or the lockfile. Pushes to `main` test everything. Node 22, 24 and 26 all gate merges, and `.nvmrc` pins 26.
- **Prettier formats the repo.** `pnpm format` rewrites and `pnpm format:check` (run in CI) verifies; the docs generator formats what it writes. `.git-blame-ignore-revs` lets `git blame` skip the formatting commit (`git config blame.ignoreRevsFile .git-blame-ignore-revs`). The files and functions Prettier's wrapping took past ESLint's `max-lines` limits are split into smaller modules and steps.
- **Storybook runs on Vite** (`@storybook/react-vite` instead of `@storybook/nextjs`), which drops Next.js and webpack from the install. Shared dependency ranges live in a pnpm catalog. ESLint 10 runs once over the repo (`pnpm lint`, including `scripts/`), on TypeScript 6 and Vite 8. Dependabot opens grouped monthly updates; TypeScript 7 waits until typescript-eslint and TypeDoc support it.
- **Release script.** `pnpm run release` checks that `main` is clean and in sync with origin and that `gh` and npm are logged in before changing anything, validates the version, always rebuilds, prints one line per step (a failing step prints its output), publishes prereleases under the `next` dist-tag, creates the GitHub release with `gh`, and restores the working tree when it stops before the commit.
- **Quieter scripts.** Builds print one line per package under `pnpm -r` or CI (`VERBOSE=1` prints every file), and the docs generator prints TypeDoc warnings only and fails when a package fails.
- The `.full` UMD bundles compile sibling packages from source, and a package with no dependencies (`@d3plus/locales`) writes its `.full` bundles as copies of the standalone ones instead of building them twice.
- Viz's const-wrapped and deep-merged config accessors (`title`, `legend`, `tooltip`, `tooltipConfig`, `legendConfig`, …, 36 in all) are generated from `vizFields.ts` too, so `VizBaseConfig` folds into `VizBase`, which keeps only the setters with real logic. The generated accessors are typed from `D3plusConfig` on `VizBase` (they were `any`), which adds the keys it was missing (`color`, `shape`, `messageStyle`, `subtitleConfig`, `timelineConfig`, `totalConfig`) and types Axis and TextBox `shape`.
- Viz's 42 config accessors that store their value as given (`zoomControlStyle`, `detectResize`, `attribution`, …) are generated from `charts/viz/vizFields.ts` instead of hand-written, with their descriptions and types on `D3plusConfig`, which now types 22 keys it was missing.
- API.md documents every class's generated config accessors in a "Config accessors" table with type, default and description, including the 26 Viz accessors (`duration`, `width`, `zoomFactor`, …) and the shape and component accessors it didn't list before. Storybook args show their real defaults.
- `@d3plus/render` exports `arcPath` and `FULL_TURN`, and `@d3plus/core/internal` adds `rowLegend`, `shareRow`, and the `VizDrawResult` type; `vizDraw` returns the margin it claimed and its panels.
- `@d3plus/core/internal` drops `createFluent` and `FluentInstance` (use `installFluent`), `vizPreDrawPure` and `vizDrawPure` (use `vizPreDraw` and `vizDraw`), `polarLegend` (use `rowLegend`), ParallelCoordinates' `grayscale` (use `colorGrayscale`), and `sunburstShadeAmount` (use `partitionShadeAmount`). Its `VizContext` type is the pipeline stage context.
- `ChartDefinition` drops its unread `features` field.
- **npm publishing runs in CI.** Publishing a GitHub release (which `pnpm run release` does) runs the "Publish to npm" workflow, which publishes every package through npm trusted publishing (OIDC, no npm token) with provenance, dependencies first. `pnpm run release` no longer needs an npm login.
- **Dev server** (`pnpm --filter @d3plus/<pkg> run dev`) serves a package's `dev/` pages through Vite instead of a hand-written HTTP server, and reloads through Vite's client instead of an injected Server-Sent Events snippet. URLs, port (`DEV_PORT`), the generated index, and per-page reloads are unchanged; `chokidar` is no longer a dependency.

## 4.8.0

4.8 is the biggest release of v4. It adds twenty chart types, bringing the total to 41, and small multiples: `facet` splits any chart into a grid of panels. Plot charts get axis breaks, error bars, forecast annotations, nested confidence bands, fills between series, and zoomable time axes. Axis labels rotate or thin evenly instead of disappearing, and date labels keep their year. Nested config objects now deep-merge, and charts read better on dark pages. Many of these change what existing charts look like; see the breaking changes.

### Added

- **Twenty new chart types**, each available in every framework wrapper:
  - **Hierarchy and part-to-whole:** Sunburst (#904; closes #288), Icicle (#934), Waffle (#930), Funnel (#928), and Marimekko (#939; closes #437). [Sunburst ↗](https://d3plus.org/?path=/docs/core-charts-sunburst--d3plus) · [Icicle ↗](https://d3plus.org/?path=/docs/core-charts-icicle--d3plus) · [Waffle ↗](https://d3plus.org/?path=/docs/core-charts-waffle--d3plus) · [Funnel ↗](https://d3plus.org/?path=/docs/core-charts-funnel--d3plus) · [Marimekko ↗](https://d3plus.org/?path=/docs/core-charts-marimekko--d3plus)
  - **Distributions:** Beeswarm (#903; closes #787), Violin and Ridgeline (#936; closes #203). [Beeswarm ↗](https://d3plus.org/?path=/docs/core-charts-beeswarm--d3plus) · [Violin ↗](https://d3plus.org/?path=/docs/core-charts-violin--d3plus) · [Ridgeline ↗](https://d3plus.org/?path=/docs/core-charts-ridgeline--d3plus)
  - **Comparison:** Lollipop and Dumbbell (#935), Waterfall (#929), Pyramid (#897, #927; closes #216), and ParallelCoordinates with axis brushing (#937). [Lollipop ↗](https://d3plus.org/?path=/docs/core-charts-lollipop--d3plus) · [Dumbbell ↗](https://d3plus.org/?path=/docs/core-charts-dumbbell--d3plus) · [Waterfall ↗](https://d3plus.org/?path=/docs/core-charts-waterfall--d3plus) · [Pyramid ↗](https://d3plus.org/?path=/docs/core-charts-pyramid--d3plus) · [ParallelCoordinates ↗](https://d3plus.org/?path=/docs/core-charts-parallelcoordinates--d3plus)
  - **Single values and KPIs:** Gauge (#884; closes #61) and Bullet (#933). [Gauge ↗](https://d3plus.org/?path=/docs/core-charts-gauge--d3plus) · [Bullet ↗](https://d3plus.org/?path=/docs/core-charts-bullet--d3plus)
  - **Radial:** PolarArea (Nightingale rose) and RadialBar (#940). [PolarArea ↗](https://d3plus.org/?path=/docs/core-charts-polararea--d3plus) · [RadialBar ↗](https://d3plus.org/?path=/docs/core-charts-radialbar--d3plus)
  - **Time:** Calendar heatmap (#931), Candlestick with an OHLC variant (#932), and FanChart (#938; closes #212). [Calendar ↗](https://d3plus.org/?path=/docs/core-charts-calendar--d3plus) · [Candlestick ↗](https://d3plus.org/?path=/docs/core-charts-candlestick--d3plus) · [FanChart ↗](https://d3plus.org/?path=/docs/core-charts-fanchart--d3plus)
- **Small multiples.** `facet` splits any chart into a grid of panels, one per value of a key. The panels share one title, legend, colorScale, timeline, set of colors, and hover/legend state. `facetConfig` sets the grid (`columns`, `rows`, `padding`, `sort`), panel titles, and whether Plot panels share their scales (`scales: "shared"` or `"independent"`). Works with every chart type, on both renderers, and under `@d3plus/ssr`. (#907, #909, #914) [Guide ↗](https://d3plus.org/?path=/docs/guides-small-multiples--d3plus) · [BarChart ↗](https://d3plus.org/?path=/docs/core-charts-viz--d3plus#small-multiples) · [Independent scales ↗](https://d3plus.org/?path=/docs/core-charts-viz--d3plus#small-multiples-independent-scales) · [Treemap ↗](https://d3plus.org/?path=/docs/core-charts-viz--d3plus#small-multiples-treemap)
- **Axis breaks.** `xBreak`/`yBreak` cut one or more ranges out of any linear axis, and the gap is cut through the shapes that cross it. BarChart, Histogram, AreaPlot, and StackedArea draw a baseline break back to 0 when their value domain (or `baseline`) stops short of it. Style breaks with `breakConfig` and `baselineBreakConfig`. (#888, #944, #945, #970; closes #645, #766, #767) [Baseline break ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#baseline-break) · [Outlier bar ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#outlier-bar-break) · [LinePlot ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#axis-break)
- **Error bars.** `confidence` on a BarChart, or any Plot that draws bars, draws a capped error bar on each bar, including stacked and horizontal bars. Style them with `confidenceConfig`. Tooltips list the lower and upper bounds. (#905; closes #781) [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#error-bars) · [Stacked ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#error-bars-stacked)
- **Forecast annotations.** `forecast` marks where a line or bar chart's forecast starts, with a shaded backdrop, a dashed rule, a translated "Forecast" label, and dashed lines from there on. It takes a predicate on the data, `"auto"` (where the confidence bands open up), or a start value. Trend-line projections get it automatically. Style it with `forecastConfig`. (#943) [Example ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#forecast-start)
- **Nested confidence bands.** `confidence` also takes a list of bands, outermost first, drawn from lightest to darkest around each line (`confidenceConfig.bandOpacity`). (#947) [Example ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#nested-confidence-bands)
- **Fill between series.** `fillBetween` shades the area between two lines in the color of whichever is higher, switching where they cross. (#946; closes #283) [Example ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#fill-between) · [Temperature range ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#temperature-range)
- **Variable bar widths.** `barWidth` makes each bar as wide as its own measure, end to end along a cumulative axis. `barWidthShare` adds each bar's share of the total width to its label. (#939) [Example ↗](https://d3plus.org/?path=/docs/core-charts-marimekko--d3plus#variable-width-bar-chart)
- **Swarm layout on any Plot.** `swarm` packs circles along their value axis without overlap, in lanes per category, with `swarmConfig` for padding and overflow. It animates when switched on or off. (#903) [Example ↗](https://d3plus.org/?path=/docs/core-charts-beeswarm--d3plus#scatter-to-swarm)
- **Zoom and pan on time axes**, with the wheel, drag, brush, and zoom buttons. (#955)
- **Radar level labels.** The rings are labeled with round values (`levels`, `levelLabels`, `levelLabelAngle`, `levelFormat`, `levelLabelConfig`), styled like a Plot axis, and the web is sized to fit its metric labels (`outerPadding: "auto"`). (#896; closes #769) [Example ↗](https://d3plus.org/?path=/docs/core-charts-radar--d3plus#level-labels)
- **Legends for color categories.** A chart colored by a categorical key that isn't one of its `groupBy` levels shows a legend of those categories, with hide, solo, and hover working on each. (#902) [Example ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#color-by-category)
- **`legendPosition` and `colorScalePosition` accept `"auto"`**, the new default: inside the chart when there's room, otherwise right or bottom depending on the chart's shape. (#964) [Guide ↗](https://d3plus.org/?path=/docs/guides-legends--d3plus#placement)
- **`shapeConfig.backgroundImage` and `texture` fill every chart's filled marks**, not just the Plot family. (#901, #948) [Treemap ↗](https://d3plus.org/?path=/docs/core-charts-treemap--d3plus#background-images) · [Pie ↗](https://d3plus.org/?path=/docs/core-charts-pie--d3plus#background-images)
- **Stacked bars grow up their stack** on first draw, one segment after another. (#979) [Guide ↗](https://d3plus.org/?path=/docs/guides-animation--d3plus#entering-marks)
- **Kernel density helpers in `@d3plus/math`:** `kernelDensity`, `gaussianKernel`, `epanechnikovKernel`, and `silvermanBandwidth`. (#936) [Example ↗](https://d3plus.org/?path=/docs/math-kerneldensity--d3plus)
- **Date helpers in `@d3plus/format`:** `formatDateFull` labels a date read on its own, such as in a tooltip, and `dateFormatter`/`dateFullFormatter` label a whole array of dates in linear time. (#917, #965) [Example ↗](https://d3plus.org/?path=/docs/format-formatdatefull--d3plus)
- **`findWeekStart`** in `@d3plus/locales` returns a locale's first day of the week. (#931) [Example ↗](https://d3plus.org/?path=/docs/locales-findweekstart--d3plus)
- `D3plusConfig` types `orient`, and `@d3plus/core` exports the `CssColor`, `Orient`, `SideOrient`, and `FacetConfig` types along with option types for the new charts. (#907, #910, #942)
- Translations for the new chart, tooltip, and forecast labels in `ar-SA`, `es-ES`, `pt-BR`, and `zh-CN`.

### Fixed

- **Axis labels.**
  - Category labels that don't fit rotate, then thin evenly, instead of being blanked, cut short, or broken mid-word, and vertical axes no longer hide every other label that had room. (#952, #920)
  - Date labels fit whole, keep the year on the first visible label after each year boundary, and show the hour on hourly end labels. (#957)
  - Date values on category axes and in tooltips are formatted as dates, and drawing thousands of them takes seconds instead of minutes. (#954, #965)
  - Plot tooltips label time values the way the axis does. (#917)
  - Year values print in full ("1990", not "1.99k") on continuous axes and color scales. (#918)
  - The "0" tick label shows again. (#877)
  - A forced domain-end label that crowds its neighboring tick is dropped. (#880)
  - A short Plot's x axis shows its two end labels, flush to the chart edges. (#883)
  - The first and last x labels no longer hang past the chart's edges, and x labels are measured at the plot's final width. (#926, #941, #966, #983)
- **Domains.**
  - `xDomain`/`yDomain` work on discrete and time axes instead of drawing NaN paths or being ignored. (#950, #951)
  - AreaPlot and StackedArea honor a value-domain minimum. (#944)
  - Plot's marks are clipped to the plot area when the domain cuts the data off. (#949)
- **Layout.**
  - Default-position legends and colorScales paint in their own margin instead of overlapping the chart on first render. (#911, #913)
  - Titles and top legends that don't fit beside the corner controls drop below them, in whole words, instead of being truncated or lost, and the chart body leaves a gap below the controls. (#959, #960, #961, #969)
  - Generic page CSS (such as `div {padding: 25px}`) no longer resizes or shifts d3plus's own controls and overlays. (#963)
  - A chart in a container with no height of its own reserves its height on the page. (#958)
  - The chart's SVG takes its final size on the first draw instead of growing from 300×150. (#978)
  - A left legend no longer offsets Plot's background and hover surface from the plot. (#878)
- **Config.**
  - Nested config objects set through chart fields and hand-written setters (`shapeConfig`, `tooltipConfig`, `xConfig`, `axisConfig`, …) deep-merge, and `RESET` works in direct setter calls at any depth. (#890, #892, #893)
  - Internal config and the Back control no longer trigger unknown-property warnings. (#894, #895)
  - Stacked Plot, Pie, and Treemap no longer overwrite a `share` field in the user's data. (#885)
- **Interaction.**
  - Hover no longer throws on Pack legend entries, Matrix cells without a colorScale, or when leaving parts of the chart that have no data. (#873, #874, #875)
  - Two charts on one page no longer share tooltip ids, which could leave the second chart's tooltip hidden. (#912)
  - A legend tooltip hides when the pointer leaves an entry that stands for several groups. (#974)
  - Hovering a stacked bar's label shows the bar's tooltip. (#925)
  - Tooltip and legend titles show a shape swatch on every chart, including when hovering a shape's label. (#872)
  - `click.Box` and other composite-shape events fire for each part of the shape. (#980)
  - A timeline click no longer starts a zoom gesture that never ends, and zoom events that don't move the view no longer cut transitions short. (#906, #908)
- **Rendering.**
  - Canvas draws rounded rect corners, and entering groups show at once instead of fading in. (#916, #977)
  - Custom path textures draw, and Line and Area texture accessors read their merged row. (#898, #953)
  - Line shapes no longer draw `backgroundImage` inside their paths. (#956)
  - SVG transitions start from the beginning after a slow render, and inset legend placement is faster. (#889)
  - The web-font redraw waits until the entrance animation finishes. (#981)
  - Canvas no longer retries failed image and pattern decodes forever. (#915)
  - Box parts have stable scene keys, so they move with their category across redraws. (#975)
  - Pie/Donut share labels no longer change at random between page loads. `largestRect` in `@d3plus/math` is now deterministic. (#891)
- **Dark backgrounds.** Titles, subtitles, and totals contrast with the chart's background, gridlines are quieter, and Plot axes are easier to read. (#879, #882)
- **Components.**
  - A TextBox with a fixed `fontSize` draws at that size instead of clamping it to `fontMin`/`fontMax`, and it draws in boxes narrower than `fontMin`. (#881, #924)
  - A time-scale Axis parses date strings in its data. (#900)
  - A numeric `shapeConfig.Circle.r` no longer crashes Plot. (#921)
- **Histogram** applies `filter`, time periods, and facet panels to its raw rows before binning. (#914, #923)
- `saveElement` in `@d3plus/export` reports render failures to its callback instead of rejecting silently. (#973)
- `@d3plus/ssr` keeps Node's native `btoa`/`atob`, which jsdom's versions broke with a stack overflow. (#922)
- `browserslist` is upgraded to 4.28.9 for CVE-2026-73088. (#851)

### Documentation

- Every new chart has its own page of stories, and there is a new [Small Multiples guide](https://d3plus.org/?path=/docs/guides-small-multiples--d3plus). (#907)
- Storybook args are generated for every `makeChart` chart, and color settings get color-picker controls. (#919, #942)
- "Show code" defines story data above the config and prints function accessors as code. (#886)
- The homepage logo animation is realigned and shows off legends, confidence bands, and annotations. (#887)
- Generated config tables show negative defaults, the Treemap guides use `sum`, and wide tables no longer widen pages on phones. (#876, #967, #871)

### Developer & tooling

- `ChartDefinition` gains a `decorateScene` hook for adding to a chart's scene, and `@d3plus/core/internal` adds `mergeConfigBag`, `resolvesReset`, `isFluentAccessor`, and `outsideBaselineBreak`. (#893, #892, #937, #970, #985)
- `@d3plus/render` adds `resetInjectedBoxes`, `flattenPath`, and the `EnterWindow`/`FadeSwap` transition helpers. (#963, #977, #979)
- Every dev page renders with no console errors or warnings and no remote data, and `pnpm run test:dev-pages` checks them on SVG and Canvas. (#899)
- Core's test suite runs in parallel (about 12 minutes down to 4), and `@d3plus/export` has full test coverage. (#971, #972, #982)
- Package entry points are treated as export lists: exempt from `max-lines`, and limited to imports and re-exports. (#984)

### Breaking changes

Most of these change defaults or fix long-standing behavior, so existing charts will look different with no config change. Visual-regression snapshots will change.

- **Value domains that stop short of 0 keep their minimum** on BarChart, Histogram, AreaPlot, and StackedArea, drawing a baseline break back to 0 instead of stretching the axis down to it. The break is cut through the bars and areas that cross it. Set `baselineBreak: false` to stretch the axis, or `yConfig: {baselineBreakConfig: {mask: false}}` to leave shapes uncut. (#888, #944, #970)
- **`baseline(n)` starts the value axis at `n`**, the same as `yDomain([n])` (or `xDomain` on horizontal charts), including the break back to 0. (#945)
- **A two-sided `xConfig`/`yConfig` `domain` is drawn exactly as given**, without rounding outward. Add `rounding: "outside"` to round it. (#962)
- **Axis `labelRotation` defaults to automatic** instead of `false`, so category labels rotate when they don't fit. Set `labelRotation: false` to keep them flat. (#952)
- **Nested config objects deep-merge** in every setter, so setting one nested key keeps its siblings' defaults instead of replacing the whole object. Use `RESET` to clear a default. (#890, #892, #893)
- **Legends appear** for charts colored by a categorical key outside `groupBy`. Set `legend: false` to hide them. (#902)
- **`legendPosition()` and `colorScalePosition()` return `"auto"`** instead of a function. Placement is unchanged. (#964)
- **Radar level rings are labeled** by default (`levelLabels: false` to hide them), and `axisConfig.shapeConfig.stroke` no longer styles the rings: use `axisConfig.gridConfig` and `barConfig`. (#896)
- **`confidence` on bar charts draws error bars** instead of being ignored. (#905)
- **Tooltip element ids include the tooltip's uuid** (`d3plus-tooltip-<uuid>-<id>`). Class names are unchanged, so target those in CSS. (#912)
- **d3plus injects a small stylesheet** at the top of `<head>` that resets margin, padding, and border on its own controls and overlays. Page rules on bare elements no longer reach them; rules on their classes still do. (#963)
- **Default visuals shift:** year values, the "0" tick, and short-Plot end labels are drawn differently, forced end labels may drop, titles may move below the corner controls, the chart body starts below the controls, title and gridline colors change on dark backgrounds, fixed TextBox font sizes are no longer clamped, and stacked bars grow one segment at a time. (#877, #879, #880, #881, #882, #883, #918, #959, #969, #979)

## 4.7.0

4.7 lets charts work together: linked charts share hover, selection, legend state, and colors. Legends can now sit in the empty space inside a chart instead of taking a margin, and trend lines can project past the end of the data. Tooltip titles and legends show matching shape swatches. Fixes cover textures, text wrapping, crowded axis labels, and colorScale gradients. Every package now has example pages in the docs. The inset legend is on by default; see the breaking changes.

### Added

- **Linked charts.** `link` ties charts into a group so they share hover, active, highlight (including search), and legend hide/solo state, plus one categorical color scale. Charts match on a shared data value (`by`), so hovering a region in one chart can light up its countries in another. (#869; closes #110) [Guide ↗](https://d3plus.org/?path=/docs/guides-interactivity--d3plus#linked-charts) · [Example ↗](https://d3plus.org/?path=/docs/core-charts-viz--d3plus#linked-charts)
- **Legends inside the chart.** Plot, Network, Pack, Pie, Rings, Tree, and Geomap draw the size legend, legend, or colorScale in open space around their marks when one fits, instead of claiming a margin. Control it with `legendInset` and style the backing box with `legendInsetConfig`. (#849; closes #72) [Guide ↗](https://d3plus.org/?path=/docs/guides-legends--d3plus#inside-the-chart) · [Plot ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#legend-inset) · [Network ↗](https://d3plus.org/?path=/docs/core-charts-network--d3plus#legend-inset)
- **Trend line projections.** `trendLineConfig.projection` extends trend lines past the data by a number of steps or `{to}` an end value, drawn dotted (`projectionConfig`), with a prediction interval on linear fits. (#863; closes #289) [LinePlot ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#trend-line-projection) · [Steps ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#trend-line-projection-steps) · [BarChart ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#trend-line-projection)
- **Tooltip and legend swatches.** Single tooltips lead their title with a swatch of the hovered mark, and Line series get their own dot-and-stroke glyph in tooltips and legends. (#862)
- **New `@d3plus/math` helpers:** `negativeSpace` finds open rectangles around a set of shapes, and `linearPrediction` gives a linear fit's prediction interval. (#849, #863) [negativeSpace ↗](https://d3plus.org/?path=/docs/math-negativespace--d3plus)
- Translations for "Projected" in `ar-SA`, `es-ES`, `pt-BR`, and `zh-CN`. (#863)

### Fixed

- Shape textures render on every chart, including Pie, Treemap, Pack, Matrix, RadialMatrix, and Priestley, instead of drawing `[object Object]` or being ignored. (#868) [Guide ↗](https://d3plus.org/?path=/docs/guides-accessibility--d3plus#texture-patterns)
- A smooth-gradient colorScale draws once instead of twice on top of itself. (#870)
- A hovered bar no longer hides its own data label. (#869)
- `textWrap` counts the spaces between words, so wrapped lines no longer run wider than their box. (#865)
- Crowded point-axis labels (such as years) are thinned instead of all disappearing. (#852)
- `nest` drops hierarchy levels whose key is missing from the data. (#853)
- Geomap fits the same projection on every draw, so `@d3plus/ssr` renders keep their inlined tiles. (#849)

### Documentation

- Every package's functions now have live examples, and single-example chart, component, and shape pages have more stories. (#761)
- New [Exporting guide](https://d3plus.org/?path=/docs/guides-exporting--d3plus), and the Size Legend guide is merged into a [Legends guide](https://d3plus.org/?path=/docs/guides-legends--d3plus). (#849, #855)
- The docs site's mobile menu, dark-theme text, and internal guide links are fixed, and wide examples scroll sideways on phones. (#866, #867)

### Developer & tooling

- The docs generator leaves `_`-prefixed members out of the READMEs and Storybook controls, and reports docs pages whose export no longer exists. (#864, #854)
- The search scene walk is shared with linking in `sceneRows.ts`. (#869)

### Breaking changes

- **Legends move inside the chart by default** wherever they fit, on Plot, Network, Pack, Pie, Rings, Tree, and Geomap. Set `legendInset: false`, or set `legendPosition`/`colorScalePosition` explicitly, to keep them in the margin. Visual-regression snapshots will change. (#849)
- **`downloadButton`, `downloadConfig`, and `downloadPosition` are removed.** They never rendered anything; setting them now logs an unknown-property warning. Use `saveElement` or the table view's CSV download instead. (#855)
- **Default visuals shift slightly:** tooltip titles gain a swatch, Line series use a new legend glyph, wrapped text breaks a little earlier, and `shapeConfig.texture` now applies on charts that used to ignore it. (#862, #865, #868)

## 4.6.0

4.6 adds a Histogram chart, regression trend lines, size legends, and a shared multi-series tooltip for Plot charts. Drilling into a `groupBy` level now morphs parents into their children, chart colors can be overridden library-wide, off-screen charts unload to save memory, and charts redraw when their web fonts finish loading. Several of these change defaults, so review the breaking changes below; visual-regression snapshots will change.

### Added

- **Histogram chart.** Bins raw observations along a linear axis, with configurable thresholds, bin width, and count/density/relative normalization; `groupBy` series stack within shared bins. Available in every framework wrapper. (#840; closes #172) [Basic ↗](https://d3plus.org/?path=/docs/core-charts-histogram--d3plus#basic-example) · [Stacked groups ↗](https://d3plus.org/?path=/docs/core-charts-histogram--d3plus#stacked-groups) · [Density ↗](https://d3plus.org/?path=/docs/core-charts-histogram--d3plus#density)
- **Trend lines.** `trendLine` fits linear, exponential, logarithmic, power, or polynomial regressions on any Plot chart, per series or across all points, with an optional confidence band and a tooltip showing the equation and R². (#846; closes #278) [Scatter ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#trend-line) · [Fit types ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#trend-line-types) · [Confidence ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#trend-line-confidence) · [Bars ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#trend-line)
- **Size legend.** Charts that size their marks (Plot bubbles, Geomap points, Network, Rings) show a nested-circle legend drawn with the chart's own radius scale, configurable via `sizeLegend`, `sizeLegendConfig`, and `sizeLegendPosition`. Also available as a standalone `SizeLegend` component. (#842; closes #83) [Guide ↗](https://d3plus.org/?path=/docs/guides-legends--d3plus#size-legend) · [Plot ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#size-legend) · [Geomap ↗](https://d3plus.org/?path=/docs/core-charts-geomap--d3plus#point-size-legend) · [Component ↗](https://d3plus.org/?path=/docs/core-components-sizelegend--d3plus)
- **Shared tooltip and crosshair on Plot charts.** On a discrete or time axis, one tooltip lists every series at the hovered position and a dashed crosshair (`crosshairConfig`) marks it. `tooltipShared(false)` reverts to per-mark tooltips. (#841; closes #779) [LinePlot ↗](https://d3plus.org/?path=/docs/core-charts-lineplot--d3plus#basic-example) · [StackedArea ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#basic-example)
- **Drill-down morph transitions.** Treemap, Pack, Pie/Donut, and Plot children grow out of the clicked parent, and collapse back into it on Back. (#838; closes #166) [Pie ↗](https://d3plus.org/?path=/docs/core-charts-pie--d3plus#drill-down-on-click) · [Donut ↗](https://d3plus.org/?path=/docs/core-charts-donut--d3plus#drill-down)
- **`colorDefaults()`** overrides the library's default colors (`dark`, `light`, `missing`, `on`, `off`, `sequential`, `scale`) on any chart, reaching its legend, tooltip, axes, and labels. (#836; closes #763) [Example ↗](https://d3plus.org/?path=/docs/color-colordefaults--d3plus)
- **Share percentages.** Pie/Donut slice labels and stacked bar labels show each mark's share of the total, and stacked Area/Bar data carry a `share` field shown in their tooltips. (#835, #837; closes #443, #783) [StackedArea ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#share-percentages) · [Pie ↗](https://d3plus.org/?path=/docs/core-charts-pie--d3plus#basic-example)
- **Warnings for unknown config properties**, including typos inside nested component configs. `configWarnings(false)` silences them page-wide. (#834; closes #764) [Guide ↗](https://d3plus.org/?path=/docs/guides-configuration--d3plus#unknown-property-warnings)
- **Off-screen charts unload.** `detectVisible` now uses a shared `IntersectionObserver`, renders charts that stay in view for `detectVisibleInterval`, and (with the new `detectVisibleUnload`) releases the DOM of charts scrolled out of view, redrawing them on return. (#829, #830)
- **Charts redraw when their web fonts load**, so text is re-measured with the real font. New `onFontsLoaded()` in `@d3plus/dom`. (#843; closes #742) [Example ↗](https://d3plus.org/?path=/docs/dom-onfontsloaded--d3plus)
- **Regression helpers in `@d3plus/math`:** `regression`, `linearConfidence`, `studentTQuantile`, and `studentTCdf`. (#846) [Example ↗](https://d3plus.org/?path=/docs/math-regression--d3plus)
- Translations for the new Histogram and trend-line labels in `ar-SA`, `es-ES`, `pt-BR`, and `zh-CN`. (#840, #846)

### Fixed

- Legend labels contrast with the chart's background instead of always rendering black. (#845)
- A legend too large to fit is hidden instead of overflowing the chart and pushing marks off-screen. (#850)
- Treemap, Pie, Donut, Tree, Rings, Chord, and Priestley labels honor `fontFamily()` and `shapeConfig.labelConfig`. (#833)
- Rings `size` actually sizes nodes, and the center node no longer disappears. (#842) [Example ↗](https://d3plus.org/?path=/docs/core-charts-rings--d3plus#sized-nodes)
- Charts no longer throw or emit `NaN` transforms at very small sizes. (#831; closes #515)
- BoxWhisker boxes land correctly on numeric discrete categories. (#832)
- Rings keeps its corner controls after a click re-centers it. (#839)
- The minimap viewport only moves along the zoomed axis on single-axis Plot zoom. (#847)
- Pie/Donut hover strokes no longer clip at the chart's edge. (#838)
- Tooltip `tdStyle` reaches cells added on first render, and both renderers always dispatch `mouseleave`. (#841)

### Developer & tooling

- `@d3plus/core/internal` adds `runPostDrawFeatures(viz)` (call it after any `_draw()` outside `runVizPipeline`), `histogramDef`, `binData`, and the bottom-right panel and size-legend layout helpers. (#839, #840, #842)
- `@d3plus/render` adds chart-agnostic drill-morph transitions (`enterFrom`/`exitTo`, `collapseTo`, `FlipTransition`, …). (#838)
- Coverage now counts code exercised by core's Playwright tests (core: 68% → 90% of lines), `render`/`ssr`/`element`/`vue`/`svelte` report to Codecov, and new pixel-level Canvas and SVG renderer tests were added. (#844, #848)
- Stories can build data with the new `datafy(code)` helper, so "Show code" prints the generator instead of every row. (#840)

### Breaking changes

These are mostly changes to defaults: existing charts will look and behave differently with no config change.

- **Size legends appear by default** on charts sized by more than one value, taking some right margin. **Rings charts that set `size` now draw varied node sizes.** Opt out with `sizeLegend: false`. (#842)
- **Plot tooltips are shared, snapped, and arrowless** on discrete/time axes; opt out with `tooltipShared: false`. **Every tooltip table** now left-aligns its first column and right-aligns the rest (override via `tdStyle`/`thStyle`), and `tdStyle` is typed `Record<string, unknown>`. (#841)
- **Share percentages appear** on Pie/Donut and stacked bar labels, and as a "Share" tooltip row on stacked charts. Override `label` or `tooltipConfig.tbody` to remove them. (#835, #837)
- **Pie/Donut wedges are separated by a 2px background-colored stroke.** Set `shapeConfig: {strokeWidth: 0}` for the old look. (#838)
- **Drill-down morphs instead of cross-fading.** `duration: 0` disables it along with all other transitions. (#838)
- **`detectVisibleUnload` defaults to `true`**, so off-screen charts drop their DOM and interaction state (zoom, selection, table view); deferred charts render only after staying in view for 1s, and each `<svg>` gets `content-visibility: auto`. Set `detectVisibleUnload: false` to keep charts alive. (#829, #830)
- **Unknown config properties warn on the console** by default; `configWarnings(false)` silences them. (#834)
- **`colorMin`, `colorMid`, and `colorMax` getters return `undefined`** until set; they resolve from `colorDefaults` at draw time. Rendering is unchanged. (#836)
- **Legends that can't fit render nothing** and reserve no margin. (#850)
- **Legend labels are no longer always black.** (#845)
- **`fontFamily()` and `shapeConfig.labelConfig` now apply** to Treemap, Pie, Donut, Tree, Rings, Chord, and Priestley labels. (#833)

## 4.5.0

4.5 makes every chart explorable: zoom and pan are on by default, with a minimap, a search box that highlights matching marks, and a table view that shows the chart's data and downloads it as CSV. The controls are real, themeable `<button>`s, Geomap gets light and dark basemaps, and `@d3plus/ssr` tile fetching is hardened against SSRF. Most of these are on by default; see the breaking changes for opt-outs.

### Added

- **Zoom & pan on every chart**, with zoom controls and a drag-to-zoom brush in the top-right corner. Plot charts rescale their linear axes instead of scaling the picture, and the zoom limit adapts to the smallest shape. (#820, #821; closes #85, #161, #780) [Guide ↗](https://d3plus.org/?path=/docs/guides-interactivity--d3plus#zoom--pan)
- **Themeable zoom controls.** Real `<button>`s with translated labels; restyle with `zoomControlClassName` and swap icons (HTML or a mount function) with `zoomControlIcons`. (#817, #822) [Guide ↗](https://d3plus.org/?path=/docs/guides-interactivity--d3plus#zoom--pan)
- **Minimap.** Once zoomed in, an overview map shows and controls the viewport (drag, click, keyboard, scroll). `.minimap(false)` turns it off. (#825; closes #81)
- **Search.** A top-left search box highlights marks whose labels match, across the `groupBy` hierarchy, and steps between matches. `.search(false)` disables it. (#827; closes #33) [Guide ↗](https://d3plus.org/?path=/docs/guides-interactivity--d3plus#highlighting-a-series)
- **Table view.** A top-left toggle swaps the chart for a sortable, virtualized table of its data, with CSV download. (#828) [Guide ↗](https://d3plus.org/?path=/docs/guides-exporting--d3plus#downloading-the-data-as-csv)
- **Light/dark Geomap basemaps.** The default basemap follows the page's color scheme, and `tileUrl`/`ocean` accept a `{light, dark}` pair. (#821) [Light & dark tiles ↗](https://d3plus.org/?path=/docs/core-charts-geomap--d3plus#light-and-dark-tiles) · [No-key tilesets ↗](https://d3plus.org/?path=/docs/core-charts-geomap--d3plus#no-key-tilesets)
- **Redesigned attribution**, collapsing to an "ⓘ" badge when wide; customize with `attributionIcon`. (#822)
- **Shared top-left controls panel** for Back, search, and table view, with a restyled Back button (`backControlClassName`). (#826)
- **`@d3plus/ssr` tile requests** send an identifying User-Agent (`tileUserAgent`) and are cached across renders. (#821) [Guide ↗](https://d3plus.org/?path=/docs/guides-server-side-rendering--d3plus#maps)
- Translations for the zoom and search controls in `ar-SA`, `es-ES`, `pt-BR`, and `zh-CN`. (#817, #827)

### Fixed

- Geomap tiles no longer vanish when `tileUrl` and `projection` change together. (#819)
- Legend swatch positioning is O(n) instead of O(n²). (#818)
- `SvgRenderer` pointer picking stays accurate on zoomed/panned content. (#820)
- `@d3plus/ssr`'s default tile fetcher refuses private, loopback, and metadata addresses, including through DNS and redirects. (#810)

### Developer & tooling

- `@d3plus/core/internal`: `backFeature` is replaced by `backContribution`, alongside `topLeftControlsFeature`, `searchContribution`, `tableViewContribution`, and the `Contribution` type. `@d3plus/render` exports `markOverlayHtmlSynced`. (#826, #827, #828)
- The Playwright `render()` helper blocks real network requests so tests stay hermetic. (#821, #823)
- Package `test` scripts lint all of `src`; the old glob silently skipped files two or more directories deep. (#824)

### Breaking changes

Most of these change defaults, and each has an opt-out. Visual-regression snapshots will change.

- **Zoom is on for every chart**, with visible controls. Set `zoom: false` to opt out. (#820)
- **`zoomScroll` defaults to `"modifier"`**: a plain wheel scrolls the page and Ctrl/⌘ + wheel zooms (Geomap and Network still zoom on any wheel). Set `zoomScroll: true` for the old behavior. **`zoomMax` no longer defaults to `16`.** (#820)
- **Zoom controls moved to the top-right** as horizontal `<button>`s with a structural default style. CSS targeting `div.zoom-control` needs updating. (#817)
- **Search, table-view, and minimap controls appear by default.** Disable with `.search(false)`, `.tableView(false)`, `.minimap(false)`. (#825, #827, #828)
- **The Back button floats over the chart** instead of reserving margin, and only `backConfig`'s font/padding/color keys still apply. `backFeature` is removed from `@d3plus/core/internal`. (#826)
- **Attribution restyled**, with new `attributionStyle` defaults. (#822)
- **Geomap's default basemap** is Esri World Light/Dark Gray Canvas instead of CARTO `light_all`; pin `tileUrl` and `ocean` to keep the old look. On Canvas, tiles now sit beneath the `<canvas>`. (#821)
- **`@d3plus/ssr` blocks tile fetches to internal addresses.** Supply a custom `fetchTile` to use an internal tile server. (#810)

## 4.4.0

4.4 adds a Chord chart and directional arrowheads for network-style charts, along with legend, UMD, export, and accessibility fixes. No breaking changes.

### Added

- **Chord chart**, using the same nodes/links model as Network, Rings, and Sankey, directed or undirected. (#751) [Example ↗](https://d3plus.org/?path=/docs/core-charts-chord--d3plus) · [Arrows ↗](https://d3plus.org/?path=/docs/core-charts-chord--d3plus#with-arrows)
- **Directional arrowheads** on Network, Rings, and Sankey links via `arrows`/`arrowSize`. (#77) [Network ↗](https://d3plus.org/?path=/docs/core-charts-network--d3plus#directional-arrows) · [Rings ↗](https://d3plus.org/?path=/docs/core-charts-rings--d3plus#directional-arrows) · [Sankey ↗](https://d3plus.org/?path=/docs/core-charts-sankey--d3plus#directional-arrows)

### Fixed

- The legend no longer merges entries when the color scale recycles hues. (#788)
- UMD bundles extend `window.d3plus` instead of overwriting it when several packages load.
- Every data-driven chart sets shape `aria-label`s; fixed two Matrix/RadialMatrix color-scale bugs.
- Network and Rings links use a darker default stroke.
- Exporting an `<svg>` element serializes it directly instead of wrapping it in a `foreignObject`.

### Developer & tooling

- Fixed the Storybook build, broken since 4.3.0.
- Fixed a CI-only timeout flake in `@d3plus/dom`'s `fontExists` test.

## 4.3.0

4.3 brings d3plus to every major framework and to the server: official Vue, Svelte, Web Components, and Angular wrappers join React, and the new `@d3plus/ssr` renders charts to SVG or PNG in Node. It also fixes how lines and areas report the hovered point.

### Added

- **Vue, Svelte, Web Components, and Angular wrappers** (`@d3plus/vue`, `@d3plus/svelte`, `@d3plus/element`, `@d3plus/angular`), sharing one core with `@d3plus/react` so they behave identically. (#716) [Guide ↗](https://d3plus.org/?path=/docs/guides-frameworks--d3plus)
- **Server-side rendering with `@d3plus/ssr`.** Render any chart, including Geomap with inlined tiles, to an SVG string or PNG buffer in Node. `Viz` gains `toSVGString()` and `toCanvas()`, and `@d3plus/react` is marked `"use client"`. (#375) [Guide ↗](https://d3plus.org/?path=/docs/guides-server-side-rendering--d3plus)

### Fixed

- Line and Area shapes report one consistent datum, and Plot mouse events report the point nearest the cursor, so tooltips name the hovered point. Lines regain their wide hover area. (#785, #786)
- `NaN`/`null` x/y values are dropped from Plot data instead of plotting at zero or breaking the line path. (#776)

### Developer & tooling

- `@d3plus/react` now runs on the shared `@d3plus/dom` core, with unchanged behavior; each wrapper has a Vite dev harness.

## 4.2.0

4.2 lets you order stacked series by their value or by any data field, adds `backgroundImageFit` for shape images, and moves path geometry into DOM-free `@d3plus/math` helpers, which also lets Pie labels render server-side. Stack order defaults changed; see the breaking changes.

### Added

- **Stack ordering by value or field.** `stackOrder("ascending" | "descending")` orders series by total value, and an accessor or `{value, order}` orders by any field. (#527) [By value ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#stack-order-by-value) · [By field ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#stack-order-by-field) · [Streamgraph ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#streamgraph)
- **`backgroundImageFit`** (`"cover"` or `"contain"`) for shape background images. [Path ↗](https://d3plus.org/?path=/docs/core-shapes-path--d3plus#background-image) · [StackedArea ↗](https://d3plus.org/?path=/docs/core-charts-stackedarea--d3plus#shape-background-images)
- **DOM-free path geometry** in `@d3plus/math`: `pathParse`, `pathBounds`, and a rewritten `path2polygon`. [pathBounds ↗](https://d3plus.org/?path=/docs/math-pathbounds--d3plus) · [path2polygon ↗](https://d3plus.org/?path=/docs/math-path2polygon--d3plus)

### Fixed

- Shape background images on `Path`, `Area`, `Line`, and `Rect` are sized, positioned, and clipped correctly, and fade and dim with their shape. (#757)
- Pie labels render in SSR/Node.
- `.legend(false)`, `.shape("Circle")`, and `.label("x")` no longer crash.
- Unknown `stackOrder`/`stackOffset` names warn and fall back to a default.

### Developer & tooling

- Upgraded to pnpm v11; workspace config moved to `pnpm-workspace.yaml`.

### Breaking changes

- **`stackOrder` `"ascending"`/`"descending"` sort by value**, not alphabetically, and the default is now `"descending"` (largest on the baseline). Use `stackOrder("key")` for the old alphabetical order. (#527)

## 4.1.0

4.1 wraps text inside circles, and types more of `D3plusConfig` so valid configs type-check. It drops support for Node 20.

### Added

- **Text wrapping inside circles.** `textWrap` gains `shape: "circle"`, fitting each line to the circle's width at that height; Circle labels use it automatically. (#736) [Example ↗](https://d3plus.org/?path=/docs/core-shapes-circle--d3plus#text-wrapping)
- Eleven missing `D3plusConfig` fields are now typed (`colorScalePadding`, `hiddenColor`, `noDataHTML`, `subtitle`, …).

### Changed

- `legend`, `tooltip`, `legendPosition`, `colorScalePosition`, `thresholdName`, and `loadingHTML` are typed to accept accessors, matching runtime behavior.
- The `*Padding` and `legendFilterInvert` accessors receive the `viz` instance when called as functions.

### Fixed

- `textWrap` no longer crashes when the first word overflows its line.

### Developer & tooling

- CI tests Node 22 and 24, with Node 26 as a non-blocking canary, and retries flaky Playwright installs.

### Breaking changes

- **Node 20 is no longer supported**; `engines.node` is now `>=22`.

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
- **Motion trails.** Points that move between frames (Timeline play) sweep a tapering "cone" from their previous position to the current one, fading from the mark's color at the head to transparent at the tail. Each cone traces the mark's swept silhouette — a circle capped with a rounded tail, a rect as the convex hull of its corners (corner-to-corner off-axis). On by default for scatter `Circle`/`Rect` marks and Geomap points (opt out with `shapeConfig.Circle.trail: false`); parity across the SVG and Canvas backends. `shapeConfig.Circle.trailPersist` keeps past moves visible too — a number of step-segments, or `true` for a long fading snail-trail. Persistent trails follow the timeline's direction (growing forward, retracting on scrub-back) — a multi-period jump traces through the skipped periods rather than cutting a straight line — and draw as a single shape so overlapping turns don't darken. Setting `trailPersist` automatically switches the chart to a single-period timeline (`brushing: false`) and fixed axes (`axisPersist: true`) — the two conditions a persistent trail needs to stay coherent — so it works with the one option. [Circles ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#timeline-motion-trails) · [Squares ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#square-motion-trails) · [Persistent ↗](https://d3plus.org/?path=/docs/core-charts-plot--d3plus#persistent-motion-trails)
- Visual-regression, pipeline-parity, and v3↔v4 chart-compare test harnesses.
- **`colorValidate`** (`@d3plus/color`) — validates a palette against the checks that can be computed from color alone: OKLCH lightness band, chroma floor, colorblind (Machado-2009 protan/deutan/tritan ΔE) separation, and WCAG contrast vs the surface; plus an ordinal-ramp mode. The default categorical palette is now gated against it. [Example ↗](https://d3plus.org/?path=/docs/color-colorvalidate--d3plus#default-palette)
- **`colorRamp`** (`@d3plus/color`) — builds an even single-hue light→dark ramp in OKLab (holds the hue, so the pale end keeps its identity instead of drifting to white). Continuous color scales now step through it. [Example ↗](https://d3plus.org/?path=/docs/color-colorramp--d3plus#basic-example)
- **`highlight(predicate)`** — a standing emphasis: the matching marks keep their color while every other mark is de-emphasized to a neutral gray (highlight one series, gray the rest). Unlike `hover`/`active` it survives pointer movement. [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#highlighting-a-series)
- **`colorOrdinal(true)`** — treats a discrete color field as _ordered_, coloring it with a single-hue light→dark ramp instead of nominal categorical hues. [Example ↗](https://d3plus.org/?path=/docs/core-charts-barchart--d3plus#ordinal-color)
- OKLab/OKLCH conversions and a WCAG `contrastRatio` helper back the above.
- **Locale-aware `titleCase`.** `titleCase(str, locale)` accepts a locale code (or a `TitleCaseRules` object) and normalizes case in _both_ directions — it lowercases ALL-CAPS "shouting" input and minor words, force-uppercases known acronyms (with automatic plurals, e.g. `tvs` → `TVs`), and preserves genuine mixed-case (`McDonald`, `iOS`). Per-language rule sets and a `{style: "sentence"}` mode ship as the new `titleCaseLocale` dictionary (and a `TitleCaseRules` type), exported from `@d3plus/locales`. [Example ↗](https://d3plus.org/?path=/docs/text-titlecase--d3plus)
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
