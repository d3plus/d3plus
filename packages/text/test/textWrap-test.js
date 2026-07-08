import assert from "assert";
import {default as textWrap} from "../es/src/textWrap.js";
import it from "./jsdom.js";

it("textWrap", () => {
  const font = "Verdana";

  const sentence = "Hello D3plus, please wrap this sentence for me.",
    testWrap = textWrap().fontFamily(font).fontSize(14)(sentence);

  assert.ok(
    testWrap.lines[0] === "Hello D3plus, please wrap this" &&
      testWrap.lines[1] === "sentence for me.",
    "returning wrapped lines",
  );
  assert.strictEqual(
    testWrap.sentence,
    "Hello D3plus, please wrap this sentence for me.",
    "returning original sentence",
  );
  assert.strictEqual(testWrap.truncated, false, "returning truncated boolean");

  const spaceTest = "Two  Space Test",
    spaceWrap = textWrap().fontFamily(font).fontSize(14)(spaceTest);
  assert.strictEqual(
    spaceWrap.lines[0],
    spaceTest,
    "catch for multiple spaces",
  );

  assert.strictEqual(
    textWrap()("A\nB").lines[0],
    "A",
    "catch for literal line break (\\n)",
  );

  const truncResult = textWrap().fontFamily(font).fontSize(14).width(200).height(14)("This is a very long sentence that should definitely be truncated at some point.");
  assert.strictEqual(truncResult.truncated, true, "truncated when height is too small");

  const maxLinesResult = textWrap().fontFamily(font).fontSize(14).maxLines(1)("Hello D3plus, please wrap this sentence for me.");
  assert.strictEqual(maxLinesResult.lines.length, 1, "maxLines limits output to 1 line");
  assert.strictEqual(maxLinesResult.truncated, true, "maxLines truncates remaining text");

  const nonString = textWrap()(42);
  assert.strictEqual(nonString.sentence, "42", "non-string input is stringified");

  const undefInput = textWrap()(undefined);
  assert.strictEqual(undefInput.sentence, "undefined", "undefined input is stringified");

  const overflowResult = textWrap().fontFamily(font).fontSize(14).width(5).overflow(false)("Superlongword");
  assert.strictEqual(overflowResult.truncated, true, "overflow false truncates wide word");

  // Re-wrapping text at the width it reports must be stable: a consumer that
  // sizes a box to `ceil(max(widths))` should not trigger another line break.
  // Hyphenated words exposed this (the soft-hyphen glyph counted toward the
  // break decision but was stripped from the re-measured line width).
  const idemSentences = [
    "Alexander Simoes",
    "Hello D3plus, please wrap this sentence for me.",
    "internationalization",
  ];
  for (const s of idemSentences) {
    const first = textWrap().fontFamily(font).fontSize(14).width(400).height(400)(s);
    const boxWidth = Math.ceil(Math.max(...first.widths));
    const refit = textWrap().fontFamily(font).fontSize(14).width(boxWidth).height(400)(s);
    assert.deepStrictEqual(
      refit.lines,
      first.lines,
      `re-wrapping "${s}" at its reported width is stable`,
    );
    assert.strictEqual(
      refit.truncated,
      false,
      `re-wrapping "${s}" at its reported width does not truncate`,
    );
  }

  const getters = textWrap().fontFamily(font).fontSize(14);
  assert.strictEqual(getters.fontFamily(), font, "fontFamily getter");
  assert.strictEqual(getters.fontSize(), 14, "fontSize getter");
  assert.strictEqual(getters.fontWeight(), 400, "fontWeight getter");
  assert.strictEqual(getters.overflow(), false, "overflow getter");
  assert.strictEqual(getters.maxLines(), null, "maxLines getter");
  assert.strictEqual(getters.shape(), "square", "shape getter defaults to square");
  assert.strictEqual(getters.shape("circle").shape(), "circle", "shape setter");
});

