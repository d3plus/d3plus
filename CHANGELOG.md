# Changelog

All notable changes to D3plus are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

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
