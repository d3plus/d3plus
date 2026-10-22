import {it} from "vitest";
import assert from "assert";
import {selectAll} from "d3-selection";
import {Message} from "../../index.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom();

it("Message", async () => {
  const msg = new Message();

  await new Promise(callback => msg.render({callback}));
  assert.ok(selectAll(".d3plus-Mask").size() === 1, "adds Mask to DOM");
  assert.ok(selectAll(".d3plus-Message").size() === 1, "adds Message to DOM");

  // TODO
  // yield callback => msg.render({callback, mask: false});
  // assert.ok(selectAll(".d3plus-Mask").empty(), "disables mask");
  // yield callback => msg.hide({callback});
  // assert.ok(selectAll(".d3plus-Message").empty(), "removes from DOM");
});
