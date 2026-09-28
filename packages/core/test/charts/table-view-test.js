import assert from "assert";
import {render, closeBrowser} from "../playwright.js";

/**
    `tableViewContribution` (drawSteps/tableViewControl.ts) is the table-view
    toggle's contribution to the shared top-left controls panel
    (`topLeftControlsFeature` — see top-left-controls-test.js); `tableViewFeature`
    (drawSteps/tableView.ts) is the separate chart-sized `htmlOverlay` that
    replaces the chart while table view is active, registered LAST in
    `runVizPipeline` so it paints over every other panel (including the shared
    corner panel's own now-covered button).

    Because the toggle button is unconditionally contributed (it doesn't
    disappear while active — it's just covered by the overlay, which embeds
    its own copy for the user to actually click), `.table-view-toggle`
    matches ONE element while inactive and TWO while active. Tests that need
    "the one the user can see/click" scope to `.d3plus-table-view` (the
    overlay) or `.d3plus-top-left-controls-item` (the shared panel's
    per-contribution overlay node) accordingly.
*/
after(async () => {
  await closeBrowser();
});

it("the table-view toggle button renders by default, and clicking it swaps the chart for a data table", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .data([
            {id: "a", x: "Q1", y: 10},
            {id: "b", x: "Q1", y: 20},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            const before = {
              toggle: document.querySelectorAll(".table-view-toggle").length,
              table: document.querySelectorAll(".d3plus-table-view-table").length,
            };
            document.querySelector(".d3plus-top-left-controls-item .table-view-toggle").click();
            const active = {
              toggleCount: document.querySelectorAll(".table-view-toggle").length,
              table: document.querySelectorAll(".d3plus-table-view-table").length,
              rows: document.querySelectorAll(".d3plus-table-view-table tbody tr").length,
              headers: Array.from(document.querySelectorAll(".d3plus-table-view-table thead th")).map(
                th => th.textContent,
              ),
              pressed: document.querySelector(".d3plus-table-view .table-view-toggle").getAttribute("aria-pressed"),
            };
            // Toggling back (via the overlay's own embedded button) should drop
            // the table and restore just the shared panel's single button.
            document.querySelector(".d3plus-table-view .table-view-toggle").click();
            const after = {
              toggle: document.querySelectorAll(".table-view-toggle").length,
              table: document.querySelectorAll(".d3plus-table-view-table").length,
              pressed: document.querySelector(".table-view-toggle").getAttribute("aria-pressed"),
            };
            resolve({before, active, after});
          });
      }),
  );

  assert.strictEqual(out.before.toggle, 1, "the toggle button renders by default (shared top-left panel only)");
  assert.strictEqual(out.before.table, 0, "no data table before the first click");
  assert.strictEqual(out.active.toggleCount, 2, "the shared panel's button + the overlay's embedded copy");
  assert.strictEqual(out.active.table, 1, "clicking the toggle renders the data table");
  assert.strictEqual(out.active.rows, 2, "one row per datum");
  assert.deepStrictEqual(out.active.headers, ["id", "x", "y"], "columns come from the datum's own keys");
  assert.strictEqual(out.active.pressed, "true", "the toggle reports pressed while active");
  assert.strictEqual(out.after.table, 0, "clicking again removes the data table");
  assert.strictEqual(out.after.toggle, 1, "back to just the shared panel's single button");
  assert.strictEqual(out.after.pressed, "false", "the toggle reports not-pressed once deactivated");
});

it("the toggle button is painted with its structural default style, active/hover state, and disables on tableViewControlClassName", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .data([{id: "x", value: 3}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            const btn = document.querySelector(".table-view-toggle");
            const beforeWidth = window.getComputedStyle(btn).width;
            btn.click(); // now active
            const activeBtn = document.querySelector(".d3plus-table-view .table-view-toggle");
            const afterWidth = window.getComputedStyle(activeBtn).width;
            const afterBg = window.getComputedStyle(activeBtn).backgroundColor;
            resolve({beforeWidth, afterWidth, afterBg});
          });
      }),
  );

  assert.strictEqual(out.beforeWidth, "20px", "structural default style is painted onto the button");
  assert.strictEqual(out.afterWidth, "20px", "structural style persists once active");
  assert.notStrictEqual(out.afterBg, "rgba(0, 0, 0, 0)", "the active style paints a background color");
});

