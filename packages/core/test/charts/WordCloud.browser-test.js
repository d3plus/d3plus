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
  window.hoverWord = async (chart, renderer, text) => {
    const box = window.boxes(chart).find(n => n.datum.id === text);
    const word = chart._shapeData
      ? chart._shapeData.find(w => w.text === text)
      : null;
    const host = window.host(renderer);
    const r = host.getBoundingClientRect();
    const t = chart._chartTransform || {};
    // The middle of the word's box, turned with the word.
    const a = ((box.transform.rotate || 0) * Math.PI) / 180;
    const mx = box.x + box.width / 2;
    const my = box.y + box.height / 2;
    const clientX = r.left + (t.x || 0) + box.transform.x + mx * Math.cos(a) - my * Math.sin(a);
    const clientY = r.top + (t.y || 0) + box.transform.y + mx * Math.sin(a) + my * Math.cos(a);
    // On SVG, the event goes to the word's rect element, as a real pointer's
    // would; the Canvas renderer hit-tests the point itself.
    const target = renderer === "canvas"
      ? host
      : host.querySelector(\`[data-key="wordcloud-\${text}"]\`);
    for (const type of ["mouseover", "mouseenter", "mousemove"])
      target.dispatchEvent(new MouseEvent(type, {clientX, clientY, bubbles: true}));
    await window.wait(150);
    return word;
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
      await window.hoverWord(chart, renderer, "draw");
      const bright = window
        .texts(chart)
        .filter(n => chart._hover && chart._hover(n.datum, n.index))
        .map(n => n.lines[0].text);
      const tooltip = document.querySelector(".d3plus-tooltip");
      return {bright, tooltip: tooltip ? tooltip.textContent : ""};
    }, renderer);
    assert.deepStrictEqual(out.bright, ["draw"]);
    assert.ok(/draw/.test(out.tooltip), out.tooltip);
    assert.ok(/Value\s*45/.test(out.tooltip), out.tooltip);
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
      return {
        legend: legend.map(d => d.group),
        noun: [...fills.noun],
        verb: [...fills.verb],
        bright: [...new Set(bright)],
        count: bright.length,
      };
    }, renderer);
    assert.deepStrictEqual(out.legend, ["noun", "verb"]);
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
}
