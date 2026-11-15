/**
    Pure critical path method (CPM) over a schedule whose dates are given:
    each task keeps its start and end, a finish-to-start dependency links a
    predecessor's end to its dependent's start, and a backward pass from the
    project's finish (the latest end) finds how late each task could start
    without delaying it. A task's slack is that latest start less its start;
    the tasks with none (or less, when the schedule overlaps a dependency)
    form the critical path. A milestone with a window (`accepts`), such as
    one on a day, falls at its predecessors' latest end within it.
*/

/** A task as the method reads it: its id, times (as numbers), and predecessors. */
export interface CpmInput {
  id: string;
  start: number;
  end: number;
  /** The ids of the tasks it waits on. */
  dependencies: string[];
  /**
      How long after its start a milestone may fall (0 by default): one on a
      day falls anywhere in it, at its predecessors' latest end, so those
      finishing that day hand off to it with no slack.
  */
  accepts?: number;
}

/** One task's result. */
export interface CpmTask {
  /** The task's start as given. */
  earlyStart: number;
  /** The task's end as given. */
  earlyFinish: number;
  /** The latest the task could start without delaying the finish. */
  lateStart: number;
  /** The latest the task could end without delaying the finish. */
  lateFinish: number;
  /** `lateStart - earlyStart`: negative when a dependent starts before the task ends. */
  slack: number;
  /** Whether the task has no slack (or less). */
  critical: boolean;
}

/** A finish-to-start link from a predecessor to its dependent. */
export interface CpmLink {
  from: string;
  to: string;
  /** Whether both tasks are critical and the dependent sets the predecessor's late finish. */
  critical: boolean;
}

/** The method's result. */
export interface CpmResult {
  /** Each task's result by id; empty when the links hold a cycle. */
  tasks: Map<string, CpmTask>;
  /** Every link between two of the tasks. */
  links: CpmLink[];
  /** The ids around a dependency cycle, each waiting on the one before it, or null. */
  cycle: string[] | null;
  /** Each dependency naming no task, as `[task, missing id]`. */
  missing: [string, string][];
  /** The project's finish: the latest end. */
  finish: number;
}

/**
    The links between `tasks`, and the dependencies naming none of them. A
    task listed as its own predecessor adds no link.
    @param tasks The tasks, by id (a repeated id keeps its last task).
*/
export function cpmLinks(tasks: Map<string, CpmInput>): {
  links: [string, string][];
  missing: [string, string][];
} {
  const links: [string, string][] = [];
  const missing: [string, string][] = [];
  for (const [id, task] of tasks) {
    for (const dep of new Set(task.dependencies)) {
      if (dep === id) continue;
      if (tasks.has(dep)) links.push([dep, id]);
      else missing.push([id, dep]);
    }
  }
  return {links, missing};
}

/**
    The tasks in dependency order (every predecessor before its dependents),
    or null when the links hold a cycle.
    @param ids The task ids, in their given order.
    @param links The links, `[predecessor, dependent]`.
*/
export function topologicalOrder(
  ids: string[],
  links: [string, string][],
): string[] | null {
  const indegree = new Map(ids.map(id => [id, 0]));
  const next = new Map<string, string[]>(ids.map(id => [id, []]));
  for (const [from, to] of links) {
    next.get(from)!.push(to);
    indegree.set(to, indegree.get(to)! + 1);
  }
  const queue = ids.filter(id => !indegree.get(id));
  const order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!;
    order.push(id);
    for (const to of next.get(id)!) {
      const left = indegree.get(to)! - 1;
      indegree.set(to, left);
      if (!left) queue.push(to);
    }
  }
  return order.length === ids.length ? order : null;
}

