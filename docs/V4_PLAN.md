# d3plus v4 — Master Plan: delete legacy, build the pipeline

## Decision (2026-05-28)

All legacy DOM-drawing code is deleted as part of **v4**, not v5. There is **no
opt-out** to the old d3-selection rendering. Every chart renders exclusively
through `@d3plus/render` (SvgRenderer / CanvasRenderer driving a scene graph).

This is a breaking change for every consumer who relied on the legacy DOM
classes (`d3plus-Treemap`, `d3plus-Rect`, `d3plus-Shape`, `d3plus-textBox`,
etc.) being present in their target element. The scene path uses
`d3plus-render-*` classes instead.

## What gets deleted

Everything in `docs/V4_DELETION_AUDIT.md`, plus:

- The `useSceneRenderer` flag (no longer needed — there's only one path).
- The `renderMode` flag on Shape / TextBox / Axis / Legend / Timeline (no
  longer needed — compute mode becomes the only mode).
- `Shape.render()`'s body after the compute-mode early return.
- `Shape._applyStyle`, `_applyTransform`, `_applyEvents`, `_renderHover`,
  `_renderActive`, the hit-area DOM block.
- Each subclass's post-`super.render()` attribute block
  (`Rect`/`Circle`/`Bar`/`Line`/`Area`/`Path`).
- `TextBox.render()`'s `boxes` join + `each` block.
- `Axis.render()`'s `if (this._renderMode !== "compute")` blocks (grid + bar
  drawing) along with `_gridPosition` / `_barPosition` once their math is
  fully captured in `_gridLinePoints` / `_barLinePoints`.
- Legend's wrapper-group elem() calls (`_group` / `_titleGroup` / `_shapeGroup`).
- `domToScene` retires from the default code path (still exported from
  `@d3plus/render` for external use).
- `Viz.renderScene` collapses into `Viz.render` since they do the same thing.

## What stays

- The data pipeline (`_preDraw`, scale construction, layout) — still needed
  by `toScene()`.
- The Shape / TextBox / Axis / Legend classes themselves — they remain as
  configuration carriers + `toScene()` emitters.
- `BaseClass.config()` reflection — still the public configuration contract.

## Phasing

### Phase A — native Timeline brush *(in flight)*
Replace the `domToScene(this._brushGroup)` snapshot in `Timeline.toScene()`
with a native `rect` SceneNode computed from the current brush selection
state (the date range mapped through the time scale). Once this lands,
`domToScene` has no caller in any default chart render path.

### Phase B — remove `useSceneRenderer` opt-out
- Delete the `useSceneRenderer()` accessor + `_useSceneRenderer` field.
- `Viz.render()` unconditionally routes through `renderScene` (which can
  then be inlined into `render()` itself in Phase D).
- Remove `useSceneRenderer` from `BaseClass.getAllMethods` exclusion list.

### Phase C — rewrite tests against scene output
The legacy-DOM-asserting tests have to go. Each is replaced with a
scene-DOM assertion that captures the same intent:

- **`packages/core/test/charts/Treemap-test.js`** — converted to assert
  scene SVG classes (`d3plus-render-svg` / `d3plus-render-rect`), with text
  content checks for cell labels.
- **`packages/core/test/render-parity-test.js`** — the legacy/scene
  *comparison* tests lose their reference; convert to **scene-output
  expectations**: a Treemap with known data must produce N cells of known
  sizes (computed from the d3-hierarchy treemap layout). The parity
  comparisons become "scene rendering matches the expected geometric layout"
  rather than "scene matches legacy DOM."
- **Compute-mode "physical deletion" test** — obsolete (renderMode goes
  away). Replaced with "viz.render() produces zero `d3plus-Rect` / zero
  `d3plus-textBox` legacy classes" — verifying the legacy classes never
  appear, period.

### Phase D — delete legacy code
Once the tests are scene-only, every line listed in
`V4_DELETION_AUDIT.md` and the section above can be removed:

