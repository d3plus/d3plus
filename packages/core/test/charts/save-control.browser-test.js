import {it} from "vitest";
import assert from "~test/browser/assert.js";
import {openPage} from "~test/browser/page.js";
import {render} from "~test/browser/render.js";

/**
    The top-left download button (`saveControl.ts`): shown by default, its
    menu opens, moves focus, and closes like a menu button, and each format
    saves the chart (without the controls) under the chart's title.
    Downloads are caught at the `<a download>` click `saveBlob` makes.
*/

const data = [
  {id: "Apple", value: 10},
  {id: "Banana", value: 20},
];

/**
    Opens a page, renders a Treemap with `calls` (`[method, ...args]` pairs)
    into #viz as `window.__viz`, and records every download in
    `window.__downloads` instead of saving it.
*/
async function chart(calls = [], renderer = "svg") {
  const opened = await openPage(
    '<div id="viz" style="width:400px;height:300px;font-family:sans-serif;"></div>',
  );
  await opened.page.evaluate(
    ([data, calls, renderer]) =>
      new Promise(resolve => {
        window.__downloads = [];
        window.HTMLAnchorElement.prototype.click = function () {
          if (this.download)
            window.__downloads.push({name: this.download, href: this.href});
        };
        const viz = new window.d3plus.Treemap()
          .data(data)
          .groupBy("id")
          .sum("value");
        for (const [method, ...args] of JSON.parse(JSON.stringify(calls)))
          viz[method](...args);
        window.__viz = viz;
        viz.renderer(renderer).duration(0).select("#viz").render(resolve);
      }),
    [data, calls, renderer],
  );
  return opened;
}

/** The center of the first element matching `selector`, in page coordinates. */
function center(page, selector) {
  return page.evaluate(selector => {
    const r = document.querySelector(selector).getBoundingClientRect();
    return {x: r.left + r.width / 2, y: r.top + r.height / 2};
  }, selector);
}

async function click(page, selector) {
  const {x, y} = await center(page, selector);
  await page.mouse.click(x, y);
}

/** The menu's state: whether it's open and showing, and what has focus. */
function menuState(page) {
  return page.evaluate(() => {
    const btn = document.querySelector("#viz .save-toggle");
    const menu = document.querySelector("#viz .d3plus-save-menu");
    const active = document.activeElement;
    return {
      expanded: btn.getAttribute("aria-expanded"),
      display: menu && getComputedStyle(menu).display,
      focus: active.dataset.format || active.className,
    };
  });
}

/**
 * Sorts saved files by name: rasterized formats finish asynchronously, so
 * saves started back to back can land in any order.
 * @param {Object[]} files
 */
function byName(files) {
  return files.slice().sort((a, b) => a.name.localeCompare(b.name));
}

/** Waits for `count` downloads and reads each file's name, type, and (SVG) text. */
function downloads(page, count) {
  return page.evaluate(async count => {
    const start = Date.now();
    while (window.__downloads.length < count && Date.now() - start < 5000)
      await new Promise(resolve => setTimeout(resolve, 20));
    return Promise.all(
      window.__downloads.map(async ({name, href}) => {
        const blob = await (await fetch(href)).blob();
        const text = blob.type.includes("svg") ? await blob.text() : "";
        const image = blob.type.includes("svg")
          ? null
          : await createImageBitmap(blob);
        return {
          name,
          type: blob.type,
          size: blob.size,
          text,
          width: image?.width,
          height: image?.height,
        };
      }),
    );
  }, count);
}

it("the download button renders by default, and saveControl(false) hides it", async function () {
  const out = await render(
    '<div id="a" style="width:400px;height:300px;"></div><div id="b" style="width:400px;height:300px;"></div>',
    data =>
      new Promise(resolve => {
        const make = () =>
          new window.d3plus.Treemap()
            .data(data)
            .groupBy("id")
            .sum("value")
            .duration(0);
        make()
          .select("#a")
          .render(() =>
            make()
              .select("#b")
              .saveControl(false)
              .render(() => {
                const btn = document.querySelector("#a .save-toggle");
                resolve({
                  on: document.querySelectorAll("#a .save-toggle").length,
                  off: document.querySelectorAll("#b .save-toggle").length,
                  label: btn.getAttribute("aria-label"),
                  popup: btn.getAttribute("aria-haspopup"),
                  // Beside table view and search, in that order.
                  order: [
                    ...document.querySelectorAll(
                      "#a .d3plus-top-left-controls-item",
                    ),
                  ].map(el => el.querySelector("button").classList[1]),
                });
              }),
          );
      }),
    data,
  );
  assert.strictEqual(out.on, 1, "button present by default");
  assert.strictEqual(out.off, 0, "saveControl(false) removes the button");
  assert.strictEqual(out.label, "Download");
  assert.strictEqual(out.popup, "menu");
  assert.deepStrictEqual(out.order, [
    "table-view-toggle",
    "save-toggle",
    "search-toggle",
  ]);
});

