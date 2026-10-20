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
  results.error = null;
}

/** Runs saveElement and resolves with whatever its `callback` receives. */
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

it("saveElement passes an error to the callback when toBlob yields no Blob", async () => {
  reset();
  const error = await save(container);
  assert.ok(error instanceof Error, "callback receives an Error");
  assert.strictEqual(saved.length, 0, "nothing is downloaded");
});

it("saveElement passes toBlob's rejection to the callback", async () => {
  reset();
  results.error = new Error("tainted canvas");
  const error = await save(container, {type: "jpg"});
  assert.strictEqual(error, results.error, "an Error rejection is passed through");
  assert.strictEqual(saved.length, 0);
});

it("saveElement wraps a non-Error rejection from toSvg", async () => {
  reset();
  const event = new dom.window.Event("error");
  results.error = event;
  const error = await save(container, {type: "svg"});
  assert.ok(error instanceof Error);
  assert.strictEqual(error.cause, event, "the original rejection is the cause");
  assert.strictEqual(saved.length, 0);
});

it("saveElement passes an error to the callback when the SVG data URL can't be read", async () => {
  reset();
  results.toSvg = "data:image/svg+xml;charset=utf-8,";
  global.XMLHttpRequest = class {
    open() {}
    send() {
      setTimeout(() => this.onerror(new dom.window.ProgressEvent("error")));
    }
  };
  try {
    const error = await save(container, {type: "svg"});
    assert.ok(error instanceof Error);
    assert.strictEqual(saved.length, 0);
  } finally {
    global.XMLHttpRequest = dom.window.XMLHttpRequest;
  }
});

it("saveElement logs the error when there is no callback", async () => {
  reset();
  results.error = new Error("tainted canvas");
  const {error: consoleError} = console;
  const logged = [];
  console.error = e => logged.push(e);
  try {
    saveElement(container);
    await new Promise(resolve => setTimeout(resolve));
  } finally {
    console.error = consoleError;
  }
  assert.deepStrictEqual(logged, [results.error]);
});