1. **Shape subclasses**: delete the post-`super.render(callback)` blocks.
2. **Shape.render**: delete the entire body after the compute-mode early
   return; collapse the early return into the new full body.
3. **Shape**: delete `_applyStyle` / `_applyTransform` / `_applyEvents` /
   `_renderHover` / `_renderActive` / hit-area construction.
4. **TextBox.render**: delete everything after the early return; collapse.
5. **Axis.render**: delete the guarded grid + bar drawing blocks; delete
   `_gridPosition` / `_barPosition` (their math now lives in the
   `_gridLinePoints` / `_barLinePoints` helpers used by `toScene()`).
6. **Legend.render**: delete the `_group` / `_titleGroup` / `_shapeGroup`
   wrapper elem() calls. The detached compute container becomes truly empty.
7. **Remove `renderMode` field + accessor** from every class that has it.
   `compute` was the only mode; now it's the default behavior.

### Phase E — pipeline / feature-module / fluent (RFC §3)
With the legacy gone, every chart is already
`config → _preDraw → _draw → this._shapes → toScene → SvgRenderer`. The
pipeline work is the refactor of that into explicit, pure stages with the
shape of RFC §3:

```
UserConfig ──resolve──▶ ResolvedSpec ──transform stages──▶ Scene ──renderer──▶ DOM/Canvas
```

Concrete subphases:

- **E1.** Extract a `ChartDefinition` shape: `{name, defaults, features,
  stages}`. Existing chart classes (`Treemap`, `BarChart`, ...) become
  instances built from definitions; the data-shape stays config-compatible.
- **E2.** Move `Viz._preDraw` into a sequence of named pure stages
  (`deriveDataDepth`, `applyTimeFilter`, `applyUserFilter`, `rollupGroups`,
  `applyThresholds`, `applyHiddenSolo`) — each `(ctx) => Partial<ctx>`.
- **E3.** Promote axis / legend / timeline / title / etc. to **FeatureModule**
  instances composed via the chart definition's `features` array, with
  explicit margin negotiation (each feature returns its panel + margin
  consumed).
- **E4.** Generate the fluent API methods from a schema, replacing the
  hand-written `arguments.length`-overloaded accessors on every chart. The
  factory lives in one place; charts contribute a `defaults` patch.

E1–E3 are mostly mechanical refactors of existing code. E4 is more invasive
(every chart's hand-written accessors get generated) and may be the v4.1
work.

## Test strategy through the deletion

- **Browser parity gate**: `packages/core/test/render-parity-test.js` runs
  in real Chromium and is the truth oracle. After Phase C it asserts scene
  output directly (no legacy reference).
- **Phase-by-phase regression**: run the full mocha suite after each
  deletion phase. Any pre-existing component test that breaks is either
  rewritten against scene output or deleted as obsolete.
- **Visual snapshots (deferred)**: Playwright snapshot testing of the
  scene output for a handful of chart configurations would lock in pixel
  parity going forward. Not blocking the deletion, but listed as a v4.0
  release-checklist item.

## Versioning

Repo is currently `3.1.6`. The deletion + scene-only default constitutes
v4.0.0. The pipeline / feature-module work (Phase E) is a refactor that
can land within v4 minor bumps (no further API breakage expected as long
as `BaseClass.config()` semantics are preserved). The fluent generation
(E4) may end up in v4.1 if it requires breaking method ergonomics.

## Critical files

- `packages/core/src/components/Timeline.ts` — Phase A target
- `packages/core/src/charts/Viz.ts` — Phase B + D
- `packages/core/src/shapes/Shape.ts` + 6 subclasses — Phase D
- `packages/core/src/components/{TextBox,Axis,Legend}.ts` — Phase D
- `packages/core/src/utils/BaseClass.ts` — Phase B (exclusion list cleanup)
- `packages/core/test/charts/Treemap-test.js`,
  `packages/core/test/render-parity-test.js` — Phase C
