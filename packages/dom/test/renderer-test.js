import assert from "assert";
import {applyConfig, hash} from "../es/src/renderer.js";
import it from "./jsdom.js";

it("applyConfig passes select + left-to-right merged config to config()", () => {
  const node = document.createElement("svg");
  let received = null;
  const inst = {config(c) { received = c; return this; }};
  applyConfig(inst, node, {globalSetting: "g", shared: "global"}, {localSetting: "l", shared: "local"});
  assert.strictEqual(received.select, node, "select is the node");
  assert.strictEqual(received.globalSetting, "g", "earlier config merged");
  assert.strictEqual(received.localSetting, "l", "later config merged");
  assert.strictEqual(received.shared, "local", "later config wins on conflict");
});

it("applyConfig ignores undefined config arguments", () => {
  const node = document.createElement("svg");
  let received = null;
  const inst = {config(c) { received = c; return this; }};
  applyConfig(inst, node, undefined, {a: 1}, undefined);
  assert.strictEqual(received.a, 1, "defined config still applied");
});

it("applyConfig routes data + dataFormat to data() and strips them from config()", () => {
  const node = document.createElement("svg");
  let cfg = null, dataArgs = null;
  const fmt = d => d;
  const inst = {
    config(c) { cfg = c; return this; },
    data(d, f) { dataArgs = [d, f]; },
  };
  applyConfig(inst, node, {data: [1, 2], dataFormat: fmt, keep: "yes"});
  assert.deepStrictEqual(dataArgs, [[1, 2], fmt], "data() receives the data array + formatter");
  assert.ok(cfg && !("data" in cfg) && !("dataFormat" in cfg), "data/dataFormat removed from config payload");
  assert.strictEqual(cfg.keep, "yes", "unrelated config keys preserved");
});

it("applyConfig routes every field/format pair (links, nodes, topojson)", () => {
  const node = document.createElement("svg");
  const seen = {};
  const inst = {
    config() { return this; },
    links(d, f) { seen.links = [d, f]; },
    nodes(d, f) { seen.nodes = [d, f]; },
    topojson(d, f) { seen.topojson = [d, f]; },
  };
  const lf = d => d, nf = d => d, tf = d => d;
  applyConfig(inst, node, {
    links: [1], linksFormat: lf,
    nodes: [2], nodesFormat: nf,
    topojson: {}, topojsonFormat: tf,
  });
  assert.deepStrictEqual(seen.links, [[1], lf], "links() routed");
  assert.deepStrictEqual(seen.nodes, [[2], nf], "nodes() routed");
  assert.deepStrictEqual(seen.topojson, [{}, tf], "topojson() routed");
});

it("applyConfig leaves a field alone when its formatter is absent", () => {
  const node = document.createElement("svg");
  let cfg = null, dataCalled = false;
  const inst = {
    config(c) { cfg = c; return this; },
    data() { dataCalled = true; },
  };
  applyConfig(inst, node, {data: [1, 2, 3]});
  assert.strictEqual(dataCalled, false, "data() is not called without a formatter");
  assert.deepStrictEqual(cfg.data, [1, 2, 3], "data stays in the config payload");
});

it("hash serializes functions by source", () => {
  assert.strictEqual(hash({x: d => d.a}), hash({x: d => d.a}), "identical source hashes equal");
  assert.notStrictEqual(hash({x: d => d.a}), hash({x: d => d.b}), "different source hashes differ");
});

it("hash tolerates circular references", () => {
  const o = {};
  o.self = o;
  assert.doesNotThrow(() => hash(o), "no throw on a circular structure");
});