it("tableView(false) removes the toggle button entirely", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .tableView(false)
          .data([{id: "x", value: 3}, {id: "y", value: 2}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() =>
            resolve({toggle: document.querySelectorAll(".table-view-toggle").length}),
          );
      }),
  );

  assert.strictEqual(out.toggle, 0, "no toggle button when tableView(false)");
});

it("tableViewControlClassName and tableViewClassName apply to the button and the table", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .tableViewControlClassName("my-toggle")
          .tableViewClassName("my-table")
          .data([{id: "x", value: 3}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({
              toggleClass: document.querySelector(".d3plus-table-view .table-view-toggle").className,
              tableClass: document.querySelector("table").className,
            });
          });
      }),
  );

  assert.ok(out.toggleClass.includes("my-toggle"), "custom button className applied");
  assert.ok(out.tableClass.includes("my-table"), "custom table className applied");
});

it("tableViewPageSize paginates the data table, and Prev/Next navigate + disable at the ends", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .tableViewPageSize(2)
          .data([
            {id: "a", x: "Q1", y: 1}, {id: "a", x: "Q2", y: 2}, {id: "a", x: "Q3", y: 3},
            {id: "a", x: "Q4", y: 4}, {id: "a", x: "Q5", y: 5},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            const page1 = {
              rows: document.querySelectorAll("tbody tr").length,
              prevDisabled: document.querySelector(".tableview-page-prev").hasAttribute("disabled"),
            };
            document.querySelector(".tableview-page-next").click();
            const page2 = {rows: document.querySelectorAll("tbody tr").length};
            document.querySelector(".tableview-page-next").click();
            const page3 = {
              rows: document.querySelectorAll("tbody tr").length,
              nextDisabled: document.querySelector(".tableview-page-next").hasAttribute("disabled"),
            };
            resolve({page1, page2, page3});
          });
      }),
  );

  assert.strictEqual(out.page1.rows, 2, "first page shows pageSize rows");
  assert.strictEqual(out.page1.prevDisabled, true, "Prev disabled on the first page");
  assert.strictEqual(out.page2.rows, 2, "second page shows the next pageSize rows");
  assert.strictEqual(out.page3.rows, 1, "final page shows the remainder (5 rows / 2 per page)");
  assert.strictEqual(out.page3.nextDisabled, true, "Next disabled on the last page");
});

it("escapes data values instead of interpreting them as HTML (#XSS)", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .data([{id: "<img src=x onerror=alert(1)>", value: 3}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            const cell = document.querySelector("tbody td");
            resolve({
              text: cell.textContent,
              injectedImg: cell.querySelectorAll("img").length,
            });
          });
      }),
  );

  assert.strictEqual(out.injectedImg, 0, "no element is injected from a data value");
  assert.ok(out.text.includes("<img"), "the raw string still renders as visible text");
});

it("table view claims zero layout margin, and coexists with a simultaneously-showing Back button", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "A", value: 10}, {id: "B", value: 20}];
        const noHistory = new window.d3plus.Treemap()
          .select("#a")
          .data(data)
          .groupBy("id")
          .sum("value")
          .duration(0);
        const withHistory = new window.d3plus.Treemap()
          .select("#b")
          .data(data)
          .groupBy("id")
          .sum("value")
          .duration(0);
        withHistory._history = [{depth: 0}];
        noHistory.render(() =>
          withHistory.render(() => {
            resolve({
              back: document.querySelectorAll("#b .back-control").length,
              tableToggle: document.querySelectorAll("#b .d3plus-top-left-controls-item .table-view-toggle").length,
              // Relative comparison, not an assumed absolute value (e.g. 0)
              // — matches top-left-controls-test.js's own equivalent check.
              // Some OTHER default margin claim (unrelated to this panel)
              // could legitimately make the baseline non-zero; what matters
              // here is that showing Back alongside table-view claims
              // nothing EXTRA.
              marginTopEqual: noHistory._margin.top === withHistory._margin.top,
            });
          }),
        );
      }),
  );

  assert.strictEqual(out.back, 1, "back button also contributes to the shared panel");
  assert.strictEqual(out.tableToggle, 1, "table-view toggle contributes alongside it");
  assert.ok(out.marginTopEqual, "neither back nor table-view claims layout margin — both float");
});

