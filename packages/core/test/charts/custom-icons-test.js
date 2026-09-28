import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `zoomControlIcons`/`attributionIcon` (drawSteps/zoomControlsMarkup.ts,
    features/attributionFeature.ts): override the built-in inline-SVG zoom
    buttons and attribution badge with raw HTML, or a mount function — the
    escape hatch for a live component (a React tree, say). A mount function
    is called once per fresh button/badge element (not once per redraw): the
    panel's/credit's html only regenerates when its actual content changes
    (locale, brush state, className, credit text), so an unrelated redraw
    (pan, zoom, a data update) must leave a mounted icon untouched, and only
    an actual content change may tear it down (running its returned cleanup)
    and mount fresh.
*/
after(async () => {
  await closeBrowser();
});

it("zoomControlIcons: a string renders as-is; a mount function persists across ordinary redraws and remounts only when the panel's html changes", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        let mounts = 0;
        let cleanups = 0;
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .duration(0)
          .data([{id: "a", value: 3}, {id: "b", value: 2}])
          .groupBy("id")
          .sum("value")
          .zoomControlIcons({
            zoomIn: "<b class=\"my-plus\">PLUS</b>",
            zoomOut: el => {
              mounts++;
              el.textContent = `M${mounts}`;
              return () => { cleanups++; };
            },
          });
        viz.render(() => {
          const stringIcon = document.querySelector(".zoom-in").innerHTML;
          const afterFirst = {mounts, cleanups, text: document.querySelector(".zoom-out").textContent};
          viz.render(() => {
            const afterOrdinary = {mounts, cleanups};
            document.querySelector(".zoom-brush").click();
            viz.render(() => {
              const afterBrush = {
                mounts, cleanups,
                text: document.querySelector(".zoom-out").textContent,
                slotIsFresh: !!document.querySelector(".zoom-out .zoom-control-icon"),
              };
              resolve({stringIcon, afterFirst, afterOrdinary, afterBrush});
            });
          });
        });
      }),
  );

  assert.strictEqual(out.stringIcon, '<b class="my-plus">PLUS</b>', "a string icon renders as raw markup");
  assert.deepStrictEqual(out.afterFirst, {mounts: 1, cleanups: 0, text: "M1"}, "the mount function runs once, with no cleanup yet");
  assert.deepStrictEqual(out.afterOrdinary, {mounts: 1, cleanups: 0}, "an unrelated redraw doesn't remount");
  assert.deepStrictEqual(
    {mounts: out.afterBrush.mounts, cleanups: out.afterBrush.cleanups, text: out.afterBrush.text},
    {mounts: 2, cleanups: 1, text: "M2"},
    "toggling brush mode (which regenerates the whole panel) cleans up the old mount and mounts fresh",
  );
  assert.ok(out.afterBrush.slotIsFresh, "the remounted icon has its own fresh slot element");
});

it("attributionIcon: a string renders as-is; a mount function persists across ordinary redraws and remounts only when the credit changes", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        let mounts = 0;
        let cleanups = 0;
        const viz = new window.d3plus.Treemap()
          .select("#a")
          .duration(0)
          .data([{id: "a", value: 3}])
          .groupBy("id")
          .sum("value")
          .attribution("Short credit")
          .attributionIcon(el => {
            mounts++;
            el.textContent = `A${mounts}`;
            return () => { cleanups++; };
          });
        viz.render(() => {
          const afterFirst = {mounts, cleanups, text: document.querySelector("#a .d3plus-attribution-icon").textContent};
          viz.render(() => {
            const afterOrdinary = {mounts, cleanups};
            viz.attribution("A longer, different credit");
            viz.render(() => {
              const afterChange = {mounts, cleanups, text: document.querySelector("#a .d3plus-attribution-icon").textContent};

              const viz2 = new window.d3plus.Treemap()
                .select("#b")
                .duration(0)
                .data([{id: "a", value: 3}])
                .groupBy("id")
                .sum("value")
                .attribution("Some credit")
                .attributionIcon('<span class="brand">B</span>');
              viz2.render(() => {
                resolve({
                  afterFirst, afterOrdinary, afterChange,
                  stringIcon: document.querySelector("#b .d3plus-attribution-toggle").innerHTML,
                });
              });
            });
          });
        });
      }),
  );

  assert.deepStrictEqual(out.afterFirst, {mounts: 1, cleanups: 0, text: "A1"}, "the mount function runs once");
  assert.deepStrictEqual(out.afterOrdinary, {mounts: 1, cleanups: 0}, "an unrelated redraw doesn't remount");
  assert.deepStrictEqual(out.afterChange, {mounts: 2, cleanups: 1, text: "A2"}, "a changed credit cleans up the old mount and mounts fresh");
  assert.strictEqual(out.stringIcon, '<span class="brand">B</span>', "a string icon renders as raw markup");
});

it("a mount-function zoom icon doesn't get invoked by the panel's off-DOM size measurement", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        let mounts = 0;
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .duration(0)
          .title("A title long enough to need to leave room for the controls")
          .data([{id: "a", value: 3}])
          .groupBy("id")
          .sum("value")
          .zoomControlIcons({zoomIn: () => { mounts++; }});
        // Rendering with a title forces zoomControlsBox() to measure the
        // panel (to reserve space for it) before the panel itself ever
        // reaches the real DOM — the function must not run during that.
        viz.render(() => resolve({mounts, box: viz._zoomControlsBox}));
      }),
  );

  assert.strictEqual(out.mounts, 1, "the real panel mounts exactly once — the off-DOM measurement never invokes the function a second time");
  assert.ok(out.box && out.box.width > 0 && out.box.height > 0, "the panel still measures a real, positive size");
});

it("a long attribution credit with a custom icon still collapses to a badge and expands on click", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:300px;height:200px;"></div>',
    () =>
      new Promise(resolve => {
        const longCredit = "A very long attribution credit that should not fit alongside a 300px-wide chart".repeat(2);
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .duration(0)
          .data([{id: "a", value: 3}])
          .groupBy("id")
          .sum("value")
          .attribution(longCredit)
          .attributionIcon("<span class=\"brand\">B</span>");
        viz.render(() => {
          const before = {
            textVisible: document.querySelector(".d3plus-attribution-text").style.display !== "none",
            badgeVisible: document.querySelector(".d3plus-attribution-toggle").style.display !== "none",
          };
          document.querySelector(".d3plus-attribution-toggle").click();
          resolve({
            before,
            afterClick: document.querySelector(".d3plus-attribution-text").style.display !== "none",
            icon: document.querySelector(".d3plus-attribution-toggle").innerHTML,
          });
        });
      }),
  );

  assert.strictEqual(out.before.textVisible, false, "the long credit starts collapsed");
  assert.strictEqual(out.before.badgeVisible, true, "the badge shows in its place");
  assert.strictEqual(out.afterClick, true, "clicking the badge expands the credit");
  assert.strictEqual(out.icon, '<span class="brand">B</span>', "the custom icon renders inside the badge");
});
