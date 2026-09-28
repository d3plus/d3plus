import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `minimapFeature` (issue #81) renders a small overview + draggable
    viewport box underneath the zoom-control panel, hidden at the chart's
    natural 1x view and shown once zoomed in. It's driven entirely by the
    live d3-zoom transform inside the panel's `onUpdate`, so a pan/zoom/drag
    tick updates it without a full re-render — these tests drive it through
    real DOM events in a browser, the same way `zoom-controls-test.js` does.
*/
after(async () => {
  await closeBrowser();
});

it("minimap is hidden at 1x and appears once zoomed in, sized to match the zoom-control panel", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}, {id: "z", value: 1}];
        const viz = new window.d3plus.Treemap().select("#s").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        const visible = el => Boolean(el) && parseFloat(window.getComputedStyle(el).opacity) > 0.5;
        viz.render(() => {
          const before = document.querySelector("#s .d3plus-minimap");
          const beforeVisible = visible(before);

          document.querySelector("#s .zoom-in").click();

          const after = document.querySelector("#s .d3plus-minimap");
          const afterVisible = visible(after);
          const controls = [...document.querySelectorAll("#s .zoom-control")].map(b => b.getBoundingClientRect());
          const mmRect = after.getBoundingClientRect();
          const viewport = document.querySelector("#s .d3plus-minimap-viewport").getBoundingClientRect();

          resolve({
            beforeVisible,
            afterVisible,
            controlsWidth: Math.max(...controls.map(b => b.right)) - Math.min(...controls.map(b => b.left)),
            controlsBottom: Math.max(...controls.map(b => b.bottom)),
            mmWidth: mmRect.width,
            mmTop: mmRect.top,
            svgTop: document.querySelector("#s svg").getBoundingClientRect().top,
            viewportFrac: viewport.width / mmRect.width,
            scale: viz._zoomTransform.scale,
          });
        });
      }),
  );

  assert.strictEqual(out.beforeVisible, false, "minimap hidden at the default 1x view");
  assert.strictEqual(out.afterVisible, true, "minimap visible once zoomed in");
  assert.ok(Math.abs(out.mmWidth - out.controlsWidth) < 20, `minimap width matches the zoom-control panel's width (mm=${out.mmWidth}, controls=${out.controlsWidth})`);
  assert.ok(out.mmTop >= out.controlsBottom - out.svgTop + (out.svgTop - 1), "minimap sits underneath the zoom-control panel");
  assert.ok(Math.abs(out.viewportFrac - 1 / out.scale) < 0.05, "viewport box is sized to 1/scale of the minimap");
});

it("dragging the minimap's viewport box pans the chart, and Cmd/Ctrl+wheel over it zooms", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}, {id: "z", value: 1}];
        const viz = new window.d3plus.Treemap().select("#s").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        viz.render(() => {
          document.querySelector("#s .zoom-in").click();
          document.querySelector("#s .zoom-in").click();
          const beforeDrag = {...viz._zoomTransform};

          const vp = document.querySelector("#s .d3plus-minimap-viewport");
          const box = vp.getBoundingClientRect();
          const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
          const at = (type, x, y) =>
            vp.dispatchEvent(new window.PointerEvent(type, {
              bubbles: true, cancelable: true, pointerId: 1, clientX: x, clientY: y,
            }));
          at("pointerdown", cx, cy);
          at("pointermove", cx + 8, cy + 5);
          at("pointerup", cx + 8, cy + 5);
          const afterDrag = {...viz._zoomTransform};

          const mm = document.querySelector("#s .d3plus-minimap");
          const mmBox = mm.getBoundingClientRect();
          mm.dispatchEvent(new window.WheelEvent("wheel", {
            bubbles: true, cancelable: true,
            clientX: mmBox.left + mmBox.width / 2, clientY: mmBox.top + mmBox.height / 2,
            deltaY: -200, ctrlKey: true,
          }));
          const afterWheel = {...viz._zoomTransform};
          const label = document.querySelector("#s .d3plus-minimap-label").textContent;

          resolve({beforeDrag, afterDrag, afterWheel, label});
        });
      }),
  );

  assert.strictEqual(out.beforeDrag.scale, out.afterDrag.scale, "dragging the viewport box pans without changing scale");
  assert.ok(out.beforeDrag.x !== out.afterDrag.x || out.beforeDrag.y !== out.afterDrag.y, "dragging the viewport box changed the pan position");
  assert.ok(out.afterWheel.scale > out.afterDrag.scale, "Cmd/Ctrl + wheel over the minimap zoomed in further");
  assert.ok(/^\d+(\.\d)?x$/.test(out.label), `zoom label reads as "Nx" (got "${out.label}")`);
});

