import assert from "assert";
import {Geomap} from "@d3plus/core";
import {createCanvas} from "@napi-rs/canvas";
import {renderToStaticPNG, renderToStaticSVG} from "../es/index.js";

const cities = [
  {city: "NYC", coords: [-74, 40.7]},
  {city: "London", coords: [-0.1, 51.5]},
  {city: "Tokyo", coords: [139.7, 35.7]},
];
const geomap = () =>
  new Geomap().data(cities).point(d => d.coords).groupBy("city");

/** A deterministic tile so tests need no network. */
function mockTile() {
  const c = createCanvas(256, 256);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#cde";
  ctx.fillRect(0, 0, 256, 256);
  return c.toBuffer("image/png");
}

it("Geomap vector-only renders points with no tiles and no network", async () => {
  const svg = await renderToStaticSVG(geomap().tiles(false), {
    width: 640,
    height: 400,
  });
  assert.ok((svg.match(/<circle/g) || []).length >= 3, "has point circles");
  assert.strictEqual((svg.match(/<image/g) || []).length, 0, "no tile images");
});

it("Geomap tiled SVG inlines fetched tiles as data URIs", async () => {
  let calls = 0;
  const svg = await renderToStaticSVG(geomap(), {
    width: 640,
    height: 400,
    fetchTile: async () => {
      calls++;
      return mockTile();
    },
  });
  assert.ok(calls > 0, "fetched at least one tile");
  assert.ok((svg.match(/<image/g) || []).length > 0, "emitted tile image nodes");
  assert.ok(svg.includes('href="data:image'), "tiles inlined as data URIs");
  assert.ok(!/href="https?:/.test(svg), "no remote tile references remain");
});

it("Geomap tiled PNG composites tiles into the raster", async () => {
  const png = await renderToStaticPNG(geomap(), {
    width: 640,
    height: 400,
    pixelRatio: 1,
    fetchTile: async () => mockTile(),
  });
  assert.ok(png.length > 1000, "non-trivial raster");
  assert.strictEqual(png[0], 0x89, "valid PNG");
});
