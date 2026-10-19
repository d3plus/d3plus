import assert from "assert";

import {closeBrowser, render} from "../playwright.js";

/**
    A title beside the corner control panels (zoom on the right, table view
    and search on the left) wraps short of them. A centered title first
    insets both sides by the larger corner's amount; when the text doesn't
    fit that narrow box it insets each side by its own corner, and when it
    doesn't fit beside the panels at all it drops below them. Either way the
    whole title is drawn, in SVG and on canvas.
*/

after(async () => {
  await closeBrowser();
});

/**
    Renders a 300px-wide Plot titled `title`, with zoom, table view and
    search showing, and returns the title's scene lines, its page-space
    box, and the page-space boxes of the corner controls.
*/
const titleLayout = (title, renderer) =>
  render(
    '<div id="s" style="width:300px;height:300px;"></div>',
    ({title, renderer}) =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus.Plot()
          .select("#s")
          .data([{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 50000}, {id: "b", x: 3, y: 3}])
          .groupBy("id")
          .x("x")
          .y("y")
          .title(title)
          .tableView(true)
          .search(true)
          .renderer(renderer)
          .duration(0);
        viz.render(() => {
          try {
            let node = null;
            const walk = n => {
              if (n.key === "viz-title" && n.type === "text") node = n;
              (n.children || []).forEach(walk);
            };
            walk(viz.toScene().root);
            const host = document.querySelector("#s").getBoundingClientRect();
            const rects = selector =>
              [...document.querySelectorAll(selector)].map(e => e.getBoundingClientRect().toJSON());
            const out = {
              lines: node ? node.lines.map(l => l.text) : [],
              controlsHeight: window.d3plus.cornerControlsHeight(viz),
              marginTop: viz._margin.top,
              plotCenter: host.left + viz._padding.left + (host.width - viz._padding.left - viz._padding.right) / 2,
              zoom: rects("#s .zoom-control"),
              topLeft: rects("#s .d3plus-top-left-controls-item button"),
            };
            if (node) {
              const {x, y} = node.transform;
              const lH = node.lines.length > 1 ? node.lines[1].y - node.lines[0].y : node.font.size * 1.2;
              const spans = node.lines.map(l => [x + l.x - l.width / 2, x + l.x + l.width / 2]);
              out.title = {
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
    {title, renderer},
  );

const overlaps = (a, b) => !(a.left >= b.right || a.right <= b.left || a.top >= b.bottom || a.bottom <= b.top);

/** Asserts the title reads in full and stays clear of every corner control. */
function assertClear(out, text, label) {
  assert.strictEqual(out.lines.join(" "), text, `${label}: the whole title is drawn`);
  assert.ok(out.zoom.length && out.topLeft.length, `${label}: both corner panels show`);
  for (const r of [...out.zoom, ...out.topLeft]) {
    assert.ok(!overlaps(out.title, r), `${label}: the title clears the control at ${r.left},${r.top}`);
  }
}

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: a centered title too wide for the symmetric inset insets each side by its own corner`, async function () {
    this.timeout(60000);
    const text = "Exports 1234567890";
    const out = await titleLayout(text, renderer);
    assertClear(out, text, renderer);
    assert.ok(out.title.top < Math.min(...out.zoom.map(r => r.bottom)), "the title stays on the controls' row");
  });

  it(`${renderer}: a title that doesn't fit beside the corner controls drops below them`, async function () {
    this.timeout(60000);
    const text = "123456789012345678901";
    const out = await titleLayout(text, renderer);
    assertClear(out, text, renderer);
    const panelsBottom = Math.max(...[...out.zoom, ...out.topLeft].map(r => r.bottom));
    assert.ok(out.title.top >= panelsBottom - 1, `the title starts below the panels (${out.title.top} vs ${panelsBottom})`);
    assert.ok(out.marginTop >= out.controlsHeight, "the claimed margin covers the drop below the panels");
  });

  it(`${renderer}: a title that fits the symmetric inset stays centered on its row`, async function () {
    this.timeout(60000);
    const text = "Exports";
    const out = await titleLayout(text, renderer);
    assertClear(out, text, renderer);
    assert.ok(out.title.top < Math.min(...out.zoom.map(r => r.bottom)), "the title stays on the controls' row");
    const center = (out.title.left + out.title.right) / 2;
    assert.ok(Math.abs(center - out.plotCenter) < 2, `centered over the plot (${center} vs ${out.plotCenter})`);
  });
}

it("cornerControlsHeight is the taller corner panel's height, and 0 with no panels", async function () {
  this.timeout(60000);
  const out = await render(
    '<div id="a" style="width:300px;height:300px;"></div><div id="b" style="width:300px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "a", x: 1, y: 2}, {id: "b", x: 2, y: 3}];
        const shown = new window.d3plus.Plot().select("#a").data(data).groupBy("id").x("x").y("y")
          .tableView(true).search(true).duration(0);
        const hidden = new window.d3plus.Plot().select("#b").data(data).groupBy("id").x("x").y("y")
          .zoom(false).tableView(false).search(false).duration(0);
        shown.render(() =>
          hidden.render(() => {
            const bottom = sel => Math.max(...[...document.querySelectorAll(sel)].map(e => e.getBoundingClientRect().bottom));
            const top = document.querySelector("#a").getBoundingClientRect().top;
            resolve({
              shown: window.d3plus.cornerControlsHeight(shown),
              panelsBottom: Math.max(bottom("#a .zoom-control"), bottom("#a .d3plus-top-left-controls-item button")) - top,
              hidden: window.d3plus.cornerControlsHeight(hidden),
            });
          }),
        );
      }),
  );
  assert.ok(out.shown >= out.panelsBottom - 1, `covers the panels (${out.shown} vs ${out.panelsBottom})`);
  assert.ok(out.shown < out.panelsBottom + 12, `hugs the panels (${out.shown} vs ${out.panelsBottom})`);
  assert.strictEqual(out.hidden, 0);
});
