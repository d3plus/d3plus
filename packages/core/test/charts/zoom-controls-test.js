import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `zoomFeature` returns its four zoom-control buttons as an `htmlOverlay`
    panel from `layout()` (the FeatureModule contract: no direct
    `viz._featurePanels` mutation). `runVizPipeline` appends the returned
    panels to `viz._featurePanels`, which `Viz.toScene()` walks into the
    scene graph. This renders a zoom-enabled Network in a real browser and
    asserts the buttons reach the DOM — locking the returned-panel path
    (nothing else in the suite exercises the zoom-control overlay).
*/
after(async () => {
  await closeBrowser();
});

it("Network zoom controls render via the returned feature panel", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Network()
          .select("#s")
          .nodes([
            {id: "a", x: 0, y: 0},
            {id: "b", x: 100, y: 100},
          ])
          .links([{source: "a", target: "b"}])
          .render(() =>
            resolve({
              controls: document.querySelectorAll(".zoom-control").length,
              zoomIn: document.querySelectorAll(".zoom-control.zoom-in").length,
            }),
          );
      }),
  );

  assert.strictEqual(
    out.controls,
    4,
    "four zoom-control buttons rendered (in/out/reset/brush)",
  );
  assert.strictEqual(out.zoomIn, 1, "zoom-in button present");
});

it("any chart gets zoom controls, a wheel zoom anchored under the cursor, and control-button zoom", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div><div id="c" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 3}, {id: "y", value: 2}, {id: "z", value: 1}];
        const plain = new window.d3plus.Pie().select("#b").zoom(false).data(data).groupBy("id").value("value").duration(0);
        // A title claims top margin and Pie centers itself with its own
        // transform — the two offsets a surface-space zoom must be immune to.
        const viz = new window.d3plus.Pie()
          .select("#a")
          .title("Title")
          .zoom(true)
          .zoomMax(16)
          .data(data)
          .groupBy("id")
          .value("value")
          .duration(0);
        plain.render(() => viz.render(() => {
          const svg = document.querySelector("#a svg");
          const box = svg.getBoundingClientRect();
          const P = [150, viz._margin.top + 100];
          const target = document.elementFromPoint(box.left + P[0], box.top + P[1]);
          target.dispatchEvent(new window.WheelEvent("wheel", {
            clientX: box.left + P[0], clientY: box.top + P[1], deltaY: -200, ctrlKey: true, bubbles: true, cancelable: true,
          }));
          const wheel = viz._zoomTransform;
          document.querySelector("#a .zoom-reset").click();
          document.querySelector("#a .zoom-in").click();
          const zoomIn = viz._zoomTransform;
          // A second chart's first programmatic zoom must start from identity
          // (the first chart's zoom can't leak into d3's shared zoomIdentity).
          const other = new window.d3plus.Treemap().select("#c").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
          other.render(() => {
            document.querySelector("#c .zoom-in").click();
            resolve({
              controls: document.querySelectorAll("#a .zoom-control").length,
              plainControls: plain._zoomTransform === undefined && document.querySelectorAll("#b .zoom-control").length,
              P,
              wheel,
              zoomIn,
              otherScale: other._zoomTransform.scale,
            });
          });
        }));
      }),
  );

  assert.strictEqual(out.controls, 4, "zoom controls render on a non-Network/Geomap chart");
  assert.ok(out.wheel && out.wheel.scale > 1, "wheel zooms in");
  // The surface point under the cursor maps to itself: P = P·k + t.
  assert.ok(Math.abs(out.P[0] * (1 - out.wheel.scale) - out.wheel.x) < 0.5, "wheel zoom anchored at cursor x");
  assert.ok(Math.abs(out.P[1] * (1 - out.wheel.scale) - out.wheel.y) < 0.5, "wheel zoom anchored at cursor y");
  assert.strictEqual(out.zoomIn.scale, 2, "zoom-in button doubles the scale from reset");
  assert.strictEqual(out.otherScale, 2, "another chart's zoom starts from identity");
});

