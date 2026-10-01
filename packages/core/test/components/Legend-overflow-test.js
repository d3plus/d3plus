import assert from "assert";
import {Legend} from "../../es/index.js";
import {
  clearLegend,
  computeLegendLineData,
  wrapLegendRows,
} from "../../es/src/components/Legend/legendRender.js";
import it from "../jsdom.js";

/**
    A legend whose swatches can't fit its box, even with labels dropped, used to
    fall back to one long row of bare swatches and report that row's full width
    as its outer bounds. A chart then claimed the whole width as margin, pushing
    its plot area off-screen. It now renders nothing and reports zero bounds.
*/

const items = n => Array.from({length: n}, (_, i) => ({id: `item ${i}`}));

function legend(n, {direction = "column", width = 400, height = 300} = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const group = svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "g"));
  return new Legend()
    .renderMode("compute")
    .select(group)
    .duration(0)
    .data(items(n))
    .direction(direction)
    .width(width)
    .height(height);
}

const swatchCount = l => l.toScene().children.length;

it("Legend: a column that fits keeps its bounds and swatches", () => {
  const l = legend(5).render();
  const {width, height} = l.outerBounds();
  assert.ok(width > 0 && height > 0, `non-zero bounds (${width}x${height})`);
  assert.ok(swatchCount(l) > 0, "swatches are in the scene");
});

it("Legend: a column too tall even without labels renders nothing", () => {
  const l = legend(127).render();
  assert.deepStrictEqual(l.outerBounds(), {width: 0, height: 0, x: 0, y: 0});
  assert.strictEqual(swatchCount(l), 0, "no swatches in the scene");
});

it("Legend: rows that wrap past the height render nothing", () => {
  const l = legend(127, {direction: "row", width: 200, height: 40}).render();
  assert.strictEqual(l.outerBounds().height, 0);
  assert.strictEqual(swatchCount(l), 0);
});

it("Legend: re-rendering moves between the overflowing and fitting states", () => {
  const l = legend(5).render();
  assert.ok(swatchCount(l) > 0, "fits at first");

  l.data(items(127)).render();
  assert.strictEqual(l.outerBounds().height, 0, "overflow clears the bounds");
  assert.strictEqual(swatchCount(l), 0, "overflow clears the previous swatches");

  l.data(items(5)).render();
  assert.ok(l.outerBounds().height > 0, "fitting again restores the bounds");
  assert.ok(swatchCount(l) > 0, "fitting again restores the swatches");
});

it("wrapLegendRows: returns the row width when swatches fit, false when they don't", () => {
  for (const [n, fits] of [[5, true], [127, false]]) {
    const l = legend(n);
    l._lineData = computeLegendLineData(l, l.height());
    const space = wrapLegendRows(l, l.width(), l.height());
    if (fits) assert.ok(typeof space === "number" && space > 0, `${n} items: ${space}`);
    else assert.strictEqual(space, false, `${n} items`);
  }
});

it("clearLegend: drops the title and swatches and zeroes the bounds", () => {
  const l = legend(5).title("Title").render();
  assert.ok(swatchCount(l) > 1, "title + swatches before clearing");

  clearLegend(l);
  assert.deepStrictEqual(l.outerBounds(), {width: 0, height: 0, x: 0, y: 0});
  assert.strictEqual(l._shapes.length, 0);
  assert.strictEqual(swatchCount(l), 0, "nothing left in the scene");
});