it("the menu opens on click, moves focus with the arrow keys, and closes on Escape and an outside click", async function () {
  const {page, close} = await chart([["title", "Fruit"]]);
  try {
    assert.strictEqual((await menuState(page)).display, "none");

    await click(page, "#viz .save-toggle");
    let state = await menuState(page);
    assert.strictEqual(state.expanded, "true", "aria-expanded once open");
    assert.strictEqual(state.display, "flex", "the menu shows");
    assert.strictEqual(state.focus, "png", "focus moves to the first item");

    await page.evaluate(() => {
      const key = key =>
        document.activeElement.dispatchEvent(
          new KeyboardEvent("keydown", {key, bubbles: true}),
        );
      key("ArrowDown");
      key("ArrowDown");
    });
    assert.strictEqual((await menuState(page)).focus, "jpg");

    await page.evaluate(() =>
      document.activeElement.dispatchEvent(
        new KeyboardEvent("keydown", {key: "Escape", bubbles: true}),
      ),
    );
    state = await menuState(page);
    assert.strictEqual(state.expanded, "false", "Escape closes the menu");
    assert.strictEqual(state.display, "none");
    assert.ok(
      state.focus.includes("save-toggle"),
      "focus returns to the button",
    );

    await click(page, "#viz .save-toggle");
    assert.strictEqual((await menuState(page)).expanded, "true");
    await page.mouse.click(300, 250);
    state = await menuState(page);
    assert.strictEqual(state.expanded, "false", "an outside click closes it");
    assert.strictEqual(state.display, "none");

    // ArrowUp on the button opens the menu at its last item.
    await page.evaluate(() =>
      document
        .querySelector("#viz .save-toggle")
        .dispatchEvent(
          new KeyboardEvent("keydown", {key: "ArrowUp", bubbles: true}),
        ),
    );
    assert.strictEqual((await menuState(page)).focus, "jpg");
  } finally {
    await close();
  }
});

it("each menu item saves its format under the chart's title, without the controls", async function () {
  const {page, close} = await chart([["title", "Fruit <b>sales</b>"]]);
  try {
    for (const format of ["svg", "png", "jpg"]) {
      await click(page, "#viz .save-toggle");
      await click(page, `#viz .save-menu-item[data-format="${format}"]`);
    }
    const files = byName(await downloads(page, 3));
    assert.deepStrictEqual(
      files.map(f => [f.name, f.type]),
      [
        ["Fruit sales.jpg", "image/jpeg"],
        ["Fruit sales.png", "image/png"],
        ["Fruit sales.svg", "image/svg+xml;charset=utf-8"],
      ],
    );
    assert.ok(
      files.every(f => f.size > 1000),
      "every file has content",
    );
    const svg = files[2].text;
    assert.ok(svg.startsWith("<svg"), "a plain svg root");
    assert.ok(svg.includes("Apple"), "the chart's labels are saved");
    assert.ok(svg.includes("d3plus-save-background"), "with a background");
    for (const control of ["save-toggle", "d3plus-save-menu", "search-toggle"])
      assert.ok(!svg.includes(control), `no ${control} in the file`);
    const closed = await menuState(page);
    assert.strictEqual(closed.expanded, "false", "the menu closes on save");
    assert.ok(closed.focus.includes("save-toggle"), "focus is on the button");
  } finally {
    await close();
  }
});

it("a single format saves in one click, with no menu", async function () {
  const {page, close} = await chart([
    ["saveControlConfig", {formats: ["jpg"], filename: "fruit"}],
  ]);
  try {
    const before = await page.evaluate(() => ({
      menu: document.querySelectorAll("#viz .d3plus-save-menu").length,
      label: document
        .querySelector("#viz .save-toggle")
        .getAttribute("aria-label"),
    }));
    assert.strictEqual(before.menu, 0, "no menu");
    assert.strictEqual(before.label, "Download (JPG image)");
    await click(page, "#viz .save-toggle");
    const files = await downloads(page, 1);
    assert.deepStrictEqual(
      files.map(f => [f.name, f.type]),
      [["fruit.jpg", "image/jpeg"]],
    );
  } finally {
    await close();
  }
});

it("the button and menu are translated", async function () {
  const {page, close} = await chart([["locale", "zh-CN"]]);
  try {
    const out = await page.evaluate(() => ({
      label: document
        .querySelector("#viz .save-toggle")
        .getAttribute("aria-label"),
      items: [...document.querySelectorAll("#viz .save-menu-item")].map(
        el => el.textContent,
      ),
    }));
    assert.strictEqual(out.label, "下载");
    assert.deepStrictEqual(out.items, ["PNG 图片", "SVG 矢量图", "JPG 图片"]);
  } finally {
    await close();
  }
});

