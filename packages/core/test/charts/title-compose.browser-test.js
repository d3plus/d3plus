import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/** Renders a two-cell Treemap configured by `setup` and reads back its text and feature keys. */
const treemap = (setup, [width, height]) =>
  render('<div id="B"></div>', async () => {
    const target = document.getElementById("B");
    const viz = new window.d3plus.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
      ])
      .groupBy("id")
      .sum("value")
      .width(width)
      .height(height)
      .duration(0)
      .select(target);
    setup(viz);
    await new Promise(resolve => viz.render(resolve));
    return {
      text: target.textContent,
      vizFeaturesGroup: !!target.querySelector('[data-key="viz-features"]'),
      hasTitle: !!target.querySelector('[data-key="viz-title"]'),
      hasSubtitle: !!target.querySelector('[data-key="viz-subtitle"]'),
      hasTotal: !!target.querySelector('[data-key="viz-total"]'),
    };
  });

it("titleFeature composes a title TextNode into the scene", async () => {
  const res = await treemap(
    viz => viz.title(() => "My Chart Title"),
    [300, 200],
  );
  assert.ok(res.vizFeaturesGroup, "viz-features group composed into scene");
  assert.ok(res.hasTitle, "title text node present in scene");
  // Wrapped lines render as separate tspans with no inserted whitespace, so
  // check the words rather than the exact phrase with its space intact.
  assert.ok(
    res.text.includes("My Chart"),
    "title text appears in rendered DOM",
  );
  assert.ok(res.text.includes("Title"), "title text appears in rendered DOM");
});

it("subtitle and total features compose into the scene", async () => {
  const res = await treemap(
    viz =>
      viz
        .title(() => "Chart Title")
        .subtitle(() => "A descriptive subtitle")
        .total(d => d.value),
    [400, 300],
  );
  assert.ok(res.hasTitle, "title in scene");
  assert.ok(res.hasSubtitle, "subtitle in scene");
  assert.ok(res.hasTotal, "total in scene");
  assert.ok(res.text.includes("Chart Title"), "title text rendered");
  assert.ok(
    res.text.includes("descriptive subtitle"),
    "subtitle text rendered",
  );
  assert.ok(res.text.includes("30"), "total value rendered");
});
