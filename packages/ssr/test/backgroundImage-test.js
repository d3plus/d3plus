import assert from "assert";
import {createCanvas} from "@napi-rs/canvas";
import {Pie, Treemap} from "@d3plus/core";
import {renderToCanvas, renderToStaticSVG} from "../es/index.js";

const data = [
  {id: "a", value: 5},
  {id: "b", value: 3},
  {id: "c", value: 8},
];

/** A solid magenta PNG as a data URI (no network). */
function magenta() {
  const c = createCanvas(4, 4);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(0, 0, 4, 4);
  return c.toDataURL("image/png");
}

it("renderToStaticSVG draws shapeConfig.backgroundImage clipped to each shape", async () => {
  const href = magenta();
  const svg = await renderToStaticSVG(
    new Treemap().data(data).groupBy("id").shapeConfig({backgroundImage: d => (d.id === "c" ? href : false)}),
    {width: 400, height: 300},
  );
  const images = svg.match(/<image [^>]*>/g) || [];
  assert.strictEqual(images.length, 1, "one image, for the one datum that has a URL");
  assert.ok(images[0].includes(href), "image uses the datum's URL");
  assert.ok(/<g [^>]*data-key="treemap-c-bgimage"[^>]*clip-path="url\(#/.test(svg), "image group is clipped");
  assert.ok(svg.indexOf("treemap-c-bgimage") < svg.lastIndexOf("<text"), "labels follow the image");
});

it("renderToCanvas paints backgroundImage inside the shapes", async () => {
  const href = magenta();
  const count = async viz => {
    const canvas = await renderToCanvas(viz, {width: 300, height: 200, pixelRatio: 1});
    const {data: px} = canvas.getContext("2d").getImageData(0, 0, 300, 200);
    let n = 0;
    for (let i = 0; i < px.length; i += 4)
      if (px[i] > 230 && px[i + 1] < 30 && px[i + 2] > 230) n++;
    return n / (300 * 200);
  };
  const withImage = await count(new Pie().data(data).groupBy("id").value("value").shapeConfig({Path: {backgroundImage: href}}));
  const without = await count(new Pie().data(data).groupBy("id").value("value"));
  assert.ok(withImage > 0.3, `the wedges are filled with the image (${withImage})`);
  assert.strictEqual(without, 0, "nothing magenta without an image");
});
