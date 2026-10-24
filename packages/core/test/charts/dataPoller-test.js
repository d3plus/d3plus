import {afterEach, beforeEach, it, vi} from "vitest";
import assert from "assert";
import {createDataPoller} from "../../src/charts/viz/dataPoller.ts";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

/** A poller over a scripted fetch, recording what it hands back. */
function poller({interval = 100, responses = [], paused = () => false} = {}) {
  const log = {fetches: 0, data: [], errors: []};
  let pending;
  const fetch = () => {
    log.fetches++;
    const next = responses.shift();
    if (next === "hang")
      return new Promise((resolve, reject) => (pending = {resolve, reject}));
    if (next instanceof Error) return Promise.reject(next);
    return Promise.resolve(next ?? log.fetches);
  };
  const p = createDataPoller({
    interval,
    fetch,
    onData: v => log.data.push(v),
    onError: e => log.errors.push(e.message),
    paused,
  });
  return {p, log, settle: v => pending.resolve(v)};
}

it("createDataPoller: fetches every interval and hands each value to onData", async () => {
  const {p, log} = poller({responses: ["a", "b", "c"]});
  await vi.advanceTimersByTimeAsync(99);
  assert.strictEqual(log.fetches, 0, "waits a full interval first");
  await vi.advanceTimersByTimeAsync(1);
  assert.deepStrictEqual(log.data, ["a"]);
  await vi.advanceTimersByTimeAsync(200);
  assert.deepStrictEqual(log.data, ["a", "b", "c"]);
  p.stop();
});

it("createDataPoller: never overlaps requests, waiting an interval after each response", async () => {
  const {p, log, settle} = poller({responses: ["hang", "next"]});
  await vi.advanceTimersByTimeAsync(100);
  assert.strictEqual(log.fetches, 1);
  await vi.advanceTimersByTimeAsync(500);
  assert.strictEqual(
    log.fetches,
    1,
    "no second request while one is in flight",
  );
  settle("slow");
  await vi.advanceTimersByTimeAsync(0);
  assert.deepStrictEqual(log.data, ["slow"]);
  await vi.advanceTimersByTimeAsync(99);
  assert.strictEqual(log.fetches, 1);
  await vi.advanceTimersByTimeAsync(1);
  assert.deepStrictEqual(log.data, ["slow", "next"]);
  p.stop();
});

it("createDataPoller: reports one error per failure streak and keeps polling", async () => {
  const fail = () => new Error("down");
  const {p, log} = poller({responses: [fail(), fail(), fail(), "ok", fail()]});
  await vi.advanceTimersByTimeAsync(300);
  assert.deepStrictEqual(
    log.errors,
    ["down"],
    "warned once for three failures",
  );
  await vi.advanceTimersByTimeAsync(100);
  assert.deepStrictEqual(log.data, ["ok"]);
  await vi.advanceTimersByTimeAsync(100);
  assert.deepStrictEqual(
    log.errors,
    ["down", "down"],
    "a new streak warns again",
  );
  p.stop();
});

it("createDataPoller: an onData that throws is reported as an error", async () => {
  const errors = [];
  const p = createDataPoller({
    interval: 100,
    fetch: () => Promise.resolve(1),
    onData: () => {
      throw new Error("draw");
    },
    onError: e => errors.push(e.message),
    paused: () => false,
  });
  await vi.advanceTimersByTimeAsync(100);
  assert.deepStrictEqual(errors, ["draw"]);
  p.stop();
});

it("createDataPoller: a tick due while paused waits, and resume() fetches at once", async () => {
  let paused = true;
  const {p, log} = poller({paused: () => paused});
  await vi.advanceTimersByTimeAsync(1000);
  assert.strictEqual(log.fetches, 0, "nothing fetched while paused");
  p.resume();
  assert.strictEqual(log.fetches, 0, "resume() while still paused waits");
  paused = false;
  p.resume();
  await vi.advanceTimersByTimeAsync(0);
  assert.strictEqual(log.fetches, 1, "the missed tick runs on resume");
  p.resume();
  await vi.advanceTimersByTimeAsync(0);
  assert.strictEqual(log.fetches, 1, "a second resume() adds nothing");
  await vi.advanceTimersByTimeAsync(100);
  assert.strictEqual(log.fetches, 2, "then the cadence resumes");
  p.stop();
});

it("createDataPoller: resume() without a missed tick keeps the cadence", async () => {
  const {p, log} = poller();
  await vi.advanceTimersByTimeAsync(50);
  p.resume();
  await vi.advanceTimersByTimeAsync(0);
  assert.strictEqual(log.fetches, 0);
  await vi.advanceTimersByTimeAsync(50);
  assert.strictEqual(log.fetches, 1);
  p.stop();
});

it("createDataPoller: stop() clears the timer and discards a fetch in flight", async () => {
  const {p, log, settle} = poller({responses: ["hang"]});
  await vi.advanceTimersByTimeAsync(100);
  p.stop();
  settle("late");
  await vi.advanceTimersByTimeAsync(1000);
  assert.deepStrictEqual(log.data, []);
  assert.strictEqual(log.fetches, 1);
  assert.strictEqual(vi.getTimerCount(), 0);
  p.resume();
  await vi.advanceTimersByTimeAsync(1000);
  assert.strictEqual(log.fetches, 1, "a stopped poller never resumes");
});
