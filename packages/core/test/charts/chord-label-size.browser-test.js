import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {render} from "~test/browser/render.js";

/**
    Chord's group names at the default 11px in Chromium, on SVG and Canvas:
    at 400×400 every name of a five-region chord curves outside the ring,
    which gives up only the extra pixel of font size to the larger text;
    names on spokes take the same size.
*/

const box = "<div id='viz' style='width:400px;height:400px'></div>";

const links = [
  {source: "North America", target: "Europe", value: 9},
  {source: "North America", target: "East Asia", value: 7},
  {source: "Europe", target: "North America", value: 6},
  {source: "Europe", target: "Africa", value: 4},
  {source: "East Asia", target: "Europe", value: 8},
  {source: "East Asia", target: "Oceania", value: 3},
  {source: "Africa", target: "East Asia", value: 3},
  {source: "Oceania", target: "North America", value: 2},
];

/** Draws the chord and reads each name's font size and the ring's radius. */
const draw = ([renderer, config]) =>
  new Promise(resolve => {
    const viz = new window.d3plus.Chord()
      .select("#viz")
      .renderer(renderer)
      .duration(0)
      .config({links, value: "value", ...config});
    viz.render(() => {
      const names = [];
      const walk = n => {
        if (n.type === "text" && /^chord-label-/.test(String(n.key)))
          names.push({
            text: n.lines[0].text,
            curved: Boolean(n.path),
            size: n.font.size,
          });
        (n.children || []).forEach(walk);
      };
      walk(viz._paintedScene.root);
      const node = viz.ctx.chordCtx.nodes[0];
      resolve({
        names,
        radius: Math.hypot(node.labelX, node.labelY),
        textPaths: document.querySelectorAll("#viz textPath").length,
      });
    });
  });

for (const renderer of ["svg", "canvas"]) {
  it(`Chord ${renderer}: names curve at 11px, and the ring keeps its room`, async () => {
    const out = await render(box, draw, [renderer, {}]);
    const ten = await render(box, draw, [
      renderer,
      {shapeConfig: {Path: {labelConfig: {fontSize: 10}}}},
    ]);
    assert.strictEqual(out.names.length, 5);
    assert.ok(
      out.names.every(n => n.curved && n.size === 11),
      JSON.stringify(out.names),
    );
    assert.ok(ten.names.every(n => n.curved && n.size === 10));
    // The curved band is a line of text and its pad: one pixel more at 11px.
    assert.ok(
      Math.abs(ten.radius - out.radius - 1) < 0.01,
      `${ten.radius} vs ${out.radius}`,
    );
    if (renderer === "svg") assert.strictEqual(out.textPaths, 5);
  });

  it(`Chord ${renderer}: names on spokes take the same 11px`, async () => {
    const out = await render(box, draw, [renderer, {labelPosition: "inside"}]);
    assert.strictEqual(out.names.length, 5);
    assert.ok(
      out.names.every(n => !n.curved && n.size === 11),
      JSON.stringify(out.names),
    );
  });
}
