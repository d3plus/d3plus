import {it} from "vitest";
import assert from "assert";
import {createCanvas, loadImage} from "@napi-rs/canvas";
import {Image} from "@d3plus/core";
import {makeChart} from "../../core/src/charts/definition/makeChart.ts";
import {renderToStaticPNG, renderToStaticSVG} from "../index.ts";

/** A 40×20 PNG as a data URI: red on the left, blue on the right. */
function halves() {
  const c = createCanvas(40, 20);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ff0000";
  ctx.fillRect(0, 0, 20, 20);
  ctx.fillStyle = "#0000ff";
  ctx.fillRect(20, 0, 20, 20);
  return c.toDataURL("image/png");
}

/**
    A chart that draws one Image shape in a 100×100 box at the chart area's
    origin, with no `preserveAspectRatio`.
*/
const ImageChart = makeChart({
  name: "ImageChart",
  layoutStage: ctx => ctx,
  emit: ({viz}) =>
    new Image()
      .data([
        {id: "img", x: 0, y: 0, width: 100, height: 100, url: viz.ctx.href},
      ])
      .toScene().children,
  ctx: {href: ""},
});

function chart(href) {
  const viz = new ImageChart().data([{id: "img"}]).legend(false);
  viz.ctx.href = href;
  return viz;
}

it("renderToStaticPNG letterboxes an image with no preserveAspectRatio, like SVG", async () => {
  const href = halves();
  const svg = await renderToStaticSVG(chart(href), {width: 300, height: 300});
  const tag = /<image [^>]*>/.exec(svg)?.[0] ?? "";
  assert.ok(tag.includes(href), "the SVG draws the image");
  assert.ok(
    !tag.includes("preserveAspectRatio"),
    "the SVG leaves preserveAspectRatio at its initial value",
  );

  const png = await renderToStaticPNG(chart(href), {
    width: 300,
    height: 300,
    pixelRatio: 1,
  });
  const decoded = await loadImage(png);
  const c = createCanvas(decoded.width, decoded.height);
  const ctx = c.getContext("2d");
  ctx.drawImage(decoded, 0, 0);

  // Find the image's box from its painted pixels: the 2:1 picture fit
  // inside a 100×100 box is 100×50, centered vertically.
  const {data} = ctx.getImageData(0, 0, c.width, c.height);
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let y = 0; y < c.height; y++)
    for (let x = 0; x < c.width; x++) {
      const i = (y * c.width + x) * 4;
      const red = data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60;
      const blue = data[i] < 60 && data[i + 1] < 60 && data[i + 2] > 200;
      if (!red && !blue) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  const width = maxX - minX + 1,
    height = maxY - minY + 1;
  assert.ok(
    Math.abs(width - 100) <= 1,
    `the image spans its box's width (${width})`,
  );
  assert.ok(
    Math.abs(height - 50) <= 1,
    `the image keeps its 2:1 shape (${height}px tall)`,
  );
});