it("zoom is on by default, and zoom(false) removes the controls and zoom surface", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () => {
      const data = [{id: "x", value: 3}, {id: "y", value: 2}];
      const treemap = (id, zoom) =>
        new Promise(resolve => {
          const viz = new window.d3plus.Treemap().select(id).data(data).groupBy("id").sum("value");
          if (zoom !== undefined) viz.zoom(zoom);
          viz.render(() => resolve());
        });
      return treemap("#a").then(() => treemap("#b", false)).then(() => ({
        on: document.querySelectorAll("#a .zoom-control").length,
        onSurface: document.querySelectorAll("#a svg.d3plus-zoom").length,
        off: document.querySelectorAll("#b .zoom-control").length,
        offSurface: document.querySelectorAll("#b svg.d3plus-zoom").length,
      }));
    },
  );

  assert.strictEqual(out.on, 4, "controls render by default");
  assert.strictEqual(out.onSurface, 1, "zoom surface mounted by default");
  assert.strictEqual(out.off, 0, "zoom(false) renders no controls");
  assert.strictEqual(out.offSurface, 0, "zoom(false) mounts no zoom surface");
});

it("the default maximum zoom follows the smallest shape (#85), and an explicit zoomMax wins", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () => {
      const network = (size, zoomMax) =>
        new Promise(resolve => {
          const viz = new window.d3plus.Network()
            .select("#s")
            .nodes([{id: "a", x: 0, y: 0}, {id: "b", x: 100, y: 100}])
            .links([{source: "a", target: "b"}])
            .size(() => size).sizeMin(size).sizeMax(size)
            .duration(0);
          if (zoomMax) viz.zoomMax(zoomMax);
          viz.render(() => resolve(viz._zoomBehavior.scaleExtent()[1]));
        });
      return network(80).then(big => network(3).then(small => network(3, 5).then(explicit => ({big, small, explicit}))));
    },
  );

  assert.ok(out.big < 5, `large nodes need little zoom (got ${out.big})`);
  assert.ok(out.small > 30, `small nodes allow deep zoom (got ${out.small})`);
  assert.strictEqual(out.explicit, 5, "explicit zoomMax overrides the automatic value");
});

it("Plot zoom rescales linear axes in place and leaves discrete axes fixed (#780)", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [];
        for (let x = 0; x < 6; x++) data.push({id: "a", x, y: (x + 1) * 2});
        const viz = new window.d3plus.BarChart()
          .select("#s")
          .zoom(true)
          .zoomMax(16)
          .data(data)
          .groupBy("id")
          .x("x")
          .y("y")
          .duration(0);
        viz.render(() => {
          const x0 = viz._xAxis._d3Scale.domain().slice();
          const y0 = viz._yAxis._d3Scale.domain().slice();
          const ct = {...viz._chartTransform};
          // Zoom 2× about a surface point: the y value under it must stay put.
          const P = [200, 150];
          const value = viz._yAxis._d3Scale.invert(P[1] - ct.y);
          document.querySelector(".zoom-reset").click();
          viz._zoomRescale({k: 2, x: P[0] * (1 - 2), y: P[1] * (1 - 2)});
          const zoomed = {
            x: viz._xAxis._d3Scale.domain().slice(),
            y: viz._yAxis._d3Scale.domain().slice(),
            drift: viz._yAxis._d3Scale(value) + ct.y - P[1],
            ct: {...viz._chartTransform},
            clip: viz._chartScene.find(n => n.key === "plot-zoom-content").clip,
            picture: viz._zoomTransform,
          };
          document.querySelector(".zoom-reset").click();
          resolve({x0, y0, zoomed, reset: viz._yAxis._d3Scale.domain().slice(), ct});
        });
      }),
  );

  assert.deepStrictEqual(out.zoomed.x, out.x0, "discrete x axis is unchanged");
  const span = d => Math.abs(d[1] - d[0]);
  assert.ok(Math.abs(span(out.zoomed.y) - span(out.y0) / 2) < 1e-6, "linear y domain halves at 2×");
  assert.ok(Math.abs(out.zoomed.drift) < 1e-6, "the value under the zoom center stays under it");
  assert.deepStrictEqual(out.zoomed.ct, out.ct, "the plot area doesn't move");
  assert.ok(out.zoomed.clip, "zoomed content is clipped to the plot rect");
  assert.strictEqual(out.zoomed.picture, undefined, "no picture-zoom transform");
  assert.deepStrictEqual(out.reset, out.y0, "reset restores the original domain");
});

