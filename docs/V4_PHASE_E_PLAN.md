# Phase E — Pipeline, FeatureModule, Fluent (RFC §3 made concrete)

## Where we are after A+B+C+D+D2

Every chart now goes: `data → Viz._preDraw → Viz._draw → this._shapes (+ component
instances) → toScene → SvgRenderer` (or CanvasRenderer). The legacy
DOM-drawing code is deleted. `domToScene` is exported but no longer used by any
default chart render path. The codebase has **one** rendering pipeline.

What's still old-shaped:

- `Viz._preDraw` and `Viz._draw` are imperative methods that mutate `this`. The
  flow is "method-then-method against `this`" rather than "stage-then-stage
  against a context value."
- Charts inherit from `Viz` (deep inheritance). `Treemap`, `Plot`, `BarChart`,
  `Pie`, ... are subclasses that override `_draw`.
- Drawsteps (`drawTitle`, `drawSubtitle`, `drawLegend`, `drawTimeline`,
  `drawTotal`, `drawBack`, `drawAttribution`, `drawColorScale`) are
  `.bind(this)`-style free functions that mutate `this._margin` as side
  effects — implicit margin negotiation through call ordering.
- Every chart hand-writes its accessor methods with the
  `arguments.length`-overloaded getter/setter pattern. Roughly 80 such methods
  per chart × ~20 charts × the boilerplate per method = a large surface area
  with no single source of truth.

## Phase E goal

Refactor those last three things to match RFC §3:

```
UserConfig ──resolve──▶ ResolvedSpec ──transform stages──▶ Scene ──renderer──▶ SVG/Canvas
  (fluent / config)     (defaults merged,    (pure data, no DOM,    (already done)
                         accessors normalized) features composed)
```

No new user-visible API breakage required for E1–E3. The fluent generation
(E4) may end up at v4.1 if it tweaks method ergonomics.

## E1 — Extract `Viz._preDraw` into named pure stages

**Current state.** `Viz._preDraw` (~150 lines) does, in order: derive
`_drawDepth`, build `_id`/`_ids`/`_drawLabel` closures, time-filter, user-
filter, `rollup` by groupBy+discrete keys with `merge`/`aggs`, apply
hidden/solo, run `_thresholdFunction`, set `_filteredData`/`_legendData`. All
of it mutates `this`.

**Target.** Each step becomes a named stage with the signature
`(ctx: VizContext) => Partial<VizContext>`. The stages run as a pipeline in
`Viz._preDraw`, which becomes a fold:

```ts
const stages: TransformStage[] = [
  resolveDrawDepth, buildIdAccessors, applyTimeFilter, applyUserFilter,
  rollupByGroupBy, applyHiddenSolo, applyThreshold, deriveLegendData,
];
let ctx: VizContext = initialContext(this);
for (const stage of stages) Object.assign(ctx, stage(ctx));
this._writeBackForLegacyConsumers(ctx);  // populates this._filteredData etc.
```

The `_writeBackForLegacyConsumers` step is the bridge: it copies the
pipeline's output onto `this` so `_draw`, `drawSteps`, and component
instances still see what they expect. Removing the writeback is a later
cleanup once consumers read from the context instead.

**Files**: `packages/core/src/charts/Viz.ts` only. Each stage extracted into
`src/charts/stages/{name}.ts`. Tests: existing browser parity suite is the
gate (the chart output must stay identical).

**Risk**: low — pure mechanical refactor of an internal method. No public
API changes. The writeback bridge means every downstream consumer still
works without modification.

## E2 — Promote drawsteps into `FeatureModule` instances

**Current state.** `drawTitle`, `drawSubtitle`, `drawTotal`, `drawLegend`,
`drawTimeline`, `drawColorScale`, `drawBack`, `drawAttribution` are
free-functions called as `drawTitle.bind(this)(this._filteredData)`. Each
mutates `this._margin.{top,bottom,left,right}` as a side effect and decides
its own placement. Order matters: a feature placed late "loses" because
earlier features have already claimed space.

