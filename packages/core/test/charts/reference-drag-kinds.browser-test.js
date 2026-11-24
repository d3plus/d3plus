import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {
  box,
  drag,
  key,
  painted,
  start,
  state,
  yUnit,
} from "./referenceDragPage.js";

/**
    Draggable reference bands, quadrant dividers, `annotations` lines,
    Pareto's threshold, Gantt's "today" line, and lines in small multiples,
    in Chromium on SVG and Canvas: each moves with the mouse or keyboard,
    writes back to its own setting, and fires its own events.
*/

const rows = [];
for (let i = 0; i <= 10; i++)
  rows.push({
    id: `p${i}`,
    x: i * 10,
    y: 10 + ((i * 37) % 80),
    g: i % 2 ? "odd" : "even",
  });

/** Runs in the page: a setting of the chart. */
const setting = name => window.__viz[name]();

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] a band's edges drag, never past each other`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "Plot",
        JSON.stringify({
          data: rows,
          groupBy: "id",
          referenceBands: [
            {y: [30, 50], label: "Target", draggable: {step: 1}},
          ],
        }),
        renderer,
      ]);
      await painted(page);
      const s = await page.evaluate(state);
      assert.strictEqual(s.handles.length, 2);
      assert.strictEqual(s.grips, 2);
      assert.deepStrictEqual(
        s.handles.map(h => h.label),
        ["Start of Target", "End of Target"],
      );
      const unit = await page.evaluate(yUnit);
      const [low] = s.handles;
      await drag(page, [low.x, low.y], -5 * unit);
      assert.deepStrictEqual(await page.evaluate(setting, "referenceBands"), [
        {y: [35, 50], label: "Target", draggable: {step: 1}},
      ]);
      const events = (await page.evaluate(state)).events;
      assert.strictEqual(events.at(-1).what, "referenceBand");
      assert.strictEqual(events.at(-1).kind, "end");
      assert.deepStrictEqual(events.at(-1).value, [35, 50]);
      // Past the other edge, it stops a step short of it.
      const again = (await page.evaluate(state)).handles[0];
      await drag(page, [again.x, again.y], -40 * unit);
      assert.deepStrictEqual(
        (await page.evaluate(setting, "referenceBands"))[0].y,
        [49, 50],
      );
      await key(page, "ArrowDown", 1);
      await page.waitForTimeout(60);
      assert.deepStrictEqual(
        (await page.evaluate(setting, "referenceBands"))[0].y,
        [49, 50],
        "the upper edge can't go below the lower",
      );
    }));

  it(`[${renderer}] the quadrant dividers each move the center's x or y`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "Plot",
        JSON.stringify({
          data: rows,
          groupBy: "id",
          quadrants: {draggable: {step: 1}, topRight: {label: "Leaders"}},
        }),
        renderer,
      ]);
      await painted(page);
      const s = await page.evaluate(state);
      assert.deepStrictEqual(
        s.handles.map(h => h.label),
        ["Vertical divider", "Horizontal divider"],
      );
      assert.strictEqual(s.grips, 2);
      await key(page, "ArrowRight", 0);
      await page.waitForTimeout(60);
      const q = await page.evaluate(setting, "quadrants");
      assert.strictEqual(q.x, 51, "the mean (50) became a value, a step on");
      assert.strictEqual(q.y, undefined, "y still the mean");
      const {events} = await page.evaluate(state);
      assert.strictEqual(events.at(-1).what, "quadrants");
      assert.strictEqual(events.at(-1).index, "x");
      assert.strictEqual(events.at(-1).value.x, 51);
      assert.ok(Number.isFinite(events.at(-1).value.y), "the center's y");
    }));
}

it("a draggable line in annotations writes back to annotations", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "Plot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        annotations: [
          {shape: "ReferenceLine", y: 40, id: "a", draggable: {step: 1}},
        ],
      }),
      "svg",
    ]);
    await painted(page);
    await key(page, "PageUp");
    await page.waitForTimeout(60);
    const [line] = await page.evaluate(setting, "annotations");
    assert.strictEqual(line.y, 50);
    const {events} = await page.evaluate(state);
    assert.deepStrictEqual(
      [events.at(-1).id, events.at(-1).index, events.at(-1).value],
      ["a", 0, 50],
    );
  }));

