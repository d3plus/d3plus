import {describe, it} from "vitest";
import assert from "node:assert/strict";

import {
  POSTER_SIZE,
  fitSvg,
  fontStack,
  renderPoster,
} from "../src/components/Hero/poster.ts";
import {SCENES} from "../src/components/Hero/scenes.ts";

describe("fitSvg", () => {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="570" height="416" viewBox="0 0 570 416"><rect width="10" height="20"/></svg>';

  it("sizes the root svg to its box and keeps its aspect", () => {
    const fitted = fitSvg(svg);
    assert.match(
      fitted,
      /^<svg [^>]*width="100%" height="100%" viewBox="0 0 570 416" preserveAspectRatio="xMidYMid meet"/,
    );
  });

  it("hides it from assistive technology", () => {
    assert.match(
      fitSvg(svg),
      /^<svg [^>]*aria-hidden="true" focusable="false">/,
    );
  });

  it("leaves the shapes inside alone", () => {
    assert.ok(fitSvg(svg).includes('<rect width="10" height="20"/>'));
  });
});

describe("fontStack", () => {
  it("swaps a default font for the whole default list", () => {
    assert.equal(
      fontStack('<text font-family="Inter">a</text>'),
      `<text font-family="'Inter', 'Helvetica Neue', 'HelveticaNeue', 'Helvetica', 'Arial', sans-serif">a</text>`,
    );
  });

  it("keeps a font the chart chose itself", () => {
    const text = '<text font-family="Georgia">a</text>';
    assert.equal(fontStack(text), text);
  });
});

describe("renderPoster", () => {
  it("draws the first scene to a scalable svg, once", async () => {
    const poster = renderPoster(SCENES[0]);
    assert.equal(renderPoster(SCENES[0]), poster, "reuses the render");
    const svg = await poster;
    assert.match(
      svg,
      new RegExp(`viewBox="0 0 ${POSTER_SIZE.width} ${POSTER_SIZE.height}"`),
    );
    assert.match(svg, /^<svg [^>]*width="100%"/);
    assert.ok(svg.includes("<rect"), "the treemap drew its cells");
    assert.ok(svg.includes("Solar"), "with their labels");
    assert.ok(!svg.includes('font-family="Inter"'), "in the font list");
  }, 60000);
});
