import {it} from "vitest";
import assert from "assert";
import {JSDOM} from "jsdom";
import saveBlob from "../src/saveBlob.ts";

it("saveBlob downloads through a temporary link and revokes its URL later", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  const {createObjectURL, revokeObjectURL} = URL;
  const timeout = global.setTimeout;
  const revoked = [];
  const timers = [];
  let clicked, revokedAtClick;
  global.document = dom.window.document;
  URL.createObjectURL = () => "blob:fake";
  URL.revokeObjectURL = url => revoked.push(url);
  global.setTimeout = (fn, ms) => timers.push({fn, ms});
  dom.window.document.addEventListener("click", e => {
    e.preventDefault();
    clicked = {href: e.target.href, download: e.target.download, attached: e.target.isConnected};
  });
  try {
    saveBlob(new Blob(["a,b"]), "table.csv");
    revokedAtClick = revoked.slice();
    timers.forEach(t => t.fn());
  } finally {
    global.setTimeout = timeout;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
    delete global.document;
  }
  assert.deepStrictEqual(clicked, {href: "blob:fake", download: "table.csv", attached: true});
  assert.strictEqual(dom.window.document.querySelectorAll("a").length, 0, "the link is removed");
  assert.deepStrictEqual(revokedAtClick, [], "the URL outlives the click");
  assert.strictEqual(timers.length, 1);
  assert.deepStrictEqual(revoked, ["blob:fake"], "then is revoked");
});
