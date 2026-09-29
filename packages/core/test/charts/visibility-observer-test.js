import assert from "assert";
import {setTimeout as wait} from "node:timers/promises";
import {StubIO, withIO} from "./stubIntersectionObserver.js";
import {
  canObserveVisibility,
  observeVisibility,
} from "../../es/src/charts/viz/vizVisibility.js";

it("visibility observer: is unavailable without IntersectionObserver", () => {
  assert.strictEqual(canObserveVisibility(), false);
});

it(
  "visibility observer: shares one IntersectionObserver per scroll root",
  withIO(() => {
    assert.strictEqual(canObserveVisibility(), true);
    const offA = observeVisibility({}, null, () => {});
    const io = StubIO.instances[0];
    const base = io.targets.size;
    const offB = observeVisibility({}, null, () => {});
    assert.strictEqual(StubIO.instances.length, 1);
    assert.strictEqual(io.targets.size, base + 1);
    offA();
    offB();
    assert.strictEqual(io.targets.size, base - 1);
  }),
);

it(
  "visibility observer: calls back only for the target that intersects",
  withIO(() => {
    const a = {};
    const b = {};
    const seen = [];
    const offA = observeVisibility(a, null, () => seen.push("a"));
    const offB = observeVisibility(b, null, () => seen.push("b"));
    const io = StubIO.instances[0];
    io.fire(a, false);
    io.fire(b, true);
    assert.deepStrictEqual(seen, ["b"]);
    offA();
    io.fire(a, true);
    assert.deepStrictEqual(seen, ["b"]);
    offB();
  }),
);

it("visibility observer: delay only fires for targets that stay in view", async () => {
  globalThis.IntersectionObserver = StubIO;
  try {
    const a = {};
    const b = {};
    const c = {};
    const seen = [];
    const offs = [
      observeVisibility(a, null, () => seen.push("a"), 30),
      observeVisibility(b, null, () => seen.push("b"), 30),
      observeVisibility(c, null, () => seen.push("c"), 30),
    ];
    const io = StubIO.instances[0];
    io.fire(a, true);
    io.fire(b, true);
    io.fire(c, true);
    io.fire(a, false); // scrolled past before the delay elapsed
    offs[2](); // unregistered while pending
    assert.deepStrictEqual(seen, []);
    await wait(80);
    assert.deepStrictEqual(seen, ["b"]);
    offs[0]();
    offs[1]();
  } finally {
    delete globalThis.IntersectionObserver;
  }
});

it(
  "visibility observer: onHidden runs when a target leaves view",
  withIO(() => {
    const a = {};
    const seen = [];
    const off = observeVisibility(a, null, () => seen.push("in"), 0, () => seen.push("out"));
    const io = StubIO.instances[0];
    io.fire(a, true);
    io.fire(a, false);
    assert.deepStrictEqual(seen, ["in", "out"]);
    off();
  }),
);

it(
  "visibility observer: registrations on one element are independent",
  withIO(() => {
    const el = {};
    const seen = [];
    const offA = observeVisibility(el, null, () => seen.push("a-in"), 0, () => seen.push("a-out"));
    const io = StubIO.instances[0];
    const offB = observeVisibility(el, null, () => seen.push("b-in"));
    io.fire(el, true);
    assert.deepStrictEqual(seen, ["a-in", "b-in"]);
    offB();
    assert.ok(io.targets.has(el), "still observed while another registration remains");
    io.fire(el, false);
    assert.deepStrictEqual(seen, ["a-in", "b-in", "a-out"]);
    offA();
    assert.ok(!io.targets.has(el));
  }),
);
