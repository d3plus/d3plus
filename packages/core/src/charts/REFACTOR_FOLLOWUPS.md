# Chart-def refactor follow-ups

The 20-chart migration to `makeChart(def)` is complete (commits `cfcf9d03`,
`635fe3ee`, `58ae91ef`, `297b7f8a`, `8a51a684`). Plot's pipeline +
`plotDef` were moved into `Plot/pipeline.ts`. `ChartDefinition.ts` is now
just the type interface (86 LOC, down from 3852).

The three follow-up workstreams below are addressed in the same branch:

- emit refactor (Item 1) — done for all six charts.
- type tightening (Item 2) — `any` count slashed across the four
  layout files (Rings 39 → 2, Network 57 → 4, Geomap 37 → 25, Sankey 26 → 20).
  Residual `any`s in `index.ts` files are concentrated in the
  `(viz as any).<method> = function(...) {...}` per-instance install
  pattern, which needs a broader Viz-instance type extension (out of
  scope for the layout-tightening work).
- `viz._<key>` alias (Item 3) — all in-tree readers migrated to
  `viz.schema.<key>` directly. The alias is still installed by
  `installFluent` so external consumers and instance-poking tests
  (`chart._foo = "x"`) keep working.

## 1. Pure-data emit — DONE

Each of the six charts' `emit.ts` now constructs flat SceneNodes
(`{type, x, y, paint, ...}`) directly instead of spinning up a transient
`new Shape().renderMode("compute")` and harvesting via `collectComputed`.
Labels go through `emitLabels()` where present.

**Helpers added to `emitHelpers.ts`:**

- `resolveAccessor<T>(val, d, i)` — previously duplicated in
  `Treemap/Pack/Pie/Priestley/emit.ts`.
- `paintFromShapeConfig(sc, d, i)` — the per-datum fill/stroke/
  strokeWidth/opacity resolution.

**Affected files (all refactored):**

- `charts/Geomap/emit.ts` (and `Geomap/applyLayout.ts`)
- `charts/Tree/emit.ts`
- `charts/Sankey/emit.ts`
- `charts/Network/emit.ts`
- `charts/Rings/emit.ts`
- `charts/Radar/{applyLayout,emit}.ts` — the layout-side
  `absorbShapeIntoChartScene` decorations (radial axis circles, axis
  labels, radial spokes) are now emitted as flat scene nodes wrapped in
  `{type: "group", key, children: …}`.

## 2. Tighten `any` types in Tier B chart layouts — DONE

Each layout file picked up named intermediate interfaces capturing the
state accreted across passes (e.g. `NetworkNode`, `RingsEdge`,
`SankeyWrappedNode`, `RingsNode`). Function-signature `any`s on
accessors, event handlers, and reducer/map callbacks were replaced with
either concrete types or `unknown` + narrowing.

Each chart's `index.ts` `setup()` types its fluent surface with a local
per-chart interface (e.g. `NetworkFluent`, `GeomapFluent`) and casts once
via `const v = viz as VizInstance & XFluent`, so the per-instance method
installs no longer use `(viz as any)`. The VizInstance index signature and
the Viz/Plot/makeChart class index signatures are removed.

