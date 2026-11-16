import {it} from "vitest";
import assert from "assert";
import {WordCloud} from "@d3plus/core";
import {renderToStaticPNG, renderToStaticSVG} from "../index.ts";

const data = [
  {id: "data", value: 120},
  {id: "chart", value: 80},
  {id: "draw", value: 45},
  {id: "scale", value: 30},
  {id: "render", value: 20},
];

/** The share of a mask's box its ink covers. */
const density = s => {
  let ink = 0;
  for (let y = 0; y < s.height; y++)
    for (let x = 0; x < s.inkWidth; x++)
      ink += (s.mask[y * s.cols + (x >> 5)] >>> (31 - (x & 31))) & 1;
  return ink / (s.inkWidth * s.height);
};

it("renderToStaticSVG lays out a WordCloud on glyph masks rasterized in Node", async () => {
  const viz = new WordCloud().data(data);
  const svg = await renderToStaticSVG(viz, {width: 500, height: 300});
  const words = svg.match(/<text [^>]*data-key="wordcloud-[^"]*-text"/g) || [];
  assert.strictEqual(words.length, data.length);
  assert.ok(svg.includes(">data<") && svg.includes(">render<"));
  const fit = viz.ctx.wordCloudFit;
  assert.strictEqual(fit.placed.length, data.length);
  // Glyph masks leave the counters and gaps empty; a measured box would not.
  assert.ok(density(fit.sprites[0]) < 0.8, `${density(fit.sprites[0])}`);
});

it("renderToStaticPNG paints a WordCloud", async () => {
  const png = await renderToStaticPNG(new WordCloud().data(data), {
    width: 300,
    height: 200,
  });
  assert.ok(png.length > 1000, "an image");
});
