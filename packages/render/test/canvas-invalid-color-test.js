import {it} from "vitest";
import assert from "assert";
import * as napi from "@napi-rs/canvas";

import {useJsdom} from "~test/jsdom.js";
import {CanvasRenderer, setCanvasBackend} from "../index.ts";

useJsdom({augment: false});

/**
    A paint color the canvas can't parse (such as Matrix's axis line,
    `stroke: 0`) paints as SVG paints it: no stroke (a context would keep its
    last stroke style, black by default), and a black fill.
*/

function scene(children) {
  return {
    width: 200,
    height: 120,
    root: {type: "group", key: "root", children},
  };
}

/** Installs the napi backend + global Path2D for the duration of `run`. */
async function headless(run) {
  const hadPath2D = Object.prototype.hasOwnProperty.call(globalThis, "Path2D");
  const prevPath2D = globalThis.Path2D;
  globalThis.Path2D = napi.Path2D;
  setCanvasBackend({
    dom: false,
    createCanvas: (w, h) => napi.createCanvas(w, h),
    loadImage: src => napi.loadImage(src),
  });
  try {
    await run();
  } finally {
    setCanvasBackend(null);
    if (hadPath2D) globalThis.Path2D = prevPath2D;
    else delete globalThis.Path2D;
  }
}

/** RGBA of every pixel in the w×h box at (x, y). */
function pixels(renderer, x, y, w, h) {
  const data = renderer
    .toCanvas()
    .getContext("2d")
    .getImageData(x, y, w, h).data;
  const out = [];
  for (let i = 0; i < data.length; i += 4)
    out.push(Array.from(data.slice(i, i + 4)));
  return out;
}

const red = {stroke: "#ff0000", strokeWidth: 6, fill: "#ff0000"};

for (const color of ["0", "false", "not-a-color"]) {
  it(`CanvasRenderer strokes nothing for stroke ${JSON.stringify(color)}`, () =>
    headless(() => {
      const renderer = new CanvasRenderer();
      renderer.mount({width: 200, height: 120, pixelRatio: 1});
      renderer.drawScene(
        scene([
          {type: "path", key: "red", d: "M10,10L190,10", paint: red},
          {
            type: "path",
            key: "bad",
            d: "M10,60L190,60",
            paint: {stroke: color, strokeWidth: 6, fill: "none"},
          },
          {
            type: "rect",
            key: "box",
            x: 20,
            y: 90,
            width: 40,
            height: 20,
            paint: {fill: "#00ff00", stroke: color, strokeWidth: 6},
          },
        ]),
      );
      const line = pixels(renderer, 20, 57, 160, 6);
      assert.ok(
        line.every(([, , , a]) => a === 0),
        "the line paints nothing",
      );
      const edge = pixels(renderer, 30, 87, 20, 2);
      assert.ok(
        edge.every(([, , , a]) => a === 0),
        "the box draws no outline",
      );
      assert.deepStrictEqual(
        pixels(renderer, 40, 100, 1, 1)[0],
        [0, 255, 0, 255],
        "its fill still paints",
      );
      renderer.destroy();
    }));

  it(`CanvasRenderer fills black for fill ${JSON.stringify(color)}`, () =>
    headless(() => {
      const renderer = new CanvasRenderer();
      renderer.mount({width: 200, height: 120, pixelRatio: 1});
      renderer.drawScene(
        scene([
          {type: "path", key: "red", d: "M10,10H60V40H10Z", paint: red},
          {
            type: "rect",
            key: "bad",
            x: 100,
            y: 20,
            width: 40,
            height: 40,
            paint: {fill: color},
          },
          {
            type: "text",
            key: "t",
            x: 0,
            y: 0,
            lines: [{text: "HHHH", x: 20, y: 90, width: 80}],
            font: {size: 30, baseline: "middle"},
            paint: {fill: color},
          },
        ]),
      );
      assert.deepStrictEqual(
        pixels(renderer, 120, 40, 1, 1)[0],
        [0, 0, 0, 255],
        "the rect fills black, as SVG does",
      );
      const glyphs = pixels(renderer, 15, 70, 120, 40).filter(
        ([, , , a]) => a > 200,
      );
      assert.ok(glyphs.length > 20, "the text paints");
      assert.ok(
        glyphs.every(([r]) => r < 60),
        "the text paints black, not the last fill",
      );
      renderer.destroy();
    }));
}