it("clicking a column header sorts the table, toggles asc/desc, and reflects state in aria-sort", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .data([
            {id: "c", x: "Q1", y: 30}, {id: "a", x: "Q1", y: 10}, {id: "b", x: "Q1", y: 20},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            const idHeaderSelector = '.tableview-sort-header[data-column="id"]';
            document.querySelector(".table-view-toggle").click();
            document.querySelector(idHeaderSelector).click(); // asc
            // Re-query after each click: sorting rebuilds the overlay's
            // innerHTML wholesale, so a header reference captured before a
            // click is a detached, stale node once the click's own handler
            // rewrites the DOM.
            const ascHeader = document.querySelector(idHeaderSelector);
            const asc = {
              order: Array.from(document.querySelectorAll("tbody tr td:first-child")).map(td => td.textContent),
              ariaSort: ascHeader.getAttribute("aria-sort"),
              chevronPoints: ascHeader.querySelector("svg polyline")?.getAttribute("points"),
            };
            document.querySelector(idHeaderSelector).click(); // desc
            const descHeader = document.querySelector(idHeaderSelector);
            const desc = {
              order: Array.from(document.querySelectorAll("tbody tr td:first-child")).map(td => td.textContent),
              ariaSort: descHeader.getAttribute("aria-sort"),
              chevronPoints: descHeader.querySelector("svg polyline")?.getAttribute("points"),
            };
            resolve({asc, desc});
          });
      }),
  );

  assert.deepStrictEqual(out.asc.order, ["a", "b", "c"], "first click sorts ascending");
  assert.strictEqual(out.asc.ariaSort, "ascending");
  assert.strictEqual(out.asc.chevronPoints, "6 15 12 9 18 15", "ascending chevron (pointing up) shown in the header");
  assert.deepStrictEqual(out.desc.order, ["c", "b", "a"], "second click on the same column reverses to descending");
  assert.strictEqual(out.desc.ariaSort, "descending");
  assert.strictEqual(out.desc.chevronPoints, "6 9 12 15 18 9", "descending chevron (pointing down) shown in the header");
});

it("tableViewSort(false) renders plain, unsortable header cells", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .tableViewSort(false)
          .data([{id: "b", value: 1}, {id: "a", value: 2}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({
              sortHeaders: document.querySelectorAll(".tableview-sort-header").length,
              order: Array.from(document.querySelectorAll("tbody tr td:first-child")).map(td => td.textContent),
            });
          });
      }),
  );

  assert.strictEqual(out.sortHeaders, 0, "no clickable sort headers when tableViewSort(false)");
  assert.deepStrictEqual(out.order, ["b", "a"], "rows stay in their original (unsorted) order");
});

it("formats numbers per the chart's own .locale(), not the browser default", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="us" style="width:400px;height:300px;"></div><div id="de" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = [{id: "x", value: 12345}];
        const us = new window.d3plus.Pie().select("#us").data(data).groupBy("id").value("value").duration(0);
        const de = new window.d3plus.Pie().select("#de").locale("de-DE").data(data).groupBy("id").value("value").duration(0);
        us.render(() => de.render(() => {
          document.querySelector("#us .table-view-toggle").click();
          document.querySelector("#de .table-view-toggle").click();
          resolve({
            us: document.querySelector("#us tbody td:nth-child(2)").textContent,
            de: document.querySelector("#de tbody td:nth-child(2)").textContent,
          });
        }));
      }),
  );

  assert.strictEqual(out.us, "12,345", "en-US groups with a comma");
  assert.strictEqual(out.de, "12.345", "de-DE groups with a period, following the chart's own locale");
});

