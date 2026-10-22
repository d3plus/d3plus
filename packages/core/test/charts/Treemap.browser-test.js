import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

// The Viz render pipeline awaits browser layout that never resolves under
// jsdom, so the chart is rendered in a headless browser instead.
it("Treemap", async function () {
  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Treemap()
          .select("#s")
          .data([
            {id: "a", value: 10},
            {id: "b", value: 20},
            {id: "c", value: 5},
          ])
          .render(() =>
            resolve({
              renderSvgs: document.querySelectorAll("svg.d3plus-render-svg")
                .length,
              rects: document.querySelectorAll("rect.d3plus-render-rect")
                .length,
            }),
          );
      }),
  );

  assert.strictEqual(
    out.renderSvgs,
    1,
    "rendered through @d3plus/render into the target",
  );
  assert.strictEqual(out.rects, 3, "scene drew a rect for each datum");
});

it("treemapDef.emit produces one rect node per laid-out cell, with its geometry", async () => {
  const res = await render('<div id="B"></div>', async () => {
    const viz = new window.d3plus.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
        {id: "C", value: 30},
        {id: "D", value: 40},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select("#B");
    await new Promise(resolve => viz.render(resolve));

    const {applyTreemapLayout, treemapDef} = window.d3plus;
    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    // Label-aware emit includes text nodes too; the geometry is on the rects.
    const rects = emitted.filter(n => n.type === "rect");
    return {
      shapeCount: shapeData.length,
      emitCount: emitted.length,
      rectCount: rects.length,
      allMatched: shapeData.every(
        (cell, i) =>
          rects[i].x === cell.x0 &&
          rects[i].y === cell.y0 &&
          rects[i].width === cell.x1 - cell.x0 &&
          rects[i].height === cell.y1 - cell.y0,
      ),
      hasAria: rects.every(n => n.aria && typeof n.aria.label === "string"),
    };
  });

  assert.strictEqual(res.shapeCount, 4, "stage produced one node per leaf");
  assert.strictEqual(
    res.rectCount,
    4,
    "emit produced one rect SceneNode per cell",
  );
  assert.ok(
    res.emitCount >= res.rectCount,
    "emit includes at least the rect cells",
  );
  assert.ok(res.allMatched, "emit geometry matches shapeData 1:1");
  assert.ok(res.hasAria, "emit annotated aria labels");
});

it("treemapDef.emit yields label-aware scene nodes (rect + text)", async () => {
  const res = await render('<div id="B"></div>', async () => {
    const viz = new window.d3plus.Treemap()
      .data([
        {id: "A", value: 10},
        {id: "B", value: 20},
      ])
      .groupBy("id")
      .sum("value")
      .width(400)
      .height(200)
      .duration(0)
      .select("#B");
    await new Promise(resolve => viz.render(resolve));

    const {applyTreemapLayout, treemapDef} = window.d3plus;
    const {shapeData} = applyTreemapLayout({viz});
    const emitted = treemapDef.emit({viz, shapeData});
    return {
      rectCount: emitted.filter(n => n.type === "rect").length,
      textCount: emitted.filter(n => n.type === "text").length,
      hasLineContent: emitted
        .filter(n => n.type === "text")
        .some(n => n.lines && n.lines.length > 0 && n.lines[0].text),
    };
  });

  assert.strictEqual(res.rectCount, 2, "two rect cells emitted");
  assert.ok(
    res.textCount >= 2,
    `at least one text node per cell (got ${res.textCount})`,
  );
  assert.ok(res.hasLineContent, "text nodes carry actual line content");
});
