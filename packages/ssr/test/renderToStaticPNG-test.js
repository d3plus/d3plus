import assert from "assert";
import {Treemap} from "@d3plus/core";
import {renderToCanvas, renderToStaticPNG} from "../es/index.js";

const data = [
  {id: "a", value: 5},
  {id: "b", value: 3},
  {id: "c", value: 8},
];

/** PNG file signature. */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

it("renderToStaticPNG returns valid PNG bytes", async () => {
  const png = await renderToStaticPNG(
    new Treemap().data(data).groupBy("id"),
    {width: 400, height: 300},
  );
  assert.ok(png.length > 1000, "non-trivial size");
  PNG_SIGNATURE.forEach((byte, i) =>
    assert.strictEqual(png[i], byte, `PNG signature byte ${i}`),
  );
});

it("pixelRatio scales the raster", async () => {
  const at1 = await renderToStaticPNG(new Treemap().data(data).groupBy("id"), {
    width: 200,
    height: 150,
    pixelRatio: 1,
  });
  const at2 = await renderToStaticPNG(new Treemap().data(data).groupBy("id"), {
    width: 200,
    height: 150,
    pixelRatio: 2,
  });
  assert.ok(at2.length > at1.length, "2x raster is larger than 1x");
});

it("renderToCanvas returns an encodable canvas sized by pixelRatio", async () => {
  const canvas = await renderToCanvas(new Treemap().data(data).groupBy("id"), {
    width: 300,
    height: 200,
    pixelRatio: 2,
  });
  assert.strictEqual(canvas.width, 600, "backing-store width = width * pixelRatio");
  assert.strictEqual(canvas.height, 400, "backing-store height = height * pixelRatio");
  const buf = await canvas.encode("png");
  assert.ok(buf.length > 500, "encodes to PNG");
});

it("renderToStaticPNG restores globals after rendering", async () => {
  await renderToStaticPNG(new Treemap().data(data).groupBy("id"), {
    width: 200,
    height: 150,
  });
  assert.strictEqual(typeof globalThis.document, "undefined");
  assert.strictEqual(typeof globalThis.OffscreenCanvas, "undefined");
});
