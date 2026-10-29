import assert from "assert";
import {mountTargetFor} from "../../src/charts/viz/mountTarget.ts";
import {jsdomit} from "~test/jsdom.js";

/** Where each renderer mounts relative to the chart's root svg. */

jsdomit("a canvas mounts beside the root svg, an svg inside it", () => {
  const div = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  div.appendChild(svg);
  assert.strictEqual(mountTargetFor("canvas", svg), div);
  assert.strictEqual(mountTargetFor("svg", svg), svg);
  assert.strictEqual(mountTargetFor("canvas", div), div);
});