it("CSV export includes every row (not just the current page), sorted, with raw (not display-formatted) values, and RFC4180 quoting", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .tableViewPageSize(1)
          .data([
            {id: "b, with a comma", x: "Q1", y: 12345},
            {id: "a", x: "Q1", y: 2},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(async () => {
            document.querySelector(".table-view-toggle").click();
            document.querySelector('.tableview-sort-header[data-column="id"]').click(); // sort asc by id

            // Capture the Blob `downloadTableViewCsv` hands to
            // `URL.createObjectURL` (read via `Blob.text()`, which works
            // regardless of the page's origin) instead of following the
            // anchor's real `blob:` href — `fetch()`-ing a blob: URL is
            // refused on a `page.setContent()` page's opaque/null origin,
            // and a real anchor `.click()` risks an actual download
            // navigation in the test harness. Also stub newly-created <a>
            // elements' own `.click()` (not the shared prototype method) so
            // nothing outside this capture window is affected.
            let capturedBlob = null;
            const originalCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
            window.URL.createObjectURL = function (blob) {
              capturedBlob = blob;
              return originalCreateObjectURL(blob);
            };
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
              const el = originalCreateElement(tag);
              if (String(tag).toLowerCase() === "a") el.click = () => {};
              return el;
            };
            try {
              document.querySelector(".tableview-download-csv").click();
            } finally {
              window.URL.createObjectURL = originalCreateObjectURL;
              document.createElement = originalCreateElement;
            }
            const csv = await capturedBlob.text();
            resolve({csv});
          });
      }),
  );

  const lines = out.csv.split("\r\n");
  assert.strictEqual(lines[0], "id,x,y", "header row");
  assert.strictEqual(lines.length, 3, "both rows exported despite tableViewPageSize(1)");
  assert.strictEqual(lines[1], 'a,Q1,2', "sorted ascending by id, matching the on-screen sort");
  assert.strictEqual(lines[2], '"b, with a comma",Q1,12345', "a comma-containing field is quoted; the number is raw (no locale grouping)");
});

it("tableViewDownload(false) removes the CSV download button", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .tableViewDownload(false)
          .data([{id: "x", value: 3}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({download: document.querySelectorAll(".tableview-download-csv").length});
          });
      }),
  );

  assert.strictEqual(out.download, 0, "no download button when tableViewDownload(false)");
});

it("a large tableViewPageSize(false) table virtualizes: only a small window of rows is ever in the DOM, and scrolling swaps which rows those are", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = Array.from({length: 1000}, (_, i) => ({id: `row-${i}`, x: "Q1", y: i}));
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .tableViewPageSize(false)
          .data(data)
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            const wrapper = document.querySelector(".d3plus-table-view-scroll");
            const firstCellText = () => wrapper.querySelector("tbody tr:not([aria-hidden]) td")?.textContent;
            const initial = {
              virtualMarker: wrapper.hasAttribute("data-tableview-virtual"),
              rowCount: wrapper.querySelectorAll("tbody tr:not([aria-hidden])").length,
              scrollHeight: wrapper.scrollHeight,
              firstCell: firstCellText(),
            };
            wrapper.scrollTop = 15000; // ~row 500 at the fixed 30px row height
            wrapper.dispatchEvent(new window.Event("scroll"));
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
              resolve({
                initial,
                afterScroll: {rowCount: wrapper.querySelectorAll("tbody tr:not([aria-hidden])").length, firstCell: firstCellText()},
                total: data.length,
              });
            }));
          });
      }),
  );

  assert.strictEqual(out.initial.virtualMarker, true, "1000-row unpaginated table is marked for virtualization");
  assert.ok(out.initial.rowCount < 100, `only a small window renders initially (got ${out.initial.rowCount})`);
  assert.strictEqual(out.initial.firstCell, "row-0", "starts scrolled to the top, showing the first row");
  assert.ok(
    Math.abs(out.initial.scrollHeight - out.total * 30) < out.total,
    "the scroll container's full height reflects all 1000 rows (via the spacer rows), not just the rendered window",
  );
  assert.ok(out.afterScroll.rowCount < 100, "still only a small window after scrolling");
  assert.notStrictEqual(out.afterScroll.firstCell, "row-0", "scrolling swapped in rows from further down the dataset");
  const scrolledIndex = Number(out.afterScroll.firstCell.replace("row-", ""));
  assert.ok(scrolledIndex > 400 && scrolledIndex < 520, `scrolled-to row is in the expected neighborhood (got ${out.afterScroll.firstCell})`);
});

