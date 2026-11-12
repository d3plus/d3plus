import {it} from "vitest";
import assert from "assert";
import {Legend} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A Legend fits each item, and each row, against the width it reports for
    it (`_rowWidth`: the swatches and labels, and the padding between
    items, none after the last). The fit check counted the padding after
    every item, the last in a row too, so an item 10px narrower than the
    room wrapped its label (or moved to a new row) though it fit.
*/

const names = [
  "Agriculture, Forestry, Fishing and Hunting",
  "Health Care and Social Assistance",
  "Accommodation and Food Services",
];

function legend(width, direction = "column") {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const group = svg.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "g"),
  );
  return new Legend()
    .renderMode("compute")
    .select(group)
    .duration(0)
    .data(names.map(id => ({id})))
    .direction(direction)
    .width(width)
    .height(300)
    .render();
}

/** Each item's label lines, as painted by its TextBox. */
const painted = l => {
  const lines = new Map();
  for (const shape of l._shapes)
    for (const t of shape._labelClass._textData())
      lines.set(t.data.data.id, t.lines);
  return l._lineData.map(d => lines.get(d.id));
};

it("Legend: a column fits an item as wide as the room it reports", () => {
  const wide = legend(800);
  const widest = Math.max(...wide._lineData.map(d => wide._rowWidth([d])));
  const p = wide.padding();
  for (const slack of [0, 3, 9]) {
    const l = legend(widest + p * 2 + slack);
    const room = l.width() - p * 2;
    assert.deepStrictEqual(
      painted(l),
      names.map(n => [n]),
      `${slack}px slack: each label keeps one line`,
    );
    assert.ok(
      l.outerBounds().width <= room,
      `${slack}px slack: ${l.outerBounds().width}px wide in ${room}px`,
    );
  }
  // Narrower than the widest item, its label wraps.
  const narrow = legend(widest + p * 2 - 1);
  assert.ok(painted(narrow).some(lines => lines.length > 1));
  assert.ok(narrow.outerBounds().width <= narrow.width() - p * 2);
});

it("Legend: a row fits the items whose reported width fits", () => {
  const wide = legend(800, "row");
  const [a, b] = wide._lineData;
  const pair = wide._rowWidth([a, b]);
  const p = wide.padding();
  for (const slack of [0, 3, 9]) {
    const l = legend(pair + p * 2 + slack, "row");
    const rows = l._lineData.map(d => d.y);
    assert.strictEqual(
      rows[0],
      rows[1],
      `${slack}px slack: a and b share a row`,
    );
    assert.ok(rows[2] > rows[1], `${slack}px slack: c starts a new row`);
    assert.ok(
      l.outerBounds().width <= l.width() - p * 2,
      `${slack}px slack: ${l.outerBounds().width}px wide`,
    );
  }
  const narrow = legend(pair + p * 2 - 1, "row");
  const rows = narrow._lineData.map(d => d.y);
  assert.ok(rows[1] > rows[0], "1px short: b starts a new row");
});