**Target.** Each becomes a `FeatureModule` value:

```ts
interface FeatureModule {
  name: string;
  /** Pure: read ctx, return a panel + the margin it claims. */
  layout?: (ctx: VizContext) => {
    panel: PanelNode | null;
    margin: {top?: number; right?: number; bottom?: number; left?: number};
  };
  /** Optional contribution to derived data (e.g. legend needs legendData). */
  derive?: (ctx: VizContext) => Partial<DerivedData>;
  /** Optional event reducers (click.legend etc.). */
  events?: Record<string, EventReducer>;
}
```

A small `layoutEngine(features, ctx)` runs each feature's `layout`, accumulates
the margin claims, and emits a `PanelLayout` (the ordered panel nodes + the
final margin box). `Viz._draw` consumes the layout result via the same
writeback bridge introduced in E1.

The migration path is one feature at a time. Convert `drawTitle` first
(easiest — claims only `margin.top`), validate against the parity tests,
move to the next. Each conversion deletes one `.bind(this)` mutating
free-function and replaces it with a pure value.

**Files**: new `src/charts/features/{Title,Subtitle,Total,Legend,Timeline,
ColorScale,Back,Attribution}.ts`, the existing drawsteps deleted once their
feature module ships. `src/charts/layoutEngine.ts` for the margin
negotiation.

**Risk**: medium — margin negotiation order is years of layout tuning that
must be preserved. Mitigation: port the exact current draw order as the
default `features` list, so the layout engine starts as a faithful refactor.

## E3 — `ChartDefinition`: charts as data, not classes

**Current state.** `Treemap extends Viz`, `BarChart extends Plot extends
Viz`. `Treemap._draw` is a 100-line method that hand-builds a `Rect` shape
and pushes it into `this._shapes`. Inheritance is the composition mechanism.

**Target.** A chart is a value:

```ts
interface ChartDefinition {
  name: string;
  defaults: Partial<VizConfig>;       // replaces constructor field-setting
  features: FeatureModule[];          // composed-in shared behavior (E2)
  stages: TransformStage[];           // the data → scene pipeline (E1)
  /** Shape emission: takes the post-stages context and returns scene nodes. */
  emit: (ctx: VizContext) => SceneNode[];
}

const Treemap: ChartDefinition = {
  name: "Treemap",
  defaults: {layoutPadding: 1, sort: defaultSort, sum: accessor("value"), ...},
  features: [titleFeature, subtitleFeature, totalFeature, legendFeature,
             timelineFeature, colorScaleFeature, backFeature, attributionFeature],
  stages: [...vizCoreStages, applyTreemapLayout],
  emit: ctx => [treemapRectsNode(ctx)],
};
```

Class wrappers (`class Treemap extends Viz`) survive as **thin facades**
generated from the definition — `class Treemap { constructor() { return
createFluent(TreemapDef); } }` — so `new Treemap()...render()` keeps
working byte-for-byte. The 100-line `_draw` body becomes the small `emit`
function.

**Files**: new `src/charts/defs/{Treemap,BarChart,LinePlot,...}.ts`. Existing
chart classes shrink to facades.

**Risk**: medium-low. Each chart converts independently, gated by the
parity tests. The class facades preserve the public API exactly.

## E4 — Generate the fluent API from a schema

**Current state.** Every chart hand-writes ~80 accessor methods like:

```ts
sum(): AccessorFn;
sum(_: AccessorFn | string): this;
sum(_?: AccessorFn | string): AccessorFn | this {
  return arguments.length
    ? ((this._sum = typeof _ === "function" ? _ : accessor(_)), this)
    : this._sum;
}
```

That `arguments.length`-overloaded getter/setter plus the `typeof _ ===
"function" ? _ : coerce(_)` dance is copy-pasted hundreds of times across
the codebase.

