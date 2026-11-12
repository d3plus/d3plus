import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    An axis title too long for its axis is wrapped across it and, when it
    still doesn't fit, cut short with "...", never dropped: a word wider
    than the axis that the wrap can't hyphenate (capitals inside it, or a
    run of capitals) is cut mid-word, and a title of words that runs out
    of room ends at a word break. Driven in real Chromium for text
    measurement.
*/

const titles = {
  camel: "GrossDomesticProductPerCapitaInConstantInternationalDollars",
  caps: "ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ",
  sentence:
    "GrossDomesticProductPerCapitaInConstantInternationalDollars for every country and year in the sample",
  // Short words, so none hyphenate, too many for the chart.
  words: Array(60)
    .fill("the quick brown fox jumps over the lazy dog")
    .join(" "),
};

/**
    Renders a chart with `title` on its `axis` and reads the title as
    painted: its lines, from the painted scene, each line's width measured
    with the font it is drawn in, and the width of the axis it spans.
*/
const probe = ([chart, axis, title, width, height, renderer]) =>
  new Promise((resolve, reject) => {
    const el = document.querySelector("#viz");
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    const viz = new window.d3plus[chart]()
      .data([
        {id: "a", x: "A", y: 10},
        {id: "a", x: "B", y: 20},
        {id: "a", x: "C", y: 15},
      ])
      .groupBy("id")
      .x("x")
      .y("y")
      .legend(false)
      .config({[`${axis}Config`]: {title}})
      .renderer(renderer)
      .duration(0)
      .select("#viz");
    viz.render(() => {
      try {
        const a = viz[`_${axis}Axis`];
        const [box] = a._titleClass._textData();
        const ctx = document.createElement("canvas").getContext("2d");
        const painted = [];
        // The title is the text box group directly in the axis's group.
        const titleNodes = node =>
          node.key === `plot-${axis}-axis`
            ? node.children
                .filter(c => c.key === "textBox-group")
                .flatMap(c => c.children)
            : (node.children || []).flatMap(titleNodes);
        for (const node of titleNodes(viz._paintedScene.root)) {
          const {family, size, weight} = node.font;
          ctx.font = `${weight || 400} ${size}px ${family}`;
          painted.push(
            node.lines.map(l => ({
              text: l.text,
              width: ctx.measureText(l.text).width,
            })),
          );
        }
        resolve({painted, axisWidth: box ? box.w : 0});
      } catch (e) {
        reject(e);
      }
    });
  });

for (const renderer of ["svg", "canvas"])
  it(`[${renderer}] a long axis title draws within its axis, cut short with "..."`, async () => {
    for (const chart of ["BarChart", "LinePlot"])
      for (const axis of ["x", "y"])
        for (const [kind, title] of Object.entries(titles))
          for (const size of [
            [160, 160],
            [300, 200],
            [160, 300],
          ]) {
            const name = `${chart} ${axis} ${kind} ${size.join("x")}`;
            const {painted, axisWidth} = await render(
              '<div id="viz"></div>',
              probe,
              [chart, axis, title, ...size, renderer],
            );
            assert.strictEqual(painted.length, 1, `${name}: draws the title`);
            const [lines] = painted;
            assert.ok(lines.length, `${name}: the title has lines`);
            for (const {text, width} of lines) {
              assert.ok(text.trim(), `${name}: no empty line`);
              assert.ok(
                width <= axisWidth + 0.5,
                `${name}: "${text}" (${width}px) fits the ${axisWidth}px axis`,
              );
            }
            const shown = lines.map(l => l.text).join(" ");
            assert.ok(
              shown.endsWith("..."),
              `${name}: "${shown}" is cut short with "..."`,
            );
            if (kind === "words") {
              const kept = shown.slice(0, -3);
              assert.ok(title.startsWith(kept), `${name}: "${shown}"`);
              assert.strictEqual(
                title[kept.length],
                " ",
                `${name}: word break`,
              );
            }
          }
  });