it("textWrap circle", () => {
  const font = "Verdana";

  // The chord of a circle of `radius` at the vertical center of line `line`
  // (1-based) in a centered block of `total` lines — the same geometry the
  // wrapper uses to bound each line.
  const chordAt = (radius, total, lineHeight, fontSize, line) => {
    const center = -(total * lineHeight) / 2 + (line - 0.5) * lineHeight;
    const edge = Math.abs(center) + fontSize / 2;
    return edge >= radius ? 0 : 2 * Math.sqrt(radius * radius - edge * edge);
  };

  const sentence =
    "internationalization internationalization internationalization";

  // The containment guarantee: in a comfortably-sized circle the label wraps to
  // the interior and every line fits the chord at its own vertical position —
  // not just the full diameter. A line near the top/bottom has far less room
  // than a middle line, and the wrapper accounts for the ACTUAL line count it
  // settles on (chords are re-centered to that count at render time). This is
  // asserted as a geometric invariant rather than an exact line count, which
  // depends on sub-pixel font metrics.
  const circle = textWrap()
    .fontFamily(font)
    .fontSize(16)
    .lineHeight(20)
    .width(300)
    .height(300)
    .shape("circle")(sentence);
  assert.strictEqual(circle.truncated, false, "the label fits without truncating");
  assert.ok(circle.lines.length >= 2, "the label wraps to multiple lines");
  circle.widths.forEach((w, i) => {
    const chord = chordAt(150, circle.lines.length, 20, 16, i + 1);
    assert.ok(
      w <= chord + 0.5,
      `circle line ${i} (w=${w.toFixed(1)}) fits its chord (${chord.toFixed(1)})`,
    );
  });

  // A single short word sits centered on one line, using the full diameter.
  const single = textWrap()
    .fontFamily(font)
    .fontSize(14)
    .width(200)
    .height(200)
    .shape("circle")("Hi");
  assert.strictEqual(single.lines.length, 1, "short text stays on one line");
  assert.strictEqual(single.truncated, false, "short text is not truncated");

  // A circle too small for even the first word truncates rather than overflowing.
  const tiny = textWrap()
    .fontFamily(font)
    .fontSize(14)
    .width(30)
    .height(30)
    .shape("circle")(sentence);
  assert.strictEqual(tiny.truncated, true, "text too large for the circle truncates");

  // maxLines caps the circle search just like the square path.
  const capped = textWrap()
    .fontFamily(font)
    .fontSize(16)
    .lineHeight(20)
    .width(170)
    .height(170)
    .shape("circle")
    .maxLines(2)(sentence);
  assert.ok(capped.lines.length <= 2, "maxLines caps circle line count");

  // Regression: a wrap that settles on fewer lines than the search assumed must
  // not be accepted with a line that overflows the re-centered block. In a 74px
  // circle this text fit in 2 lines whose bottom line measured ~66.9px against a
  // ~65.7px chord — validated against the search count (3) instead of the actual
  // (2). It must now report truncation (a resizing caller then shrinks to fit)
  // rather than returning a silently-overflowing layout.
  const reflow = textWrap()
    .fontFamily(font)
    .fontSize(14)
    .width(74)
    .height(74)
    .shape("circle")("wrap text wrap");
  assert.ok(
    reflow.truncated ||
      reflow.widths.every(
        (w, i) => w <= chordAt(37, reflow.lines.length, 20, 14, i + 1) + 0.5,
      ),
    "a non-truncated circle wrap never returns an overflowing line",
  );

  // overflow(true) opts out of circle containment: at least one line is allowed
  // to exceed its chord (spill past the curved edge) instead of being forced to
  // shrink or truncate.
  const spilled = textWrap()
    .fontFamily(font)
    .fontSize(20)
    .lineHeight(28)
    .width(120)
    .height(120)
    .shape("circle")
    .overflow(true)("these are several fairly long words");
  assert.ok(
    spilled.widths.some(
      (w, i) => w > chordAt(60, spilled.lines.length, 28, 20, i + 1) + 0.5,
    ),
    "overflow(true) lets a circle line exceed its chord",
  );

  // Regression: overflow with a first word wider than its line must not throw.
  // The first-word break path advanced the line counter past the (empty) line
  // buffer, so a following word read an undefined line and crashed.
  assert.doesNotThrow(
    () =>
      textWrap()
        .fontFamily(font)
        .fontSize(20)
        .width(10)
        .shape("circle")
        .overflow(true)("Superlongword tail"),
    "overflow with a first word wider than the line does not crash",
  );
});
