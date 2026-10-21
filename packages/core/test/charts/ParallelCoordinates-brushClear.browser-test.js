import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Clearing ParallelCoordinates brushes in Chromium, on SVG and Canvas: a
    plain click on a strip outside its selection, a double-click on the
    strip, and Escape on a focused (brushed) strip each clear that axis's
    brush, fire on("brush"), and restore the lines; on small multiples every
    panel's strip for the axis clears together.
*/

const rows = Array.from({length: 40}, (_, i) => ({
  id: `r${i}`,
  group: ["A", "B"][i % 2],
  x: i,
  y: (i * 7) % 40,
  z: 40 - i,
}));

/**
    Runs in the page: draws a chart, then plays `steps`. Each step names an
    action on a dimension's strip (`panel` picks the small-multiples panel)
    at fraction `f` from the strip's top: "press", "release", "click",
    "dblclick", "focus", or "escape"; a "record" step snapshots the brushes,
    the painted lines, and each strip's state under `label`.
*/
const scenario = async ({data, renderer, brushes, facet, steps}) => {
  const fired = [];
  const viz = new window.d3plus.ParallelCoordinates()
    .select("#viz")
    .duration(0)
    .renderer(renderer)
    .data(data)
    .groupBy(["group", "id"])
    .brushes(brushes)
    .on("brush", b => fired.push(b));
  if (facet) viz.facet(facet);
  await new Promise(r => viz.render(r));

  const frame = () => new Promise(r => requestAnimationFrame(() => setTimeout(r, 20)));
  const strips = key =>
    [...document.querySelectorAll("#viz g.d3plus-parallel-brush")].filter(g => g.__data__.key === key);
  const at = (g, f) => {
    const box = g.querySelector("rect.overlay").getBoundingClientRect();
    return {clientX: box.left + box.width / 2, clientY: box.top + box.height * f, bubbles: true, view: window, button: 0};
  };
  // The element a real pointer would hit: the selection rect inside a brush, else the overlay.
  const hit = (g, f) => {
    const p = at(g, f);
    return document.elementFromPoint(p.clientX, p.clientY);
  };
  const actions = {
    press: (g, f) => hit(g, f).dispatchEvent(new MouseEvent("mousedown", {...at(g, f), detail: 1})),
    release: (g, f) => window.dispatchEvent(new MouseEvent("mouseup", at(g, f))),
    click: (g, f) => {
      actions.press(g, f);
      actions.release(g, f);
    },
    dblclick: (g, f) => {
      actions.click(g, f);
      actions.click(g, f);
      hit(g, f).dispatchEvent(new MouseEvent("dblclick", {...at(g, f), detail: 2}));
    },
    focus: g => g.focus(),
    escape: g => g.dispatchEvent(new KeyboardEvent("keydown", {key: "Escape", bubbles: true})),
  };
  const lines = () => {
    const out = [];
    for (const n of sceneNodes(viz._paintedScene.root)) {
      if (typeof n.key === "string" && n.key.includes("pc-line-") && !n.key.endsWith("::hit")) out.push(n);
    }
    return {
      faded: out.filter(n => n.interactive === false).length,
      opacities: [...new Set(out.map(n => n.paint.strokeOpacity))].length,
    };
  };
  const stripState = g => ({
    shown: g.querySelector("rect.selection").style.display !== "none",
    tabindex: g.getAttribute("tabindex"),
    hint: g.querySelector(":scope > title")?.textContent ?? null,
  });
  const log = {};
  const record = label => {
    log[label] = {
      brushes: viz.brushes(),
      lines: lines(),
      strips: Object.fromEntries(["x", "y", "z"].map(k => [k, strips(k).map(stripState)])),
      focused: document.activeElement?.__data__?.key ?? null,
      fired: fired.length,
    };
  };
  record("start");
  for (const step of steps) {
    if (step.record) record(step.record);
    else {
      actions[step.do](strips(step.key)[step.panel ?? 0], step.f ?? 0.5);
      await frame();
    }
  }
  return {log, last: fired[fired.length - 1]};
};

const hint = "x: Double-click or Escape to Clear";

