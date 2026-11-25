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
  it(`[${renderer}] a band's edges drag, crossing and swapping ends`, () =>
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
      assert.strictEqual(s.grips, 3, "a grip per edge, and one for the body");
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
      // Past the other edge, the two swap.
      const again = (await page.evaluate(state)).handles[0];
      await drag(page, [again.x, again.y], -30 * unit);
      assert.deepStrictEqual(
        (await page.evaluate(setting, "referenceBands"))[0].y,
        [50, 65],
      );
      const after = await page.evaluate(state);
      assert.deepStrictEqual(
        after.handles.map(h => [h.label, h.now]),
        [
          ["Start of Target", "50"],
          ["End of Target", "65"],
        ],
      );
      // The keyboard crosses too, never landing on the other end.
      await key(page, "PageDown", 1);
      await key(page, "PageDown", 1);
      await page.waitForTimeout(60);
      assert.deepStrictEqual(
        (await page.evaluate(setting, "referenceBands"))[0].y,
        [45, 50],
      );
    }));

  it(`[${renderer}] a band's body moves the whole band; the marks under it still hover and click`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "Plot",
        JSON.stringify({
          data: [{id: "in", x: 50, y: 40}, ...rows],
          groupBy: "id",
          referenceBands: [{y: [30, 50], draggable: {step: 1}}],
        }),
        renderer,
      ]);
      await painted(page);
      await page.evaluate(() => {
        window.__hovers = 0;
        window.__viz.on("mousemove.shape", () => window.__hovers++);
      });
      // The point "in" sits inside the band, under its body.
      const point = await page.evaluate(() => {
        let found;
        const walk = (n, x, y) => {
          const t = n.transform || {};
          const nx = x + (t.x || 0),
            ny = y + (t.y || 0);
          const d = n.datum && (n.datum.data || n.datum);
          if (n.type === "circle" && d && d.id === "in")
            found = [nx + (n.cx || 0), ny + (n.cy || 0)];
          (n.children || []).forEach(c => walk(c, nx, ny));
        };
        walk(window.__viz._paintedScene.root, 0, 0);
        const surface = document.querySelector("#viz canvas, #viz svg");
        const r = surface.getBoundingClientRect();
        return [r.left + found[0], r.top + found[1]];
      });
      await page.mouse.move(point[0] - 2, point[1]);
      await page.mouse.move(point[0], point[1]);
      await page.waitForTimeout(60);
      assert.ok((await page.evaluate(() => window.__hovers)) > 0, "hovers");
      await page.mouse.click(point[0], point[1]);
      await page.waitForTimeout(60);
      assert.strictEqual(await page.evaluate(() => window.__clicks), 1);
      const unit = await page.evaluate(yUnit);
      await drag(page, point, -10 * unit);
      assert.deepStrictEqual(
        (await page.evaluate(setting, "referenceBands"))[0].y,
        [40, 60],
        "both ends moved",
      );
      assert.strictEqual(await page.evaluate(() => window.__clicks), 1);
      const {events} = await page.evaluate(state);
      assert.deepStrictEqual(events.at(-1).value, [40, 60]);
      assert.strictEqual(events.at(-1).kind, "end");
      // The keyboard moves it too.
      await page.evaluate(() => {
        const el = document.querySelector(".d3plus-reference-drag-body");
        el.focus();
        for (const type of ["keydown", "keyup"])
          el.dispatchEvent(
            new KeyboardEvent(type, {
              key: "End",
              bubbles: true,
              cancelable: true,
            }),
          );
      });
      await page.waitForTimeout(60);
      const [, top] = (await page.evaluate(setting, "referenceBands"))[0].y;
      const max = await page.evaluate(() =>
        Math.max(...window.__viz._yAxis._getDomain()),
      );
      assert.ok(top <= max && top > 60, `moved to the top: ${top}`);
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
      const {events, texts} = await page.evaluate(state);
      assert.ok(texts.includes("51"), "the divider shows its value");
      assert.strictEqual(events.at(-1).what, "quadrants");
      assert.strictEqual(events.at(-1).index, "x");
      assert.strictEqual(events.at(-1).value.x, 51);
      assert.ok(Number.isFinite(events.at(-1).value.y), "the center's y");
    }));
}

it("a rectangle's body moves it on both axes", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "Plot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        referenceBands: [{x: [20, 40], y: [20, 40], draggable: {step: 1}}],
      }),
      "svg",
    ]);
    await painted(page);
    const [center, unit] = await page.evaluate(() => {
      const el = document.querySelector(".d3plus-reference-drag-body");
      const r = el.getBoundingClientRect();
      const x = window.__viz._xAxis;
      return [
        [r.left + r.width / 2 + 7, r.top + r.height / 2 + 7],
        Math.abs(x._getPosition(0) - x._getPosition(1)),
      ];
    });
    await drag(page, center, [10 * unit, 0]);
    const [band] = await page.evaluate(setting, "referenceBands");
    assert.deepStrictEqual(band.x, [30, 50]);
    assert.deepStrictEqual(band.y, [20, 40], "a level drag keeps y");
    const {events} = await page.evaluate(state);
    assert.deepStrictEqual(events.at(-1).value, {x: [30, 50], y: [20, 40]});
  }));

it("perSeries lines each drag on their own", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "g",
        referenceLines: [{y: "mean", perSeries: true, draggable: {step: 1}}],
      }),
      "canvas",
    ]);
    await painted(page);
    const s = await page.evaluate(state);
    assert.deepStrictEqual(
      s.handles.map(h => h.label),
      ["even", "odd"],
    );
    await key(page, "PageUp", 1);
    await page.waitForTimeout(60);
    const [line] = await page.evaluate(setting, "referenceLines");
    assert.deepStrictEqual(Object.keys(line.seriesValues), ["odd"]);
    const after = await page.evaluate(state);
    assert.strictEqual(after.handles[0].now, s.handles[0].now, "even unmoved");
    assert.strictEqual(after.handles[1].now, `${line.seriesValues.odd}`);
    assert.ok(Number(after.handles[1].now) > Number(s.handles[1].now));
    const last = await page.evaluate(() => window.__seriesEvents);
    assert.strictEqual(last, "odd");
  }));

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
  }));
