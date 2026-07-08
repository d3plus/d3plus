import assert from "assert";
import it from "../jsdom.js";
import {Circle} from "../../es/index.js";

/**
    Circle labels wrap to the circle interior (issue #736): lines near the top
    and bottom are shorter than lines through the middle, and no line spills
    outside the circle. Circle's `labelBounds` returns a full-diameter box
    tagged `shape: "circle"`, so the label TextBox flows text as circle chords
    rather than being capped to a square inscribed in the circle.
*/
it("Circle wraps labels inside the circle", () => {
  const r = 110;
  const circle = new Circle()
    .data([
      {
        id: "a",
        r,
        x: 150,
        y: 150,
        text:
          "internationalization internationalization internationalization",
      },
    ])
    .label(d => d.text)
    // padding 0 makes the effective wrap radius exactly r, so the containment
    // check below can reconstruct each line's chord without guessing padding.
    .labelConfig({padding: 0})
    .renderMode("compute")
    .render();

  // The circle's labelBounds tags the label record so it wraps as a circle,
  // without leaking into charts that supply their own rectangular bounds. The
  // hint is stamped under a namespaced key so a caller's own `shape` data field
  // can't trigger it.
  const record = circle._buildLabelData()[0];
  assert.strictEqual(
    record.__d3plusWrapShape__,
    "circle",
    "label record carries the circle wrap hint",
  );

  const text = circle._labelClass.toScene().children[0];
  assert.ok(text, "a label text node was emitted");
  assert.strictEqual(text.font.anchor, "middle", "label is centered horizontally");

  const widths = text.lines.map(l => l.width);
  assert.ok(widths.length >= 3, "long label wraps to several lines");

  // Every line fits the circle chord available at its vertical position — the
  // real containment guarantee, not just the loose diameter bound. Chords are
  // reconstructed from the same geometry textWrap uses: a vertically-centered
  // block of `n` lines, each line's font-box spanning ~fontSize.
  const fS = text.font.size;
  const lH = fS * 1.2;
  const n = text.lines.length;
  text.lines.forEach((l, i) => {
    const center = (i + 0.5 - n / 2) * lH;
    const edge = Math.abs(center) + fS / 2;
    const chord = edge >= r ? 0 : 2 * Math.sqrt(r * r - edge * edge);
    assert.ok(
      l.width <= chord + 0.5,
      `line ${i} (w=${l.width.toFixed(1)}) fits its chord (${chord.toFixed(1)})`,
    );
  });

  // The widest line runs through the middle, not the top or bottom edge.
  const widest = Math.max(...widths);
  const widestIndex = widths.indexOf(widest);
  assert.ok(
    widestIndex > 0 && widestIndex < widths.length - 1,
    "the widest line is an interior line, not the first or last",
  );
  assert.ok(
    widths[0] < widest && widths[widths.length - 1] < widest,
    "the first and last lines are shorter than the widest middle line",
  );
});

/**
    A chart that repositions a circle's label with its own `labelBounds` (e.g.
    Tree's external node labels) must NOT inherit circle wrapping — the label
    box is no longer the circle. The `shape` hint rides on the bounds, so a
    custom `labelBounds` without one falls back to ordinary rectangular wrapping.
*/
it("Circle custom labelBounds does not inherit circle wrapping", () => {
  const circle = new Circle()
    .data([{id: "a", r: 60, x: 100, y: 100, text: "Group 1"}])
    .label(d => d.text)
    .labelBounds(() => ({width: 120, height: 20, x: -60, y: 70}))
    .renderMode("compute")
    .render();

  const record = circle._buildLabelData()[0];
  assert.strictEqual(
    record.__d3plusWrapShape__,
    undefined,
    "no circle hint on custom bounds",
  );

  const text = circle._labelClass.toScene().children[0];
  assert.ok(text, "label still renders with a custom rectangular box");
});