for (const renderer of ["svg", "canvas"]) {
  it(`ParallelCoordinates (${renderer}) a click on a strip outside its brush clears it and restores the lines`, async function () {
    const {log, last} = await render("<div id='viz' style='width:700px;height:400px'></div>", scenario, {
      data: rows,
      renderer,
      brushes: {x: [10, 29]},
      // x runs from 39 at the top to 0 at the bottom: 0.05 down is about 37, outside [10, 29].
      steps: [
        {do: "press", key: "x", f: 0.05},
        {record: "pressed"},
        {do: "release", key: "x", f: 0.05},
        {record: "released"},
      ],
    });
    assert.ok(log.start.lines.faded > 0, "the brush fades lines");
    assert.deepStrictEqual(log.start.strips.x, [{shown: true, tabindex: "0", hint}], "a brushed strip is focusable and hints how to clear it");
    assert.strictEqual(log.pressed.lines.faded, 0, "pressing outside the selection doesn't gray every line");
    assert.deepStrictEqual(log.released.brushes, {}, "the brush is cleared");
    assert.deepStrictEqual(last, {}, "on('brush') reports no brushes");
    assert.strictEqual(log.released.lines.faded, 0, "every line is active again");
    assert.strictEqual(log.released.lines.opacities, 1, "and drawn at one opacity");
    assert.deepStrictEqual(log.released.strips.x, [{shown: false, tabindex: null, hint: null}], "the strip shows no selection and leaves the tab order");
  });

  it(`ParallelCoordinates (${renderer}) double-clicking a brush clears it`, async function () {
    const {log, last} = await render("<div id='viz' style='width:700px;height:400px'></div>", scenario, {
      data: rows,
      renderer,
      brushes: {x: [10, 29], y: [0, 20]},
      steps: [
        {do: "click", key: "x"},
        {do: "click", key: "x"},
        {record: "clicked inside"},
        {do: "dblclick", key: "x"},
        {record: "x cleared"},
        {do: "dblclick", key: "y", f: 0.9},
        {record: "y cleared"},
      ],
    });
    assert.deepStrictEqual(Object.keys(log["clicked inside"].brushes).sort(), ["x", "y"], "clicks inside a selection keep it");
    assert.deepStrictEqual(Object.keys(log["x cleared"].brushes), ["y"], "the double-click clears only that axis");
    assert.ok(log["x cleared"].lines.faded > 0, "the other brush still filters");
    assert.strictEqual(log["x cleared"].strips.x[0].shown, false);
    assert.deepStrictEqual(log["y cleared"].brushes, {}, "the last brush clears");
    assert.deepStrictEqual(last, {});
    assert.strictEqual(log["y cleared"].lines.faded, 0, "every line is active again");
  });

  it(`ParallelCoordinates (${renderer}) Escape clears a focused brush`, async function () {
    const {log, last} = await render("<div id='viz' style='width:700px;height:400px'></div>", scenario, {
      data: rows,
      renderer,
      brushes: {x: [10, 29]},
      steps: [
        {do: "escape", key: "z"},
        {record: "escape elsewhere"},
        {do: "focus", key: "x"},
        {record: "focused"},
        {do: "escape", key: "x"},
        {record: "escaped"},
      ],
    });
    assert.deepStrictEqual(log.start.strips.z, [{shown: false, tabindex: null, hint: null}], "a strip with no brush stays out of the tab order");
    assert.deepStrictEqual(log["escape elsewhere"].brushes, {x: [10, 29]}, "Escape on another strip keeps the brush");
    assert.strictEqual(log.focused.focused, "x", "a brushed strip takes focus");
    assert.deepStrictEqual(log.escaped.brushes, {}, "Escape clears it");
    assert.strictEqual(log.escaped.lines.faded, 0);
    assert.deepStrictEqual(last, {});
  });

  it(`ParallelCoordinates (${renderer}) clearing a brush on one panel clears it on every panel`, async function () {
    const {log} = await render("<div id='viz' style='width:800px;height:400px'></div>", scenario, {
      data: rows,
      renderer,
      brushes: {x: [0, 9]},
      facet: "group",
      steps: [{do: "dblclick", key: "x", panel: 1, f: 0.9}, {record: "cleared"}],
    });
    assert.deepStrictEqual(log.start.strips.x.map(s => s.shown), [true, true], "both panels show the brush");
    assert.deepStrictEqual(log.cleared.strips.x.map(s => s.shown), [false, false], "a double-click on the second panel clears both");
    assert.deepStrictEqual(log.cleared.brushes, {});
    assert.strictEqual(log.cleared.lines.faded, 0, "every panel's lines are active again");
  });
}
