import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {withPage} from "~test/browser/page.js";
import {
  box,
  drag,
  key,
  painted,
  press,
  start,
  state,
  yUnit,
} from "./referenceDragPage.js";

/**
    Draggable reference lines in Chromium, on SVG and Canvas: a real mouse
    drags the line (firing drag and end events, without clicking, and
    redrawing on release to refit the axes), the value lasts through a
    redraw, a linked valueColors threshold and the line's highlight follow
    it, the keyboard moves a focused line, one finger drags it, a grip marks
    it, and statistic, category, time, and zoomed lines move too.
*/

const sales = [
  {month: "Jan", sales: 30},
  {month: "Feb", sales: 45},
  {month: "Mar", sales: 60},
  {month: "Apr", sales: 52},
];

const target = {
  data: sales,
  groupBy: "month",
  x: "month",
  y: "sales",
  referenceLines: [{y: 50, id: "target", draggable: {step: 1}}],
  valueColors: {values: "target", colors: ["#ff0000", "#00ff00"]},
};

for (const renderer of ["svg", "canvas"]) {
  it(`[${renderer}] dragging the line moves it, recolors the linked bars, and fires drag and end`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "BarChart",
        JSON.stringify(target),
        renderer,
      ]);
      await painted(page);
      const before = await page.evaluate(state);
      assert.strictEqual(before.handles.length, 1);
      assert.strictEqual(before.grips, 1, "a grip marks the line");
      assert.ok(before.texts.includes("50"), "labeled with its value");
      assert.strictEqual(before.bars.Apr, "#00ff00");
      assert.strictEqual(before.bars.Feb, "#ff0000");
      const [handle] = before.handles;
      const unit = await page.evaluate(yUnit);
      // A drag repaints at the drawn layout; letting go redraws once.
      await page.evaluate(() => {
        const viz = window.__viz;
        const draw = viz._draw;
        window.__draws = 0;
        viz._draw = function (...args) {
          window.__draws++;
          return draw.apply(this, args);
        };
      });
      // Up past 52 (Apr), not 60 (Mar).
      await press(page, [handle.x - 100, handle.y], [0, -5.4 * unit]);
      assert.strictEqual(await page.evaluate(() => window.__draws), 0);
      const mid = await page.evaluate(state);
      assert.ok(mid.lines[0].width > 1, "lit while dragged");
      await page.mouse.up();
      await page.waitForTimeout(60);
      assert.strictEqual(await page.evaluate(() => window.__draws), 1);
      const after = await page.evaluate(state);
      assert.ok(after.value >= 54 && after.value <= 56, `value ${after.value}`);
      assert.ok(Number.isInteger(after.value), "snaps to whole units");
      assert.ok(after.lines[0].y < before.lines[0].y, "the line moved up");
      assert.strictEqual(after.bars.Apr, "#ff0000", "Apr is now below it");
      assert.strictEqual(after.bars.Mar, "#00ff00");
      assert.ok(after.texts.includes(`${after.value}`), "the label follows");
      assert.strictEqual(after.handles[0].now, `${after.value}`);
      const kinds = after.events.map(e => e.kind);
      assert.ok(kinds.filter(k => k === "drag").length >= 2, "drag events");
      assert.deepStrictEqual(kinds.slice(-1), ["end"]);
      assert.strictEqual(after.events.at(-1).value, after.value);
      assert.strictEqual(after.events[0].id, "target");
      assert.strictEqual(after.events[0].index, 0);
      assert.strictEqual(after.clicks, 0, "the drag doesn't click");

      // The value lasts through a redraw.
      await page.evaluate(() => {
        window.__drawn = false;
        window.__viz.render(() => (window.__drawn = true));
      });
      await painted(page);
      const redrawn = await page.evaluate(state);
      assert.strictEqual(redrawn.value, after.value);
      assert.strictEqual(redrawn.bars.Apr, "#ff0000");
    }));

  it(`[${renderer}] the keyboard moves a focused line, settling when the key is let go`, () =>
    withPage(box, async page => {
      await page.evaluate(start, [
        "BarChart",
        JSON.stringify(target),
        renderer,
      ]);
      await painted(page);
      await key(page, "ArrowUp");
      await key(page, "ArrowUp");
      await page.waitForTimeout(60);
      let s = await page.evaluate(state);
      assert.strictEqual(s.value, 52);
      assert.strictEqual(s.handles[0].now, "52");
      assert.strictEqual(s.handles[0].text, "52");
      assert.strictEqual(s.handles[0].label, "Reference line");
      assert.ok(s.handles[0].focused, "keeps focus through the redraw");
      assert.ok(s.lines[0].width > 1, "lit while focused");
      assert.deepStrictEqual(
        s.events.map(e => e.kind),
        ["drag", "end", "drag", "end"],
      );
      await key(page, "PageDown");
      await page.waitForTimeout(60);
      assert.strictEqual((await page.evaluate(state)).value, 42);
      await key(page, "End");
      await page.waitForTimeout(60);
      s = await page.evaluate(state);
      assert.strictEqual(s.handles[0].now, s.handles[0].max);
      await key(page, "Escape");
      assert.strictEqual((await page.evaluate(state)).events.length, 8);
    }));
}

