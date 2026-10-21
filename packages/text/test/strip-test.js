import assert from "assert";
import {default as strip} from "../es/src/strip.js";

it("strip", () => {
  assert.strictEqual(strip("one two"), "one-two", "Strips Spaces");
  assert.strictEqual(
    strip("one two", " "),
    "one two",
    "Changes Spacer Argument",
  );
  assert.strictEqual(strip("one@two"), "onetwo", "Strips Non-character");
  assert.strictEqual(strip("á"), "a", "Strips Diacritic");
  assert.strictEqual(strip("Čeština Ğ"), "Cestina-G", "Strips Diacritics Beyond Latin-1");
  assert.strictEqual(strip("Æsir Øre ß"), "AEsir-Ore-B", "Maps Letters Without A Decomposition");
  assert.strictEqual(strip("ł"), "", "Drops Letters Without An ASCII Form");
  assert.strictEqual(strip("والاجتماعية"), "والاجتماعية", "Keeps Arabic");
});
