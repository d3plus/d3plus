import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    WordCloud in a real browser, on SVG and Canvas: a text node per word over
    a transparent hit rect, font sizes by value, glyph masks that never
    overlap; hovering a word highlights it and shows its value; colors and a
    legend by group; rotated words; small multiples; the dark theme.
*/

const data = [
  {id: "data", value: 120, group: "noun"},
  {id: "chart", value: 80, group: "noun"},
  {id: "draw", value: 45, group: "verb"},
  {id: "scale", value: 30, group: "noun"},
  {id: "render", value: 20, group: "verb"},
  {id: "axis", value: 12, group: "noun"},
  {id: "hover", value: 8, group: "verb"},
  {id: "zoom", value: 6, group: "verb"},
];

/** In-page helpers: build + render a chart, list its words, and wait. */
const setup = `
  window.build = (opts = {}) => new Promise(resolve => {
    const chart = new window.d3plus.WordCloud()
      .select("#viz")
      .data((opts.data || window.DATA).map(d => ({...d})))
      .duration(0)
      .width(600).height(400);
    if (opts.renderer) chart.renderer(opts.renderer);
    if (opts.config) chart.config(opts.config);
    chart.render(() => resolve(chart));
  });
  window.flat = nodes => nodes.flatMap(n => [n, ...(n.children ? window.flat(n.children) : [])]);
  window.texts = chart => window.flat(chart._chartScene)
    .filter(n => n.type === "text" && /wordcloud-.*-text$/.test(String(n.key)));
  window.boxes = chart => window.flat(chart._chartScene)
    .filter(n => n.type === "rect" && /wordcloud-/.test(String(n.key)));
  window.wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  window.host = renderer => document.querySelector(
    renderer === "svg" ? "#viz svg.d3plus-render-svg" : "#viz canvas.d3plus-render-canvas",
  );
  window.surface = chart => chart._sceneRenderer.elements()
    .find(el => el.localName === "svg" || el.localName === "canvas");
  window.origin = chart => {
    const el = window.surface(chart);
    const ctm = el.localName === "svg" ? el.getScreenCTM() : null;
    if (ctm) return [ctm.e, ctm.f];
    const r = el.getBoundingClientRect();
    return [r.left, r.top];
  };
  // Each word's box center on screen, through every transform it is painted
  // under (chart, zoom, and its own turn).
  window.centers = chart => {
    const [ox, oy] = window.origin(chart);
    const out = {};
    const walk = (n, m) => {
      const t = n.transform || {};
      const a = ((t.rotate || 0) * Math.PI) / 180, s = t.scale ?? 1;
      const [ma, mb, mc, md, me, mf] = m;
      const ex = me + ma * (t.x || 0) + mc * (t.y || 0);
      const fy = mf + mb * (t.x || 0) + md * (t.y || 0);
      const c = Math.cos(a) * s, sn = Math.sin(a) * s;
      const next = [ma * c + mc * sn, mb * c + md * sn, -ma * sn + mc * c, -mb * sn + md * c, ex, fy];
      if (n.type === "rect" && /wordcloud-/.test(String(n.key)) && n.datum) {
        const at = (x, y) => [
          ox + next[4] + next[0] * x + next[2] * y,
          oy + next[5] + next[1] * x + next[3] * y,
        ];
        const corners = [[n.x, n.y], [n.x + n.width, n.y], [n.x, n.y + n.height], [n.x + n.width, n.y + n.height]].map(([x, y]) => at(x, y));
        out[n.datum.id] = at(n.x + n.width / 2, n.y + n.height / 2);
        out[n.datum.id].box = [
          Math.min(...corners.map(c => c[0])), Math.min(...corners.map(c => c[1])),
          Math.max(...corners.map(c => c[0])), Math.max(...corners.map(c => c[1])),
        ];
      }
      (n.children || []).forEach(k => walk(k, next));
    };
    walk(chart._paintedScene.root, [1, 0, 0, 1, 0, 0]);
    return out;
  };
  // Moves the pointer onto a word: on SVG to the element under that point,
  // on Canvas to the canvas, which hit-tests it.
  window.hoverWord = async (chart, renderer, text) => {
    const [clientX, clientY] = window.centers(chart)[text];
    const target = renderer === "canvas"
      ? window.surface(chart)
      : document.elementFromPoint(clientX, clientY);
    for (const type of ["mouseover", "mouseenter", "mousemove"])
      target.dispatchEvent(new MouseEvent(type, {clientX, clientY, bubbles: true}));
    await window.wait(150);
    return target && target.getAttribute ? target.getAttribute("data-key") : null;
  };
  window.pointer = (type, target, [x, y]) =>
    target.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, composed: true, view: window,
      clientX: x, clientY: y, pointerId: 1, isPrimary: true,
      pointerType: "mouse", button: 0, buttons: 1,
    }));
  window.drag = async (chart, from, to) => {
    const el = window.surface(chart).localName === "canvas" ? window.surface(chart) : chart._select.node();
    window.pointer("pointerdown", el, from);
    window.pointer("pointermove", el, [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]);
    window.pointer("pointermove", el, to);
    window.pointer("pointerup", el, to);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  };
`;

