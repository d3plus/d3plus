import {it, vi} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {WordCloud} from "../../index.ts";
import {runStages} from "../../src/charts/pipeline/stages.ts";
import {
  applyWordCloudLayout,
  wordCandidates,
} from "../../src/charts/WordCloud/applyLayout.ts";
import {
  WORD_SHAPE,
  wordAriaLabel,
  wordBox,
  wordCloudEmit,
} from "../../src/charts/WordCloud/emit.ts";
import {
  wordCloudDef,
  wordCloudTooltipRows,
} from "../../src/charts/WordCloud/index.ts";
import {
  markFontsLoaded,
  rasterizeWords,
} from "../../src/charts/WordCloud/glyphMask.ts";
import {OccupancyBoard} from "../../src/charts/WordCloud/occupancy.ts";

useJsdom();

const rows = [
  {id: "data", value: 120, group: "noun"},
  {id: "chart", value: 80, group: "noun"},
  {id: "draw", value: 45, group: "verb"},
  {id: "scale", value: 30, group: "noun"},
  {id: "render", value: 20, group: "verb"},
  {id: "axis", value: 12, group: "noun"},
  {id: "hover", value: 8, group: "verb"},
];

/** A chart laid out with no margins, ready to read. */
function draw(config = {}, data = rows, size = [600, 400]) {
  const viz = new WordCloud()
    .data(data.map(d => ({...d})))
    .config(config)
    .width(size[0])
    .height(size[1]);
  viz._preDraw();
  viz._margin = {top: 0, right: 0, bottom: 0, left: 0};
  viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  const {shapeData} = runStages({viz}, [applyWordCloudLayout]);
  return {viz, words: shapeData};
}

/** `count` rows with Zipf-like values and distinct made-up words. */
function zipf(count) {
  const syllables = ["ka", "lo", "mi", "ne", "ru", "so", "ta", "vi", "ze"];
  return Array.from({length: count}, (_, k) => {
    let n = k + 7;
    let word = "";
    while (n > 0) {
      word += syllables[n % syllables.length];
      n = Math.floor(n / syllables.length);
    }
    return {id: `${word}${k}`, value: Math.round(10000 / (k + 1))};
  });
}

/**
    Whether any two placed words' glyph masks cover the same pixel, with
    each word's ink grown by `gap` pixels (so `gap: 1` also finds words
    that touch).
*/
function overlaps(viz, words, gap = 0) {
  const glyphs = rasterizeWords(
    words.map(w => ({
      text: w.text,
      family: w.family,
      weight: w.weight,
      size: w.size,
      rotate: w.rotate,
      padding: gap,
    })),
  );
  const board = new OccupancyBoard(viz.schema.width, viz.schema.height);
  return words.some((w, k) => {
    const s = glyphs[k].sprite;
    const x = Math.round(w.x + s.x0);
    const y = Math.round(w.y + s.y0);
    if (board.collides(s, x, y)) return true;
    board.place(s, x, y);
    return false;
  });
}

it("WordCloud: the def lists ctx then fields last", () => {
  assert.deepStrictEqual(Object.keys(wordCloudDef).slice(-2), [
    "ctx",
    "fields",
  ]);
  assert.strictEqual(wordCloudDef.name, "WordCloud");
});

it("WordCloud: fluent defaults", () => {
  const viz = new WordCloud();
  assert.strictEqual(viz.fontMin(), 10);
  assert.strictEqual(viz.fontMax(), 60);
  assert.strictEqual(viz.fontScale(), "sqrt");
  assert.strictEqual(viz.fontWeight(), 600);
  assert.strictEqual(viz.rotate(), 0);
  assert.strictEqual(viz.spiral(), "archimedean");
  assert.strictEqual(viz.wordPadding(), 2);
  assert.notStrictEqual(viz.zoom(), false);
  assert.strictEqual(viz.dataCutoff(), 500);
  assert.strictEqual(viz.size()({value: 6}), 6);
  assert.strictEqual(viz.schema.threshold([]), 0.0001, "Treemap's default");
  viz.size("count");
  assert.strictEqual(viz.size()({count: 3}), 3);
  assert.strictEqual(viz._sizeKey, "count");
  assert.strictEqual(viz.schema.thresholdKey, viz.size());
  viz.size(d => d.n * 2);
  assert.strictEqual(viz.size()({n: 4}), 8);
  assert.strictEqual(viz.size(null).size()({value: 5}), 5, "null resets it");
  assert.deepStrictEqual(viz.rotate([0, 90]).rotate(), [0, 90]);
});