it("clicking the minimap's outer box jumps there, and double-clicking resets the zoom", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}, {id: "z", value: 1}];
        const viz = new window.d3plus.Treemap().select("#s").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        viz.render(() => {
          document.querySelector("#s .zoom-in").click();
          document.querySelector("#s .zoom-in").click();
          const beforeClick = {...viz._zoomTransform};

          const mm = document.querySelector("#s .d3plus-minimap");
          const box = mm.getBoundingClientRect();
          // A corner, well away from the (centered) viewport box, so the
          // click lands on the background rather than the draggable box.
          const x = box.left + box.width * 0.9, y = box.top + box.height * 0.1;
          mm.dispatchEvent(new window.MouseEvent("click", {bubbles: true, cancelable: true, clientX: x, clientY: y}));
          const afterClick = {...viz._zoomTransform};

          mm.dispatchEvent(new window.MouseEvent("dblclick", {bubbles: true, cancelable: true, clientX: x, clientY: y}));
          const afterDblClick = {...viz._zoomTransform};

          resolve({beforeClick, afterClick, afterDblClick});
        });
      }),
  );

  assert.strictEqual(out.beforeClick.scale, out.afterClick.scale, "clicking the background re-centers without changing scale");
  assert.ok(out.beforeClick.x !== out.afterClick.x || out.beforeClick.y !== out.afterClick.y, "clicking the background jumped the pan position");
  assert.deepStrictEqual(out.afterDblClick, {x: 0, y: 0, scale: 1}, "double-clicking resets to the identity transform");
});

it("arrow keys pan the chart when the viewport box is focused", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}, {id: "z", value: 1}];
        const viz = new window.d3plus.Treemap().select("#s").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        viz.render(() => {
          document.querySelector("#s .zoom-in").click();
          const before = {...viz._zoomTransform};

          const vp = document.querySelector("#s .d3plus-minimap-viewport");
          resolve({
            focusable: vp.tabIndex === 0,
            before,
            after: (() => {
              vp.dispatchEvent(new window.KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowRight"}));
              return {...viz._zoomTransform};
            })(),
            shiftAfter: (() => {
              vp.dispatchEvent(new window.KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "ArrowDown", shiftKey: true}));
              return {...viz._zoomTransform};
            })(),
            ignoresOtherKeys: (() => {
              const before2 = {...viz._zoomTransform};
              vp.dispatchEvent(new window.KeyboardEvent("keydown", {bubbles: true, cancelable: true, key: "a"}));
              return JSON.stringify(before2) === JSON.stringify(viz._zoomTransform);
            })(),
          });
        });
      }),
  );

  assert.strictEqual(out.focusable, true, "the viewport box is keyboard-focusable");
  assert.strictEqual(out.before.scale, out.after.scale, "an arrow key pans without changing scale");
  assert.notStrictEqual(out.before.x, out.after.x, "ArrowRight moved the pan position");
  assert.ok(out.ignoresOtherKeys, "a non-arrow key is ignored");
});

it("minimapClassName is applied to the outer box, viewport box, and label", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}];
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .minimapClassName("my-mm")
          .zoomMax(16)
          .data(data)
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz.render(() => {
          document.querySelector("#s .zoom-in").click();
          resolve({
            outer: document.querySelector("#s .d3plus-minimap").className,
            viewport: document.querySelector("#s .d3plus-minimap-viewport").className,
            label: document.querySelector("#s .d3plus-minimap-label").className,
          });
        });
      }),
  );

  assert.ok(out.outer.includes("my-mm"), `outer box carries the custom class (got "${out.outer}")`);
  assert.ok(out.viewport.includes("my-mm"), `viewport box carries the custom class (got "${out.viewport}")`);
  assert.ok(out.label.includes("my-mm"), `label carries the custom class (got "${out.label}")`);
});

it("minimap(false) hides the panel even while zoomed, and zoom(false) implies no minimap either", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}];
        const a = new window.d3plus.Treemap().select("#a").minimap(false).zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        const b = new window.d3plus.Treemap().select("#b").zoom(false).zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        a.render(() => {
          document.querySelector("#a .zoom-in").click();
          b.render(() => {
            resolve({
              aPanel: document.querySelectorAll("#a .d3plus-minimap").length,
              bPanel: document.querySelectorAll("#b .d3plus-minimap").length,
            });
          });
        });
      }),
  );

  assert.strictEqual(out.aPanel, 0, "minimap(false) renders no minimap panel, even while zoomed in");
  assert.strictEqual(out.bPanel, 0, "zoom(false) implies no minimap panel either");
});

it("the minimap works on a Plot-family chart, whose zoom rescales axes rather than the picture", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [];
        for (let x = 0; x < 10; x++) data.push({id: "a", x, y: 10 + x * 2});
        const viz = new window.d3plus.LinePlot().select("#s").zoomMax(16).data(data).groupBy("id").x("x").y("y").duration(0);
        const visible = el => Boolean(el) && parseFloat(window.getComputedStyle(el).opacity) > 0.5;
        viz.render(() => {
          const before = document.querySelector("#s .d3plus-minimap");
          const beforeVisible = visible(before);
          document.querySelector("#s .zoom-in").click();
          const after = document.querySelector("#s .d3plus-minimap");
          const rect = after.getBoundingClientRect();
          const viewport = document.querySelector("#s .d3plus-minimap-viewport").getBoundingClientRect();
          resolve({
            beforeVisible,
            afterVisible: visible(after),
            hasSize: rect.width > 0 && rect.height > 0,
            viewportFrac: viewport.width / rect.width,
            picture: viz._zoomTransform,
          });
        });
      }),
  );

  assert.strictEqual(out.beforeVisible, false, "minimap hidden at 1x on a Plot chart too");
  assert.strictEqual(out.afterVisible, true, "minimap appears once a Plot chart is zoomed in");
  assert.ok(out.hasSize, "minimap has a real size");
  assert.ok(Math.abs(out.viewportFrac - 0.5) < 0.05, "viewport box reflects the live d3-zoom scale (2x), even though Plot clears the picture transform");
  assert.strictEqual(out.picture, undefined, "Plot's zoom rescales axes — no picture-zoom transform");
});
