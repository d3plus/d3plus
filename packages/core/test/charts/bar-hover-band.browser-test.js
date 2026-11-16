import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";

/**
    A hovered bar's hit area shows as a band over its slot, on both
    renderers, with a real pointer: hovering the bar or anywhere in its slot
    draws the band (the theme's text color at 10% opacity, in light and dark
    themes) behind the bars, and leaving clears it. Grouped bars band their
    own column, stacked bars their whole slot (its empty part reaching the
    nearest segment), horizontal bars their row,
    and a small multiple its own panel's bar: the band follows the bar
    under the pointer, not every bar the hover lights, with hover styling
    on or off (`hoverOpacity: 1`). `hitAreaStyle` restyles the
    band or, `false`, turns it off; `hitArea: false` draws none.
*/

const body = `<div id="viz" style="width:600px;height:400px;position:absolute;left:0;top:0;font-family:sans-serif"></div>`;

/** Opens a page with the helpers the tests drive charts through. */
async function open() {
  const opened = await openPage(body);
  await opened.page.evaluate(() => {
    const bars = [
      {id: "a", x: "A", y: 10},
      {id: "b", x: "B", y: 40},
      {id: "c", x: "C", y: 25},
    ];
    const units = [
      {id: "Retail", x: "Q1", y: 12},
      {id: "Wholesale", x: "Q1", y: 4},
      {id: "Retail", x: "Q2", y: 6},
      {id: "Wholesale", x: "Q2", y: 9},
    ];
    // Built in the page's realm, where config bags merge as plain objects.
    const charts = {
      bar: {data: bars},
      dark: {data: bars, theme: "dark"},
      horizontal: {data: bars, discrete: "y", x: "y", y: "x"},
      grouped: {data: units},
      stacked: {data: units, stacked: true},
      // Q2's short stack leaves most of its slot empty.
      stackedLow: {
        data: units.map(d => (d.x === "Q2" ? {...d, y: d.y / 4} : d)),
        stacked: true,
      },
      unhovered: {data: bars, shapeConfig: {hoverOpacity: 1}},
      facet: {
        data: ["P", "Q"].flatMap(panel => bars.map(d => ({...d, panel}))),
        facet: "panel",
      },
      styled: {data: bars, shapeConfig: {Bar: {hitAreaStyle: {fill: "red"}}}},
      unstyled: {data: bars, shapeConfig: {Bar: {hitAreaStyle: false}}},
      noHit: {data: bars, shapeConfig: {Bar: {hitArea: false}}},
    };
    window.make = (name, renderer) =>
      new Promise(resolve => {
        if (window.__viz) window.__viz.destroy();
        window.__viz = new window.d3plus.BarChart()
          .config({
            groupBy: "id",
            x: "x",
            y: "y",
            legend: false,
            duration: 0,
            ...charts[name],
          })
          .renderer(renderer)
          .select("#viz");
        window.__viz.render(() => resolve(null));
      });
    // The painted scene's Bar nodes and their client-space boxes, keyed by
    // `<key>` (a bar) and `<key>::hit` (its hit area).
    window.bars = () => {
      const surface = document
        .querySelector("#viz svg, #viz canvas")
        .getBoundingClientRect();
      const out = {};
      const walk = (n, x, y) => {
        const t = n.transform || {};
        const nx = x + (t.x || 0),
          ny = y + (t.y || 0);
        if (n.shapeType === "Bar" && n.type === "rect")
          out[n.key] = {
            x: surface.left + nx + n.x,
            y: surface.top + ny + n.y,
            width: n.width,
            height: n.height,
            paint: n.paint,
            interactive: n.interactive,
            z: n.z,
          };
        (n.children || []).forEach(c => walk(c, nx, ny));
      };
      walk(window.__viz._paintedScene.root, 0, 0);
      return out;
    };
    // The painted band at a point: the SVG hit rect's fill, or the canvas's
    // pixel there.
    window.paintAt = ([x, y]) => {
      const canvas = document.querySelector("#viz canvas");
      if (canvas) {
        const box = canvas.getBoundingClientRect();
        const ratio = canvas.width / box.width;
        const [r, g, b, a] = canvas
          .getContext("2d")
          .getImageData(
            (x - box.left) * ratio,
            (y - box.top) * ratio,
            1,
            1,
          ).data;
        // Over the page's white, where the canvas paints no background.
        const over = c => Math.round((c * a) / 255 + 255 * (1 - a / 255));
        return {rgb: [over(r), over(g), over(b)]};
      }
      const rect = document
        .elementsFromPoint(x, y)
        .find(el => `${el.dataset?.key}`.endsWith("::hit"));
      return rect
        ? {
            fill: rect.getAttribute("fill"),
            opacity: rect.getAttribute("fill-opacity"),
          }
        : {};
    };
    window.themeText = () => window.__viz._theme.text;
  });
  return opened;
}

