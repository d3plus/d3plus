import {OffscreenCanvas} from "./canvas.js";

// Text measurement (pretext, via @d3plus/dom) reads a global OffscreenCanvas.
globalThis.OffscreenCanvas ??= OffscreenCanvas;
