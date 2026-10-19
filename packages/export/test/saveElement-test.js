import assert from "assert";
import {JSDOM} from "jsdom";
import saveElement from "../es/src/saveElement.js";
import {saved} from "./fakes/file-saver.js";
import {calls, results} from "./fakes/html-to-image.js";

const dom = new JSDOM(
  `<!doctype html><html><body>
    <div id="container"><span>chart</span></div>
    <svg id="chart" xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="5" height="5"/></svg>
  </body></html>`,
);
const {document} = dom.window;
const container = document.getElementById("container");
const svg = document.getElementById("chart");

before(() => {
  global.XMLSerializer = dom.window.XMLSerializer;
  global.XMLHttpRequest = dom.window.XMLHttpRequest;
});

after(() => {
  delete global.XMLSerializer;
  delete global.XMLHttpRequest;
});

function reset() {
  saved.length = 0;
  calls.length = 0;
  results.toBlob = null;
  results.toSvg = "";
}

/** Runs saveElement and resolves once its `callback` fires. */
function save(elem, options = {}, renderOptions) {
  return new Promise(resolve =>
    saveElement(elem, {...options, callback: resolve}, renderOptions),
  );
}

/** Reads a jsdom Blob (which lacks `.text()`) as a string. */
function readBlob(blob) {
  return new Promise(resolve => {
    const reader = new dom.window.FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsText(blob);
  });
}

it("saveElement serializes an <svg> target directly for type svg", async () => {
  reset();
  await save(svg, {filename: "chart", type: "svg"});
  assert.strictEqual(calls.length, 0, "html-to-image is not used");
  assert.strictEqual(saved.length, 1);
  const {blob, name} = saved[0];
  assert.strictEqual(name, "chart.svg");
  assert.strictEqual(blob.type, "image/svg+xml;charset=utf-8");
  const xml = await blob.text();
  assert.ok(xml.startsWith("<svg"), "the <svg> is the root");
  assert.ok(xml.includes("<rect"), "children are serialized");
  assert.ok(!xml.includes("foreignObject"), "no foreignObject wrapper");
});

it("saveElement routes an HTML container through toSvg for type svg", async () => {
  reset();
  const markup = "<svg xmlns='http://www.w3.org/2000/svg'><foreignObject/></svg>";
  results.toSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await save(container, {type: "svg"}, {background: "white"});
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].fn, "toSvg");
  assert.strictEqual(calls[0].node, container);
  assert.strictEqual(calls[0].options.backgroundColor, "white", "renderOptions are resolved");
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].name, "download.svg");
  assert.strictEqual(await readBlob(saved[0].blob), markup, "the data URL is fetched into a Blob");
});

it("saveElement routes png through toBlob", async () => {
  reset();
  results.toBlob = new Blob(["png"], {type: "image/png"});
  await save(container, {}, {pixelRatio: 2});
  assert.strictEqual(calls.length, 1);
  assert.strictEqual(calls[0].fn, "toBlob");
  assert.strictEqual(calls[0].node, container);
  assert.strictEqual(calls[0].options.pixelRatio, 2);
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].blob, results.toBlob);
  assert.strictEqual(saved[0].name, "download.png");
});

it("saveElement routes an <svg> target through toBlob for type jpg", async () => {
  reset();
  results.toBlob = new Blob(["jpg"], {type: "image/jpeg"});
  await save(svg, {filename: "chart", type: "jpg"});
  assert.strictEqual(calls[0].fn, "toBlob");
  assert.strictEqual(calls[0].node, svg);
  assert.strictEqual(saved[0].name, "chart.jpg");
});

it("saveElement saves without a callback", async () => {
  reset();
  results.toBlob = new Blob(["png"], {type: "image/png"});
  saveElement(container);
  await new Promise(resolve => setTimeout(resolve));
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].name, "download.png");
});

it("saveElement saves nothing when toBlob yields no Blob", async () => {
  reset();
  let called = false;
  saveElement(container, {callback: () => (called = true)});
  await new Promise(resolve => setTimeout(resolve));
  assert.strictEqual(saved.length, 0, "nothing is downloaded");
  assert.strictEqual(called, false, "callback does not fire");
});
