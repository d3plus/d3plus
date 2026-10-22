import {it} from "vitest";
import assert from "assert";

import {useJsdom} from "~test/jsdom.js";
import {SvgRenderer, CanvasRenderer, resetInjectedBoxes} from "../index.ts";
import {alignOverlayHost} from "../src/overlay.ts";

useJsdom({augment: false});

const resetStyles = root => [...root.querySelectorAll("style[data-d3plus-box-reset]")];

it("resetInjectedBoxes puts one reset sheet first in <head>", () => {
  const page = document.createElement("style");
  page.textContent = "div {padding: 25px}";
  document.head.appendChild(page);
  const node = document.body.appendChild(document.createElement("div"));

  resetInjectedBoxes(node, [".a", ".b"]);
  resetInjectedBoxes(node, [".b", ".c"]);

  const styles = resetStyles(document);
  assert.strictEqual(styles.length, 1, "a single sheet, shared by every call");
  assert.strictEqual(document.head.firstChild, styles[0], "ahead of the page's stylesheets");
  const css = styles[0].textContent;
  for (const s of [".a", ".b", ".c"]) assert.ok(css.includes(s), `registers ${s}`);
  assert.strictEqual(css.match(/\.b/g).length, 1, "a selector registered twice is listed once");
  for (const prop of ["margin", "padding", "border", "box-sizing"])
    assert.ok(css.includes(`${prop}: revert`), `reverts ${prop}`);
});

it("resetInjectedBoxes leaves the sheet alone when nothing new registers", () => {
  const node = document.body.appendChild(document.createElement("div"));
  resetInjectedBoxes(node, [".a"]);
  const style = resetStyles(document)[0];
  const css = style.textContent;
  style.textContent = `${css}\n/* marker */`;
  resetInjectedBoxes(node, [".a"]);
  assert.ok(style.textContent.endsWith("/* marker */"), "not rewritten");
});

it("resetInjectedBoxes goes into the shadow root holding the node", () => {
  const holder = document.body.appendChild(document.createElement("div"));
  const shadow = holder.attachShadow({mode: "open"});
  const node = shadow.appendChild(document.createElement("div"));
  resetInjectedBoxes(node, [".a"]);
  assert.strictEqual(resetStyles(shadow).length, 1, "the shadow root gets its own sheet");
  assert.strictEqual(shadow.firstChild, resetStyles(shadow)[0], "first in the shadow root");
  assert.strictEqual(resetStyles(document).length, 0, "the document's head is untouched");
});

it("resetInjectedBoxes ignores a detached node", () => {
  resetInjectedBoxes(document.createElement("div"), [".a"]);
  resetInjectedBoxes(null, [".a"]);
  assert.strictEqual(resetStyles(document).length, 0);
});

it("alignOverlayHost fits the host to its container's content box", () => {
  const container = document.body.appendChild(document.createElement("div"));
  container.style.padding = "5px 6px 7px 8px";
  const host = container.appendChild(document.createElement("div"));
  alignOverlayHost(host);
  assert.deepStrictEqual(
    [host.style.top, host.style.right, host.style.bottom, host.style.left],
    ["5px", "6px", "7px", "8px"],
  );
  container.style.padding = "0";
  alignOverlayHost(host);
  assert.deepStrictEqual(
    [host.style.top, host.style.right, host.style.bottom, host.style.left],
    ["0px", "0px", "0px", "0px"],
    "follows a padding change",
  );
});

for (const Renderer of [SvgRenderer, CanvasRenderer]) {
  it(`${Renderer.name} guards its overlay host and re-aligns it on draw`, () => {
    const container = document.body.appendChild(document.createElement("div"));
    const renderer = new Renderer();
    renderer.mount({container, width: 200, height: 100});
    const host = container.querySelector(".d3plus-render-overlays");
    const css = resetStyles(document)[0]?.textContent || "";
    assert.ok(css.includes(".d3plus-render-overlays"), "the host is guarded");
    assert.ok(css.includes(".d3plus-render-overlay,") || css.includes(".d3plus-render-overlay "), "each overlay is guarded");
    assert.strictEqual(host.style.top, "0px");

    container.style.padding = "12px";
    renderer.drawScene({
      width: 200,
      height: 100,
      root: {type: "group", key: "root", children: [{type: "htmlOverlay", key: "o", x: 0, y: 0, html: "x"}]},
    });
    assert.strictEqual(host.style.top, "12px", "aligned to the new padding");
    assert.strictEqual(host.style.left, "12px");
  });
}
