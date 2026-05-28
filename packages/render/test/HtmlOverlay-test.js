import assert from "assert";

import it from "./jsdom.js";
import {SvgRenderer, CanvasRenderer} from "../es/index.js";

function scene(children) {
  return {width: 200, height: 100, root: {type: "group", key: "root", children}};
}

it("SvgRenderer mounts an HtmlOverlay node as a sibling div", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "r", x: 0, y: 0, width: 10, height: 10},
      {
        type: "htmlOverlay",
        key: "o",
        x: 50,
        y: 30,
        html: '<button class="zoom-in">+</button>',
        className: "test-overlay",
      },
    ]),
  );

  const host = container.querySelector(".d3plus-render-overlays");
  assert.ok(host, "overlay host div exists");

  const overlay = host.querySelector(".d3plus-render-overlay");
  assert.ok(overlay, "overlay child div created");
  assert.strictEqual(overlay.style.left, "50px", "left positions absolute");
  assert.strictEqual(overlay.style.top, "30px", "top positions absolute");
  assert.ok(overlay.className.includes("test-overlay"), "className applied");
  assert.strictEqual(
    overlay.querySelector(".zoom-in")?.tagName.toLowerCase(),
    "button",
    "innerHTML parsed",
  );

  // The svg side is still rendered alongside.
  const rect = container.querySelector('rect[data-key="r"]');
  assert.ok(rect, "svg rect coexists with the overlay");

  renderer.destroy();
});

it("HtmlOverlay onMount callback fires with the host element", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});

  let mountEl = null;
  renderer.drawScene(
    scene([
      {
        type: "htmlOverlay",
        key: "btn",
        x: 0,
        y: 0,
        html: '<div class="b">x</div>',
        onMount: el => {
          mountEl = el;
        },
      },
    ]),
  );

  assert.ok(mountEl, "onMount was called");
  assert.strictEqual(mountEl?.className.includes("d3plus-render-overlay"), true);
  assert.strictEqual(
    mountEl?.querySelector(".b")?.textContent,
    "x",
    "host contains the rendered HTML",
  );

  renderer.destroy();
});

it("HtmlOverlay update keys reconciles enter/update/exit", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "htmlOverlay", key: "a", x: 0, y: 0, html: "<i>A</i>"},
      {type: "htmlOverlay", key: "b", x: 10, y: 10, html: "<i>B</i>"},
    ]),
  );
  assert.strictEqual(
    container.querySelectorAll(".d3plus-render-overlay").length,
    2,
    "two overlays on first draw",
  );

  // Drop "a", keep "b" (with updated position), add "c".
  renderer.drawScene(
    scene([
      {type: "htmlOverlay", key: "b", x: 20, y: 20, html: "<i>B*</i>"},
      {type: "htmlOverlay", key: "c", x: 30, y: 30, html: "<i>C</i>"},
    ]),
  );
  const overlays = container.querySelectorAll(".d3plus-render-overlay");
  assert.strictEqual(overlays.length, 2, "exit removed; enter added");
  const bOverlay = Array.from(overlays).find(o => o.textContent === "B*");
  assert.ok(bOverlay, "B updated");
  assert.strictEqual(bOverlay?.style.left, "20px", "B's position updated");

  renderer.destroy();
});

it("CanvasRenderer mounts an HtmlOverlay alongside the canvas", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new CanvasRenderer();
  renderer.mount({container, width: 200, height: 100});

  renderer.drawScene(
    scene([
      {type: "rect", key: "r", x: 0, y: 0, width: 10, height: 10},
      {type: "htmlOverlay", key: "o", x: 5, y: 5, html: "<span>hi</span>"},
    ]),
  );

  const host = container.querySelector(".d3plus-render-overlays");
  assert.ok(host, "overlay host exists on canvas backend too");
  const overlay = host.querySelector(".d3plus-render-overlay");
  assert.strictEqual(
    overlay?.querySelector("span")?.textContent,
    "hi",
    "canvas backend hosts the same HtmlOverlay content",
  );
  // Canvas itself is also present.
  assert.ok(container.querySelector("canvas"), "canvas coexists with overlay");

  renderer.destroy();
});

it("Inherited group transforms offset the overlay's mount position", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const renderer = new SvgRenderer();
  renderer.mount({container, width: 200, height: 100});

  renderer.drawScene({
    width: 200,
    height: 100,
    root: {
      type: "group",
      key: "root",
      children: [
        {
          type: "group",
          key: "outer",
          transform: {x: 40, y: 20},
          children: [
            {
              type: "htmlOverlay",
              key: "o",
              x: 5,
              y: 7,
              html: "<i>x</i>",
            },
          ],
        },
      ],
    },
  });

  const overlay = container.querySelector(".d3plus-render-overlay");
  // x = 40 (group) + 5 (overlay) = 45; y = 20 + 7 = 27.
  assert.strictEqual(overlay?.style.left, "45px", "group tx applied");
  assert.strictEqual(overlay?.style.top, "27px", "group ty applied");

  renderer.destroy();
});