const page = (fn, arg) =>
  render(
    "<div id='viz' style='width:600px;height:400px'></div>",
    new Function(
      "arg",
      `window.DATA = arg.data; ${setup}; return (${fn})(arg.arg);`,
    ),
    {data, arg},
  );

for (const renderer of ["svg", "canvas"]) {
  it(`WordCloud (${renderer}): a text node per word over its hit rect, sized by value`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const texts = window.texts(chart);
      const boxes = window.boxes(chart);
      return {
        words: texts.map(n => n.lines[0].text),
        sizes: texts.map(n => n.font.size),
        boxes: boxes.length,
        transparent: boxes.every(n => n.paint.fill === "transparent"),
        aria: boxes.every(n => /, \d/.test(n.aria.label)),
        hidden: texts.every(n => n.aria.hidden && n.interactive === false),
        fills: new Set(texts.map(n => n.paint.fill)).size,
        legend: chart._legendClass.data().length,
        dom:
          renderer === "svg"
            ? document.querySelectorAll("#viz svg text[data-key$='-text']")
                .length
            : document.querySelectorAll("#viz canvas").length,
      };
    }, renderer);
    assert.deepStrictEqual(
      out.words,
      data.map(d => d.id),
    );
    assert.strictEqual(out.sizes[0], 60);
    assert.strictEqual(out.sizes[out.sizes.length - 1], 10);
    assert.ok(out.sizes.every((s, k) => !k || s <= out.sizes[k - 1]));
    assert.strictEqual(out.boxes, data.length);
    assert.ok(out.transparent && out.aria && out.hidden);
    assert.strictEqual(out.fills, data.length, "a color per word");
    assert.strictEqual(out.legend, 0, "no legend repeating every word");
    assert.ok(out.dom >= (renderer === "svg" ? data.length : 1));
  });

  it(`WordCloud (${renderer}): hovering a word highlights it and shows its value`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer});
      const target = await window.hoverWord(chart, renderer, "draw");
      const bright = window
        .texts(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => n.lines[0].text);
      const tooltip = document.querySelector(".d3plus-tooltip");
      return {bright, target, tooltip: tooltip ? tooltip.textContent : ""};
    }, renderer);
    if (renderer === "svg") assert.strictEqual(out.target, "wordcloud-draw");
    assert.deepStrictEqual(out.bright, ["draw"]);
    assert.ok(/draw/.test(out.tooltip), out.tooltip);
    assert.ok(/Value\s*45/.test(out.tooltip), out.tooltip);
    // 45 of the 321 drawn: 14%.
    assert.ok(/Share\s*14%/.test(out.tooltip), out.tooltip);
  });

  it(`WordCloud (${renderer}): colors and a legend by group, hovered from the legend`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({
        renderer,
        config: {groupBy: ["group", "id"], color: "group"},
      });
      const legend = chart._legendClass.data();
      const fills = {};
      for (const n of window.texts(chart))
        (fills[n.datum.group] ||= new Set()).add(n.paint.fill);
      chart.schema.on.mouseenter.call(
        chart,
        legend.find(d => d.group === "verb"),
        0,
      );
      await window.wait(50);
      const bright = window
        .texts(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => n.datum.group);
      const [, shareCell] = chart.schema.legendTooltip.tbody[1];
      const verb = legend.find(d => d.group === "verb");
      return {
        verbShare: shareCell(verb, 0, verb),
        legend: legend.map(d => d.group),
        noun: [...fills.noun],
        verb: [...fills.verb],
        bright: [...new Set(bright)],
        count: bright.length,
      };
    }, renderer);
    assert.deepStrictEqual(out.legend, ["noun", "verb"]);
    // draw, render, hover, and zoom: 79 of 321.
    assert.strictEqual(out.verbShare, "24.6%");
    assert.strictEqual(out.noun.length, 1);
    assert.strictEqual(out.verb.length, 1);
    assert.notStrictEqual(out.noun[0], out.verb[0]);
    assert.deepStrictEqual(out.bright, ["verb"]);
    assert.strictEqual(out.count, 4);
  });

  it(`WordCloud (${renderer}): rotated words, small multiples, and the dark theme`, async () => {
    const out = await page(async renderer => {
      const rotated = await window.build({
        renderer,
        config: {rotate: [0, 90]},
      });
      const angles = window
        .texts(rotated)
        .map(n => (n.transform && n.transform.rotate) || 0);
      const facet = await window.build({
        renderer,
        data: window.DATA.flatMap(d => [
          {...d, year: 2024},
          {...d, year: 2025, value: d.value * (d.group === "verb" ? 3 : 1)},
        ]),
        config: {facet: "year"},
      });
      const facetWords = window.texts(facet);
      const dark = await window.build({renderer, config: {theme: "dark"}});
      return {
        angles: [...new Set(angles)].sort(),
        facetWords: facetWords.length,
        panels: new Set(facetWords.map(n => n.datum.year)).size,
        darkWords: window.texts(dark).length,
        darkBackground: dark._theme.background,
      };
    }, renderer);
    assert.deepStrictEqual(out.angles, [0, 90]);
    assert.strictEqual(out.facetWords, data.length * 2);
    assert.strictEqual(out.panels, 2);
    assert.strictEqual(out.darkWords, data.length);
    assert.ok(out.darkBackground, "a dark background");
  });

  it(`WordCloud (${renderer}): size, and a threshold bucket drawn as a word`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({
        renderer,
        data: window.DATA.map(d => ({word: d.id, count: d.value})),
        config: {groupBy: "word", size: "count", threshold: 0.05},
      });
      const texts = window.texts(chart);
      const bucket = texts.find(n => n.datum._isAggregation);
      return {
        words: texts.map(n => n.lines[0].text),
        bucket: bucket ? bucket.lines[0].text : null,
        size: bucket ? bucket.font.size : 0,
      };
    }, renderer);
    // The words under 5% of the 321 drawn (axis, hover, zoom) merge into one.
    assert.deepStrictEqual(out.words.slice(0, 4), [
      "data",
      "chart",
      "draw",
      "scale",
    ]);
    assert.ok(out.words.includes("Values < 5%"), out.words.join());
    assert.ok(!out.words.includes("hover") && !out.words.includes("zoom"));
    assert.ok(out.size >= 10);
  });

  it(`WordCloud (${renderer}): zoomed in, hover, the tooltip, and box select line up with the words`, async () => {
    const out = await page(async renderer => {
      const chart = await window.build({renderer, config: {selectMode: "box"}});
      const buttons = document.querySelectorAll(
        "#viz .d3plus-zoom-control button",
      ).length;
      chart.zoomIn();
      await window.wait(700);
      const zoomed = chart._zoomTransform ? chart._zoomTransform.scale : 1;
      const target = await window.hoverWord(chart, renderer, "chart");
      const bright = window
        .texts(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => n.lines[0].text);
      const tooltip = document.querySelector(".d3plus-tooltip");
      const tip = tooltip ? tooltip.textContent : "";
      // A box drawn on the chart selects the words whose boxes it touches,
      // as they show zoomed in (inside the chart area).
      const [ox, oy] = window.origin(chart);
      const from = [ox + 200, oy + 120],
        to = [ox + 330, oy + 180];
      const m = chart._margin;
      const want = Object.entries(window.centers(chart))
        .filter(
          ([
            ,
            {
              box: [x0, y0, x1, y1],
            },
          ]) =>
            x1 >= from[0] &&
            x0 <= to[0] &&
            y1 >= from[1] &&
            y0 <= to[1] &&
            x1 >= ox + m.left &&
            x0 <= ox + 600 - m.right &&
            y1 >= oy + m.top &&
            y0 <= oy + 400 - m.bottom,
        )
        .map(([id]) => id)
        .sort();
      await window.drag(chart, from, to);
      return {
        buttons,
        zoomed,
        target,
        bright,
        tip,
        want,
        got: chart
          .selection()
          .map(d => d.id)
          .sort(),
      };
    }, renderer);
    assert.ok(out.buttons > 0, "zoom controls show");
    assert.ok(out.zoomed > 1, `zoomed in (${out.zoomed})`);
    if (renderer === "svg") assert.strictEqual(out.target, "wordcloud-chart");
    assert.deepStrictEqual(out.bright, ["chart"]);
    assert.ok(/chart/.test(out.tip) && /Value\s*80/.test(out.tip), out.tip);
    assert.ok(out.want.length > 0, "the box covers some words");
    assert.deepStrictEqual(out.got, out.want);
  });
}