/**
    One cycle in the links, as the ids around it with each waiting on the
    one before it (and the first on the last), starting from the earliest
    id in `ids` that sits on one; null when there is none.
    @param ids The task ids, in their given order.
    @param links The links, `[predecessor, dependent]`.
*/
export function findCycle(
  ids: string[],
  links: [string, string][],
): string[] | null {
  const prev = new Map<string, string[]>(ids.map(id => [id, []]));
  for (const [from, to] of links) prev.get(to)!.push(from);
  // Peel off every task with no predecessor left; the rest wait on a cycle
  // or sit on one, and each still has a predecessor among them.
  const left = new Set(ids);
  let peeled = true;
  while (peeled) {
    peeled = false;
    for (const id of left) {
      if (!prev.get(id)!.some(p => left.has(p))) {
        left.delete(id);
        peeled = true;
      }
    }
  }
  if (!left.size) return null;
  // Walking back through predecessors from any of them meets a cycle.
  const start = ids.find(id => left.has(id))!;
  const path: string[] = [];
  const seen = new Map<string, number>();
  let id = start;
  while (!seen.has(id)) {
    seen.set(id, path.length);
    path.push(id);
    id = prev.get(id)!.find(p => left.has(p))!;
  }
  const loop = path.slice(seen.get(id)).reverse();
  const first = loop.indexOf(ids.find(i => loop.includes(i))!);
  return [...loop.slice(first), ...loop.slice(0, first)];
}

/**
    Places each task with an `accepts` window at its predecessors' latest
    end, held within the window; a task without a window, or without drawn
    predecessors, stays where it is.
    @param tasks The tasks, by id.
*/
export function placeMilestones(
  tasks: Map<string, CpmInput>,
): Map<string, CpmInput> {
  const out = new Map<string, CpmInput>();
  for (const [id, task] of tasks) {
    const window = task.accepts ?? 0;
    const ends = task.dependencies
      .filter(dep => dep !== id && tasks.has(dep))
      .map(dep => tasks.get(dep)!.end);
    if (!(window > 0) || !ends.length) {
      out.set(id, task);
      continue;
    }
    const at = Math.min(task.start + window, Math.max(task.start, ...ends));
    out.set(id, {...task, start: at, end: task.end + (at - task.start)});
  }
  return out;
}

/**
    Runs the critical path method over tasks whose dates are given (see the
    module notes). Without a cycle, every task gets its late start and
    finish, its slack, and whether it's critical; tied paths are all
    critical. With one, `cycle` names it and no task gets a result.
    @param tasks The tasks.
    @param tolerance The most slack a critical task may have, for rounding;
    a billionth of the schedule's span by default.
*/
export function criticalPath(tasks: CpmInput[], tolerance?: number): CpmResult {
  const byId = placeMilestones(new Map(tasks.map(t => [t.id, t])));
  const ids = Array.from(byId.keys());
  const {links, missing} = cpmLinks(byId);
  const all = Array.from(byId.values());
  const finish = all.length ? Math.max(...all.map(t => t.end)) : 0;
  const begin = all.length ? Math.min(...all.map(t => t.start)) : 0;
  const tol = tolerance ?? Math.max(0, finish - begin) * 1e-9;
  const order = topologicalOrder(ids, links);
  if (!order)
    return {
      tasks: new Map(),
      links: links.map(([from, to]) => ({from, to, critical: false})),
      cycle: findCycle(ids, links),
      missing,
      finish,
    };

  const next = new Map<string, string[]>(ids.map(id => [id, []]));
  for (const [from, to] of links) next.get(from)!.push(to);
  const lateStart = new Map<string, number>();
  const lateFinish = new Map<string, number>();
  for (const id of [...order].reverse()) {
    const task = byId.get(id)!;
    const lf = Math.min(finish, ...next.get(id)!.map(s => lateStart.get(s)!));
    lateFinish.set(id, lf);
    lateStart.set(id, lf - (task.end - task.start));
  }

  const out = new Map<string, CpmTask>();
  for (const id of ids) {
    const task = byId.get(id)!;
    const slack = lateStart.get(id)! - task.start;
    out.set(id, {
      earlyStart: task.start,
      earlyFinish: task.end,
      lateStart: lateStart.get(id)!,
      lateFinish: lateFinish.get(id)!,
      slack,
      critical: slack <= tol,
    });
  }
  return {
    tasks: out,
    links: links.map(([from, to]) => ({
      from,
      to,
      critical:
        out.get(from)!.critical &&
        out.get(to)!.critical &&
        Math.abs(lateStart.get(to)! - lateFinish.get(from)!) <= tol,
    })),
    cycle: null,
    missing,
    finish,
  };
}
