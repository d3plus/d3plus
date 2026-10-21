import {it} from "vitest";
import assert from "assert";
import {Legend} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("Legend", async () => {
  await new Promise(cb => {
    new Legend().render(cb);
  });

  assert.strictEqual(
    document.getElementsByTagName("svg").length,
    1,
    "automatically added <svg> element to page",
  );
  assert.strictEqual(
    document.getElementsByClassName("d3plus-Legend").length,
    1,
    "created <g> container element",
  );
});
