import assert from "assert";
import {setTimeout as wait} from "node:timers/promises";
import {
  canObserveVisibility,
  observeVisibility,
} from "../../es/src/charts/viz/vizVisibility.js";

class StubIO {
  static instances = [];
  constructor(cb, opts) {
    this.cb = cb;
    this.opts = opts;
    this.targets = new Set();
    StubIO.instances.push(this);
  }
  observe(el) {
    this.targets.add(el);
  }
  unobserve(el) {
    this.targets.delete(el);
  }
  fire(target, isIntersecting) {
    this.cb([{target, isIntersecting}]);
  }
}

// IntersectionObserver is stubbed only for the duration of each test so other
// suites in the same mocha process don't see it. The observer is shared per
// scroll root and persists across tests, so assertions are relative.
function withIO(fn) {
  return () => {
    globalThis.IntersectionObserver = StubIO;
    try {
      fn();
    } finally {
      delete globalThis.IntersectionObserver;
    }
  };
}

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
