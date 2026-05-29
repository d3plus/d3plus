# Chart-def refactor follow-ups

The 20-chart migration to `makeChart(def)` is complete (commits `cfcf9d03`,
`635fe3ee`, `58ae91ef`, `297b7f8a`, `8a51a684`). Plot's pipeline +
`plotDef` were moved into `Plot/pipeline.ts`. `ChartDefinition.ts` is now
just the type interface (86 LOC, down from 3852).

Three known follow-up workstreams remain. None block correctness — all
104 tests pass against the current code. They're code-cleanliness
improvements.

## 1. Replace transient-shape compute mode with pure-data emit

**Affected files:**
- `charts/Network/emit.ts`
- `charts/Rings/emit.ts`
- `charts/Sankey/emit.ts`
- `charts/Tree/emit.ts`
- `charts/Radar/{applyLayout,emit}.ts`
- `charts/Geomap/emit.ts`

**Pattern today:** spin up a `new Shape()` (Path / Circle / Rect / Box)
in `renderMode("compute")`, configure it with per-datum accessors,
then `collectComputed(shape)` to harvest both the shape geometry and
its labels into scene nodes.

**Target:** emit shape SceneNodes directly as flat data
(`{type, x, y, paint, ...}`), and use `emitLabels()` (already in
`shapes/emitLabels.ts`) for labels. Mirrors how `Treemap/emit.ts`,
`Pack/emit.ts`, `Pie/emit.ts`, `Priestley/emit.ts` already work.

**Per-chart effort:** ~1–2 hours each, because each emit currently uses
the compute-mode shape's accessor-resolution logic (e.g. Circle's `.r`,
Path's `.d`, Rect's `.width`/`.height`) — that resolution has to be
re-implemented at the flat-data layer with explicit `resolveAccessor()`
calls per paint property.

## 2. Tighten `any` types in Tier B chart layouts

**Affected files (count of `any`):**
- `charts/Rings/applyLayout.ts` — 39
- `charts/Network/{index,applyLayout}.ts` — 32 + 25
- `charts/Geomap/{index,applyLayout}.ts` — 31 + 6
- `charts/Sankey/{index,applyLayout}.ts` — 18 + 8

**Why `any` is dense:** these layouts walk heterogeneous data
structures that mutate as they go — a node is built as `{id, fx, fy}`,
then layout writes `.r`, `.shape`, `.radians`, `.edges`, etc. onto it
across multiple passes. Modelling this in TypeScript needs per-chart
intermediate interfaces (NetworkLayoutNode → NetworkPositionedNode →
NetworkScaledNode etc.) or builder-style pattern.

**Per-chart effort:** ~1 hour each for the function-signature `any`s
(events, accessors), more for the deep reducer `any`s.

**Not in scope (pre-existing):** `Plot/index.ts` has 126 `any`s but
those came over verbatim from the old Plot.ts — separate problem.

## 3. Drop `viz._<key>` getter/setter aliases

**Currently:** `installFluent` installs per-instance getter/setter on
`viz._<key>` that routes to `viz.schema[key]`. The transitional alias
lets old code reading `viz._sum` keep working while new code writes
into `viz.schema.sum`.

**Scope to remove:** ~3500 read sites across 93 files
(`features.ts`, `Viz.ts` internals, every chart's `applyLayout`/`emit`/
`setup` that reads `viz._sum`/`viz._x`/`viz._y`/etc.).

**Tactic:** find every `viz._<key>` where `<key>` is a field declared
in any chart's `def.fields`, replace with `viz.schema.<key>`. Per-chart
audit because different charts have different schema keys.

**Special case:** `BaseClass.config()` reflection walks prototype
methods and invokes each to read `this._<key>`. Either keep the alias
on (since `config()` is the public contract) or refactor `config()` to
read `this.schema` directly.

**Effort:** estimated 4–6 hours for a careful sweep with test
verification after each batch.

## Estimated total: 12–20 hours

Each item is independently shippable and doesn't block the others.
