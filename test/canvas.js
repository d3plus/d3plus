import {createCanvas, GlobalFonts} from "@napi-rs/canvas";

const backing = new WeakMap();

// Skia resolves CSS generic families to one default face, so a page's
// "serif" would measure like its "sans-serif". Map each to an installed face,
// as a browser does.
const generic = {
  serif: ["Times New Roman", "Times", "DejaVu Serif", "Liberation Serif"],
  "sans-serif": ["Helvetica", "Arial", "DejaVu Sans", "Liberation Sans"],
  monospace: ["Menlo", "Courier New", "DejaVu Sans Mono", "Liberation Mono"],
};
const installed = new Set(GlobalFonts.families.map(f => f.family));
for (const [alias, faces] of Object.entries(generic)) {
  const face = faces.find(f => installed.has(f));
  if (face) GlobalFonts.setAlias(face, alias);
}

/**
 * A constructor whose instances are `@napi-rs/canvas` canvases, standing in
 * for the browser's `OffscreenCanvas` (as `@d3plus/ssr` installs it).
 * @private
 */
export function OffscreenCanvas(width, height) {
  return createCanvas(width, height);
}

/**
 * Backs each `<canvas>` in a jsdom window with an `@napi-rs/canvas` canvas
 * (Skia), so `getContext("2d")`, `toDataURL()` and `toBlob()` work without
 * the native `canvas` package. The backing canvas follows the element's
 * `width` and `height`.
 * @param {Window} window
 */
export function installCanvas(window) {
  const proto = window.HTMLCanvasElement.prototype;
  const native = el => {
    let canvas = backing.get(el);
    if (!canvas) {
      canvas = createCanvas(el.width, el.height);
      backing.set(el, canvas);
    }
    return canvas;
  };
  for (const key of ["width", "height"]) {
    const {get, set} = Object.getOwnPropertyDescriptor(proto, key);
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: true,
      get,
      set(value) {
        set.call(this, value);
        const canvas = backing.get(this);
        if (canvas) canvas[key] = get.call(this);
      },
    });
  }
  proto.getContext = function (type) {
    return type === "2d" ? native(this).getContext("2d") : null;
  };
  proto.toDataURL = function (type = "image/png", quality) {
    return native(this).toDataURL(type, quality);
  };
  proto.toBlob = function (callback, type = "image/png", quality) {
    const format = type.replace("image/", "");
    const bytes = native(this).encodeSync(format === "jpg" ? "jpeg" : format, quality);
    setTimeout(() => callback(new window.Blob([bytes], {type})));
  };
}