it("WordCloud: wordCandidates sizes rows by value, largest first, and skips rows it can't draw", () => {
  const {viz} = draw();
  const words = wordCandidates(viz);
  assert.deepStrictEqual(
    words.map(w => w.text),
    ["data", "chart", "draw", "scale", "render", "axis", "hover"],
  );
  assert.strictEqual(words[0].size, 60);
  assert.strictEqual(words[words.length - 1].size, 10);
  assert.ok(words.every((w, k) => !k || w.size <= words[k - 1].size));
  assert.ok(words.every(w => w.weight === 600 && w.rotate === 0));
  assert.ok(words.every(w => w.padding === 2 && w.id === w.text));

  const {viz: odd} = draw(
    {
      label: d => d.word,
      fontWeight: d => (d.value > 10 ? 700 : 300),
      rotate: d => d.tilt,
    },
    [
      {id: 1, word: "Alpha", value: 50, tilt: -90},
      {id: 2, word: "Beta", value: 5, tilt: 0},
      {id: 3, word: "Zero", value: 0},
      {id: 4, word: "Negative", value: -4},
      {id: 5, word: "Missing"},
      {id: 6, word: "  ", value: 9},
    ],
  );
  const oddWords = wordCandidates(odd);
  assert.deepStrictEqual(
    oddWords.map(w => [w.text, w.weight, w.rotate]),
    [
      ["Alpha", 700, -90],
      ["Beta", 300, 0],
    ],
  );
});

it("WordCloud: size reads each word's value from a key or an accessor, and repeated words add up", () => {
  const data = [
    {word: "data", count: 10},
    {word: "data", count: 15},
    {word: "chart", count: 5},
  ];
  const byKey = draw({groupBy: "word", size: "count"}, data).words;
  assert.deepStrictEqual(
    byKey.map(w => [w.text, w.value]),
    [
      ["data", 25],
      ["chart", 5],
    ],
  );
  const byFn = draw({groupBy: "word", size: d => d.count * 2}, data).words;
  assert.deepStrictEqual(
    byFn.map(w => w.value),
    [50, 10],
  );
});

it("WordCloud: stamps each word with its share of the drawn words' total", () => {
  const {viz, words} = draw();
  const total = rows.reduce((a, d) => a + d.value, 0);
  for (const w of words)
    assert.ok(Math.abs(w.data.share - w.value / total) < 1e-12, w.text);
  const [, share] = wordCloudTooltipRows(viz);
  const data = words.find(w => w.text === "data").data;
  assert.strictEqual(share[0](), "Share");
  assert.strictEqual(
    share[1](data, 0, data),
    `${Math.round((120 / total) * 1000) / 10}%`,
  );
});

it("WordCloud: by default, words under 0.01% of the total merge into one word", () => {
  // 300 words of 1 beside one of 1,000,000: each is 0.0001% of the total.
  const data = [
    {id: "huge", value: 1e6},
    ...Array.from({length: 300}, (_, k) => ({id: `tiny${k}`, value: 1})),
  ];
  const {words} = draw({}, data);
  assert.strictEqual(words.length, 2);
  const bucket = words.find(w => w.data._isAggregation);
  assert.strictEqual(bucket.value, 300);
  assert.strictEqual(bucket.text, "Values < 0.01%");
  assert.ok(words.some(w => w.text === "huge"));
  // `threshold: 0` draws every word (as many as fit).
  const every = draw({threshold: 0, fontMin: 6, fontMax: 12}, data).words;
  assert.ok(!every.some(w => w.data._isAggregation));
  assert.ok(every.length > 2);
});

it("WordCloud: threshold merges the smallest words into one bucket word", () => {
  const none = draw().words;
  assert.strictEqual(none.length, rows.length, "no word under 0.01%");
  const {viz, words} = draw({threshold: 0.05});
  const total = rows.reduce((a, d) => a + d.value, 0);
  const small = rows.filter(d => d.value < 0.05 * total);
  assert.ok(small.length >= 2);
  assert.strictEqual(words.length, rows.length - small.length + 1);
  const bucket = words.find(w => w.data._isAggregation);
  assert.ok(bucket, "a bucket word");
  assert.strictEqual(
    bucket.value,
    small.reduce((a, d) => a + d.value, 0),
  );
  assert.ok(/^Values < 5%$/.test(bucket.text), bucket.text);
  assert.ok(!overlaps(viz, words));
  const named = draw({threshold: 0.05, thresholdName: "Other"}).words;
  assert.ok(named.some(w => /^Other < 5%$/.test(w.text)));
});

