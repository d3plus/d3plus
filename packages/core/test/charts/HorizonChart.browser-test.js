/* global requestAnimationFrame, setTimeout */
import {describe, it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    HorizonChart in a real browser, on SVG and Canvas: one row per series
    labeled on the y axis, bands folded onto each row's baseline, a band key
    legend, the full-height crosshair with every row's value, keyboard focus
    along each row, small multiples with their own rows, and dark themes.
*/

/** Page-side helpers, installed before each probe. */
const helpers = () => {
  window.__rows = () =>
    ["north", "south", "west"].flatMap((id, s) =>
      Array.from({length: 12}, (_, x) => ({
        id,
        region: s === 2 ? "B" : "A",
        x,
        date: new Date(Date.UTC(2024, 0, 1 + x * 7)),
        v: s === 1 ? -(x % 6) * 2 : ((x * (s + 3)) % 11) + (s === 0 ? 1 : 0),
      })),
    );
  window.__wait = () =>
    new Promise(r => requestAnimationFrame(() => setTimeout(r, 60)));
  window.__draw = (renderer, configure, size = [800, 400]) =>
    new Promise(resolve => {
      document.body.innerHTML = "";
      const el = document.createElement("div");
      el.style.cssText = `position:absolute;top:0;left:0;width:${size[0]}px;height:${size[1]}px`;
      document.body.appendChild(el);
      const viz = new window.d3plus.HorizonChart()
        .select(el)
        .detectVisible(false)
        .duration(0)
        .renderer(renderer)
        .width(size[0])
        .height(size[1])
        .data(window.__rows())
        .groupBy("id")
        .x("x")
        .y("v");
      configure(viz);
      viz.render(() => resolve({el, viz}));
    });
  // Every node in a scene, depth first.
  window.__nodes = nodes => {
    const out = [];
    const walk = n => {
      out.push(n);
      (n.children || []).forEach(walk);
    };
    nodes.forEach(walk);
    return out;
  };
  // The element pointer events go to, and a client point at chart-content (x, y).
  window.__pointer = (el, viz, x, y) => {
    const target =
      viz.renderer() === "canvas"
        ? el.querySelector("canvas.d3plus-render-canvas")
        : el.querySelector("rect[data-key^='horizon-row-']");
    const box = el.getBoundingClientRect();
    const t = viz._chartTransform || {};
    return {
      target,
      clientX: box.left + x + (t.x || 0),
      clientY: box.top + y + (t.y || 0),
    };
  };
  // A row label's center, in client pixels, read off an SVG draw.
  window.__labelAt = async (text, configure = v => v) => {
    const {el} = await window.__draw("svg", configure);
    const label = Array.from(el.querySelectorAll("text")).find(
      t => t.textContent === text,
    );
    const b = label.getBoundingClientRect();
    const at = [b.left + b.width / 2, b.top + b.height / 2];
    at.box = {left: b.left, right: b.right, top: b.top, bottom: b.bottom};
    return at;
  };
  // Pointer events at a client point, on whatever element is there.
  window.__at = async ([x, y], type, init = {}) => {
    document
      .elementFromPoint(x, y)
      .dispatchEvent(
        new MouseEvent(type, {clientX: x, clientY: y, bubbles: true, ...init}),
      );
    await window.__wait();
  };
  // The opacity a row label is painted with.
  window.__labelOpacity = (viz, text) => {
    const node = window
      .__nodes(viz._paintedScene.root.children)
      .find(
        n =>
          n.type === "text" &&
          (n.lines || []).map(l => l.text).join("") === text,
      );
    if (!node) return null;
    const p = node.paint || {};
    return p.opacity ?? p.fillOpacity ?? node.opacity ?? 1;
  };
  window.__move = async (el, viz, x, y) => {
    const {target, clientX, clientY} = window.__pointer(el, viz, x, y);
    target.dispatchEvent(
      new MouseEvent("mousemove", {clientX, clientY, bubbles: true}),
    );
    await window.__wait();
    const tip = Array.from(document.querySelectorAll(".d3plus-tooltip")).find(
      t => t.innerText.trim(),
    );
    return tip ? tip.innerText.replace(/\s+/g, " ").trim() : "";
  };
};

const run = (fn, arg) =>
  render("", new Function("arg", `return (${helpers})(), (${fn})(arg);`), arg);

for (const renderer of ["svg", "canvas"]) {
  describe(`HorizonChart [${renderer}]`, () => {
    it("draws a row per series, first on top, with bands and a band key", async () => {
      const out = await run(async renderer => {
        const {el, viz} = await window.__draw(renderer, v => v);
        const nodes = window.__nodes(viz._chartScene);
        const rows = nodes.filter(n => `${n.key}`.startsWith("horizon-row-"));
        const bands = nodes.filter(
          n => n.type === "path" && `${n.key}`.startsWith("horizon-"),
        );
        const area = viz._plotArea;
        return {
          rows: rows.map(r => ({
            key: r.key,
            top: r.y,
            bottom: r.y + r.height,
            points: r.interactionPoints.length,
          })),
          area,
          bands: bands.map(b => ({key: b.key, fill: b.paint.fill})),
          palette: viz.ctx.horizon.palette,
          size: viz.ctx.horizon.size,
          labels: viz._yAxis._d3Scale
            .domain()
            .map(d => viz._yAxis.schema.tickFormat(d)),
          legend: viz._legendData.length,
          svgPaths:
            renderer === "svg"
              ? el.querySelectorAll("path[data-key^='horizon-']").length
              : null,
          nan:
            renderer === "svg"
              ? Array.from(el.querySelectorAll("*")).filter(n =>
                  Array.from(n.attributes).some(a => a.value.includes("NaN")),
                ).length
              : 0,
        };
      }, renderer);
      assert.deepStrictEqual(
        out.rows.map(r => r.key),
        ["horizon-row-north", "horizon-row-south", "horizon-row-west"],
      );
      const [a, b, c] = out.rows;
      assert.ok(a.bottom <= b.top && b.bottom <= c.top, "rows stack down");
      assert.ok(a.top >= out.area.y - 1, "rows fill the plot area");
      assert.ok(c.bottom <= out.area.y + out.area.height + 1);
      assert.ok(
        Math.abs(a.bottom - a.top - (b.bottom - b.top)) < 0.01,
        "rows share one height",
      );
      out.rows.forEach(r => assert.strictEqual(r.points, 12));
      assert.deepStrictEqual(out.labels.slice().sort(), [
        "north",
        "south",
        "west",
      ]);
      assert.strictEqual(
        out.size,
        5,
        "the largest value over 3 bands, rounded up",
      );
      assert.strictEqual(out.legend, 6, "three bands of each sign");
      const fills = new Set(out.bands.map(b => b.fill));
      assert.ok(
        fills.has(out.palette.negative[0]) &&
          fills.has(out.palette.positive[2]),
        "both hues, every shade",
      );
      if (out.svgPaths !== null)
        assert.strictEqual(out.svgPaths, out.bands.length);
      assert.strictEqual(out.nan, 0);
    });

    it("hover shows every row's value at the nearest x, under a full-height crosshair", async () => {
      const out = await run(async renderer => {
        const {el, viz} = await window.__draw(renderer, v => v);
        const area = viz._plotArea;
        const x = viz._xFunc(4) + 3;
        const tip = await window.__move(el, viz, x, area.y + 10);
        await window.__wait();
        const crosshair = window
          .__nodes(viz._paintedScene.root.children)
          .find(n => `${n.key}`.includes("crosshair"));
        const line = crosshair
          ? window.__nodes([crosshair]).find(n => n.key === "crosshair")
          : null;
        const ys = line
          ? line.d
              .match(/-?[\d.]+/g)
              .map(Number)
              .filter((_, i) => i % 2)
              .map(y => y + (line.transform?.y ?? 0))
          : [];
        const state = viz._sharedHoverState;
        viz.tooltipShared(false);
        await new Promise(r => viz.render(r));
        const single = await window.__move(
          el,
          viz,
          x,
          area.y + area.height - 5,
        );
        return {
          tip,
          single,
          px: state && state.px,
          expected: viz._xFunc(4),
          span: ys.length ? [Math.min(...ys), Math.max(...ys)] : null,
          area,
        };
      }, renderer);
      assert.ok(out.tip.startsWith("4"), `titled by x: ${out.tip}`);
      ["north 2", "south -8", "west 9"].forEach(row =>
        assert.ok(out.tip.includes(row), `${row}: ${out.tip}`),
      );
      assert.ok(Math.abs(out.px - out.expected) < 0.5, "snapped to x 4");
      assert.ok(out.span, "a crosshair is drawn");
      assert.ok(
        Math.abs(out.span[1] - out.span[0] - out.area.height) < 2,
        `spans the plot: ${out.span} vs ${out.area.height}`,
      );
      assert.ok(out.single.includes("west 9"), out.single);
      assert.ok(!out.single.includes("north"), `one row only: ${out.single}`);
    });

    it("a band key entry lights that shade in every row", async () => {
      const out = await run(async renderer => {
        const {viz} = await window.__draw(renderer, v => v);
        const entry = viz._legendData[3];
        viz.schema.on.mouseenter.call(viz, entry, 3);
        await window.__wait();
        const bands = window
          .__nodes(viz._chartScene)
          .filter(n => n.type === "path" && `${n.key}`.startsWith("horizon-"));
        return bands.map(b => ({key: b.key, lit: viz._hover(b.datum, 0)}));
      }, renderer);
      out.forEach(b =>
        assert.strictEqual(b.lit, /-p0(-\d+)?$/.test(b.key), b.key),
      );
      assert.ok(out.some(b => b.lit));
    });

    it("keyboard focus walks each row's points and shows the shared tooltip", async () => {
      const out = await run(async renderer => {
        const {el} = await window.__draw(renderer, v => v);
        const host = el.querySelector(".d3plus-keyboard-nav");
        const record = () => {
          const tip = document.querySelector(
            ".d3plus-tooltip .d3plus-tooltip-title",
          );
          return {
            live: host.querySelector("[aria-live]").textContent,
            title: tip ? tip.textContent : null,
          };
        };
        const key = async k => {
          host.dispatchEvent(
            new KeyboardEvent("keydown", {key: k, bubbles: true}),
          );
          await window.__wait();
          return record();
        };
        host.focus();
        await window.__wait();
        const first = record();
        return {
          first,
          right: await key("ArrowRight"),
          next: await key("ArrowRight"),
          down: await key("ArrowDown"),
        };
      }, renderer);
      assert.strictEqual(
        out.first.live,
        "north, Click to Hide",
        "focus starts on the top row label",
      );
      assert.strictEqual(out.right.title, "0", JSON.stringify(out.right));
      assert.strictEqual(out.next.title, "1", JSON.stringify(out.next));
      assert.strictEqual(out.down.title, "1", "down stays at x 1");
      assert.notStrictEqual(out.down.live, out.next.live, "on another row");
    });

    it("small multiples share x and band size, each panel drawing its own rows", async () => {
      const out = await run(async renderer => {
        const {viz} = await window.__draw(
          renderer,
          v => v.facet("region"),
          [900, 400],
        );
        return {
          size: viz.ctx.horizon.size,
          panels: viz._facetPanels.map(p => ({
            key: p.key,
            rows: window
              .__nodes(p.scene)
              .filter(n => `${n.key}`.startsWith("horizon-row-"))
              .map(n => n.key),
          })),
        };
      }, renderer);
      assert.strictEqual(out.size, 5);
      assert.deepStrictEqual(
        out.panels.map(p => p.rows),
        [["horizon-row-north", "horizon-row-south"], ["horizon-row-west"]],
      );
    });

    it("a dark theme ramps the bands up from the background", async () => {
      const out = await run(async renderer => {
        const {viz} = await window.__draw(renderer, v => v.theme("dark"));
        const bands = window
          .__nodes(viz._chartScene)
          .filter(n => n.type === "path" && `${n.key}`.startsWith("horizon-"));
        const fill = k => bands.find(b => b.key === k).paint.fill;
        const lum = c => {
          const el = document.createElement("div");
          el.style.color = c;
          document.body.appendChild(el);
          const [r, g, b] = getComputedStyle(el)
            .color.match(/\d+/g)
            .map(Number);
          el.remove();
          return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        return {
          low: lum(fill("horizon-north-p0")),
          high: lum(fill("horizon-north-p2")),
          theme: viz._theme.dark,
        };
      }, renderer);
      assert.ok(out.theme);
      assert.ok(out.high > out.low, "higher bands are brighter on dark");
    });
  });
}

for (const renderer of ["svg", "canvas"]) {
  describe(`HorizonChart row labels [${renderer}]`, () => {
    it("clicking a row label hides its series, Shift+click solos it, and Back undoes it", async () => {
      const out = await run(async renderer => {
        const south = await window.__labelAt("south");
        const north = await window.__labelAt("north");
        const {el, viz} = await window.__draw(renderer, v => v);
        const rows = () =>
          window
            .__nodes(viz._chartScene)
            .filter(n => `${n.key}`.startsWith("horizon-row-"))
            .map(n => `${n.key}`.slice(12));
        const surface =
          renderer === "canvas"
            ? el.querySelector("canvas.d3plus-render-canvas")
            : el.querySelector("svg");
        const size = viz.ctx.horizon.size;
        await window.__at(south, "mousemove");
        const tip = Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .map(t => t.innerText.replace(/\s+/g, " ").trim())
          .find(t => t);
        const cursor = surface.style.cursor;
        await window.__at(south, "click");
        await window.__wait();
        const hidden = {
          ids: [...viz._hidden],
          rows: rows(),
          domain: viz._yAxis._d3Scale.domain().slice(),
          south: window.__labelOpacity(viz, "south"),
          north: window.__labelOpacity(viz, "north"),
          size: viz.ctx.horizon.size,
          legend: viz._legendData.length,
        };
        await window.__at(south, "click");
        await window.__wait();
        const shown = {ids: [...viz._hidden], rows: rows()};
        await window.__at(north, "click", {shiftKey: true});
        await window.__wait();
        const solo = {
          ids: [...viz._solo],
          rows: rows(),
          south: window.__labelOpacity(viz, "south"),
        };
        const back = Array.from(el.querySelectorAll("button")).find(b =>
          /back/i.test(b.getAttribute("aria-label") || b.textContent),
        );
        back.click();
        await window.__wait();
        await window.__wait();
        return {
          size,
          tip,
          cursor,
          hidden,
          shown,
          solo,
          back: {solo: [...viz._solo], hidden: [...viz._hidden], rows: rows()},
        };
      }, renderer);
      assert.ok(out.tip.startsWith("south"), out.tip);
      assert.ok(
        out.tip.includes("Click to Hide") &&
          out.tip.includes("Shift+Click to Highlight"),
        out.tip,
      );
      assert.strictEqual(out.cursor, "pointer");
      assert.deepStrictEqual(out.hidden.ids, ["south"]);
      assert.deepStrictEqual(out.hidden.rows, ["north", "west"]);
      assert.strictEqual(
        out.hidden.domain.length,
        3,
        "the hidden row keeps its place",
      );
      assert.strictEqual(out.hidden.south, 0.4, "its label dims");
      assert.strictEqual(out.hidden.north, 1);
      assert.strictEqual(out.hidden.size, out.size, "the band size holds");
      assert.strictEqual(out.hidden.legend, 6, "and so does the band key");
      assert.deepStrictEqual(out.shown.ids, [], "a second click shows it");
      assert.deepStrictEqual(out.shown.rows, ["north", "south", "west"]);
      assert.deepStrictEqual(out.solo.ids, ["north"]);
      assert.deepStrictEqual(out.solo.rows, ["north"]);
      assert.strictEqual(out.solo.south, 0.4);
      assert.deepStrictEqual(out.back.solo, [], "Back undoes the solo");
      assert.deepStrictEqual(out.back.rows, ["north", "south", "west"]);
    });

    it("the band size holds across timeline steps", async () => {
      const out = await run(async renderer => {
        const {viz} = await window.__draw(renderer, v =>
          v.x("date").time("date").timeline(true),
        );
        const all = viz.ctx.horizon.size;
        const cut = new Date(Date.UTC(2024, 0, 20));
        viz.timeFilter(d => new Date(d.date) <= cut);
        await new Promise(r => viz.render(r));
        return {
          all,
          step: viz.ctx.horizon.size,
          drawn: viz._filteredData.length,
          key: viz._legendData.map(d => d.__d3plusHorizonBand.range[1]),
        };
      }, renderer);
      assert.strictEqual(out.all, 5);
      assert.strictEqual(out.drawn, 9, "three dates of three series");
      assert.strictEqual(out.step, out.all);
      assert.deepStrictEqual(out.key, [-10, -5, -0, 5, 10, 15]);
    });
  });
}

for (const renderer of ["svg", "canvas"]) {
  describe(`HorizonChart row labels by keyboard [${renderer}]`, () => {
    it("Tab steps through the row labels, Enter hides, Shift+Enter solos", async () => {
      const out = await run(async renderer => {
        const {el, viz} = await window.__draw(renderer, v => v);
        const host = el.querySelector(".d3plus-keyboard-nav");
        const live = () => host.querySelector("[aria-live]").textContent;
        const key = async (k, shiftKey = false) => {
          const event = new KeyboardEvent("keydown", {
            key: k,
            shiftKey,
            bubbles: true,
            cancelable: true,
          });
          host.dispatchEvent(event);
          await window.__wait();
          await window.__wait();
          return {live: live(), kept: event.defaultPrevented};
        };
        const ring = () => {
          const group = viz._paintedScene.root.children.find(
            n => n.key === "viz-focus",
          );
          const rect = group
            ? window.__nodes([group]).find(n => n.type === "rect")
            : null;
          return rect ? {x: rect.x, width: rect.width} : null;
        };
        host.focus();
        await window.__wait();
        const steps = [live()];
        const ringAtLabel = ring();
        steps.push((await key("Tab")).live);
        steps.push((await key("Tab")).live);
        const past = await key("Tab");
        const backTab = await key("Tab", true);
        const hide = await key("Enter");
        const hidden = [...viz._hidden];
        const soloStart = await key("Tab", true);
        const solo = await key("Enter", true);
        return {
          steps,
          ringAtLabel,
          area: viz._plotArea,
          past,
          backTab,
          hide,
          hidden,
          soloStart,
          solo,
          soloIds: [...viz._solo],
          after: [...viz._hidden],
        };
      }, renderer);
      assert.deepStrictEqual(out.steps, [
        "north, Click to Hide",
        "south, Click to Hide",
        "west, Click to Hide",
      ]);
      assert.ok(out.ringAtLabel, "a focus ring is drawn");
      assert.ok(
        out.ringAtLabel.x + out.ringAtLabel.width <= out.area.x + 1,
        "around the label, left of the plot",
      );
      assert.strictEqual(
        out.past.kept,
        false,
        "Tab leaves past the last label",
      );
      assert.strictEqual(out.past.live, "west, Click to Hide");
      assert.strictEqual(out.backTab.live, "south, Click to Hide");
      assert.strictEqual(out.backTab.kept, true);
      assert.deepStrictEqual(out.hidden, ["south"], "Enter hides the row");
      assert.strictEqual(
        out.hide.live,
        "south, Click to Show",
        "the live region announces the change",
      );
      assert.strictEqual(out.soloStart.live, "north, Click to Hide");
      assert.deepStrictEqual(out.soloIds, ["north"], "Shift+Enter solos it");
      assert.deepStrictEqual(out.after, []);
    });

    it("the row label tooltip opens just right of the label", async () => {
      const out = await run(async renderer => {
        const at = await window.__labelAt("south");
        await window.__draw(renderer, v => v);
        await window.__at(at, "mousemove");
        const tip = Array.from(document.querySelectorAll(".d3plus-tooltip"))
          .filter(t => t.innerText.trim())
          .map(t => t.getBoundingClientRect())[0];
        return {
          label: at.box,
          tip: tip && {left: tip.left, top: tip.top, bottom: tip.bottom},
        };
      }, renderer);
      assert.ok(out.tip, "a tooltip shows");
      assert.ok(
        out.tip.left >= out.label.right - 1,
        `the tooltip starts past the label: ${out.tip.left} vs ${out.label.right}`,
      );
      assert.ok(
        out.tip.left - out.label.right < 30,
        "just past it, not far off",
      );
      const middle = (out.label.top + out.label.bottom) / 2;
      assert.ok(
        out.tip.top < middle && out.tip.bottom > middle,
        "beside the label",
      );
    });
  });
}
