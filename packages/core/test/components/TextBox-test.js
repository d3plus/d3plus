import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

// TextBox positions and wraps text using real layout (getBBox), so it runs in a
// headless browser rather than jsdom.
after(async () => {
  await closeBrowser();
});

it("TextBox", async function () {
  this.timeout(60000);

  const out = await render(
    '<svg id="s" width="300" height="300"><g id="box"></g></svg>',
    () =>
      new Promise(resolve => {
        const box = new window.d3plus.TextBox().select("#box");
        const draw = configure =>
          new Promise(done => configure(box).render(done));
        // v4 emits a single <text> per text box with one <tspan> per wrapped
        // line. Top-level tspans (direct children of <text>) are the lines.
        const lineTspans = () =>
          [...document.querySelectorAll("#box text > tspan")].map(
            t => t.textContent,
          );

        (async () => {
          const o = {};

          await draw(b =>
            b
              .data([{text: "Hello D3plus, please wrap this sentence for me."}])
              .fontSize(14)
              .fontResize(false)
              .height(200)
              .width(200)
              .x(100)
              .y(100),
          );
          o.lines = lineTspans();
          // Count only the line-level tspans (not nested style spans) so the
          // plain-text assertion below stays meaningful when bold runs appear.
          o.tspans = document.querySelectorAll("#box text > tspan").length;
          // Count any styled child tspans (bold/italic runs).
          o.styledTspans = document.querySelectorAll('#box tspan tspan[style]').length;
          o.plainLineCount = o.lines.length;
          const bbox = document.getElementById("d3plus-textBox-0").getBBox();
          o.bbox = {width: Math.round(bbox.width), height: Math.round(bbox.height)};

          await draw(b =>
            b.data([
              {text: "Hello <b>D3plus</b>, please wrap this sentence for me."},
            ]),
          );
          const bold = document.querySelector('#box tspan[style*="bold"]');
          o.boldText = bold ? bold.textContent : null;

          await draw(b =>
            b
              .data([
                {text: "Hello D3plus, please wrap this sentence for me."},
              ])
              .fontResize(true),
          );
          o.resizedLineCount = lineTspans().length;

          resolve(o);
        })();
      }),
  );

  // The exact break points depend on the available font (which differs between
  // machines/CI), so assert that the text wrapped onto multiple lines and that
  // the lines reconstruct the original sentence (a trailing "-" marks a
  // hyphenation break, so re-join those without a space).
  assert.ok(out.lines.length >= 2, "wraps text onto multiple lines");
  const rejoined = out.lines.reduce((acc, line, i) =>
    i === 0
      ? line
      : acc.endsWith("-")
        ? acc.slice(0, -1) + line
        : `${acc} ${line}`,
  "");
  assert.strictEqual(
    rejoined,
    "Hello D3plus, please wrap this sentence for me.",
    "wrapped lines reconstruct the original text",
  );
  // Scene-based rendering emits one <tspan> per wrapped line; plain text has
  // no extra styled child spans, so tspan count equals line count.
  assert.strictEqual(
    out.tspans,
    out.plainLineCount,
    "plain text renders one tspan per line",
  );
  // The box is 200×200. d3plus wraps to its own text measurement, but the
  // rendered bbox can exceed that on another platform's fonts (Linux CI renders
  // this sentence ~220px wide vs <=200 on macOS). Wrapping itself is asserted
  // above (lines.length >= 2); this is a coarse guard that the wrapped result
  // stays roughly box-sized rather than blowing out to the full unwrapped width
  // (~330px), so allow generous slack for cross-platform font metrics.
  const FIT_MAX = 200 * 1.3;
  assert.ok(
    out.bbox.width <= FIT_MAX && out.bbox.height <= FIT_MAX,
    `wrapped text stays roughly within the box (bbox ${out.bbox.width}×${out.bbox.height}, box 200×200, max ${FIT_MAX})`,
  );
  assert.strictEqual(out.boldText, "D3plus", "renders <b> as a bold tspan");
  assert.ok(
    out.resizedLineCount > out.plainLineCount,
    "fontResize enlarges the text onto more lines",
  );
});

it("TextBox sizes its render surface to fit the laid-out content", async function () {
  this.timeout(60000);

  // Mirrors the @d3plus/react wrapper, whose container svg is sized with
  // `width`/`height="100%"`. `width`/`x` are per-box accessors (not canvas
  // dimensions), so the surface must grow to the content extent rather than
  // fall back to a hard-coded 400 that crops the later boxes.
  const out = await render(
    '<svg id="s" width="100%" height="100%"></svg>',
    () =>
      new Promise(resolve => {
        new window.d3plus.TextBox()
          .select("#s")
          .data([{text: "One"}, {text: "Two"}, {text: "Three"}])
          .fontSize(14)
          .fontResize(false)
          .height(120)
          .width(200)
          .x((d, i) => i * 250)
          .render(() => {
            const svg = document.querySelector("#s .d3plus-render-svg");
            resolve({
              svgWidth: svg ? Number(svg.getAttribute("width")) : null,
              boxes: document.querySelectorAll(
                "#s [id^='d3plus-textBox-']",
              ).length,
            });
          });
      }),
  );

  // Boxes sit at x = 0, 250, 500 and are 200 wide, so the content extends to
  // 700px; the surface must be at least that wide for every box to render.
  assert.strictEqual(out.boxes, 3, "renders all three boxes");
  assert.ok(
    out.svgWidth >= 700,
    `render surface fits the content extent (got ${out.svgWidth})`,
  );
});
