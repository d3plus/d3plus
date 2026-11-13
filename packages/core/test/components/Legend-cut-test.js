import {it} from "vitest";
import assert from "assert";
import {Legend} from "../../index.ts";
import {
  cutLegendLabels,
  labelRoom,
} from "../../src/components/Legend/legendCut.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

/**
    A Legend that cuts its labels short (`_cutLabels`, as a ColorScale's
    is) gives labels that don't fit whole the room it has left, for their
    TextBoxes to cut short with "..."; any other Legend leaves them out.
*/

const label = i =>
  `An extraordinarily long legend label, longer than any legend could show, number ${i}`;
const items = n => Array.from({length: n}, (_, i) => ({id: label(i)}));

function legend({cut, direction = "column", width = 120, height = 200}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  document.body.appendChild(svg);
  const group = svg.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "g"),
  );
  const l = new Legend();
  l._cutLabels = cut;
  return l
    .renderMode("compute")
    .select(group)
    .duration(0)
    .data(items(4))
    .direction(direction)
    .width(width)
    .height(height)
    .render();
}

/** The labels' text in the legend's scene. */
const labels = l => {
  const out = [];
  const walk = n => {
    if (n.type === "text") out.push(n.lines.map(line => line.text).join(" "));
    (n.children || []).forEach(walk);
  };
  walk(l.toScene());
  return out;
};

for (const direction of ["column", "row"])
  it(`Legend: a ${direction} that cuts its labels short keeps them, cut with "..."`, () => {
    const size =
      direction === "column"
        ? {width: 120, height: 200}
        : {width: 400, height: 60};
    const l = legend({cut: true, direction, ...size});
    const drawn = labels(l);
    assert.strictEqual(drawn.length, 4, `every label drawn (${drawn})`);
    assert.ok(
      drawn.every(t => t.endsWith("...")),
      `cut short (${drawn})`,
    );
    assert.ok(
      l._lineData.every(d => d.cut),
      "each marked cut",
    );
    const {width, height} = l.outerBounds();
    assert.ok(
      width <= size.width - l.padding() * 2 && height <= size.height,
      `within the legend (${width}×${height})`,
    );
  });

it("Legend: any other Legend leaves out labels that don't fit whole", () => {
  const l = legend({cut: false});
  assert.deepStrictEqual(labels(l), []);
  assert.ok(l._lineData.every(d => !d.width));
});

it("cutLegendLabels: changes nothing when the room can't hold a line", () => {
  const l = legend({cut: false, width: 40});
  const before = JSON.stringify(l._lineData.map(d => [d.width, d.height]));
  assert.strictEqual(cutLegendLabels(l, 30, 200), false);
  assert.strictEqual(
    JSON.stringify(l._lineData.map(d => [d.width, d.height])),
    before,
  );
  assert.strictEqual(cutLegendLabels(l, 200, 8), false);
});

it("cutLegendLabels: a label that fits its room keeps its whole text", () => {
  const l = new Legend();
  l._lineData = [
    {sentence: "Short", f: "Arial", s: 10, lh: 14, shapeWidth: 12, width: 0},
  ];
  l.schema.direction = "column";
  assert.strictEqual(cutLegendLabels(l, 200, 100), true);
  assert.strictEqual(l._lineData[0].cut, false);
  assert.strictEqual(l._lineData[0].height, 15);
  assert.ok(l._lineData[0].width > 0 && l._lineData[0].width < 200);
});

it("labelRoom: more rows give each label more width and less height", () => {
  const l = new Legend();
  l._lineData = Array.from({length: 5}, () => ({shapeWidth: 12}));
  l.schema.direction = "row";
  // Each row: 5, 3, then 2 swatches across 240px, 100px tall.
  assert.deepStrictEqual(labelRoom(l, 240, 100, 1), {width: 25, height: 90});
  assert.deepStrictEqual(labelRoom(l, 240, 100, 2), {width: 57, height: 42});
  assert.deepStrictEqual(labelRoom(l, 240, 100, 3), {width: 97, height: 26});
  l.schema.direction = "column";
  assert.deepStrictEqual(labelRoom(l, 240, 100, 3), {width: 217, height: 14});
});

it("cutLegendLabels: a row takes the count of rows that cuts the fewest labels", () => {
  const l = legend({cut: false, direction: "row"});
  l._lineData = Array.from({length: 5}, (_, i) => ({
    sentence: `$${i}35,000 - $${i}40,000`,
    f: "Arial",
    s: 10,
    lh: 14,
    shapeWidth: 12,
    shapeHeight: 12,
  }));
  assert.strictEqual(cutLegendLabels(l, 240, 66), true);
  // In one row each label has 25px, too few for a number of seven figures.
  assert.ok(
    l._lineData.every(d => !d.cut),
    "every label whole",
  );
  assert.ok(
    l._lineData.every(d => d.width > 25),
    `wider than one row's room (${l._lineData.map(d => d.width)})`,
  );
});

for (const direction of ["column", "row"])
  it(`Legend: a ${direction}'s cut labels store the lines they paint`, () => {
    const size =
      direction === "column"
        ? {width: 120, height: 200}
        : {width: 400, height: 60};
    const l = legend({cut: true, direction, ...size});
    const painted = [];
    const walk = n => {
      if (n.type === "text") painted.push(n.lines.map(line => line.text));
      (n.children || []).forEach(walk);
    };
    walk(l.toScene());
    const cut = l._lineData.filter(d => d.cut);
    assert.ok(cut.length > 0, "labels are cut short");
    assert.deepStrictEqual(
      l._lineData.map(d => d.lines),
      painted,
      "stored lines are the painted lines",
    );
  });
