import {it} from "vitest";
import assert from "assert";
import {ColorScale} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("ColorScale", async () => {
  await new Promise(cb => {
    new ColorScale().render(cb);
  });

  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.getElementsByClassName("d3plus-ColorScale").length,
    1,
    "created <g> container element",
  );
});