it("zoom controls pin to the chart's top-right corner and top content wraps short of them", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .title("A long title that would otherwise run underneath the zoom controls")
          .data([{id: "x", value: 3}, {id: "y", value: 2}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz.render(() => {
          const svg = document.querySelector("#s svg").getBoundingClientRect();
          const panel = [...document.querySelectorAll("#s .zoom-control")].map(b => b.getBoundingClientRect());
          const title = document.querySelector('#s [data-key="viz-title"]').getBoundingClientRect();
          resolve({
            panelRight: svg.right - Math.max(...panel.map(b => b.right)),
            panelTop: Math.min(...panel.map(b => b.top)) - svg.top,
            panelLeft: Math.min(...panel.map(b => b.left)),
            panelBottom: Math.max(...panel.map(b => b.bottom)),
            title: {left: title.left, right: title.right, top: title.top},
            svgCenter: svg.left + svg.width / 2,
          });
        });
      }),
  );

  assert.ok(out.panelRight >= 0 && out.panelRight <= 8, `panel hugs the right edge (${out.panelRight}px)`);
  assert.ok(out.panelTop >= 0 && out.panelTop <= 8, `panel hugs the top edge (${out.panelTop}px)`);
  assert.ok(out.title.right <= out.panelLeft, "title stops short of the controls");
  const titleCenter = (out.title.left + out.title.right) / 2;
  assert.ok(Math.abs(titleCenter - out.svgCenter) < 10, "centered title stays centered");
});

it("brush mode ends once a brushed selection zooms, and the toggle reports it", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [];
        for (let i = 0; i < 20; i++) data.push({id: `n${i}`, value: i + 1});
        const viz = new window.d3plus.Treemap().select("#s").zoomMax(16).data(data).groupBy("id").sum("value").duration(0);
        viz.render(() => {
          const btn = document.querySelector("#s .zoom-brush");
          btn.click();
          const pressed = btn.getAttribute("aria-pressed");
          const overlay = document.querySelector("#s g.d3plus-zoom-brush .overlay");
          const box = overlay.getBoundingClientRect();
          const at = (type, x, y, target) =>
            target.dispatchEvent(new window.MouseEvent(type, {
              bubbles: true, cancelable: true, view: window, button: 0, detail: 1,
              clientX: box.left + x, clientY: box.top + y,
            }));
          at("mousedown", 40, 40, overlay);
          at("mousemove", 120, 100, window);
          at("mouseup", 120, 100, window);
          window.setTimeout(() => resolve({
            pressed,
            brushing: viz._brushing,
            after: document.querySelector("#s .zoom-brush").getAttribute("aria-pressed"),
            active: document.querySelector("#s .zoom-brush").classList.contains("active"),
            scale: viz._zoomTransform && viz._zoomTransform.scale,
          }), 100);
        });
      }),
  );

  assert.strictEqual(out.pressed, "true", "toggle reports brush mode on");
  assert.ok(out.scale > 1, "the selection zoomed the chart");
  assert.strictEqual(out.brushing, false, "brush mode ended");
  assert.strictEqual(out.after, "false", "toggle reports brush mode off");
  assert.strictEqual(out.active, false, "toggle drops its active class");
});

