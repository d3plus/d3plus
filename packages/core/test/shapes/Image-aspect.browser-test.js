import {it} from "vitest";
import {CanvasRenderer, SvgRenderer} from "@d3plus/render";
import {Image} from "@d3plus/core";
import assert from "~test/browser/assert.js";

/**
    The Canvas backend places an image node's picture where the SVG backend
    does, for every `preserveAspectRatio`: omitted (the Image shape's scene,
    which sets none), an alignment alone, `slice` cropped per its alignment,
    `none`, and a value Chromium rejects. Each box draws the same 40×20
    image, a quadrant per color, so a pixel tells which part of the picture
    landed there, or that the box is empty there. The SVG render is rasterized
    through an `<img>` and sampled at the same points as the Canvas render.
    The Image shape's `preserveAspectRatio` accessor then sets each case, and
    its scene (on both backends) and its own SVG render must match.
*/

const SIZE = 100,
  GAP = 20;
const CASES = [
  undefined,
  "xMinYMin",
  "xMaxYMax slice",
  "none",
  "xMinYMid slice",
  "defer xMaxYMax slice",
];
const COLORS = {
  red: [255, 0, 0],
  green: [0, 255, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
};

/** A 40×20 PNG: red, green / blue, yellow quadrants. */
function quadrants() {
  const canvas = document.createElement("canvas");
  canvas.width = 40;
  canvas.height = 20;
  const ctx = canvas.getContext("2d");
  [
    ["#ff0000", 0, 0],
    ["#00ff00", 20, 0],
    ["#0000ff", 0, 10],
    ["#ffff00", 20, 10],
  ].forEach(([fill, x, y]) => {
    ctx.fillStyle = fill;
    ctx.fillRect(x, y, 20, 10);
  });
  return canvas.toDataURL("image/png");
}

function scene(href) {
  const children = CASES.map((preserveAspectRatio, i) => {
    const box = {x: i * (SIZE + GAP), y: 0, width: SIZE, height: SIZE};
    if (preserveAspectRatio === undefined) {
      const shape = new Image().data([{id: "omitted", ...box, url: href}]);
      return shape.toScene().children[0];
    }
    return {type: "image", key: `case-${i}`, ...box, href, preserveAspectRatio};
  });
  return {
    width: CASES.length * (SIZE + GAP),
    height: SIZE,
    root: {type: "group", key: "root", children},
  };
}

/** Rasterizes an `<svg>` through an `<img>`, returning a 2D context holding it. */
async function rasterize(svg, width, height) {
  const raster = document.createElement("img");
  raster.src = `data:image/svg+xml,${encodeURIComponent(
    new XMLSerializer().serializeToString(svg),
  )}`;
  await raster.decode();
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(raster, 0, 0);
  return ctx;
}

/** Names the color at each point of a `width`×`height` context. */
function sampler(ctx, width, height) {
  const {data} = ctx.getImageData(0, 0, width, height);
  return (x, y) => {
    const i = (y * width + x) * 4;
    if (data[i + 3] < 128) return "empty";
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const near = Object.entries(COLORS).find(([, c]) =>
      c.every((v, k) => Math.abs(v - rgb[k]) < 40),
    );
    return near ? near[0] : rgb.join(",");
  };
}

/** Draws `sc` with `Renderer` and returns its pixels at device ratio 1. */
async function paint(Renderer, sc) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new Renderer();
  renderer.mount({
    container,
    width: sc.width,
    height: sc.height,
    pixelRatio: 1,
  });
  renderer.drawScene(sc);
  let ctx;
  if (Renderer === CanvasRenderer) {
    await renderer.whenSettled();
    ctx = container.querySelector("canvas").getContext("2d");
  } else
    ctx = await rasterize(container.querySelector("svg"), sc.width, sc.height);
  const sample = sampler(ctx, sc.width, sc.height);
  renderer.destroy();
  container.remove();
  return sample;
}

// Sample points inside each box, clear of every quadrant and letterbox edge.
const OFFSETS = [8, 18, 32, 42, 58, 68, 82, 92];

