import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {CHROME_SELECTORS, resetChromeBoxes} from "../../src/charts/viz/resetChromeBoxes.ts";

useJsdom();

/**
    `resetChromeBoxes(viz)` registers the chart chrome's wrapper selectors
    with `@d3plus/render`'s box-model reset in the document holding the
    chart; every selector carries one class's worth of specificity, so a
    page rule naming the same class still wins.
*/

it("registers every chrome selector in the chart's document", () => {
  const container = document.body.appendChild(document.createElement("div"));
  const svg = container.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "svg"));
  resetChromeBoxes({_select: {node: () => svg}});
  const style = document.head.querySelector("style[data-d3plus-box-reset]");
  assert.ok(style, "a reset sheet is added");
  for (const selector of CHROME_SELECTORS)
    assert.ok(style.textContent.includes(selector), `registers ${selector}`);
});

it("does nothing before the chart has an element", () => {
  resetChromeBoxes({_select: undefined});
  assert.strictEqual(document.head.querySelector("style[data-d3plus-box-reset]"), null);
});

it("scopes every unprefixed class to the d3plus panels with zero specificity", () => {
  for (const selector of CHROME_SELECTORS) {
    const classes = selector.replace(/:where\([^)]*\)/g, "").match(/\.[\w-]+/g) || [];
    assert.strictEqual(classes.length, 1, `${selector} has a single class outside :where()`);
    if (!classes[0].startsWith(".d3plus-"))
      assert.ok(selector.startsWith(":where("), `${selector} is scoped to the d3plus panels`);
  }
});