/** Draws a chart and parks the pointer off it. */
async function draw(page, name, renderer) {
  await page.evaluate(
    ([name, renderer]) => window.make(name, renderer).then(() => null),
    [name, renderer],
  );
  await page.mouse.move(598, 2);
  await page.waitForTimeout(60);
  return page.evaluate(() => window.bars());
}

/** Moves the real pointer to a point and reads the bars there. */
async function hover(page, point) {
  await page.mouse.move(point[0], point[1], {steps: 4});
  await page.waitForTimeout(120);
  return page.evaluate(() => window.bars());
}

/** A point in a hit area, `frac` of the way along its value axis. */
const inSlot = (hit, frac = 0.1, vertical = true) =>
  vertical
    ? [hit.x + hit.width / 2, hit.y + hit.height * frac]
    : [hit.x + hit.width * (1 - frac), hit.y + hit.height / 2];

/** The band paint the theme's text color gives. */
const band = text => ({fill: text, fillOpacity: 0.1});

/** The brightness of a pixel. */
const light = ({rgb}) => rgb.reduce((a, b) => a + b, 0) / 3;

for (const renderer of ["svg", "canvas"]) {
  it(`hover band (${renderer}): hovering a bar or its slot draws the band behind the bars`, async () => {
    const {page, close} = await open();
    try {
      const before = await draw(page, "bar", renderer);
      const text = await page.evaluate(() => window.themeText());
      const point = inSlot(before["a_A::hit"]);
      const blank = await page.evaluate(p => window.paintAt(p), point);
      assert.deepStrictEqual(before["a_A::hit"].paint, {fill: "transparent"});

      let now = await hover(page, point);
      assert.deepStrictEqual(now["a_A::hit"].paint, band(text), "in the slot");
      assert.deepStrictEqual(now["b_B::hit"].paint, {fill: "transparent"});
      assert.strictEqual(now["a_A::hit"].z, undefined, "not raised");
      const shown = await page.evaluate(p => window.paintAt(p), point);
      if (renderer === "svg")
        assert.deepStrictEqual(shown, {fill: text, opacity: "0.1"});
      else
        assert.ok(
          light(shown) < light(blank) - 5,
          `a darker band (${shown.rgb} over ${blank.rgb})`,
        );

      const a = now.a_A;
      now = await hover(page, [a.x + a.width / 2, a.y + a.height / 2]);
      assert.deepStrictEqual(now["a_A::hit"].paint, band(text), "on the bar");

      now = await hover(page, [598, 2]);
      assert.deepStrictEqual(now["a_A::hit"].paint, {fill: "transparent"});
      assert.deepStrictEqual(
        await page.evaluate(p => window.paintAt(p), point),
        blank,
        "gone on leaving",
      );
    } finally {
      await close();
    }
  });

  it(`hover band (${renderer}): the dark theme's band is its light text color`, async () => {
    const {page, close} = await open();
    try {
      const before = await draw(page, "dark", renderer);
      const text = await page.evaluate(() => window.themeText());
      const point = inSlot(before["a_A::hit"]);
      const blank = await page.evaluate(p => window.paintAt(p), point);
      const now = await hover(page, point);
      assert.deepStrictEqual(now["a_A::hit"].paint, band(text));
      const shown = await page.evaluate(p => window.paintAt(p), point);
      if (renderer === "svg")
        assert.deepStrictEqual(shown, {fill: text, opacity: "0.1"});
      else assert.ok(light(shown) > light(blank) + 5, "a lighter band");
    } finally {
      await close();
    }
  });

  it(`hover band (${renderer}): horizontal, grouped, stacked and faceted bars`, async () => {
    const {page, close} = await open();
    try {
      let bars = await draw(page, "horizontal", renderer);
      let now = await hover(page, inSlot(bars["a_A::hit"], 0.1, false));
      assert.strictEqual(now["a_A::hit"].paint.fillOpacity, 0.1, "a row");

      bars = await draw(page, "grouped", renderer);
      const retail = Object.keys(bars).find(k => /^Retail.*Q1::hit$/.test(k));
      const wholesale = retail.replace("Retail", "Wholesale");
      now = await hover(page, inSlot(bars[retail]));
      assert.strictEqual(now[retail].paint.fillOpacity, 0.1, "its column");
      assert.deepStrictEqual(now[wholesale].paint, {fill: "transparent"});
      const series = retail.replace("Q1", "Q2");
      assert.deepStrictEqual(
        now[series].paint,
        {fill: "transparent"},
        "not the rest of its series",
      );
      now = await hover(page, inSlot(bars[series]));
      assert.strictEqual(now[series].paint.fillOpacity, 0.1, "moves along");
      assert.deepStrictEqual(now[retail].paint, {fill: "transparent"});

      bars = await draw(page, "stacked", renderer);
      const segment = Object.keys(bars).find(k => /^Retail.*Q1$/.test(k));
      const slot = bars[`${segment}::hit`];
      assert.strictEqual(slot.interactive, false, "the pointer passes through");
      now = await hover(page, [
        bars[segment].x + bars[segment].width / 2,
        bars[segment].y + bars[segment].height / 2,
      ]);
      assert.strictEqual(now[`${segment}::hit`].paint.fillOpacity, 0.1);
      assert.ok(slot.height > bars[segment].height, "over the whole slot");
      const shown = Object.keys(now).filter(
        k => /Q1::hit$/.test(k) && now[k].paint.fillOpacity,
      );
      assert.strictEqual(shown.length, 1, "one band for the slot");

      // The empty slot above a short stack reaches its top segment.
      bars = await draw(page, "stackedLow", renderer);
      const q2 = Object.keys(bars).filter(k => /Q2$/.test(k));
      const top = q2.reduce((a, b) => (bars[b].y < bars[a].y ? b : a));
      const target = bars[`${top}::start::hit`];
      assert.ok(target && target.interactive === undefined, "a slot target");
      now = await hover(page, inSlot(bars[`${top}::hit`], 0.05));
      assert.strictEqual(now[`${top}::hit`].paint.fillOpacity, 0.1, "its band");
      assert.strictEqual(
        Object.keys(now).filter(k => now[k].paint?.fillOpacity === 0.1).length,
        1,
        "one band",
      );
      assert.ok(
        await page.evaluate(() =>
          [...document.querySelectorAll(".d3plus-tooltip")].some(
            t => getComputedStyle(t).visibility === "visible",
          ),
        ),
        "the column's tooltip",
      );

      bars = await draw(page, "facet", renderer);
      const hits = Object.keys(bars).filter(k => /a_A::hit$/.test(k));
      assert.strictEqual(hits.length, 2, "a band per panel");
      now = await hover(page, inSlot(bars[hits[1]]));
      // The hover lights the bar in every panel; the band, the one hovered.
      assert.strictEqual(now[hits[1]].paint.fillOpacity, 0.1, "this panel");
      assert.deepStrictEqual(now[hits[0]].paint, {fill: "transparent"});
    } finally {
      await close();
    }
  });

  it(`hover band (${renderer}): the band shows with hover styling off`, async () => {
    const {page, close} = await open();
    try {
      const bars = await draw(page, "unhovered", renderer);
      let now = await hover(page, inSlot(bars["a_A::hit"]));
      assert.deepStrictEqual(
        now["a_A::hit"].paint.fillOpacity,
        0.1,
        "hoverOpacity: 1",
      );
      assert.ok(!(now.b_B.paint.opacity < 1), "nothing dims");
      now = await hover(page, [598, 2]);
      assert.deepStrictEqual(now["a_A::hit"].paint, {fill: "transparent"});
    } finally {
      await close();
    }
  });

  it(`hover band (${renderer}): hitAreaStyle restyles or removes it, and hitArea false draws none`, async () => {
    const {page, close} = await open();
    try {
      let bars = await draw(page, "styled", renderer);
      let now = await hover(page, inSlot(bars["a_A::hit"]));
      assert.deepStrictEqual(now["a_A::hit"].paint, {
        fill: "red",
        fillOpacity: 0.1,
      });

      bars = await draw(page, "unstyled", renderer);
      now = await hover(page, inSlot(bars["a_A::hit"]));
      assert.deepStrictEqual(now["a_A::hit"].paint, {fill: "transparent"});

      bars = await draw(page, "noHit", renderer);
      assert.ok(!Object.keys(bars).some(k => k.endsWith("::hit")));
      const a = bars.a_A;
      now = await hover(page, [a.x + a.width / 2, a.y + a.height / 2]);
      assert.ok(!Object.keys(now).some(k => k.endsWith("::hit")));
    } finally {
      await close();
    }
  });
}
