import {it} from "vitest";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";

/**
    A title beside the corner control panels fits a placement only in whole
    words: a placement where it only fits by breaking a word mid-word moves on
    to the next, and a word hyphenated just to pack a line is drawn whole.
    Only the last resort, the full-width row below the panels, still breaks a
    word too wide for it. The same holds for the subtitle, in SVG and on canvas.
*/

/**
    Renders a `width`-px-wide Plot with zoom, table view and search showing
    and `text` as its `key` ("title" or "subtitle"), and returns that text's
    scene lines, its page-space box and the corner controls' page-space boxes.
*/
const textLayout = (text, renderer, width = 300, key = "title") =>
  render(
    `<div id="s" style="width:${width}px;height:300px;"></div>`,
    ({text, renderer, key}) =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus.Plot()
          .select("#s")
          .data([{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 50000}, {id: "b", x: 3, y: 3}])
          .groupBy("id")
          .x("x")
          .y("y")
          .config({[key]: text})
          .tableView(true)
          .search(true)
          .renderer(renderer)
          .duration(0);
        viz.render(() => {
          try {
            let node = null;
            const walk = n => {
              if (n.key === `viz-${key}` && n.type === "text") node = n;
              (n.children || []).forEach(walk);
            };
            walk(viz.toScene().root);
            const host = document.querySelector("#s").getBoundingClientRect();
            const rects = selector =>
              [...document.querySelectorAll(selector)].map(e => e.getBoundingClientRect().toJSON());
            const out = {
              lines: node ? node.lines.map(l => l.text) : [],
              zoom: rects("#s .zoom-control"),
              topLeft: rects("#s .d3plus-top-left-controls-item button"),
            };
            if (node) {
              const {x, y} = node.transform;
              const lH = node.lines.length > 1 ? node.lines[1].y - node.lines[0].y : node.font.size * 1.2;
              const spans = node.lines.map(l => [x + l.x - l.width / 2, x + l.x + l.width / 2]);
              out.box = {
                left: host.left + Math.min(...spans.map(s => s[0])),
                right: host.left + Math.max(...spans.map(s => s[1])),
                top: host.top + y,
                bottom: host.top + y + node.lines.length * lH,
              };
            }
            resolve(out);
          } catch (e) {
            reject(e);
          }
        });
      }),
    {text, renderer, key},
  );

const overlaps = (a, b) => !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top);

/** Asserts the text is drawn in whole words and stays clear of every corner control. */
function assertWholeWords(out, text, label) {
  assert.ok(out.lines.every(l => !l.endsWith("-")), `${label}: no word is broken (${JSON.stringify(out.lines)})`);
  assert.strictEqual(out.lines.join(" "), text, `${label}: the whole text is drawn`);
  assert.ok(out.zoom.length && out.topLeft.length, `${label}: both corner panels show`);
  for (const r of [...out.zoom, ...out.topLeft]) {
    assert.ok(!overlaps(out.box, r), `${label}: the text clears the control at ${r.left},${r.top}`);
  }
}

const panelsBottom = out => Math.max(...[...out.zoom, ...out.topLeft].map(r => r.bottom));
const onControlsRow = out => out.box.top < Math.min(...out.zoom.map(r => r.bottom));

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a word hyphenated only to pack a line is drawn whole beside the controls`, async function () {
    const text = "{buffer: false} (New Default)";
    // Widths where the title used to read "(New De-" / "fault)".
    for (const width of [240, 300, 310, 400, 420]) {
      const out = await textLayout(text, renderer, width);
      assertWholeWords(out, text, `${renderer} @ ${width}px`);
      assert.ok(onControlsRow(out), `${renderer} @ ${width}px: the title stays on the controls' row`);
    }
  });

  it(`${renderer}: a title whose word is too wide for the symmetric inset insets each side instead`, async function () {
    // The symmetric inset used to break "Unemployment" across lines.
    const text = "Quarterly Unemployment Rate";
    const out = await textLayout(text, renderer, 300);
    assertWholeWords(out, text, renderer);
    assert.ok(onControlsRow(out), "the title stays on the controls' row");
  });

  it(`${renderer}: a title whose word is too wide beside the controls drops below them, wrapped by words`, async function () {
    for (const text of ["Quarterly Unemployment Rate", "Telecommunications Infrastructure Spending"]) {
      const width = text.startsWith("Quarterly") ? 250 : 300;
      const out = await textLayout(text, renderer, width);
      assertWholeWords(out, text, `${renderer}: ${text} @ ${width}px`);
      assert.ok(out.box.top >= panelsBottom(out) - 1, `${text}: starts below the panels (${out.box.top} vs ${panelsBottom(out)})`);
    }
  });

  it(`${renderer}: a single word too wide for the full-width row still breaks there`, async function () {
    const text = "Pneumonoultramicroscopicsilicovolcanoconiosis";
    const out = await textLayout(text, renderer, 300);
    assert.ok(out.lines.length > 1 && out.lines[0].endsWith("-"), `the word is hyphenated (${JSON.stringify(out.lines)})`);
    assert.strictEqual(out.lines.map(l => l.replace(/-$/, "")).join(""), text, "the whole word is drawn");
    assert.ok(out.box.top >= panelsBottom(out) - 1, "it is drawn on the full-width row below the panels");
  });

  it(`${renderer}: a subtitle fits beside the controls in whole words too`, async function () {
    const text = "Quarterly Unemployment Rate";
    for (const width of [250, 280, 300]) {
      const out = await textLayout(text, renderer, width, "subtitle");
      assertWholeWords(out, text, `${renderer} subtitle @ ${width}px`);
    }
  });
}
