import {it} from "vitest";
import assert from "assert";
import {applyConfig, hash} from "../src/renderer.ts";
import {useJsdom} from "~test/jsdom.js";

useJsdom({augment: false});

it("applyConfig passes select + left-to-right merged config to config()", () => {
  const node = document.createElement("svg");
  let received = null;
  const inst = {
    config(c) {
      received = c;
      return this;
    },
  };
  applyConfig(
    inst,
    node,
    {globalSetting: "g", shared: "global"},
    {localSetting: "l", shared: "local"},
  );
  assert.strictEqual(received.select, node, "select is the node");
  assert.strictEqual(received.globalSetting, "g", "earlier config merged");
  assert.strictEqual(received.localSetting, "l", "later config merged");
  assert.strictEqual(received.shared, "local", "later config wins on conflict");
});

it("applyConfig ignores undefined config arguments", () => {
  const node = document.createElement("svg");
  let received = null;
  const inst = {
    config(c) {
      received = c;
      return this;
    },
  };
  applyConfig(inst, node, undefined, {a: 1}, undefined);
  assert.strictEqual(received.a, 1, "defined config still applied");
});

it("applyConfig passes every loader and its *Format through config()", () => {
  const node = document.createElement("svg");
  let cfg = null;
  const called = [];
  const inst = {
    config(c) {
      cfg = c;
      return this;
    },
    data() {
      called.push("data");
    },
    links() {
      called.push("links");
    },
    nodes() {
      called.push("nodes");
    },
    topojson() {
      called.push("topojson");
    },
  };
  const df = d => d,
    lf = d => d,
    nf = d => d,
    tf = d => d;
  applyConfig(inst, node, {
    data: [1, 2],
    dataFormat: df,
    links: [1],
    linksFormat: lf,
    nodes: [2],
    nodesFormat: nf,
    topojson: {},
    topojsonFormat: tf,
    keep: "yes",
  });
  assert.deepStrictEqual(called, [], "no loader is called directly");
  assert.deepStrictEqual(cfg.data, [1, 2]);
  assert.strictEqual(cfg.dataFormat, df);
  assert.deepStrictEqual(cfg.links, [1]);
  assert.strictEqual(cfg.linksFormat, lf);
  assert.deepStrictEqual(cfg.nodes, [2]);
  assert.strictEqual(cfg.nodesFormat, nf);
  assert.deepStrictEqual(cfg.topojson, {});
  assert.strictEqual(cfg.topojsonFormat, tf);
  assert.strictEqual(cfg.keep, "yes");
});

it("applyConfig passes a *Format through even without its loader", () => {
  const node = document.createElement("svg");
  let cfg = null;
  const fmt = d => d;
  const inst = {
    config(c) {
      cfg = c;
      return this;
    },
  };
  applyConfig(inst, node, {dataFormat: fmt});
  assert.strictEqual(cfg.dataFormat, fmt);
  assert.ok(!("data" in cfg));
});

it("hash serializes functions by source", () => {
  assert.strictEqual(
    hash({x: d => d.a}),
    hash({x: d => d.a}),
    "identical source hashes equal",
  );
  assert.notStrictEqual(
    hash({x: d => d.a}),
    hash({x: d => d.b}),
    "different source hashes differ",
  );
});

it("hash tolerates circular references", () => {
  const o = {};
  o.self = o;
  assert.doesNotThrow(() => hash(o), "no throw on a circular structure");
});
