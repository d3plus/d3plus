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
        const texts = () =>
          [...document.querySelectorAll("#box text")].map(t => t.textContent);

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
          o.lines = texts();
          o.tspans = document.querySelectorAll("#box tspan").length;
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
          o.resizedLineCount = texts().length;

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
  assert.strictEqual(out.tspans, 0, "plain text renders without tspans");
  assert.ok(
    out.bbox.width <= 200 && out.bbox.height <= 200,
    "wrapped text fits within the box",
  );
  assert.strictEqual(out.boldText, "D3plus", "renders <b> as a bold tspan");
  assert.ok(
    out.resizedLineCount > out.plainLineCount,
    "fontResize enlarges the text onto more lines",
  );
});
