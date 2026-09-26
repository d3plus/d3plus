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

it("shows match-count feedback (`-/total` while typing, `N/total` after stepping) and reserves its layout space while empty", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "Apple", value: 10}, {id: "Apricot", value: 8}, {id: "Banana", value: 20}])
          .groupBy("id")
          .sum("value")
          .duration(0);
        viz.render(() => {
          const countEl = document.querySelector("#s .search-count");
          const beforeTyping = countEl.style.visibility;
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "ap";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          window.setTimeout(() => {
            const afterTyping = {text: countEl.textContent, visibility: countEl.style.visibility};
            input.dispatchEvent(new window.KeyboardEvent("keydown", {key: "Enter", bubbles: true, cancelable: true}));
            window.setTimeout(() => {
              resolve({
                beforeTyping,
                afterTyping,
                afterEnter: countEl.textContent,
              });
            }, 400);
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.beforeTyping, "hidden", "count feedback reserves space but stays invisible with no term");
  assert.strictEqual(out.afterTyping.text, "-/2", "2 matches (Apple, Apricot) found, no current position yet");
  assert.strictEqual(out.afterTyping.visibility, "visible", "count feedback becomes visible once there's a term");
  assert.strictEqual(out.afterEnter, "1/2", "Enter steps to the first match");
});

it("Enter/Shift+Enter cycle through matches (wrapping) and pan/zoom the current one into view", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [];
        for (let i = 0; i < 8; i++) data.push({id: `apple-${i}`, value: 10 + i});
        const viz = new window.d3plus.Treemap().select("#s").data(data).groupBy("id").sum("value").duration(0);
        viz.render(() => {
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "apple";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          const enter = shift => input.dispatchEvent(new window.KeyboardEvent("keydown", {key: "Enter", shiftKey: shift, bubbles: true, cancelable: true}));
          window.setTimeout(() => {
            enter(false);
            window.setTimeout(() => {
              const first = {count: document.querySelector("#s .search-count").textContent, transform: viz._zoomTransform};
              enter(false);
              window.setTimeout(() => {
                const second = {count: document.querySelector("#s .search-count").textContent, transform: viz._zoomTransform};
                enter(true); // back to the first match
                window.setTimeout(() => {
                  resolve({
                    first,
                    second,
                    backToFirstCount: document.querySelector("#s .search-count").textContent,
                  });
                }, 400);
              }, 400);
            }, 400);
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.first.count, "1/8", "first Enter steps to match 1 of 8");
  assert.ok(out.first.transform, "first Enter pans/zooms (a zoom transform is set)");
  assert.strictEqual(out.second.count, "2/8", "second Enter steps to match 2");
  assert.notDeepStrictEqual(out.second.transform, out.first.transform, "each match pans to a different position");
  assert.strictEqual(out.backToFirstCount, "1/8", "Shift+Enter from match 2 wraps back to match 1");
});

it("the clear button empties the term, restores the prior highlight, and refocuses the input", async function () {
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
          .highlight(d => d.id === "Banana")
          .duration(0);
        viz.render(() => {
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "apple";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          window.setTimeout(() => {
            const clearBtn = document.querySelector("#s .search-clear");
            const wasVisible = clearBtn.style.visibility;
            clearBtn.click();
            window.setTimeout(() => {
              resolve({
                wasVisible,
                value: input.value,
                isFocused: document.activeElement === input,
                stillOpen: viz._searchOpen,
                matchesBanana: viz._highlight ? viz._highlight({id: "Banana"}, 0) : null,
              });
            }, 50);
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.wasVisible, "visible", "clear button is visible once there's a term");
  assert.strictEqual(out.value, "", "clicking clear empties the input");
  assert.ok(out.isFocused, "clicking clear refocuses the input");
  assert.ok(out.stillOpen, "clearing doesn't close the box");
  assert.strictEqual(out.matchesBanana, true, "clearing restores the highlight(d => d.id === 'Banana') set before search opened");
});

it(".searchAccessor() overrides what the typed term matches against", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([{id: "X", secret: "banana-code", value: 5}, {id: "Y", secret: "nope", value: 5}])
          .groupBy("id")
          .sum("value")
          .searchAccessor(d => d.secret)
          .duration(0);
        viz.render(() => {
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "banana";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          window.setTimeout(() => {
            resolve({
              matchesX: viz._highlight({id: "X", secret: "banana-code"}, 0),
              matchesY: viz._highlight({id: "Y", secret: "nope"}, 1),
            });
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.matchesX, true, "matches the custom accessor's field, not the label, for X");
  assert.strictEqual(out.matchesY, false, "Y's secret field doesn't contain the term");
});

it("search term/open state and the highlight survive a drill-down re-render", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Treemap()
          .select("#s")
          .data([
            {parent: "Fruit", id: "Apple", value: 10},
            {parent: "Fruit", id: "Banana", value: 20},
            {parent: "Veg", id: "Carrot", value: 5},
          ])
          .groupBy(["parent", "id"])
          .sum("value")
          .duration(0);
        viz.render(() => {
          document.querySelector("#s .search-toggle").click();
          const input = document.querySelector("#s .search-input");
          input.value = "apple";
          input.dispatchEvent(new window.Event("input", {bubbles: true}));
          window.setTimeout(() => {
            // Simulate drilling into "Fruit" the way click.shape does: push
            // history + a narrower filter, then a full re-render.
            viz._history.push({depth: viz.schema.depth, filter: viz.schema.filter});
            viz.config({depth: 1, filter: (d) => d.parent === "Fruit"}).render(() => {
              const newInput = document.querySelector("#s .search-input");
              resolve({
                sameInputValue: newInput.value,
                stillOpen: viz._searchOpen,
                backButtonPresent: !!document.querySelector("#s .back-control"),
                matchesApple: viz._highlight ? viz._highlight({id: "Apple"}, 0) : null,
                matchesBanana: viz._highlight ? viz._highlight({id: "Banana"}, 0) : null,
              });
            });
          }, 50);
        });
      }),
  );

  assert.strictEqual(out.sameInputValue, "apple", "search term survives the drill-down re-render");
  assert.ok(out.stillOpen, "search box stays open across the drill-down");
  assert.ok(out.backButtonPresent, "back button now appears alongside search, post-drill");
  assert.strictEqual(out.matchesApple, true, "highlight still matches Apple after drilling");
  assert.strictEqual(out.matchesBanana, false, "highlight still excludes Banana after drilling");
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