**Target.** Centralize once:

```ts
function createFluent(def: ChartDefinition): FluentChart {
  const config = {...def.defaults};
  const api: any = {};
  for (const field of schemaOf(def)) {
    api[field.key] = (...args: unknown[]) =>
      args.length
        ? ((config[field.key] = coerce(field, args[0])), api)
        : config[field.key];
  }
  api.config = (c?: VizConfig) => c ? (Object.assign(config, c), api) : {...config};
  api.render = (cb?) => { runPipeline(def, resolve(config)).then(cb); return api; };
  return api;
}
```

`coerce(field, value)` centralizes the `typeof === "function" ? _ :
constant(_)` / `accessor(_)` pattern. Per-method autocomplete is preserved
via a mapped type `FluentChart<Def>` derived from the schema.

**Files**: a single `src/fluent.ts`. Every per-chart accessor declaration
deleted. The schema is derived mostly from `def.defaults` plus a small
per-field metadata table for fields needing accessor coercion.

**Risk**: medium-high — `BaseClass.config()` currently reflects over methods
via `Object.getOwnPropertyNames` to discover the config schema. The
React wrapper's `hash()` and the React `Renderer.tsx` config diff both
depend on `config()` round-tripping the methods-as-keys schema. The
generated fluent must reproduce `config()`'s behavior bit-exact, including
`RESET` handling and `nestedReset`. Validation: snapshot every chart's
`config()` output before and after, assert unchanged.

This is the riskiest sub-phase. It also has the largest cleanup payoff —
several thousand lines of repetitive accessor declarations removed.

## Order + checkpoints

1. **E1** ships first (safest, internal-only).
2. **E2** one feature at a time, each gated by the browser parity suite.
   `drawTitle` → `drawSubtitle` → `drawTotal` → `drawBack` →
   `drawAttribution` → `drawColorScale` → `drawLegend` → `drawTimeline`.
3. **E3** one chart at a time (Treemap is the easiest first move because its
   `_draw` is short and produces a single shape). Then Plot-based charts
   (`BarChart`, `LinePlot`, `AreaPlot`, `StackedArea`, `BumpChart`).
   Hierarchy charts (`Pack`, `Tree`, `Network`, `Sankey`) follow. `Geomap`,
   `Pie`, `Donut`, `Rings`, `Matrix`, `RadialMatrix`, `Radar`, `Priestley`
   last.
4. **E4** can land mid-E3 or at the end. Doing it at the end means we don't
   churn the generated methods every time a new chart definition lands.

## What is **not** in scope for Phase E

- New backends (WebGL, etc.) — the Renderer interface already supports them.
- New chart types — the migration is a refactor, not a feature addition.
- Framework wrappers beyond what exists — `@d3plus/react` is already a thin
  proxy that benefits automatically from cleaner `config()` semantics.
- TextBox HTML/bold porting — that's still in `V4_DELETION_AUDIT.md` as
  carved-out work; it's orthogonal to the pipeline refactor.

## Phase E entry criteria

- All Phase D + D2 tests green (24+ parity & regression tests passing).
- The browser parity test suite is the truth oracle throughout E1–E4.
- A new test file `test/pipeline-parity-test.js` will be added in E1 to
  snapshot a chart's `ctx` after each pipeline stage and assert
  stability across the refactor (so individual stage extractions don't
  silently drift).

## Phase E exit criteria

- `Viz._preDraw` is a fold over `stages`.
- All eight drawsteps are `FeatureModule` instances.
- At least three chart types (Treemap, BarChart, LinePlot) live as
  `ChartDefinition` values with thin class facades.
- The fluent API is generated for those three charts; per-method autocomplete
  preserved.
- `config()` snapshots are byte-identical before/after the refactor.
- The browser parity suite still passes.
- Line count of `Viz.ts` reduced from ~2100 to under 1000 (the bulk moves
  into `stages/`, `features/`, `defs/`).
