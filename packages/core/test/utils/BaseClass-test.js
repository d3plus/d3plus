import assert from "assert";
import {default as BaseClass} from "../../es/src/utils/BaseClass.js";
import {default as RESET} from "../../es/src/utils/RESET.js";

it("BaseClass", () => {
  const one = new BaseClass(),
    two = new BaseClass();
  assert.ok(one._uuid !== two._uuid, "_uuid");

  // config getter returns object with method values
  const cfg = one.config();
  assert.ok(typeof cfg === "object", "config() returns object");
  assert.ok("locale" in cfg, "config includes locale");

  // config setter applies values
  one.config({locale: "es"});
  assert.ok(one._locale.startsWith("es"), "config setter applies locale");

  // locale getter/setter
  const inst = new BaseClass();
  assert.strictEqual(inst.locale(), "en-US", "locale default");
  inst.locale("fr");
  assert.ok(inst.locale().startsWith("fr"), "locale setter");

  // on getter/setter
  assert.ok(typeof inst.on() === "object", "on() returns object");
  const handler = () => {};
  inst.on("click", handler);
  assert.strictEqual(inst.on("click"), handler, "on(name) returns handler");
  inst.on({hover: handler});
  assert.strictEqual(inst.on("hover"), handler, "on(object) sets handlers");

  // parent getter/setter
  assert.ok(typeof inst.parent() === "object", "parent() returns object");
  inst.parent({test: true});
  assert.strictEqual(inst.parent().test, true, "parent setter");

  // translate getter/setter
  assert.ok(typeof inst.translate() === "function", "translate() returns function");
  const customTranslate = d => d.toUpperCase();
  inst.translate(customTranslate);
  assert.strictEqual(inst.translate()("hello"), "HELLO", "custom translate");

  // shapeConfig getter/setter
  inst.shapeConfig({fill: "red"});
  assert.strictEqual(inst.shapeConfig().fill, "red", "shapeConfig setter");
  inst.shapeConfig({stroke: "blue"});
  assert.strictEqual(inst.shapeConfig().fill, "red", "shapeConfig merges");
  assert.strictEqual(inst.shapeConfig().stroke, "blue", "shapeConfig merges new keys");

  // RESET via config
  const r = new BaseClass();
  r.config(); // initialize _configDefault while locale is still en-US
  r.config({locale: "es"});
  assert.ok(r.locale().startsWith("es"), "locale changed before reset");
  r.config({locale: RESET});
  assert.strictEqual(r.locale(), "en-US", "locale reset to default");

  // config with unknown key does not throw
  r.config({nonExistentProp: "value"});
  assert.ok(true, "unknown config key ignored");

  // config with nested object
  r.shapeConfig({nested: {a: 1}});
  r.config({shapeConfig: {nested: {b: 2}}});
  assert.ok(typeof r.shapeConfig() === "object", "nested config applied");

  // on RESET
  const r2 = new BaseClass();
  r2.config(); // snapshot defaults before adding handler
  r2.on("click", () => {});
  assert.ok(r2.on("click"), "on handler set");
  r2.config({on: RESET});
  assert.strictEqual(r2.on("click"), undefined, "on handlers reset");

  // default translate uses built-in dictionary
  const r3 = new BaseClass();
  const translated = r3.translate()("Back");
  assert.ok(typeof translated === "string", "built-in translate returns string");
});
