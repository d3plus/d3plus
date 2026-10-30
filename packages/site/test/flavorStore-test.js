import {afterEach, beforeEach, describe, it, vi} from "vitest";
import assert from "node:assert/strict";

import {
  onFlavor,
  readFlavor,
  writeFlavor,
} from "../src/components/Playground/flavorStore.ts";

/** A Map-backed stand-in for `localStorage`. */
const memoryStorage = () => {
  const items = new Map();
  return {
    getItem: key => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
  };
};

describe("flavorStore", () => {
  beforeEach(() => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("localStorage", memoryStorage());
  });
  afterEach(() => vi.unstubAllGlobals());

  it("is null before any choice", () => {
    assert.equal(readFlavor(), null);
  });
  it("remembers a choice under Starlight's synced-tabs key", () => {
    writeFlavor("Vue");
    assert.equal(readFlavor(), "Vue");
    assert.equal(localStorage.getItem("starlight-synced-tabs__flavor"), "Vue");
  });
  it("tells listeners, until they unsubscribe", () => {
    const heard = [];
    const off = onFlavor(label => heard.push(label));
    writeFlavor("React");
    off();
    writeFlavor("Svelte");
    assert.deepEqual(heard, ["React"]);
  });
  it("still tells listeners when storage throws", () => {
    vi.stubGlobal("localStorage", {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("SecurityError");
      },
    });
    const heard = [];
    onFlavor(label => heard.push(label));
    writeFlavor("Angular");
    assert.deepEqual(heard, ["Angular"]);
    assert.equal(readFlavor(), null);
  });
});
