import {describe, it} from "vitest";
import assert from "assert";
import {useJsdom} from "~test/jsdom.js";
import * as core from "../../index.ts";
import {installFluent, resolvesReset} from "../../src/fluent.ts";
import {notSetter, resetSetters} from "../../src/utils/resetSetters.ts";

useJsdom();

const {
  Axis,
  BaseClass,
  Donut,
  Geomap,
  Legend,
  Plot,
  RESET,
  Rect,
  Sankey,
  TextBox,
} = core;

/** A value's structure, with functions called on an empty row, for comparing across instances. */
function shape(value) {
  if (typeof value === "function") {
    try {
      return {fn: shape(value({}, 0))};
    } catch {
      return "[fn]";
    }
  }
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object")
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return "[object]";
    }
  return value;
}

/** Whether `value` holds the RESET token, as is or in a plain object or array. */
function holdsToken(value) {
  if (value === RESET) return true;
  if (Array.isArray(value)) return value.some(holdsToken);
  return (
    Boolean(value) &&
    typeof value === "object" &&
    Object.getPrototypeOf(value) === Object.prototype &&
    Object.values(value).some(holdsToken)
  );
}

/** The config setters of `instance`: its reflected keys and the setters a chart's `setup` gives it. */
function setters(instance) {
  const own = Object.keys(instance).filter(
    k => !notSetter(k) && typeof instance[k] === "function",
  );
  return [...new Set([...Object.keys(instance.config()), ...own])];
}

describe("every setter takes RESET directly", () => {
  for (const Cls of [
    Donut,
    Sankey,
    Geomap,
    Plot,
    Axis,
    TextBox,
    Rect,
    Legend,
  ]) {
    it(`${Cls.name}: x.key(RESET) never stores the token and matches config({key: RESET})`, () => {
      const keys = setters(new Cls());
      assert.ok(keys.length > 20, `${keys.length} setters`);
      for (const key of keys) {
        const direct = new Cls();
        direct[key](RESET);
        const value = direct[key]();
        // A method with no getter (Legend's `active`) reads back the instance.
        if (value === direct) continue;
        assert.ok(!holdsToken(value), `${key} stores the token`);
        const config = new Cls().config({[key]: RESET});
        assert.deepStrictEqual(shape(value), shape(config[key]()), key);
      }
    });
  }

  it("on(RESET) restores the default handlers", () => {
    const viz = new Donut();
    const defaults = {...viz.on()};
    viz.on("click", () => 1).on(RESET);
    assert.deepStrictEqual(viz.on(), defaults);
    assert.notStrictEqual(viz.on(), viz._configDefault.on, "a copy");
  });

  it("every d3plus class snapshots its defaults once it is constructed", () => {
    for (const [name, Cls] of Object.entries(core)) {
      if (typeof Cls !== "function") continue;
      if (Cls !== BaseClass && !(Cls.prototype instanceof BaseClass)) continue;
      assert.ok(new Cls()._configDefault, name);
    }
  });

  it("a value set before the first config() is not a default", () => {
    for (const make of [
      () => new Axis().orient("left"),
      () => new TextBox().fontSize(30),
      () => new Rect().width(80),
      () => new Plot().discreteCutoff(3),
    ]) {
      const x = make();
      const key = Object.keys(x._configDefault).find(
        k =>
          ["orient", "fontSize", "width", "discreteCutoff"].includes(k) &&
          shape(x[k]()) !== shape(x._configDefault[k]),
      );
      assert.ok(key, "set");
      x.config({[key]: RESET});
      assert.deepStrictEqual(shape(x[key]()), shape(x._configDefault[key]));
    }
  });
});

describe("resetSetters", () => {
  /** A BaseClass subclass with a hand-written setter, a tagged one, and a generated one. */
  function makeClass() {
    class Host extends BaseClass {
      // A d3plus class states its own display name (see `_constructed`).
      static _displayName = "Host";
      constructor() {
        super();
        this.schema.size = 4;
        this.schema.bag = {a: 1};
        installFluent(this, [{key: "gap", default: 2}]);
        this._constructed(new.target, Host);
      }
      size(_, extra) {
        if (!arguments.length) return this.schema.size;
        this.schema.size = extra === undefined ? _ : [_, extra];
        return this;
      }
      bag(_) {
        if (!arguments.length) return this.schema.bag;
        this.schema.bag = _;
        return this;
      }
    }
    resolvesReset(Host.prototype, "bag");
    return Host;
  }

  it("a hand-written setter given RESET receives its default", () => {
    const Host = makeClass();
    const host = new Host().size(9);
    assert.strictEqual(host.size(RESET), host);
    assert.strictEqual(host.size(), 4);
  });

  it("other calls pass through as made", () => {
    const Host = makeClass();
    const host = new Host();
    assert.strictEqual(host.size(), 4, "a getter");
    host.size(5, 6);
    assert.deepStrictEqual(host.size(), [5, 6], "every argument");
  });

  it("leaves setters that resolve RESET themselves, and generated accessors, alone", () => {
    const Host = makeClass();
    const host = new Host();
    host.bag(RESET);
    assert.strictEqual(host.bag(), RESET, "the tagged setter sees the token");
    host.gap(7).gap(RESET);
    assert.strictEqual(host.gap(), 2);
  });

  it("wraps each prototype once", () => {
    const Host = makeClass();
    new Host();
    const wrapped = Host.prototype.size;
    resetSetters(Host.prototype, notSetter);
    new Host();
    assert.strictEqual(Host.prototype.size, wrapped);
  });

  it("wraps an instance's own setters, skipping what `skip` names", () => {
    const host = new BaseClass();
    host.schema.mode = "a";
    host.schema.extra = "x";
    host._configDefault = {mode: "a", extra: "x"};
    host.mode = function (_) {
      return arguments.length
        ? ((this.schema.mode = _), this)
        : this.schema.mode;
    };
    host.extra = function (_) {
      return arguments.length
        ? ((this.schema.extra = _), this)
        : this.schema.extra;
    };
    resetSetters(host, key => key === "extra");
    host.mode("b").mode(RESET);
    assert.strictEqual(host.mode(), "a");
    host.extra(RESET);
    assert.strictEqual(host.extra(), RESET, "skipped");
  });
});

describe("notSetter", () => {
  it("names private and lifecycle methods, not config setters", () => {
    for (const key of ["_draw", "render", "config", "constructor", "toScene"])
      assert.strictEqual(notSetter(key), true, key);
    for (const key of ["data", "locale", "shapeConfig", "hover"])
      assert.strictEqual(notSetter(key), false, key);
  });
});
