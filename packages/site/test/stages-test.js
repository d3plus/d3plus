import {describe, it} from "vitest";
import assert from "node:assert/strict";
import {Tooltip} from "@d3plus/core";

import {STAGES} from "../src/components/Playground/stages.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

// jsdom has no animation frames; a timer stands in.
globalThis.requestAnimationFrame ??= callback => setTimeout(callback, 16);
globalThis.cancelAnimationFrame ??= id => clearTimeout(id);

describe("Tooltip stage", () => {
  it("points the tooltip at an anchor box and shows its data", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const tip = new Tooltip();
    STAGES.Tooltip.draw(tip, host, {
      data: [{title: "Alpha"}],
      background: "#212529",
    });
    const anchor = host.querySelector(".d3p-anchor");
    assert.ok(anchor, "draws an anchor box");
    assert.equal(tip.parent(), host);
    assert.deepEqual(tip.data(), [{title: "Alpha"}]);
    assert.equal(tip.position()(), anchor, "points at the anchor");
  });

  it("uses the config's own position", () => {
    const host = document.createElement("div");
    const tip = new Tooltip();
    const position = () => [10, 20];
    STAGES.Tooltip.draw(tip, host, {data: [], position});
    assert.equal(tip.position(), position);
  });

  it("clears the tooltip and its anchor", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const tip = new Tooltip();
    STAGES.Tooltip.draw(tip, host, {data: [{title: "Alpha"}]});
    STAGES.Tooltip.clear(tip, host);
    assert.deepEqual(tip.data(), []);
    assert.equal(host.querySelector(".d3p-anchor"), null);
  });
});

describe("Tooltip stage scrolling", () => {
  it("re-renders the tooltip when the page scrolls, until cleared", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const tip = new Tooltip();
    STAGES.Tooltip.draw(tip, host, {data: [{title: "Alpha"}]});
    let renders = 0;
    const render = tip.render.bind(tip);
    tip.render = (...args) => {
      renders++;
      return render(...args);
    };
    const frame = () => new Promise(r => requestAnimationFrame(r));
    window.dispatchEvent(new Event("scroll"));
    window.dispatchEvent(new Event("scroll"));
    await frame();
    assert.equal(renders, 1, "once per frame");
    STAGES.Tooltip.clear(tip, host);
    renders = 0;
    window.dispatchEvent(new Event("scroll"));
    await frame();
    assert.equal(renders, 0, "stops after clear");
  });
});