it("a rescaled Plot axis labels only nice ticks and stays in place", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [];
        for (let x = 0; x < 10; x++) data.push({id: "a", x, y: 10 + x * 2});
        const viz = new window.d3plus.LinePlot().select("#s").zoomMax(64).data(data).groupBy("id").x("x").y("y").duration(0);
        viz.render(() => {
          const axisX = () => viz._yAxis._outerBounds.x + viz._yAxis._outerBounds.width;
          const before = {x: axisX(), space: viz._yAxis._labelSpace};
          // Deep enough that nice ticks become fractional (wider labels).
          viz._zoomRescale({k: 40, x: 200 * (1 - 40), y: 150 * (1 - 40)});
          const domain = viz._yAxis._d3Scale.domain();
          const ticks = viz._yAxis._visibleTicks.map(Number);
          resolve({before, after: {x: axisX(), space: viz._yAxis._labelSpace}, domain, ticks});
        });
      }),
  );

  assert.strictEqual(out.after.x, out.before.x, "axis line doesn't move");
  assert.strictEqual(out.after.space, out.before.space, "label space stays pinned");
  const [lo, hi] = [Math.min(...out.domain), Math.max(...out.domain)];
  assert.ok(!out.ticks.includes(lo) && !out.ticks.includes(hi), "domain endpoints aren't forced in as ticks");
});

it("zoom leaves page scrolling alone by default, on every chart", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () => {
      const done = viz => new Promise(resolve => viz.duration(0).render(() => resolve(viz)));
      return Promise.all([
        done(new window.d3plus.Treemap().select("#a").zoomMax(16).data([{id: "x", value: 3}, {id: "y", value: 2}]).groupBy("id").sum("value")),
        done(new window.d3plus.Network().select("#b").nodes([{id: "a", x: 0, y: 0}, {id: "b", x: 1, y: 1}]).links([{source: "a", target: "b"}])),
      ]).then(([treemap, network]) => {
        const allows = (viz, type, init = {}) => {
          const filter = viz._zoomBehavior.filter();
          const event = Object.assign({type, ctrlKey: false, metaKey: false, button: 0, deltaY: -100, deltaMode: 0}, init);
          return filter.call(viz._zoomEventTarget.node(), event);
        };
        const touchAction = viz => window.getComputedStyle(viz._zoomEventTarget.node()).touchAction;
        const result = {
          wheel: allows(treemap, "wheel"),
          ctrlWheel: allows(treemap, "wheel", {ctrlKey: true}),
          metaWheel: allows(treemap, "wheel", {metaKey: true}),
          oneFinger: allows(treemap, "touchstart", {touches: [{}]}),
          twoFingers: allows(treemap, "touchstart", {touches: [{}, {}]}),
          restTouchAction: touchAction(treemap),
          networkWheel: allows(network, "wheel"),
          networkTouchAction: touchAction(network),
          mouseRate: treemap._zoomBehavior.wheelDelta()({ctrlKey: true, deltaY: -100, deltaMode: 0}),
          pinchRate: treemap._zoomBehavior.wheelDelta()({ctrlKey: true, deltaY: -4, deltaMode: 0}),
        };
        document.querySelector("#a .zoom-in").click();
        result.zoomedOneFinger = allows(treemap, "touchstart", {touches: [{}]});
        result.zoomedTouchAction = touchAction(treemap);
        return result;
      });
    },
  );

  assert.strictEqual(out.wheel, false, "a plain wheel scrolls the page");
  assert.strictEqual(out.ctrlWheel, true, "Ctrl + wheel zooms");
  assert.strictEqual(out.metaWheel, true, "⌘ + wheel zooms");
  assert.strictEqual(out.oneFinger, false, "one finger scrolls the page at rest");
  assert.strictEqual(out.twoFingers, true, "a two-finger pinch zooms");
  assert.strictEqual(out.restTouchAction, "pan-x pan-y", "the browser keeps one-finger scrolling at rest");
  assert.strictEqual(out.zoomedOneFinger, true, "one finger pans once zoomed in");
  assert.strictEqual(out.zoomedTouchAction, "none", "the chart takes every touch once zoomed in");
  assert.strictEqual(out.networkWheel, false, "Network leaves a plain wheel to the page too");
  assert.strictEqual(out.networkTouchAction, "pan-x pan-y", "Network keeps one-finger page scrolling at rest");
  assert.ok(Math.abs(out.mouseRate - 0.2) < 1e-9, "Ctrl + mouse wheel zooms at the normal rate");
  assert.ok(Math.abs(out.pinchRate - 0.08) < 1e-9, "a trackpad pinch keeps the boosted rate");
});