it("a Canvas chart saves its canvas as PNG and its scene as SVG", async function () {
  const {page, close} = await chart([["title", "Canvas fruit"]], "canvas");
  try {
    for (const format of ["svg", "png"]) {
      await click(page, "#viz .save-toggle");
      await click(page, `#viz .save-menu-item[data-format="${format}"]`);
    }
    const files = byName(await downloads(page, 2));
    assert.deepStrictEqual(
      files.map(f => [f.name, f.type]),
      [
        ["Canvas fruit.png", "image/png"],
        ["Canvas fruit.svg", "image/svg+xml;charset=utf-8"],
      ],
    );
    const svg = files[1].text;
    assert.ok(svg.includes("<rect"), "the scene is re-rendered as svg shapes");
    assert.ok(svg.includes("Banana"), "with its labels");
    assert.ok(!svg.includes("save-toggle"), "and no controls");
    assert.ok(files[0].size > 1000);
  } finally {
    await close();
  }
});

it("saveControlConfig's callback receives each save, and an error when there is nothing to save", async function () {
  const {page, close} = await chart([]);
  try {
    const out = await page.evaluate(
      () =>
        new Promise(resolve => {
          const results = [];
          const viz = window.__viz;
          viz.saveControlConfig({callback: e => results.push(e)});
          window.d3plus.saveChart(viz, "svg");
          viz._select = undefined;
          window.d3plus.saveChart(viz, "png");
          resolve(results.map(e => (e ? e.constructor.name : "ok")));
        }),
    );
    assert.deepStrictEqual(out, ["ok", "Error"]);
  } finally {
    await close();
  }
});

it("a Canvas chart saved above its own pixel density is drawn from its SVG scene", async function () {
  const {page, close} = await chart(
    [["saveControlConfig", {formats: ["png"], pixelRatio: 2}]],
    "canvas",
  );
  try {
    const count = () =>
      page.evaluate(() => ({
        svgCalls: window.__svgCalls,
        bodyChildren: document.body.children.length,
        density:
          document.querySelector("#viz canvas").width /
          document.querySelector("#viz canvas").getBoundingClientRect().width,
      }));
    await page.evaluate(() => {
      const viz = window.__viz;
      const toSVGString = viz.toSVGString.bind(viz);
      window.__svgCalls = 0;
      viz.toSVGString = () => {
        window.__svgCalls++;
        return toSVGString();
      };
    });
    const before = await count();
    assert.strictEqual(before.density, 1, "the test page's canvas is 1x");

    await click(page, "#viz .save-toggle");
    const [sharp] = await downloads(page, 1);
    const after = await count();
    assert.deepStrictEqual([sharp.width, sharp.height], [800, 600]);
    assert.strictEqual(after.svgCalls, 1, "drawn from the SVG scene");
    assert.strictEqual(
      after.bodyChildren,
      before.bodyChildren,
      "the off-screen copy is removed",
    );

    // At the canvas's own density, the canvas itself is used.
    await page.evaluate(() => window.__viz.saveControlConfig({pixelRatio: 1}));
    await click(page, "#viz .save-toggle");
    const files = await downloads(page, 2);
    assert.deepStrictEqual([files[1].width, files[1].height], [400, 300]);
    assert.strictEqual((await count()).svgCalls, 1, "no SVG re-render");
  } finally {
    await close();
  }
});

it("the menu takes saveControlMenuClassName and the menu style keys", async function () {
  const {page, close} = await chart([
    ["saveControlMenuClassName", "my-menu"],
    ["saveControlMenuItemStyleHover", {color: "rgb(255, 0, 0)"}],
  ]);
  try {
    await click(page, "#viz .save-toggle");
    await page.mouse.move(0, 0);
    const {x, y} = await center(
      page,
      '#viz .save-menu-item[data-format="svg"]',
    );
    await page.mouse.move(x, y);
    const out = await page.evaluate(() => {
      const menu = document.querySelector("#viz .d3plus-save-menu");
      const item = format =>
        document.querySelector(`#viz .save-menu-item[data-format="${format}"]`);
      return {
        menuClass: menu.classList.contains("my-menu"),
        menuBackground: menu.style.background,
        position: getComputedStyle(menu).position,
        focus: document.activeElement.dataset.format,
        hovered: item("svg").style.color,
        other: item("png").style.color,
      };
    });
    assert.ok(out.menuClass);
    assert.strictEqual(out.menuBackground, "", "the inline theme is dropped");
    assert.strictEqual(out.position, "absolute", "the layout stays");
    assert.strictEqual(out.focus, "svg", "hovering focuses the item");
    assert.strictEqual(out.hovered, "rgb(255, 0, 0)", "with the hover style");
    assert.strictEqual(out.other, "", "and only that item");
  } finally {
    await close();
  }
});