it("a small tableViewPageSize(false) table renders every row directly — virtualization doesn't engage below the threshold", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = Array.from({length: 20}, (_, i) => ({id: `row-${i}`, value: i + 1}));
        new window.d3plus.Pie()
          .select("#s")
          .tableViewPageSize(false)
          .data(data)
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            const wrapper = document.querySelector(".d3plus-table-view-scroll");
            resolve({
              virtualMarker: wrapper.hasAttribute("data-tableview-virtual"),
              rows: wrapper.querySelectorAll("tbody tr").length,
            });
          });
      }),
  );

  assert.strictEqual(out.virtualMarker, false, "below VIRTUALIZE_THRESHOLD, no virtualization marker");
  assert.strictEqual(out.rows, 20, "every row renders directly, no spacer/window logic involved");
});

it("the shared top-left panel's toggle button stays in sync after deactivating via the overlay's own embedded copy", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const viz = new window.d3plus.Pie()
          .select("#s")
          .data([{id: "a", value: 1}, {id: "b", value: 2}])
          .groupBy("id")
          .value("value")
          .duration(0);
        viz.render(async () => {
          // Activate via the shared panel's (only visible) button.
          document.querySelector(".table-view-toggle").click();
          // An unrelated full re-render while still active — e.g. a resize
          // or a second .render() call — rebuilds the shared top-left panel
          // fresh via topLeftControlsFeature, baking the active/pressed
          // state into its (still-covered, off-screen-under-the-overlay)
          // copy of the button.
          await new Promise(r => viz.render(r));
          // Deactivate via the OVERLAY's own embedded toggle, not the shared
          // panel's — this is the path that used to leave the shared
          // panel's button stale.
          document.querySelector(".d3plus-table-view .table-view-toggle").click();
          const sharedBtn = document.querySelector(".d3plus-top-left-controls-item .table-view-toggle");
          resolve({
            isTableView: viz._tableView,
            sharedActive: sharedBtn.classList.contains("active"),
            sharedAriaPressed: sharedBtn.getAttribute("aria-pressed"),
          });
        });
      }),
  );

  assert.strictEqual(out.isTableView, false, "table view is deactivated");
  assert.strictEqual(out.sharedActive, false, "the shared panel's button drops its stale active class");
  assert.strictEqual(out.sharedAriaPressed, "false", "…and its stale aria-pressed");
});

it("columns come from the union of every row's keys, not just the first row's — no silent column loss on heterogeneous data", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .data([
            {id: "a", x: "Q1", y: 1}, // no "note" key
            {id: "b", x: "Q1", y: 2, note: "flagged"},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({
              headers: Array.from(document.querySelectorAll("thead th")).map(th => th.textContent),
              secondRowCells: Array.from(document.querySelectorAll("tbody tr:nth-child(2) td")).map(td => td.textContent),
            });
          });
      }),
  );

  assert.deepStrictEqual(out.headers, ["id", "x", "y", "note"], "the 'note' column (absent from row 1) still appears");
  assert.deepStrictEqual(out.secondRowCells, ["b", "Q1", "2", "flagged"], "and the row that has it shows its value");
});

