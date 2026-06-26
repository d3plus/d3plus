# Migrating from D3plus v3 to v4

v4 rewrites how D3plus renders. In v3 each chart mutated the DOM as it drew; in
v4 a chart compiles to a **serializable scene graph** that a pluggable backend
paints. **SVG is still the default backend and the visual output is intended to
match v3.**

The good news for most projects: **the public API did not change.** The chart
classes, the fluent setters (`.data()`, `.groupBy()`, `.size()`, …), `config()`,
the `RESET` token, locale handling, and event handlers all behave as before. If
you use D3plus through its documented API, upgrading is usually just a version
bump.

## Install

The package names and scope are unchanged from v3:

```sh
npm install @d3plus/react      # React wrappers
npm install @d3plus/core       # vanilla JS — charts, components, shapes
```

## What you may need to change

### 1. React `forceUpdate` is now a prop (breaking)

In v3 you forced a re-render on every cycle by passing it inside `config`. In v4
it is a first-class prop:

```diff
- <Treemap config={{forceUpdate: true, data, groupBy: "id"}} />
+ <Treemap forceUpdate config={{data, groupBy: "id"}} />
```

### 2. Custom render internals

If you subclassed `Viz` and overrode private `_draw`-stage internals, or reached
into the chart's intermediate DOM / d3-selection during a draw pass, that code
must move to the new pipeline. Drawing now flows through `runVizPipeline` and
emits scene nodes; it no longer mutates the chart mid-draw. Code that only reads
the **final** rendered SVG (after `render()` resolves) is unaffected.

### 3. `d3-collection` removed

`@d3plus/data` no longer depends on the deprecated `d3-collection`; grouping is
built on `d3-array` (`groups`/`rollups`). The `nest()` and `nestGroups()` exports
remain available.

## What's new in v4

### Pick a rendering backend

Every visualization accepts a backend via `.renderer()` (default `"svg"`):

```js
new d3plus.BarChart()
  .data(data)
  .renderer("canvas")   // paint to <canvas> instead of <svg>
  .render();
```

Use **SVG** (the default) for the broadest feature coverage and crisp,
inspectable output. Use **Canvas** for dense, high-shape-count charts where
paint performance matters. Both backends paint shapes, gradients, and
texture/pattern fills; Geomap renders on either.

### Clean teardown

Call `viz.destroy()` when removing a chart to disconnect its `ResizeObserver`
and event listeners. The React wrapper does this for you on unmount.

### One import for types

```ts
import type {Treemap} from "@d3plus/types";
// React component types live in a separate entry, so non-React projects
// don't pull in React:
import type {D3plusComponentProps} from "@d3plus/types/react";
```

## Need help?

Full documentation and live examples are at **[d3plus.org](https://d3plus.org/)**.
If a chart renders differently than it did in v3, please open an issue with a
reproduction — the v3↔v4 comparison harness (`packages/core/scripts/chart-compare.mjs`)
is how parity regressions are tracked.