The four `applyLayout.ts` files (Sankey, Network, Rings, Geomap) now open
with `const v = viz;` (typed `VizInstance`) instead of `const v = viz as
any`. Schema reads resolve to `any` through `VizInstance`'s intentional
`schema: Record<string, any>`; the remaining structured `viz.ctx` reads
and accessor-signature mismatches use targeted casts (e.g. Geomap's
`GeomapCtx` view of `viz.ctx`, Sankey's `SankeyGenerator` interface).

`Plot/index.ts` is now `any`-free. Its fluent surface follows the
`Viz.ts` house style — `(_?: T): this | T` signatures (config setters take
`Record<string, unknown>`, accessor setters take `string | PlotAccessor`),
and the constructor's inline shape-config callbacks, `_wirePlotShapeEvents`
handlers, and `_paint(pCtx: PlotPaintContext)` are concretely typed. The
class extends `(BaseClass as any)`, so `this._<field>` assignments stay
loose without explicit casts; the only narrowing casts are at typed
boundaries (`accessor(_ as string)`, `d3Shape as Record<string, unknown>`
for the `stackOffset`/`stackOrder` string lookups).

## 3. Drop `viz._<key>` reads inside chart code — DONE (alias removed)

The mechanical sweep (~820 read sites, 50+ files) rewrote `viz._<key>`
and `this._<key>` to `viz.schema.<key>` and `this.schema.<key>` for
every key declared in a chart's `def.fields` or in `Viz`'s `vizSchema`
array. The per-instance `viz._<key>` getter/setter alias that
`installFluent` used to install was then **removed** (commit
`af7ace88`) — config storage lives solely on `this.schema.<key>`.

**Reflection still works.** `BaseClass.config()` walks prototype
methods (`getAllMethods`) and invokes each as a getter; the
prototype-installed fluent accessor reads from `this.schema[key]`, so
`config()` returns the correct values without traversing `_<key>`.

## 4. tsc-error sweep — DONE (whole package, including `plotPaint.ts`)

`npx tsc` (from `packages/core`) started at ~197 errors. **These do not
block the build** — `build:esm` uses esbuild, which strips types without
checking, so the package ships regardless. tsc is advisory type-debt
here, not a gate.

**Result:** `npx tsc` now reports **0 errors** across the package.
Re-run to confirm:
`npx tsc 2>&1 | grep "error TS" | sed 's/(.*//' | sort | uniq -c`.

**`plotPaint.ts` is now fully typed.** The file-level
`eslint-disable @typescript-eslint/no-explicit-any, no-unused-vars` and
the (false) "Fully `any`-typed internally for back-compat" header are
gone. De-anyfication leans on the real `Axis`/`Shape` types — both carry
`[key: string]: any` index signatures, so their dynamically-installed
fluent methods resolve and chain without any `any` token written. The
cross-phase context types (`PlotPaintContext`/`PlotMeasureResult`) and
the wrapped-datum/label-width records (`PlotDatum`/`LabelWidth`/
`PlotAxisFn`) are concrete; the only casts are at typed boundaries.
~78 eslint `any` warnings in the file dropped to 0.

**What the sweep touched (no behavior changes — type-level only):**

- Possibly-undefined (`TS18048`/`TS2532`) and invoke-undefined
  (`TS2722`): `!` at sites the code already establishes are defined
  (`viz._select`, `viz._zoomToBounds`, `viz.config`, `viz.active`,
  `viz._thresholdFunction`, …).
- Unknown reads + assignability/overload (`TS18046`/`TS2345`/`TS2322`/
  `TS2769`): typed locals + targeted casts. `axisLayout.ts` resolved by
  typing `axis._data`/`domain` as `number[]` (the d3-array `min`/`max`
  overload was resolving to the `string` signature).
- Base/override mismatches (`TS2416`, 12): shape-config interfaces
  (`BaseShapeConfig`/`BoxConfig`/`WhiskerConfig`) gained a
  `[key: string]: unknown` index signature so they're assignable to
  `D3plusConfig`; `BaseShapeConfig.discrete` narrowed to `"x" | "y"` and
  `D3plusConfig.label` widened to `string | string[] | false |
  AccessorFn` to reconcile the two shared keys. `BaseClass.parent`
  getter return + setter param widened to `unknown` so `Tooltip.parent`
  (a DOM-element accessor, not the config-record one) overrides cleanly.
- Hierarchy interface conflicts (`TS2430`): `PackLeaf`/`TreemapShapeNode`/
  `AggregatedLeaf` switched from `interface … extends Hierarchy*Node` to
  `type … = Omit<Hierarchy*Node, "id"|"children"> & {…}` so the
  redeclared `id`/`children` no longer clash with the d3 base.
- `TreeNode` switched from `interface extends DataPoint` to
  `type = DataPoint & {…}` so its optional props stop violating
  DataPoint's string index signature (`TS2411`).
- Self-referential generator casts (`TS7022`) in Pack/Treemap layouts
  extracted to named local `interface PackGenerator`/`TreemapGenerator`.

**Guardrail (held):** baseline 197; each batch verified with
`npx tsc 2>&1 | grep -c "error TS"` to confirm the count only dropped
(197 → 169 → 147 → … → 54 → 0). Gate (from `packages/core`):
`npm run build:esm` ✓ → `npx eslint index.ts 'src/**/*.ts'` (0 errors,
3 pre-existing `any`/`prefer-const` warnings) ✓
→ `npx mocha 'test/**/*-test.js'` (104 passing) ✓.

## 5. Removed back-compat shims — DONE

- `viz._<key>` schema alias: removed in `af7ace88` (config storage is
  solely `this.schema.<key>`). See §3.
- `_thresholdFunction`→`viz.schema.timeFilter` back-assign: dropped; the
  shim consumes its own `computedTimeFilter` and does not pin it (stale
  `latestTime`). See `vizPreDraw.ts`.
- `shapeConfigFor` re-export from `ChartDefinition.ts`: deleted (every
  caller imports from `./emitHelpers.js`; not in the public index).
- `useSceneRenderer()` alias on `Viz`: deleted (use `renderer()`).
- `viz._xConfigScale`/`_x2`/`_y`/`_y2ConfigScale` side-assigns in
  `computePlotScales`: dropped; the resolved scale-type strings flow only
  through the returned `plotConfigScales` ctx.
- "legacy"/back-compat comment framing across the chart + shape +
  component sources: reworded to present-tense per house style.