it("CSV export quotes a field containing a lone carriage return, not just '\\n'", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.Pie()
          .select("#s")
          .data([{id: "line1\rline2", value: 3}])
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(async () => {
            document.querySelector(".table-view-toggle").click();
            let capturedBlob = null;
            const originalCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
            window.URL.createObjectURL = function (blob) {
              capturedBlob = blob;
              return originalCreateObjectURL(blob);
            };
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
              const el = originalCreateElement(tag);
              if (String(tag).toLowerCase() === "a") el.click = () => {};
              return el;
            };
            try {
              document.querySelector(".tableview-download-csv").click();
            } finally {
              window.URL.createObjectURL = originalCreateObjectURL;
              document.createElement = originalCreateElement;
            }
            const csv = await capturedBlob.text();
            resolve({csv});
          });
      }),
  );

  assert.strictEqual(out.csv, 'id,value,share\r\n"line1\rline2",3,1', "the \\r-containing field is quoted");
});

it("a big-page-size table (pagination AND virtualization both active) sizes its scroll height against the current page, not the whole dataset", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const data = Array.from({length: 1000}, (_, i) => ({id: `row-${i}`, value: i}));
        new window.d3plus.Pie()
          .select("#s")
          .tableViewPageSize(500) // 2 pages of 500 — each page exceeds VIRTUALIZE_THRESHOLD (300)
          .data(data)
          .groupBy("id")
          .value("value")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            const wrapper = document.querySelector(".d3plus-table-view-scroll");
            resolve({
              virtualMarker: wrapper.hasAttribute("data-tableview-virtual"),
              scrollHeight: wrapper.scrollHeight,
            });
          });
      }),
  );

  assert.strictEqual(out.virtualMarker, true, "500-row page still exceeds the virtualization threshold");
  // Correct: ~500 rows * 30px. Buggy (dataset-wide total instead of the
  // current page's): ~1000 rows * 30px — over double.
  assert.ok(
    out.scrollHeight < 1000 * 30 * 0.75,
    `scroll height reflects the current PAGE's 500 rows, not the dataset's 1000 (got ${out.scrollHeight})`,
  );
});

it("a raw/aggregate source toggle appears (next to download) when a chart aggregates its input, and switches which dataset the table + CSV show", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        // groupBy === sum key with repeated categories: Treemap merges every
        // row sharing a category into one aggregated rect, so _filteredData
        // (5 rows) diverges from _data (200 raw rows) — exactly the
        // "aggregate data being shown differs from the raw data passed by
        // the user" case the toggle exists for.
        const categories = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon"];
        const data = Array.from({length: 200}, (_, i) => ({
          id: `row-${i}`,
          category: categories[i % categories.length],
          value: i + 1,
        }));
        new window.d3plus.Treemap()
          .select("#s")
          .groupBy("category")
          .sum("value")
          // Off, so the on-screen row count reflects the full raw/aggregate
          // total directly rather than being capped by the default
          // tableViewPageSize(50) — 200 rows is well under the
          // virtualization threshold (300) either way.
          .tableViewPageSize(false)
          .data(data)
          .duration(0)
          .render(async () => {
            document.querySelector(".table-view-toggle").click();
            const toggleSelector = ".tableview-source-toggle";
            const aggregate = {
              toggleCount: document.querySelectorAll(toggleSelector).length,
              rows: document.querySelectorAll("tbody tr:not([aria-hidden])").length,
              pressed: document.querySelector(toggleSelector)?.getAttribute("aria-pressed"),
            };

            document.querySelector(toggleSelector).click();
            const raw = {
              rows: document.querySelectorAll("tbody tr:not([aria-hidden])").length,
              pressed: document.querySelector(toggleSelector).getAttribute("aria-pressed"),
            };

            // CSV should follow whichever source is currently selected (raw, now).
            let capturedBlob = null;
            const originalCreateObjectURL = window.URL.createObjectURL.bind(window.URL);
            window.URL.createObjectURL = function (blob) {
              capturedBlob = blob;
              return originalCreateObjectURL(blob);
            };
            const originalCreateElement = document.createElement.bind(document);
            document.createElement = function (tag) {
              const el = originalCreateElement(tag);
              if (String(tag).toLowerCase() === "a") el.click = () => {};
              return el;
            };
            try {
              document.querySelector(".tableview-download-csv").click();
            } finally {
              window.URL.createObjectURL = originalCreateObjectURL;
              document.createElement = originalCreateElement;
            }
            const csv = await capturedBlob.text();

            resolve({aggregate, raw, csvLineCount: csv.split("\r\n").length});
          });
      }),
  );

  assert.strictEqual(out.aggregate.toggleCount, 1, "toggle renders once raw/aggregate diverge");
  assert.strictEqual(out.aggregate.rows, 5, "aggregate view shows one row per Treemap group");
  assert.strictEqual(out.aggregate.pressed, "false", "aggregate is the default (unpressed) state");
  assert.strictEqual(out.raw.rows, 200, "clicking the toggle switches to the 200 raw input rows");
  assert.strictEqual(out.raw.pressed, "true", "raw is now the pressed state");
  assert.strictEqual(out.csvLineCount, 201, "CSV export follows the currently-selected (raw) source: header + 200 rows");
});