it("Pareto's threshold line drags with paretoThresholdConfig.draggable", () =>
  withPage(box, async page => {
    const data = ["a", "b", "c", "d", "e"].map((id, i) => ({
      id,
      value: 50 - i * 9,
    }));
    await page.evaluate(start, [
      "Pareto",
      JSON.stringify({
        data,
        groupBy: "id",
        x: "id",
        y: "value",
        paretoThresholdConfig: {draggable: {step: 0.05}},
      }),
      "svg",
    ]);
    await painted(page);
    const s = await page.evaluate(state);
    assert.strictEqual(s.handles.length, 1);
    await key(page, "ArrowDown");
    await page.waitForTimeout(60);
    assert.strictEqual(await page.evaluate(setting, "paretoThreshold"), 0.75);
    const {events} = await page.evaluate(state);
    assert.strictEqual(events.at(-1).index, "paretoThreshold");
    assert.strictEqual(events.at(-1).value, 0.75);
  }));

it("Gantt's today line drags with todayConfig.draggable", () =>
  withPage(box, async page => {
    const tasks = [
      {id: "Plan", start: "2024-01-01", end: "2024-01-20"},
      {id: "Build", start: "2024-01-15", end: "2024-02-20"},
    ];
    await page.evaluate(start, [
      "Gantt",
      JSON.stringify({
        data: tasks,
        today: "2024-01-25",
        todayConfig: {draggable: true},
      }),
      "canvas",
    ]);
    await painted(page);
    const s = await page.evaluate(state);
    assert.strictEqual(s.handles.length, 1);
    assert.strictEqual(s.handles[0].label, "Today");
    await drag(page, [s.handles[0].x, s.handles[0].y], [80, 0]);
    const today = await page.evaluate(() => +window.__viz.today());
    assert.ok(today > +new Date(2024, 0, 26), "moved later");
    const after = await page.evaluate(state);
    assert.ok(after.handles[0].x > s.handles[0].x + 60, "redrawn there");
    assert.strictEqual(after.events.at(-1).index, "today");
  }));

it("small multiples: dragging one panel's line moves it in every panel", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "Plot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        facet: "g",
        referenceLines: [{y: 40, draggable: {step: 1}}],
      }),
      "svg",
    ]);
    await painted(page);
    const before = await page.evaluate(state);
    assert.strictEqual(before.handles.length, 2, "a handle per panel");
    assert.strictEqual(before.grips, 2);
    await drag(page, [before.handles[1].x, before.handles[1].y], -30);
    const after = await page.evaluate(state);
    assert.ok(after.value > 40, `moved up to ${after.value}`);
    const moved = after.handles.map((h, i) => before.handles[i].y - h.y);
    assert.ok(
      moved.every(d => d > 20),
      `every panel's line moved: ${moved}`,
    );
  }));

it("the grip takes the chart's background, light or dark", () =>
  withPage(box, async page => {
    const fill = async theme => {
      await page.evaluate(start, [
        "Plot",
        JSON.stringify({
          data: rows,
          groupBy: "id",
          theme,
          referenceLines: [{y: 40, draggable: true}],
        }),
        "canvas",
      ]);
      await painted(page);
      return page.evaluate(() => {
        let pill;
        const walk = n => {
          if (String(n.key).endsWith("-grip")) pill = n.children[0];
          (n.children || []).forEach(walk);
        };
        walk(window.__viz._paintedScene.root);
        const lum = c => {
          const el = document.createElement("i");
          el.style.color = c;
          document.body.append(el);
          const m = getComputedStyle(el).color.match(/\d+/g);
          el.remove();
          return (+m[0] + +m[1] + +m[2]) / 3;
        };
        return lum(pill.paint.fill);
      });
    };
    assert.ok((await fill("light")) > 200, "a light pill");
    assert.ok((await fill("dark")) < 80, "a dark pill");
  }));

it("lines that can't move get no handle", () =>
  withPage(box, async page => {
    const count = async config => {
      await page.evaluate(start, ["Plot", JSON.stringify(config), "svg"]);
      await painted(page);
      return (await page.evaluate(state)).handles.length;
    };
    assert.strictEqual(
      await count({data: rows, groupBy: "id", referenceLines: [{y: 20}]}),
      0,
      "not draggable",
    );
    assert.strictEqual(
      await count({
        data: rows,
        groupBy: "g",
        referenceLines: [{y: "mean", perSeries: true, draggable: true}],
      }),
      0,
      "one line per series",
    );
  }));
