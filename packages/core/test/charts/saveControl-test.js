import {it} from "vitest";
import assert from "assert";
import {select} from "d3-selection";
import {useJsdom} from "~test/jsdom.js";
import {Treemap} from "../../index.ts";
import {
  resolveSaveConfig,
  SAVE_FORMATS,
  saveChart,
  saveFilename,
  saveFormats,
  saveTarget,
  svgForSave,
} from "../../src/charts/drawSteps/saveChart.ts";
import {
  paintSaveButton,
  SAVE_FORMAT_LABELS,
  saveButtonStyles,
  saveControlHtml,
  showsSaveControl,
} from "../../src/charts/drawSteps/saveControlMarkup.ts";
import {
  closeSaveMenu,
  isSaveMenuOpen,
  openSaveMenu,
  saveContribution,
} from "../../src/charts/drawSteps/saveControl.ts";

useJsdom();

const SVG_NS = "http://www.w3.org/2000/svg";

/** A Treemap drawn into a fresh `<svg>` inside a page-colored container. */
function mountedViz(background = "rgb(10, 20, 30)") {
  const host = document.body.appendChild(document.createElement("div"));
  host.style.backgroundColor = background;
  const svg = host.appendChild(document.createElementNS(SVG_NS, "svg"));
  svg.appendChild(document.createElementNS(SVG_NS, "circle"));
  const viz = new Treemap();
  viz._select = select(svg);
  return {viz, host, svg};
}

it("saveFormats keeps the valid formats in order, once each", () => {
  assert.deepStrictEqual(saveFormats(undefined), ["png", "svg", "jpg"]);
  assert.deepStrictEqual(saveFormats(["svg", "PNG", "svg", "gif", "jpeg"]), [
    "svg",
    "png",
    "jpg",
  ]);
  assert.deepStrictEqual(saveFormats([]), []);
  assert.deepStrictEqual(SAVE_FORMATS, ["png", "svg", "jpg"]);
});

it("saveFilename strips markup and characters file systems reject", () => {
  assert.strictEqual(saveFilename("Revenue <b>2024</b>"), "Revenue 2024");
  assert.strictEqual(saveFilename('a/b\\c:d*e?f"g|h'), "abcdefgh");
  assert.strictEqual(saveFilename("  Two\n lines  "), "Two lines");
  assert.strictEqual(saveFilename(2024), "2024");
  assert.strictEqual(saveFilename(""), "download");
  assert.strictEqual(saveFilename(false), "download");
  assert.strictEqual(saveFilename("x".repeat(150)).length, 100);
});

it("resolveSaveConfig defaults to the title, every format, and the page color", () => {
  const {viz, host} = mountedViz();
  viz.title("Fruit <i>sales</i>");
  const resolved = resolveSaveConfig(viz);
  assert.strictEqual(resolved.filename, "Fruit sales");
  assert.deepStrictEqual(resolved.formats, ["png", "svg", "jpg"]);
  assert.strictEqual(resolved.background, "rgb(10, 20, 30)");
  assert.strictEqual(resolved.callback, undefined);
  assert.deepStrictEqual(resolved.renderOptions, {});
  host.remove();
});

it("resolveSaveConfig reads saveControlConfig and passes other options through", () => {
  const callback = () => {};
  const viz = new Treemap().saveControlConfig({
    filename: "sales",
    formats: ["jpg"],
    background: "#fafafa",
    callback,
    pixelRatio: 3,
  });
  const resolved = resolveSaveConfig(viz);
  assert.strictEqual(resolved.filename, "sales");
  assert.deepStrictEqual(resolved.formats, ["jpg"]);
  assert.strictEqual(resolved.background, "#fafafa");
  assert.strictEqual(resolved.callback, callback);
  assert.deepStrictEqual(resolved.renderOptions, {pixelRatio: 3});
  assert.strictEqual(
    resolveSaveConfig(new Treemap().saveControlConfig({background: false}))
      .background,
    false,
  );
  assert.strictEqual(resolveSaveConfig(new Treemap()).filename, "download");
});

it("saveTarget is the chart's svg, or its canvas on the Canvas backend", () => {
  const {viz, host, svg} = mountedViz();
  assert.strictEqual(saveTarget(viz), svg);
  const canvas = document.createElement("canvas");
  const canvasViz = {_renderer: "canvas", toCanvas: () => canvas};
  assert.strictEqual(saveTarget(canvasViz), canvas);
  assert.strictEqual(saveTarget(new Treemap()), null);
  host.remove();
});

it("svgForSave copies the chart's svg with a background rect", () => {
  const {viz, host, svg} = mountedViz();
  svg.setAttribute("aria-hidden", "true");
  svg.style.position = "absolute";
  const copy = svgForSave(viz, "#123456");
  assert.strictEqual(copy.hasAttribute("aria-hidden"), false);
  assert.strictEqual(copy.style.position, "");
  assert.strictEqual(svg.style.position, "absolute", "live svg untouched");
  assert.notStrictEqual(copy, svg, "a detached copy");
  assert.strictEqual(copy.firstChild.getAttribute("fill"), "#123456");
  assert.strictEqual(copy.querySelectorAll("circle").length, 1);
  assert.strictEqual(svg.querySelectorAll("rect").length, 0, "live svg kept");
  assert.strictEqual(svgForSave(viz, false).querySelector("rect"), null);
  host.remove();
});

