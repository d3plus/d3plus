import {it} from "vitest";
import assert from "assert";
import {
  NODE_KEY_STEP,
  installNodeKeys,
  nodeKeyShortcuts,
  nodeKeyStep,
} from "../../internal.ts";

/**
    Moving a focused node from the keyboard: Shift and an arrow key nudge it,
    Shift+Backspace puts it back, and each change is announced through
    keyboard navigation's live region.
*/

const key = (k, shiftKey = true) => ({key: k, shiftKey});

it("nodeKeyStep: Shift and an arrow move a step; up and down only when vertical", () => {
  assert.deepStrictEqual(nodeKeyStep(key("ArrowLeft")), [-NODE_KEY_STEP, 0]);
  assert.deepStrictEqual(nodeKeyStep(key("ArrowDown")), [0, NODE_KEY_STEP]);
  assert.strictEqual(nodeKeyStep(key("ArrowLeft", false)), null);
  assert.strictEqual(nodeKeyStep(key("Enter")), null);
  assert.strictEqual(nodeKeyStep(key("ArrowRight"), true), null);
  assert.deepStrictEqual(nodeKeyStep(key("ArrowUp"), true), [
    0,
    -NODE_KEY_STEP,
  ]);
});

it("nodeKeyShortcuts: the keys as aria-keyshortcuts lists them", () => {
  assert.strictEqual(
    nodeKeyShortcuts(),
    "Shift+ArrowLeft Shift+ArrowRight Shift+ArrowUp Shift+ArrowDown Shift+Backspace",
  );
  assert.strictEqual(
    nodeKeyShortcuts(true),
    "Shift+ArrowUp Shift+ArrowDown Shift+Backspace",
  );
});

/** A stand-in chart with node `a` focused, and its moves logged. */
function fixture({enabled = true, vertical = false, current} = {}) {
  const calls = [];
  const viz = {
    schema: {
      translate: (s, _locale, ...args) =>
        `[${s.replace("{0}", args[0] ?? "{0}")}]`,
    },
    _keyboardNav: {
      current: current === undefined ? "node-a" : current,
      live: {textContent: ""},
    },
    _paintedScene: {
      root: {
        children: [
          {
            type: "circle",
            key: "node-a",
            cx: 10,
            cy: 10,
            r: 5,
            datum: {id: "a"},
            aria: {label: "Alpha."},
          },
        ],
      },
    },
  };
  installNodeKeys(viz, {
    nodeAt: k => (k === "node-a" ? "a" : null),
    nudge: (id, by) => (calls.push(["nudge", id, by]), true),
    reset: id => (calls.push(["reset", id]), id === "a"),
    enabled: () => enabled,
    vertical,
    messages: {nudge: "{0} moved", reset: "{0} back"},
    instructions: "Move it.",
  });
  return {viz, calls, gesture: viz._keyboardGesture};
}

it("installNodeKeys: nudges the focused node and announces it", () => {
  const {viz, calls, gesture} = fixture();
  assert.strictEqual(gesture.keydown(key("ArrowRight")), true);
  assert.deepStrictEqual(calls, [["nudge", "a", [NODE_KEY_STEP, 0]]]);
  assert.strictEqual(viz._keyboardNav.live.textContent, "[Alpha moved]");
  assert.strictEqual(viz._keyboardNav.announce, "[Alpha moved]");
  assert.strictEqual(gesture.keydown(key("Backspace")), true);
  assert.deepStrictEqual(calls[1], ["reset", "a"]);
  assert.strictEqual(viz._keyboardNav.live.textContent, "[Alpha back]");
});

it("installNodeKeys: leaves plain arrows, other marks, and a disabled chart to navigation", () => {
  const {calls, gesture} = fixture();
  assert.strictEqual(gesture.keydown(key("ArrowRight", false)), false);
  assert.strictEqual(gesture.keydown(key("Backspace", false)), false);
  const other = fixture({current: "legend-a"});
  assert.strictEqual(other.gesture.keydown(key("ArrowRight")), false);
  const none = fixture({current: null});
  assert.strictEqual(none.gesture.keydown(key("ArrowRight")), false);
  const off = fixture({enabled: false});
  assert.strictEqual(off.gesture.keydown(key("ArrowRight")), false);
  assert.strictEqual(off.gesture.keys(), null);
  assert.deepStrictEqual(calls, []);
});

it("installNodeKeys: up and down only when vertical; its keys and instructions", () => {
  const {calls, gesture} = fixture({vertical: true});
  assert.strictEqual(gesture.keydown(key("ArrowLeft")), false);
  assert.strictEqual(gesture.keydown(key("ArrowUp")), true);
  assert.deepStrictEqual(calls, [["nudge", "a", [0, -NODE_KEY_STEP]]]);
  assert.deepStrictEqual(gesture.keys(), {
    shortcuts: "Shift+ArrowUp Shift+ArrowDown Shift+Backspace",
    instructions: "[Move it.]",
  });
});