it("letting go redraws, refitting the axis the line had widened", () =>
  withPage(box, async page => {
    const rows = [];
    for (let i = 0; i <= 10; i++) rows.push({id: "a", x: i, y: 20 + i * 2});
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        referenceLines: [{y: 100, draggable: true}],
      }),
      "svg",
    ]);
    await painted(page);
    const top = () =>
      page.evaluate(() => Math.max(...window.__viz._yAxis._getDomain()));
    assert.ok((await top()) >= 100, "widened to the line");
    const {handles} = await page.evaluate(state);
    const unit = await page.evaluate(yUnit);
    await press(page, [handles[0].x, handles[0].y], [0, 60 * unit]);
    assert.ok((await top()) >= 100, "held while dragging");
    await page.mouse.up();
    await page.waitForTimeout(60);
    const value = (await page.evaluate(state)).value;
    assert.ok(value < 45, `dragged to ${value}`);
    assert.ok((await top()) < 100, "refit on release");
  }));

it("a statistic line drags to a fixed value, dropping its name", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "BarChart",
      JSON.stringify({
        ...target,
        referenceLines: [{y: "mean", draggable: true}],
      }),
      "svg",
    ]);
    await painted(page);
    const before = await page.evaluate(state);
    assert.ok(before.texts.includes("Mean"));
    const unit = await page.evaluate(yUnit);
    await drag(page, [before.handles[0].x, before.handles[0].y], -10 * unit);
    const after = await page.evaluate(state);
    assert.strictEqual(typeof after.value, "number");
    assert.ok(after.value > 50, `the mean (46.75) moved up to ${after.value}`);
    assert.ok(!after.texts.includes("Mean"));
    assert.ok(after.texts.includes(`${after.value}`));
  }));

it("a category axis line snaps to the categories it is dragged across", () =>
  withPage(box, async page => {
    await page.evaluate(start, [
      "BarChart",
      JSON.stringify({
        ...target,
        referenceLines: [{x: "Feb", draggable: true}],
      }),
      "canvas",
    ]);
    await painted(page);
    const before = await page.evaluate(state);
    assert.strictEqual(before.handles[0].text, "Feb");
    const step = await page.evaluate(
      () =>
        window.__viz._xAxis._getPosition("Mar") -
        window.__viz._xAxis._getPosition("Feb"),
    );
    await drag(
      page,
      [before.handles[0].x, before.handles[0].y - 50],
      [step * 1.3, 0],
    );
    let s = await page.evaluate(() => window.__viz.referenceLines()[0].x);
    assert.strictEqual(s, "Mar");
    await key(page, "ArrowRight");
    await page.waitForTimeout(60);
    s = await page.evaluate(state);
    assert.strictEqual(
      await page.evaluate(() => window.__viz.referenceLines()[0].x),
      "Apr",
    );
    assert.strictEqual(s.handles[0].text, "Apr");
    assert.deepStrictEqual(s.events.map(e => e.value).slice(-1), ["Apr"]);
  }));

it("a zoomed plot's line drags along its zoomed axis", () =>
  withPage(box, async page => {
    const rows = [];
    for (let i = 0; i <= 10; i++) rows.push({id: "a", x: i, y: i * 10});
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        zoom: true,
        referenceLines: [{y: 50, draggable: true}],
      }),
      "svg",
    ]);
    await painted(page);
    const unzoomed = await page.evaluate(yUnit);
    await page.evaluate(() =>
      document.querySelector("button[aria-label='Zoom In']").click(),
    );
    await page.waitForTimeout(900);
    const zoomed = await page.evaluate(yUnit);
    assert.ok(zoomed > unzoomed * 1.2, "the y axis rescaled");
    const {handles} = await page.evaluate(state);
    assert.strictEqual(handles.length, 1, "still in view");
    await drag(page, [handles[0].x - 50, handles[0].y], -30);
    const {value} = await page.evaluate(state);
    const expected = 50 + 30 / zoomed;
    assert.ok(Math.abs(value - expected) < 0.5, `${value} ≈ ${expected}`);
  }));

