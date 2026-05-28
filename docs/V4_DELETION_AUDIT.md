# v4 Migration — Default-Dead Code Audit

With `Viz._useSceneRenderer = "svg"` now the default in the constructor, every
new chart instance routes `render()` through `@d3plus/render`. The legacy
d3-selection DOM-drawing code is **only reachable via explicit opt-out**:

```js
new BarChart().useSceneRenderer(false).select(target).render();
```

The blocks below are therefore "default-dead" — exercised only by callers who
opt out. They are candidates for **physical deletion in the next major
version** (when opt-out support is dropped). Each cited line range refers to
its location after the v4 toScene/compute-mode work.

## Shape (`packages/core/src/shapes/Shape.ts`)

- The body of `render()` after the `if (this._renderMode === "compute")` early
  return — the d3 enter/update/exit join, transition setup, hover/active group
  reparenting (~150 lines around `_renderHover`/`_renderActive` calls).
- `_applyStyle()` — only called by the legacy `render()` body and by
  `_renderHover()` / `_renderActive()`.
- `_applyTransform()` — same: only called by the legacy `render()` body and
  the hover/active mutators.
- `_applyEvents()` — only called by legacy `render()` when binding pointer
  events to per-element DOM. The scene path uses `SvgRenderer.on(handler)`
  with a single surface listener + spatial pick.
- `_renderHover()` and `_renderActive()` — DOM-reparenting routines that
  reorder shape/hover/active groups. Replaced by paint-recomputation in the
  scene path.
- The hit-area `<rect>`/`<path>` creation block inside `render()` (the
  `g.d3plus-${name}-hover` / `g.d3plus-${name}-active` siblings).

## Shape subclasses

In each of `Rect.ts`, `Circle.ts`, `Bar.ts`, `Line.ts`, `Area.ts`, `Path.ts`:
the body of `render()` after `super.render(callback)` — the attribute
application (width/height/x/y/cx/cy/r/d, stroke-dasharray choreography,
enter/exit attr writes, transitions). Each is fronted by
`if (this._renderMode === "compute") return super.render(callback);`.

## TextBox (`packages/core/src/components/TextBox.ts`)

- The `boxes` selection block + the big `each` rebuild of `<text>`/`<tspan>`
  elements with font/style attribute writes and d3-transitions, all gated
  behind the compute-mode early return at the top of `render()`.

## Axis (`packages/core/src/components/Axis.ts`)

- The grid `<line>` enter/update/exit block (now wrapped in
  `if (this._renderMode !== "compute")`).
- The domain `<line.bar>` enter + transition block (same wrap).
- The `g.ticks` parent group creation when the tick shape is in compute
  mode (the `if (this._renderMode !== "compute") this._tickShape.select(...)`
  guard).
- `_gridPosition()` and `_barPosition()` — the d3 selection mutators are
  unused once the grid/bar blocks above are gone; only their math survives
  (already factored into the native `_gridLinePoints()` / `_barLinePoints()`
  helpers used by `toScene()`).

## Legend (`packages/core/src/components/Legend.ts`)

- The wrapper groups `this._group` / `this._titleGroup` / `this._shapeGroup`
  are created but populated only by the title TextBox and the swatch shapes
  (both of which run in compute mode and contribute no DOM). The wrappers
  themselves can be elided once the legacy path is removed.

## Timeline (`packages/core/src/components/Timeline.ts`)

- The d3-brush DOM creation in the `_brushGroup` is still snapshotted by
  `Timeline.toScene()` via `domToScene`. The brush is the **one remaining
  legitimate use of the bridge** — replacing it with a native scene emission
  for the selection rect + handles will let `domToScene` retire entirely.

## drawSteps that haven't migrated yet

The `drawSteps/` modules `drawTitle`, `drawSubtitle`, `drawTotal`, `drawBack`,
`drawAttribution` still emit legacy DOM via TextBoxes in the detached compute.
Their TextBox instances do propagate compute mode (via the Viz-level flag
plumbing), so each is already a no-op rendering — but the `elem("g.…")`
wrapper creation still happens. These wrappers in the detached compute are
the next propagation targets.

## How deletion will proceed

1. The `useSceneRenderer(false)` opt-out is marked **deprecated** in v4.
2. Once consumers have migrated, the opt-out is removed in v5. At that point:
   - The `Shape.render()` body and every subclass attribute block can be
     deleted (kept the compute-mode branch only).
   - `_applyStyle`/`_applyTransform`/`_applyEvents`/`_renderHover`/`_renderActive`
     can be deleted.
   - `TextBox.render()` body shrinks to just the compute branch.
   - Axis grid/bar drawing blocks deleted.
   - Hit-area DOM creation deleted.
3. The `renderMode` flag itself becomes vestigial (there's no longer a "full"
   mode to switch to) and can be removed as a cleanup.

The browser parity tests in `packages/core/test/render-parity-test.js` are
the gate: as long as those keep passing (legacy side via explicit
`.useSceneRenderer(false)`, scene side via the new default), the deletion is
safe to proceed step by step.
