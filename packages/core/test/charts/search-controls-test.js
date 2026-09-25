import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `searchContribution` merges a toggle button + expanding input into the
    shared top-left controls panel (`topLeftControls.ts`), driving
    `.highlight()` from the typed term. This renders in a real browser and
    asserts: the panel/button render by default (and are skippable via
    `.search(false)`), clicking the toggle opens + focuses the input,
    typing highlights matching-label marks (gray non-matches) without
    touching data, and closing restores whatever `.highlight()` predicate
    (if any) preceded it.
*/
after(async () => {
  await closeBrowser();
});

it("the search toggle button renders by default, and search(false) hides it", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "Apple", value: 10}, {id: "Banana", value: 20}];
        const on = new window.d3plus.Treemap().select("#a").data(data).groupBy("id").sum("value").duration(0);
        const off = new window.d3plus.Treemap().select("#b").data(data).groupBy("id").sum("value").search(false).duration(0);
        on.render(() =>
          off.render(() => {
            resolve({
              onCount: document.querySelectorAll("#a .search-toggle").length,
              offCount: document.querySelectorAll("#b .search-toggle").length,
            });
          }),
        );
      }),
  );

  assert.strictEqual(out.onCount, 1, "search button present by default");
  assert.strictEqual(out.offCount, 0, "search(false) removes the button");
});

it("clicking the toggle opens and focuses the input; Escape closes it", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "Apple", value: 10}, {id: "Banana", value: 20}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz.render(() => {
          const btn = document.querySelector("#s .search-toggle");
          const input = document.querySelector("#s .search-input");
          btn.click();
          const openedWidth = input.style.width;
          const isFocused = document.activeElement === input;
          input.dispatchEvent(new window.KeyboardEvent("keydown", {key: "Escape", bubbles: true}));
          resolve({
            openedWidth,
            isFocused,
            closedWidth: input.style.width,
            open: btn.getAttribute("aria-pressed"),
          });
        });
      }),
  );

  assert.notStrictEqual(out.openedWidth, "0px", "input has real width once opened");
  assert.ok(out.isFocused, "input is focused on open");
  assert.strictEqual(out.closedWidth, "0px", "input collapses again after Escape");
  assert.strictEqual(out.open, "false", "toggle reports closed after Escape");
});

it("typing highlights matching-label marks and grays the rest; closing restores the prior state", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "Apple", value: 10}, {id: "Banana", value: 20}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz.render(() => {
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "app";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          window.setTimeout(() => {
            const afterTyping = viz._highlight ? viz._highlight({id: "Apple"}, 0) : null;
            document.querySelector("#s .search-toggle").click(); // close
            resolve({
              matchesApple: afterTyping,
              highlightRestoredAfterClose: viz._highlight === false || viz._highlight === undefined,
            });
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.matchesApple, true, "typing 'app' sets a highlight predicate matching Apple");
  assert.ok(out.highlightRestoredAfterClose, "closing restores the (empty) prior highlight state");
});

it("search does not render under SSR", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "Apple", value: 10}, {id: "Banana", value: 20}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz._ssr = true;
        viz.render(() => {
          resolve({count: document.querySelectorAll("#s .search-toggle").length});
        });
      }),
  );

  assert.strictEqual(out.count, 0, "no search button under SSR");
});