it("svgForSave parses the Canvas backend's re-rendered SVG markup", () => {
  const viz = {
    _renderer: "canvas",
    toSVGString: () =>
      `<svg xmlns="${SVG_NS}" width="10" height="10"><circle r="2"/></svg>`,
  };
  const svg = svgForSave(viz, "white");
  assert.strictEqual(svg.localName, "svg");
  assert.strictEqual(svg.querySelector("rect").getAttribute("fill"), "white");
  assert.ok(svg.querySelector("circle"));
  assert.strictEqual(
    svgForSave({_renderer: "canvas", toSVGString: () => ""}, "white"),
    null,
  );
});

it("saveChart reports an unrendered chart to the callback, else the console", () => {
  const errors = [];
  const viz = new Treemap().saveControlConfig({callback: e => errors.push(e)});
  saveChart(viz, "png");
  saveChart(viz, "svg");
  assert.strictEqual(errors.length, 2);
  assert.ok(errors.every(e => e instanceof Error));

  const logged = [];
  const original = console.error;
  console.error = e => logged.push(e);
  try {
    saveChart(new Treemap(), "jpg");
  } finally {
    console.error = original;
  }
  assert.strictEqual(logged.length, 1);
});

it("showsSaveControl is on by default, off with saveControl(false), SSR, or no formats", () => {
  assert.strictEqual(showsSaveControl(new Treemap()), true);
  assert.strictEqual(showsSaveControl(new Treemap().saveControl(false)), false);
  const ssr = new Treemap();
  ssr._ssr = true;
  assert.strictEqual(showsSaveControl(ssr), false);
  assert.strictEqual(
    showsSaveControl(new Treemap().saveControlConfig({formats: []})),
    false,
  );
});

it("saveControlHtml lists a translated menu item per format", () => {
  const viz = new Treemap().locale("es-ES").saveControlClassName("btn");
  const div = document.createElement("div");
  div.innerHTML = saveControlHtml(viz);
  const btn = div.querySelector(".save-toggle");
  assert.strictEqual(btn.getAttribute("aria-label"), "Descargar");
  assert.strictEqual(btn.getAttribute("aria-haspopup"), "menu");
  assert.strictEqual(btn.getAttribute("aria-expanded"), "false");
  assert.ok(btn.classList.contains("btn"));
  const items = [...div.querySelectorAll(".save-menu-item")];
  assert.deepStrictEqual(
    items.map(item => [item.dataset.format, item.textContent]),
    [
      ["png", "Imagen PNG"],
      ["svg", "Vector SVG"],
      ["jpg", "Imagen JPG"],
    ],
  );
  assert.deepStrictEqual(Object.keys(SAVE_FORMAT_LABELS), SAVE_FORMATS);
});

it("saveControlHtml has no menu for a single format", () => {
  const viz = new Treemap().saveControlConfig({formats: ["svg"]});
  const div = document.createElement("div");
  div.innerHTML = saveControlHtml(viz);
  const btn = div.querySelector(".save-toggle");
  assert.strictEqual(div.querySelector(".d3plus-save-menu"), null);
  assert.strictEqual(btn.dataset.format, "svg");
  assert.strictEqual(btn.getAttribute("aria-label"), "Download (SVG vector)");
  assert.strictEqual(btn.hasAttribute("aria-haspopup"), false);
});

it("saveButtonStyles and paintSaveButton follow the shared control styling", () => {
  const viz = new Treemap();
  assert.strictEqual(saveButtonStyles(viz).base.width, "20px");
  assert.deepStrictEqual(
    saveButtonStyles(new Treemap().saveControlClassName("btn")).base,
    {},
  );
  const btn = document.createElement("button");
  btn.classList.add("active");
  paintSaveButton(viz, btn);
  assert.strictEqual(btn.style.width, "20px");
  assert.strictEqual(btn.style.borderColor.toLowerCase(), "accentcolor");
});

it("openSaveMenu and closeSaveMenu toggle the menu and its focus", () => {
  const viz = new Treemap();
  const div = document.body.appendChild(document.createElement("div"));
  div.innerHTML = saveControlHtml(viz);
  const root = div.querySelector(".save-root");
  const menu = div.querySelector(".d3plus-save-menu");
  const btn = div.querySelector(".save-toggle");
  assert.strictEqual(isSaveMenuOpen(root), false);

  openSaveMenu(viz, root, "last");
  assert.strictEqual(isSaveMenuOpen(root), true);
  assert.strictEqual(menu.style.display, "flex");
  assert.strictEqual(document.activeElement.dataset.format, "jpg");

  closeSaveMenu(viz, root, true);
  assert.strictEqual(isSaveMenuOpen(root), false);
  assert.strictEqual(menu.style.display, "none");
  assert.strictEqual(document.activeElement, btn);

  openSaveMenu(viz, root);
  document.body.dispatchEvent(new window.Event("pointerdown", {bubbles: true}));
  assert.strictEqual(isSaveMenuOpen(root), false, "an outside press closes it");
  div.remove();
});

it("saveContribution contributes the button unless saveControl is off", () => {
  const contribution = saveContribution(new Treemap());
  assert.strictEqual(contribution.key, "save");
  assert.ok(contribution.html.includes("save-toggle"));
  assert.ok(contribution.events[".save-toggle"].click);
  assert.strictEqual(saveContribution(new Treemap().saveControl(false)), null);
});
