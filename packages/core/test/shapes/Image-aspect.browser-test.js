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
  } else {
    const svg = container.querySelector("svg");
    const raster = document.createElement("img");
    raster.src = `data:image/svg+xml,${encodeURIComponent(
      new XMLSerializer().serializeToString(svg),
    )}`;
    await raster.decode();
    const canvas = document.createElement("canvas");
    canvas.width = sc.width;
    canvas.height = sc.height;
    ctx = canvas.getContext("2d");
    ctx.drawImage(raster, 0, 0);
  }
  const {data} = ctx.getImageData(0, 0, sc.width, sc.height);
  renderer.destroy();
  container.remove();
  return (x, y) => {
    const i = (y * sc.width + x) * 4;
    if (data[i + 3] < 128) return "empty";
    const rgb = [data[i], data[i + 1], data[i + 2]];
    const near = Object.entries(COLORS).find(([, c]) =>
      c.every((v, k) => Math.abs(v - rgb[k]) < 40),
    );
    return near ? near[0] : rgb.join(",");
  };
}

// Sample points inside each box, clear of every quadrant and letterbox edge.
const OFFSETS = [8, 18, 32, 42, 58, 68, 82, 92];

it("Canvas places images like SVG for every preserveAspectRatio", async () => {
  const sc = scene(quadrants());
  const svg = await paint(SvgRenderer, sc);
  const canvas = await paint(CanvasRenderer, sc);
  CASES.forEach((par, i) => {
    const grid = {svg: [], canvas: []};
    for (const dy of OFFSETS)
      for (const dx of OFFSETS) {
        const x = i * (SIZE + GAP) + dx;
        grid.svg.push(svg(x, dy));
        grid.canvas.push(canvas(x, dy));
      }
    assert.deepStrictEqual(grid.canvas, grid.svg, `${par}: Canvas matches SVG`);
  });

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