/** The named colors at every sample point of box `i`. */
function grid(sample, i) {
  const out = [];
  for (const dy of OFFSETS)
    for (const dx of OFFSETS) out.push(sample(i * (SIZE + GAP) + dx, dy));
  return out;
}

it("Canvas places images like SVG for every preserveAspectRatio", async () => {
  const sc = scene(quadrants());
  const svg = await paint(SvgRenderer, sc);
  const canvas = await paint(CanvasRenderer, sc);
  CASES.forEach((par, i) =>
    assert.deepStrictEqual(
      grid(canvas, i),
      grid(svg, i),
      `${par}: Canvas matches SVG`,
    ),
  );

  // The SVG layout itself, in each box's corners and center.
  const at = (i, dx, dy) => svg(i * (SIZE + GAP) + dx, dy);
  assert.deepStrictEqual(
    [at(0, 8, 8), at(0, 8, 32), at(0, 92, 68), at(0, 92, 92)],
    ["empty", "red", "yellow", "empty"],
    "omitted: xMidYMid meet letterboxes",
  );
  assert.deepStrictEqual(
    [at(1, 8, 8), at(1, 92, 42), at(1, 92, 58)],
    ["red", "yellow", "empty"],
    "xMinYMin: meet, at the top",
  );
  assert.deepStrictEqual(
    [at(2, 8, 8), at(2, 92, 92)],
    ["green", "yellow"],
    "xMaxYMax slice: crops to the right half",
  );
  assert.deepStrictEqual(
    [at(3, 8, 8), at(3, 92, 92)],
    ["red", "yellow"],
    "none: stretches",
  );
  assert.deepStrictEqual(
    [at(4, 8, 8), at(4, 92, 92)],
    ["red", "blue"],
    "xMinYMid slice: crops to the left half",
  );
  assert.deepStrictEqual(
    [at(5, 8, 8), at(5, 8, 32)],
    ["empty", "red"],
    "an invalid value: xMidYMid meet",
  );
});

it("the Image shape's preserveAspectRatio places images alike on SVG and Canvas", async () => {
  const href = quadrants();
  // Every valid case, set per datum through the shape's accessor.
  const fits = CASES.slice(0, 5);
  const rows = fits.map((fit, i) => ({
    id: `fit-${i}`,
    x: i * (SIZE + GAP),
    y: 0,
    width: SIZE,
    height: SIZE,
    url: href,
    fit,
  }));
  const width = fits.length * (SIZE + GAP);
  const shape = () => new Image().data(rows).preserveAspectRatio(d => d.fit);
  const fromShape = {width, height: SIZE, root: shape().toScene()};

  const reference = await paint(SvgRenderer, scene(href));
  const canvas = await paint(CanvasRenderer, fromShape);
  const svgScene = await paint(SvgRenderer, fromShape);

  // The shape's own SVG render, outside the scene renderers.
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", width);
  svg.setAttribute("height", SIZE);
  document.body.appendChild(svg);
  await new Promise(cb => shape().select(svg).duration(0).render(cb));
  const dom = sampler(await rasterize(svg, width, SIZE), width, SIZE);
  svg.remove();

  fits.forEach((fit, i) => {
    const expected = grid(reference, i);
    assert.deepStrictEqual(grid(canvas, i), expected, `${fit}: Canvas`);
    assert.deepStrictEqual(grid(svgScene, i), expected, `${fit}: SVG scene`);
    assert.deepStrictEqual(grid(dom, i), expected, `${fit}: Image.render()`);
  });

  // A constant applies to every image.
  const constant = await paint(CanvasRenderer, {
    width,
    height: SIZE,
    root: new Image()
      .data(rows)
      .preserveAspectRatio("xMaxYMax slice")
      .toScene(),
  });
  const sliced = grid(reference, 2);
  fits.forEach((fit, i) =>
    assert.deepStrictEqual(
      grid(constant, i),
      sliced,
      `box ${i}: xMaxYMax slice`,
    ),
  );
});