it("WordCloud: words take the chart's fontFamily", () => {
  const {viz, words} = draw({fontFamily: ["Georgia", "serif"]});
  assert.ok(
    words.every(w => /Georgia/.test(w.family)),
    words[0].family,
  );
  const nodes = wordCloudEmit({viz, shapeData: words});
  assert.ok(
    nodes
      .filter(n => n.type === "text")
      .every(n => /Georgia/.test(n.font.family)),
  );
});

it("WordCloud: repeated ids add up through the groupBy aggregation", () => {
  const {words} = draw({}, [
    {id: "data", value: 10},
    {id: "data", value: 15},
    {id: "chart", value: 5},
  ]);
  const data = words.find(w => w.text === "data");
  assert.strictEqual(data.value, 25);
  assert.strictEqual(words.length, 2);
});

it("WordCloud: places every word inside the chart without overlapping glyphs, centered", () => {
  const {viz, words} = draw();
  assert.strictEqual(words.length, rows.length);
  assert.ok(!overlaps(viz, words, 1), "no glyphs touch");
  const fit = viz.ctx.wordCloudFit;
  assert.strictEqual(fit.scale, 1);
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const p of fit.placed) {
    const w = words.find(d => d.text === wordCandidates(viz)[p.index].text);
    const s = fit.sprites[p.index];
    x0 = Math.min(x0, w.x + s.x0);
    x1 = Math.max(x1, w.x + s.x0 + s.inkWidth);
    y0 = Math.min(y0, w.y + s.y0);
    y1 = Math.max(y1, w.y + s.y0 + s.height);
  }
  assert.ok(x0 >= 0 && y0 >= 0 && x1 <= 600 && y1 <= 400);
  assert.ok(Math.abs(x0 - (600 - x1)) < 1 && Math.abs(y0 - (400 - y1)) < 1);
});

it("WordCloud: the same data and size give the same layout every time", () => {
  const a = draw().words.map(w => [w.text, w.x, w.y, w.size]);
  const b = draw().words.map(w => [w.text, w.x, w.y, w.size]);
  assert.deepStrictEqual(a, b);
  // A redraw of an unchanged chart reuses its layout.
  const {viz} = draw();
  const first = viz.ctx.wordCloudFit;
  runStages({viz}, [applyWordCloudLayout]);
  assert.strictEqual(viz.ctx.wordCloudFit, first);
  // So does one after a web font loads, which re-rasterizes the words.
  markFontsLoaded();
  runStages({viz}, [applyWordCloudLayout]);
  assert.notStrictEqual(viz.ctx.wordCloudFit, first);
  assert.deepStrictEqual(
    viz.ctx.wordCloudFit.placed,
    first.placed,
    "the same font lays out the same way",
  );
  const refit = viz.ctx.wordCloudFit;
  viz.fontMax(40);
  viz._preDraw();
  viz._margin = viz._padding = {top: 0, right: 0, bottom: 0, left: 0};
  runStages({viz}, [applyWordCloudLayout]);
  assert.notStrictEqual(viz.ctx.wordCloudFit, refit);
});

it("WordCloud: rotated words keep their angles and still don't overlap", () => {
  const {viz, words} = draw({rotate: [0, 90, -45]});
  assert.ok(words.some(w => w.rotate === 90 || w.rotate === -45));
  assert.ok(words.every(w => [0, 90, -45].includes(w.rotate)));
  assert.ok(!overlaps(viz, words, 1), "no two words touch");
  const again = draw({rotate: [0, 90, -45]}).words;
  assert.deepStrictEqual(
    again.map(w => w.rotate),
    words.map(w => w.rotate),
  );
});

it("WordCloud: shrinks every font size until the words fit", () => {
  const {viz, words} = draw({fontMax: 140, fontMin: 40}, rows, [300, 160]);
  const fit = viz.ctx.wordCloudFit;
  assert.ok(fit.scale < 1, `${fit.scale}`);
  assert.strictEqual(words.length, rows.length);
  assert.ok(words[0].size < 140);
  assert.ok(!overlaps(viz, words));
});

it("WordCloud: drops the words that don't fit at the smallest size, with one console note", () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  try {
    const {viz, words} = draw({}, zipf(400), [120, 60]);
    assert.ok(words.length > 0 && words.length < 400);
    assert.strictEqual(viz.ctx.wordCloudFit.dropped.length, 400 - words.length);
    assert.strictEqual(warn.mock.calls.length, 1);
    assert.ok(/WordCloud/.test(warn.mock.calls[0][0]));
    // The kept words are the largest.
    const kept = new Set(words.map(w => w.text));
    assert.ok(kept.has(zipf(400)[0].id));
  } finally {
    warn.mockRestore();
  }
});

