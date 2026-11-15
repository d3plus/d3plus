import {it} from "vitest";
import assert from "assert";
import {
  cpmLinks,
  criticalPath,
  findCycle,
  placeMilestones,
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

it("placeMilestones puts a windowed task at its predecessors' latest end, within its window", () => {
  const byId = tasks => new Map(tasks.map(t => [t.id, t]));
  const m = (start, deps, accepts = 1) => ({
    id: "M",
    start,
    end: start,
    dependencies: deps,
    accepts,
  });
  const at = (tasks, id = "M") => placeMilestones(byId(tasks)).get(id);
  // Inside the window: at the latest predecessor end.
  const inside = at([task("A", 0, 5.5), task("B", 0, 5.2), m(5, ["A", "B"])]);
  assert.deepStrictEqual([inside.start, inside.end], [5.5, 5.5]);
  // Before the window: at its start; past it: at its end.
  assert.strictEqual(at([task("A", 0, 4), m(5, ["A"])]).start, 5);
  assert.strictEqual(at([task("A", 0, 7), m(5, ["A"])]).start, 6);
  // No window, no drawn predecessors, or only itself: unchanged.
  const plain = m(5, ["A"], 0);
  assert.strictEqual(at([task("A", 0, 5.5), plain]), plain);
  const lone = m(5, ["Gone", "M"]);
  assert.strictEqual(at([lone]), lone);
});

it("criticalPath: a milestone on its predecessor's last day hands off with no slack", () => {
  // Days are 1 long: A runs through day 4 (ends at 5), M is on day 4.
  const result = criticalPath([
    task("A", 0, 5),
    {id: "M", start: 4, end: 4, dependencies: ["A"], accepts: 1},
    task("B", 5, 7, ["M"]),
  ]);
  assert.deepStrictEqual(pick(result, "slack"), {A: 0, M: 0, B: 0});
  assert.ok(result.links.every(l => l.critical));
  // As the last task, it still ends the project with no slack.
  const last = criticalPath([
    task("A", 0, 5),
    {id: "M", start: 4, end: 4, dependencies: ["A"], accepts: 1},
  ]);
  assert.deepStrictEqual(pick(last, "slack"), {A: 0, M: 0});
  // Without a window it sits at the start of its day, a day before B
  // starts: M is left a day of slack, which breaks the chain.
  const none = criticalPath([
    task("A", 0, 5),
    {id: "M", start: 4, end: 4, dependencies: ["A"]},
    task("B", 5, 7, ["M"]),
  ]);
  assert.deepStrictEqual(pick(none, "slack"), {A: 0, M: 1, B: 0});
});
