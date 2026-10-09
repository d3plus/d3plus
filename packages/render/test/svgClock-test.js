import assert from "assert";
import {delayTransitions, trackTransition} from "../es/src/svg/svgClock.js";

it("svgClock: delayTransitions delays every transition and skips one already started", () => {
  const delays = [];
  const ok = {delay: v => delays.push(v)};
  const started = {
    delay: () => {
      throw new Error("too late; already scheduled");
    },
  };
  delayTransitions([ok, started, ok], 40);
  assert.deepStrictEqual(delays, [40, 40]);
});

it("svgClock: trackTransition returns the child, registering it only under a clocked root", () => {
  const child = {delay: () => undefined};
  assert.strictEqual(
    trackTransition(child, {}),
    child,
    "an untracked root is a no-op",
  );
});
