import {it} from "vitest";
import assert from "assert";
import {
  cpmLinks,
  criticalPath,
  findCycle,
  topologicalOrder,
} from "../../src/charts/Gantt/criticalPath.ts";

/**
    The critical path method over given dates: late starts and finishes
    from a backward pass off the latest end, slack, critical tasks and
    links, ties, negative slack, cycles, and missing predecessors.
*/

const task = (id, start, end, dependencies = []) => ({
  id,
  start,
  end,
  dependencies,
});

/** A → B → D is critical; A → C → D has a day of slack. */
const diamond = [
  task("A", 0, 2),
  task("B", 2, 5, ["A"]),
  task("C", 2, 4, ["A"]),
  task("D", 5, 9, ["B", "C"]),
];

const pick = (result, key) =>
  Object.fromEntries([...result.tasks].map(([id, t]) => [id, t[key]]));

it("criticalPath: late starts, finishes, and slack from the latest end", () => {
  const result = criticalPath(diamond);
  assert.strictEqual(result.finish, 9);
  assert.strictEqual(result.cycle, null);
  assert.deepStrictEqual(pick(result, "lateFinish"), {A: 2, B: 5, C: 5, D: 9});
  assert.deepStrictEqual(pick(result, "lateStart"), {A: 0, B: 2, C: 3, D: 5});
  assert.deepStrictEqual(pick(result, "slack"), {A: 0, B: 0, C: 1, D: 0});
  assert.deepStrictEqual(pick(result, "critical"), {
    A: true,
    B: true,
    C: false,
    D: true,
  });
  // The dates are taken as given, not rescheduled.
  assert.deepStrictEqual(pick(result, "earlyStart"), {A: 0, B: 2, C: 2, D: 5});
  assert.deepStrictEqual(pick(result, "earlyFinish"), {
    A: 2,
    B: 5,
    C: 4,
    D: 9,
  });
});

it("criticalPath: a link is critical when both ends are and it sets the late finish", () => {
  const {links} = criticalPath(diamond);
  assert.deepStrictEqual(
    links.map(l => `${l.from}>${l.to}:${l.critical}`),
    ["A>B:true", "A>C:false", "B>D:true", "C>D:false"],
  );
});

it("criticalPath: tied chains are all critical", () => {
  const result = criticalPath([
    task("A", 0, 2),
    task("B", 2, 6, ["A"]),
    task("C", 2, 6, ["A"]),
    task("D", 6, 8, ["B", "C"]),
  ]);
  assert.deepStrictEqual(pick(result, "critical"), {
    A: true,
    B: true,
    C: true,
    D: true,
  });
  assert.ok(result.links.every(l => l.critical));
});

it("criticalPath: a gap before a dependent is slack", () => {
  const result = criticalPath([task("A", 0, 2), task("B", 3, 5, ["A"])]);
  assert.deepStrictEqual(pick(result, "slack"), {A: 1, B: 0});
  assert.deepStrictEqual(pick(result, "critical"), {A: false, B: true});
  assert.strictEqual(result.links[0].critical, false);
});

it("criticalPath: a dependent starting before its predecessor ends leaves negative slack", () => {
  const result = criticalPath([task("A", 0, 4), task("B", 3, 6, ["A"])]);
  assert.deepStrictEqual(pick(result, "slack"), {A: -1, B: 0});
  assert.deepStrictEqual(pick(result, "critical"), {A: true, B: true});
  assert.strictEqual(result.links[0].critical, true);
});

it("criticalPath: a lone task ending last is the critical path", () => {
  const result = criticalPath([
    task("A", 0, 2),
    task("B", 2, 4, ["A"]),
    task("Docs", 0, 6),
  ]);
  assert.deepStrictEqual(pick(result, "slack"), {A: 2, B: 2, Docs: 0});
  assert.deepStrictEqual(pick(result, "critical"), {
    A: false,
    B: false,
    Docs: true,
  });
});