it("WordCloud: lays out 200 words at 800 × 500 quickly", () => {
  const data = zipf(200);
  const start = performance.now();
  const {viz, words} = draw({}, data, [800, 500]);
  const ms = performance.now() - start;
  console.info(
    `WordCloud: ${words.length} words at 800 × 500 in ${ms.toFixed(0)}ms (scale ${viz.ctx.wordCloudFit.scale.toFixed(2)})`,
  );
  assert.strictEqual(words.length, 200);
  assert.ok(!overlaps(viz, words, 1));
  const turned = draw({rotate: [0, 90, -90]}, data, [800, 500]);
  assert.ok(
    !overlaps(turned.viz, turned.words, 1),
    "rotated words don't touch",
  );
  assert.ok(ms < 3000, `${ms}ms`);
});

it("WordCloud: emits each word as a transparent hit rect and a text node", () => {
  const {viz, words} = draw({rotate: d => (d.id === "chart" ? 90 : 0)});
  const nodes = wordCloudEmit({viz, shapeData: words});
  assert.strictEqual(nodes.length, words.length * 2);
  const rect = nodes.find(n => n.key === "wordcloud-chart");
  const text = nodes.find(n => n.key === "wordcloud-chart-text");
  assert.strictEqual(rect.type, "rect");
  assert.strictEqual(rect.paint.fill, "transparent");
  assert.strictEqual(rect.shapeType, WORD_SHAPE);
  assert.strictEqual(rect.aria.label, "chart, 80");
  assert.strictEqual(rect.datum.id, "chart");
  assert.strictEqual(rect.transform.rotate, 90);
  assert.strictEqual(text.type, "text");
  assert.strictEqual(text.interactive, false);
  assert.deepStrictEqual(text.aria, {hidden: true});
  assert.strictEqual(text.lines[0].text, "chart");
  assert.strictEqual(text.font.anchor, "middle");
  assert.strictEqual(text.font.weight, 600);
  assert.deepStrictEqual(text.transform, rect.transform);
  assert.ok(/^#|^rgb/.test(text.paint.fill), text.paint.fill);
  // Each rect is followed by its own word, largest first.
  assert.strictEqual(nodes[0].key, "wordcloud-data");
  assert.strictEqual(nodes[1].key, "wordcloud-data-text");
  // Words colored by group share their group's color.
  const {viz: grouped, words: gw} = draw({
    groupBy: ["group", "id"],
    color: "group",
  });
  const fills = wordCloudEmit({viz: grouped, shapeData: gw})
    .filter(n => n.type === "text")
    .reduce(
      (m, n) =>
        m.set(n.datum.group, [...(m.get(n.datum.group) || []), n.paint.fill]),
      new Map(),
    );
  for (const list of fills.values()) assert.strictEqual(new Set(list).size, 1);
  assert.notDeepStrictEqual(fills.get("noun"), fills.get("verb"));
  assert.deepStrictEqual(wordCloudEmit({viz, shapeData: []}), []);
});

it("WordCloud: wordBox and wordAriaLabel describe a word", () => {
  const metrics = {width: 40, ascent: 12, descent: 3};
  assert.deepStrictEqual(wordBox({metrics}), {
    x: -20,
    y: -12,
    width: 40,
    height: 15,
  });
  assert.strictEqual(
    wordAriaLabel({text: "data", value: 12500}, "en-US"),
    "data, 12.5k",
  );
});

it("WordCloud: the tooltip shows the word's value, translated", () => {
  const viz = new WordCloud();
  const [[label, value], [shareLabel]] = wordCloudTooltipRows(viz);
  assert.strictEqual(shareLabel(), "Share");
  assert.strictEqual(label(), "Value");
  assert.strictEqual(value({value: 1500}, 0), "1.5k");
  assert.strictEqual(value({}, 0), "");
  assert.strictEqual(value({value: 3}, 0, {_isColorScaleBucket: true}), "");
  viz.locale("es-ES");
  assert.notStrictEqual(label(), "Value");
});

it("WordCloud: an empty chart lays out nothing", () => {
  const {viz, words} = draw({}, [{id: "none", value: 0}]);
  assert.deepStrictEqual(words, []);
  assert.strictEqual(viz.ctx.wordCloudFit, undefined);
});
