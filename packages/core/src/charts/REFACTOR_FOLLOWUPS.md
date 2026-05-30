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

**Remaining (deferred):**

- `Plot/index.ts` has 126 `any`s carried over verbatim from the old
  Plot.ts. The Plot refactor is its own workstream.

## 3. Drop `viz._<key>` reads inside chart code — DONE (alias stays)

`installFluent` still installs the per-instance `viz._<key>` getter/
setter alias, so external code that reads `viz._sum` and tests that do
`chart._foo = "x"` keep working. **In-tree chart code no longer relies
on the alias.** The mechanical sweep (~820 read sites, 50+ files)
rewrote `viz._<key>` and `this._<key>` to `viz.schema.<key>` and
`this.schema.<key>` for every key declared in a chart's `def.fields` or
in `Viz`'s `vizSchema` array.

**Why keep the alias installed?** It costs one `Object.defineProperty`
per schema key per instance — modest. Removing it would break (a) any
out-of-tree consumer reading instance underscore slots and (b) tests
that hand-roll viz stubs with `_<key>` properties. Dropping the alias
installation itself is a follow-on if/when those external dependencies
are also migrated.

**Reflection still works.** `BaseClass.config()` walks prototype
methods (`getAllMethods`) and invokes each as a getter; the
prototype-installed fluent accessor reads from `this.schema[key]`, so
`config()` returns the correct values without traversing `_<key>`.