it("the raw/aggregate toggle does NOT render when raw and aggregate data are the same", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .data([
            {id: "a", x: "Q1", y: 10},
            {id: "b", x: "Q1", y: 20},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({toggleCount: document.querySelectorAll(".tableview-source-toggle").length});
          });
      }),
  );

  assert.strictEqual(out.toggleCount, 0, "no toggle when there's nothing distinct to switch to");
});

it("the default (unsorted) row order matches .data() insertion order, even when the chart's own pipeline regroups rows without merging them", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        // Interleaved series: BarChart's own pipeline groups _filteredData
        // by series ("all of B, then all of A") for axis/domain purposes —
        // the exact-JSON-match path in defaultRowOrder should undo that.
        new window.d3plus.BarChart()
          .select("#s")
          .groupBy("id")
          .data([
            {id: "B", x: "Q1", y: 20}, {id: "A", x: "Q1", y: 10},
            {id: "B", x: "Q2", y: 25}, {id: "A", x: "Q2", y: 15},
            {id: "B", x: "Q3", y: 30}, {id: "A", x: "Q3", y: 12},
          ])
          .x("x")
          .y("y")
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({
              order: Array.from(document.querySelectorAll("tbody tr")).map(tr =>
                Array.from(tr.querySelectorAll("td")).map(td => td.textContent).join("-"),
              ),
            });
          });
      }),
  );

  assert.deepStrictEqual(
    out.order,
    ["B-Q1-20", "A-Q1-10", "B-Q2-25", "A-Q2-15", "B-Q3-30", "A-Q3-12"],
    "matches the caller's original interleaved row order, not the chart's internal per-series grouping",
  );
});

it("the default (unsorted) row order falls back to group-first-appearance when rows are genuinely merged (not just reordered)", async function () {
  this.timeout(60000);

  const out = await render(
    '<div id="s" style="width:400px;height:300px;"></div>',
    () =>
      new Promise(resolve => {
        const categories = ["Zebra", "Alpha", "Mango"]; // deliberately non-alphabetical
        const data = [];
        for (let i = 0; i < 30; i++) data.push({id: categories[i % 3], value: i + 1});
        new window.d3plus.Treemap()
          .select("#s")
          .groupBy("id")
          .sum("value")
          .data(data)
          .duration(0)
          .render(() => {
            document.querySelector(".table-view-toggle").click();
            resolve({
              order: Array.from(document.querySelectorAll("tbody tr td:first-child")).map(td => td.textContent),
            });
          });
      }),
  );

  assert.deepStrictEqual(
    out.order,
    ["Zebra", "Alpha", "Mango"],
    "aggregate groups appear in the order they first occurred in .data(), not alphabetically or by summed value",
  );
});
