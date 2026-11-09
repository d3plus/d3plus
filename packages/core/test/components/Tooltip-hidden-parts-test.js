import {it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import {Tooltip} from "../../index.ts";

useJsdom();

/**
    A tooltip part (title, body, footer) set to `false`, `null`, or nothing
    is hidden and left empty, so the tooltip's text never holds "false".
*/

const part = (tip, cat) =>
  (tip._portalEl ?? document.body).querySelector(`.d3plus-tooltip-${cat}`);

it("Tooltip leaves a false, null, or undefined part empty and hidden", () => {
  for (const off of [false, null, undefined]) {
    const tip = new Tooltip()
      .data([{id: "a"}])
      .title("Alpha")
      .body(() => off)
      .footer(() => off)
      .render();
    for (const cat of ["body", "footer"]) {
      const el = part(tip, cat);
      assert.strictEqual(el.innerHTML, "", `${cat} (${off}) is empty`);
      assert.strictEqual(el.style.display, "none", `${cat} (${off}) is hidden`);
    }
    const title = part(tip, "title");
    assert.strictEqual(title.textContent, "Alpha");
    assert.strictEqual(title.style.display, "block");
    assert.ok(!part(tip, "title").parentNode.textContent.includes("false"));
    tip.data([]).render();
  }
});

it("Tooltip still shows a part that turns from false to text", () => {
  const tip = new Tooltip()
    .data([{id: "a"}])
    .footer(false)
    .render();
  assert.strictEqual(part(tip, "footer").innerHTML, "");
  tip.footer("Click to Expand").render();
  assert.strictEqual(part(tip, "footer").textContent, "Click to Expand");
  assert.strictEqual(part(tip, "footer").style.display, "block");
  tip.data([]).render();
});
