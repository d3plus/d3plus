import {it} from "vitest";
import assert from "~test/browser/assert.js";

import {render} from "~test/browser/render.js";
import {sceneNodes} from "~test/browser/helpers.js";

/**
    Generic page CSS (`div {padding}`, `button {padding}`) stays off the
    HTML d3plus injects into a chart's container: the corner control panels
    measure and sit where they would on a bare page, so a title dropped
    below them sits right under them. Class rules naming d3plus's own
    classes, and d3plus's own style config, still apply.
*/

const PAGE_CSS = "div {padding: 25px; margin: 10px} button {padding: 20px; margin: 10px}";

/**
    Renders a 300px-wide Plot with zoom, table view and search showing and a
    title too wide to sit beside them, under the given page `css`. Boxes are
    relative to the chart's svg, so the container's own padding (also from
    the page CSS) doesn't count.
*/
const layout = (css, renderer, config = {}) =>
  render(
    `<style>${css}</style><div id="s" style="width:300px;height:300px;"></div>`,
    ({renderer, config}) =>
      new Promise((resolve, reject) => {
        const viz = new window.d3plus.Plot()
          .select("#s")
          .data([{id: "a", x: 1, y: 2}, {id: "a", x: 2, y: 50000}, {id: "b", x: 3, y: 3}])
          .groupBy("id")
          .x("x")
          .y("y")
          .title("123456789012345678901")
          .tableView(true)
          .search(true)
          .renderer(renderer)
          .duration(0)
          .config(config);
        viz.render(() => {
          try {
            const svg = document.querySelector("#s .d3plus-viz").getBoundingClientRect();
            const box = el => {
              const r = el.getBoundingClientRect();
              return {left: r.left - svg.left, top: r.top - svg.top, width: r.width, height: r.height};
            };
            const boxes = selector => [...document.querySelectorAll(selector)].map(box);
            let title = null;
            for (const n of sceneNodes(viz.toScene().root)) {
              if (n.key === "viz-title" && n.type === "text") title = n;
            }
            const zoomButton = document.querySelector("#s .zoom-control");
            resolve({
              controlsHeight: window.d3plus.cornerControlsHeight(viz),
              host: box(document.querySelector("#s .d3plus-render-overlays")),
              svg: {width: svg.width, height: svg.height},
              zoom: boxes("#s .zoom-control"),
              topLeft: boxes("#s .d3plus-top-left-controls-item button"),
              titleTop: title ? title.transform.y : null,
              zoomButton: {
                padding: getComputedStyle(zoomButton).padding,
                margin: getComputedStyle(zoomButton).margin,
              },
            });
          } catch (e) {
            reject(e);
          }
        });
      }),
    {renderer, config},
  );

const bottom = rects => Math.max(...rects.map(r => r.top + r.height));

for (const renderer of ["svg", "canvas"]) {
  it(`${renderer}: generic page CSS doesn't move or resize the corner controls`, async function () {
    const bare = await layout("", renderer);
    const styled = await layout(PAGE_CSS, renderer);
    assert.strictEqual(styled.controlsHeight, bare.controlsHeight, "cornerControlsHeight matches the bare page");
    assert.ok(bare.controlsHeight > 0 && bare.controlsHeight < 30, `a single row of controls (${bare.controlsHeight}px)`);
    assert.deepStrictEqual(styled.zoom, bare.zoom, "the zoom controls sit and size as on the bare page");
    assert.deepStrictEqual(styled.topLeft, bare.topLeft, "the top-left controls sit and size as on the bare page");
    assert.deepStrictEqual(
      styled.host,
      {left: 0, top: 0, ...styled.svg},
      "the overlay host covers the chart's svg, inside the container's padding",
    );
    assert.strictEqual(styled.titleTop, bare.titleTop, "the title drops to the same spot");
    const under = styled.titleTop - bottom([...styled.zoom, ...styled.topLeft]);
    assert.ok(under >= 0 && under < 10, `the title sits right under the panels (${under}px)`);
  });

  it(`${renderer}: class rules on d3plus's own classes still apply`, async function () {
    const bare = await layout("", renderer);
    const zoomPadded = await layout(`${PAGE_CSS} .d3plus-zoom-control {padding-bottom: 10px}`, renderer);
    // The controls reach their panel's bottom plus a gap equal to the
    // buttons' inset from the chart's top edge.
    assert.strictEqual(
      zoomPadded.controlsHeight,
      bottom(bare.zoom) + 10 + bare.zoom[0].top,
      "the zoom panel's padding from the page is measured",
    );
    const itemPadded = await layout(`${PAGE_CSS} .tlc-item {padding-bottom: 16px}`, renderer);
    assert.strictEqual(
      itemPadded.controlsHeight,
      bare.controlsHeight + 16,
      "the top-left items' padding from the page is measured",
    );
  });

  it(`${renderer}: d3plus style config still wins over page CSS`, async function () {
    const styled = await layout(PAGE_CSS, renderer, {
      zoomControlStyle: {height: "30px", width: "30px", padding: "5px", margin: "2px"},
    });
    assert.strictEqual(styled.zoomButton.padding, "5px", "configured padding");
    assert.strictEqual(styled.zoomButton.margin, "2px", "configured margin");
    assert.ok(styled.zoom.every(r => r.height === 30), "configured size");
  });
}

it("a zoomControlClassName hands the zoom buttons to the page's CSS", async function () {
  const styled = await layout(`${PAGE_CSS} .my-button {padding: 3px}`, "svg", {zoomControlClassName: "my-button"});
  assert.strictEqual(styled.zoomButton.padding, "3px", "the class's padding");
  assert.strictEqual(styled.zoomButton.margin, "10px", "the page's own button rules apply too");
});

it("generic page CSS stays off the tooltip, and tooltip config still applies", async function () {
  const out = await render(
    `<style>${PAGE_CSS}</style><div id="s"></div>`,
    () =>
      new Promise(resolve => {
        new window.d3plus.Tooltip()
          .data([{id: "a", title: "Title", body: "Body"}])
          .title(d => d.title)
          .body(d => d.body)
          .titleStyle({"padding-left": "4px"})
          .position([50, 50])
          .render(() => {
            const css = sel => getComputedStyle(document.querySelector(sel));
            const tip = css(".d3plus-tooltip");
            const title = css(".d3plus-tooltip-title");
            const body = css(".d3plus-tooltip-body");
            resolve({
              tip: [tip.padding, tip.margin],
              title: [title.paddingTop, title.paddingLeft, title.marginBottom, title.marginTop],
              body: [body.padding, body.margin],
            });
          });
      }),
  );
  assert.deepStrictEqual(out.tip, ["10px", "0px"], "the box keeps its configured padding, and no page margin");
  assert.deepStrictEqual(out.title, ["0px", "4px", "5px", "0px"], "the title keeps titleStyle and drops the page's box");
  assert.deepStrictEqual(out.body, ["0px", "0px"], "the body drops the page's box");
});
