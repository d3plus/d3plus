import {it} from "vitest";
import assert from "assert";
import {textWidth} from "@d3plus/dom";
import {Legend} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A Legend's title wraps within the width it is drawn in (the legend's,
    less its padding on both sides), its height counts every line it wraps
    onto, and it is left out when it can't fit whole. A single row of
    swatches keeps to the legend's height as rows that wrap do.
*/

const items = n => Array.from({length: n}, (_, i) => ({id: `item ${i}`}));
const font = {"font-family": "Arial", "font-size": 12};

function legend({width = 400, height = 300, direction = "column", title}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const group = svg.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "g"),
  );
  return new Legend()
    .renderMode("compute")
    .select(group)
    .duration(0)
    .data(items(3))
    .direction(direction)
    .title(title)
    .titleConfig({fontFamily: "Arial", fontSize: 12})
    .width(width)
    .height(height)
    .render();
}

/** The title's lines in the legend's scene. */
const titleLines = l => {
  const out = [];
  const walk = n => {
    if (n.type === "text") out.push(...n.lines.map(line => line.text));
    (n.children || []).forEach(walk);
  };
  if (l._titleClass._data.length) walk(l._titleClass.toScene());
  return out;
};

it("Legend: a title wraps within the legend's width less its padding", () => {
  const title = "Median income";
  // Room for the title on one line, but not once the padding is taken off.
  const width = Math.ceil(textWidth(title, font)) + 4;
  const l = legend({width, title});
  assert.ok(
    l.outerBounds().width <= width - l.padding() * 2,
    `the legend keeps within its width (${l.outerBounds().width} of ${width})`,
  );
  assert.deepStrictEqual(titleLines(l), ["Median", "income"]);
});

it("Legend: a title's height counts each line it wraps onto", () => {
  const title = "Median income";
  const one = legend({title});
  const width = Math.ceil(textWidth("Median", font)) + 20;
  const two = legend({width, title});
  assert.deepStrictEqual(titleLines(two), ["Median", "income"]);
  const line = one._titleHeight - one.padding();
  assert.strictEqual(
    two._titleHeight,
    line * 2 + two.padding(),
    `two lines (${two._titleHeight}) are twice one (${one._titleHeight})`,
  );
});

it("Legend: a title with a number too wide for the legend is left out", () => {
  // A number can't break between syllables, as a word can.
  const title = "Exports over 1000000000";
  const width = Math.ceil(textWidth("1000000000", font));
  const titled = legend({width, title});
  const plain = legend({width});
  assert.strictEqual(titled._titleHeight, 0);
  assert.deepStrictEqual(titleLines(titled), [], "no title drawn");
  assert.deepStrictEqual(titled.outerBounds(), plain.outerBounds());
});

it("Legend: a single row taller than the legend leaves out its labels", () => {
  const roomy = legend({direction: "row", height: 100});
  const pad = roomy.padding() * 2;
  assert.ok(
    roomy._lineData.some(d => d.width),
    "with room, its swatches are drawn with labels",
  );
  // A pixel less than the row needs with its labels (as they are measured).
  const height = roomy.outerBounds().height + pad - 1;
  const short = legend({direction: "row", height});
  assert.ok(
    short.outerBounds().height > 0 &&
      short.outerBounds().height + pad <= height,
    `the row keeps within the height (${short.outerBounds().height} + ${pad} <= ${height})`,
  );
  assert.ok(
    short._lineData.every(d => !d.width),
    "its swatches are drawn without labels",
  );
});