it("criticalPath: milestones (zero-length tasks) chain like any task", () => {
  const result = criticalPath([
    task("A", 0, 3),
    task("M", 3, 3, ["A"]),
    task("B", 3, 5, ["M"]),
  ]);
  assert.deepStrictEqual(pick(result, "critical"), {A: true, M: true, B: true});
  assert.ok(result.links.every(l => l.critical));
});

it("criticalPath: tolerance absorbs rounding, and defaults to a sliver of the span", () => {
  const tasks = [task("A", 0, 0.1 + 0.2), task("B", 0.3, 1, ["A"])];
  assert.ok(criticalPath(tasks).tasks.get("A").critical, "within rounding");
  const gap = [task("A", 0, 2), task("B", 2.5, 5, ["A"])];
  assert.strictEqual(criticalPath(gap).tasks.get("A").critical, false);
  assert.strictEqual(criticalPath(gap, 0.5).tasks.get("A").critical, true);
});

it("criticalPath: a cycle is named and leaves every task without a result", () => {
  const result = criticalPath([
    task("A", 0, 2, ["C"]),
    task("B", 2, 4, ["A"]),
    task("C", 4, 6, ["B"]),
    task("D", 6, 8, ["C"]),
  ]);
  assert.deepStrictEqual(result.cycle, ["A", "B", "C"]);
  assert.strictEqual(result.tasks.size, 0);
  assert.ok(result.links.every(l => !l.critical));
});

it("criticalPath: missing predecessors and self-dependencies add no link", () => {
  const result = criticalPath([
    task("A", 0, 2, ["A", "Z"]),
    task("B", 2, 4, ["A", "A"]),
  ]);
  assert.deepStrictEqual(result.missing, [["A", "Z"]]);
  assert.deepStrictEqual(
    result.links.map(l => [l.from, l.to]),
    [["A", "B"]],
  );
  assert.deepStrictEqual(pick(result, "critical"), {A: true, B: true});
});

it("criticalPath: no tasks gives an empty result", () => {
  const result = criticalPath([]);
  assert.strictEqual(result.tasks.size, 0);
  assert.deepStrictEqual(result.links, []);
  assert.strictEqual(result.cycle, null);
});

it("cpmLinks lists links between tasks and the dependencies naming none", () => {
  const byId = new Map(
    [task("A", 0, 1, ["X"]), task("B", 1, 2, ["A", "B"])].map(t => [t.id, t]),
  );
  assert.deepStrictEqual(cpmLinks(byId), {
    links: [["A", "B"]],
    missing: [["A", "X"]],
  });
});

it("topologicalOrder puts predecessors first, or gives null on a cycle", () => {
  assert.deepStrictEqual(
    topologicalOrder(
      ["D", "C", "B", "A"],
      [
        ["A", "B"],
        ["B", "D"],
        ["C", "D"],
      ],
    ),
    ["C", "A", "B", "D"],
  );
  assert.strictEqual(
    topologicalOrder(
      ["A", "B"],
      [
        ["A", "B"],
        ["B", "A"],
      ],
    ),
    null,
  );
});

it("findCycle walks to a cycle past the tasks only waiting on it", () => {
  const links = [
    ["A", "B"],
    ["B", "C"],
    ["C", "B"],
    ["C", "D"],
  ];
  assert.deepStrictEqual(findCycle(["A", "B", "C", "D"], links), ["B", "C"]);
  assert.deepStrictEqual(findCycle(["D", "C", "B", "A"], links), ["C", "B"]);
  assert.strictEqual(findCycle(["A", "B"], [["A", "B"]]), null);
  assert.deepStrictEqual(
    findCycle(
      ["X", "Y", "Z"],
      [
        ["Z", "X"],
        ["X", "Y"],
        ["Y", "Z"],
      ],
    ),
    ["X", "Y", "Z"],
  );
});
