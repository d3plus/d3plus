import assert from "assert";
import {default as unique} from "../es/src/unique.js";

it("unique", () => {
  assert.strictEqual(unique(["a", "a", "b"]).join(","), "a,b", "Strings");
  assert.strictEqual(unique([1, 2, 1]).join(","), "1,2", "Numbers");

  const firstDate = new Date("1987/06/12");
  const secondDate = new Date("1987/06/12");
  assert.strictEqual(
    unique([firstDate, secondDate]).join(","),
    firstDate.toString(),
    "Dates",
  );

  const withAccessor = unique(
    [{id: 1, name: "a"}, {id: 2, name: "b"}, {id: 1, name: "c"}],
    d => d.id,
  );
  assert.strictEqual(withAccessor.length, 2, "Accessor function");
  assert.strictEqual(withAccessor[0].name, "a", "Accessor keeps first occurrence");

  const dateAccessor = unique(
    [{d: new Date("2020/01/01")}, {d: new Date("2020/01/01")}, {d: new Date("2020/06/01")}],
    d => d.d,
  );
  assert.strictEqual(dateAccessor.length, 2, "Date accessor deduplication");

  assert.strictEqual(unique([]).length, 0, "Empty array");
  assert.strictEqual(unique([42]).length, 1, "Single element");
});