it("one finger drags the line", () =>
  withPage(box, async page => {
    await page.evaluate(start, ["BarChart", JSON.stringify(target), "svg"]);
    await painted(page);
    await page.evaluate(() => {
      const el = document.querySelector(".d3plus-reference-drag");
      const r = el.getBoundingClientRect();
      const x = r.left + 20,
        y = r.top + r.height / 2;
      const touch = dy =>
        new Touch({identifier: 1, target: el, clientX: x, clientY: y + dy});
      const fire = (type, dy) => {
        const t = touch(dy);
        const list = type === "touchend" ? [] : [t];
        (type === "touchstart" ? el : window).dispatchEvent(
          new TouchEvent(type, {
            touches: list,
            targetTouches: list,
            changedTouches: [t],
            bubbles: true,
            cancelable: true,
          }),
        );
      };
      fire("touchstart", 0);
      fire("touchmove", 20);
      fire("touchmove", 40);
      fire("touchend", 40);
    });
    await page.waitForTimeout(60);
    const s = await page.evaluate(state);
    assert.ok(s.value < 50, `moved down to ${s.value}`);
    assert.strictEqual(s.events.at(-1).kind, "end");
  }));

it("highlight follows a dragged line", () =>
  withPage(box, async page => {
    const points = [
      {id: "a", x: 1, y: 10},
      {id: "b", x: 2, y: 40},
      {id: "c", x: 3, y: 70},
    ];
    await page.evaluate(start, [
      "Plot",
      JSON.stringify({
        data: points,
        groupBy: "id",
        referenceLines: [{y: 50, draggable: true, highlight: "above"}],
      }),
      "svg",
    ]);
    await painted(page);
    // The rows off the highlighted side gray out.
    const gray = c => /^rgb\((\d+), \1, \1\)$/.test(c);
    const before = await page.evaluate(state);
    assert.ok(gray(before.fills.a) && gray(before.fills.b), "a and b grayed");
    assert.ok(!gray(before.fills.c), "c lit");
    const unit = await page.evaluate(yUnit);
    await drag(page, [before.handles[0].x, before.handles[0].y], 20 * unit);
    const after = await page.evaluate(state);
    assert.ok(after.value < 40 && after.value > 10, `value ${after.value}`);
    assert.ok(!gray(after.fills.b), "b lit too");
    assert.ok(gray(after.fills.a), "a still grayed");
  }));

it("a time axis line drags to dates inside its range", () =>
  withPage(box, async page => {
    const rows = [];
    for (let i = 0; i < 24; i++)
      rows.push({id: "p", date: Date.UTC(2021, i, 1), value: 10 + (i % 5)});
    await page.evaluate(start, [
      "LinePlot",
      JSON.stringify({
        data: rows,
        groupBy: "id",
        x: "date",
        y: "value",
        xConfig: {utc: true},
        referenceLines: [
          {
            x: Date.UTC(2021, 6, 1),
            draggable: {min: Date.UTC(2021, 3, 1), max: Date.UTC(2021, 9, 1)},
          },
        ],
      }),
      "svg",
    ]);
    await page.evaluate(() => {
      window.__drawn = false;
      window.__viz.time("date").render(() => (window.__drawn = true));
    });
    await painted(page);
    const before = await page.evaluate(state);
    assert.strictEqual(before.handles[0].text, "Jul 1, 2021");
    await drag(page, [before.handles[0].x, before.handles[0].y], [400, 0], 2);
    const after = await page.evaluate(() => ({
      x: +window.__viz.referenceLines()[0].x,
      date: window.__viz.referenceLines()[0].x instanceof Date,
      events: window.__events,
    }));
    assert.ok(after.date, "stored as a Date");
    assert.strictEqual(after.x, Date.UTC(2021, 9, 1), "kept at its max");
    assert.strictEqual(after.events.at(-1).value, after.x);
  }));
