/**
    Work spread over the browser's idle time: jobs run in short turns from
    `requestIdleCallback` (or `setTimeout` where it is missing), so no turn
    keeps the main thread busy for long.
*/

/** What `requestIdleCallback` hands its callback. */
interface IdleDeadline {
  timeRemaining(): number;
}

/** The longest a turn runs, in milliseconds, however long the browser stays idle. */
export const IDLE_BUDGET = 12;

/** The longest a job waits for an idle moment before it runs anyway, in milliseconds. */
const IDLE_TIMEOUT = 2000;

/** Calls `fn` at the next idle moment, or soon after when the browser has no idle callbacks. */
export function requestIdle(fn: (deadline?: IdleDeadline) => void): void {
  const ric = (
    globalThis as {
      requestIdleCallback?: (
        fn: (deadline: IdleDeadline) => void,
        options?: {timeout: number},
      ) => number;
    }
  ).requestIdleCallback;
  if (typeof ric === "function") ric(fn, {timeout: IDLE_TIMEOUT});
  else setTimeout(() => fn(undefined), 1);
}

/** A job: each `step` works for about `budget` milliseconds (at least one unit), and returns whether it is done. */
export interface IdleJob {
  step(budget: number): boolean;
}

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

/**
    Jobs keyed by name, run one after another in idle turns. Callbacks
    passed to `beforeNext` run at the start of the next turn, before any job.
*/
export class IdleQueue {
  private jobs = new Map<string, IdleJob>();
  private before: (() => void)[] = [];
  private waiting = false;

  /** How many jobs are waiting or running. */
  get size(): number {
    return this.jobs.size;
  }

  /** Whether a job named `key` is waiting or running. */
  has(key: string): boolean {
    return this.jobs.has(key);
  }

  /** Queues `job` under `key`, unless a job of that name is already queued. */
  add(key: string, job: IdleJob): void {
    if (this.jobs.has(key)) return;
    this.jobs.set(key, job);
    this.wake();
  }

  /** Cancels every job whose name isn't in `keys`. */
  keep(keys: Set<string>): void {
    for (const key of [...this.jobs.keys()])
      if (!keys.has(key)) this.jobs.delete(key);
  }

  /** Runs `fn` at the start of the next idle turn. */
  beforeNext(fn: () => void): void {
    this.before.push(fn);
    this.wake();
  }

  private wake(): void {
    if (this.waiting) return;
    this.waiting = true;
    requestIdle(deadline => this.turn(deadline));
  }

  /** One idle turn: the `beforeNext` callbacks, then jobs until the turn's time is up. */
  private turn(deadline?: IdleDeadline): void {
    this.waiting = false;
    const start = now();
    const budget = Math.min(
      IDLE_BUDGET,
      deadline ? deadline.timeRemaining() : IDLE_BUDGET,
    );
    for (const fn of this.before.splice(0)) fn();
    for (const [key, job] of this.jobs) {
      const left = budget - (now() - start);
      if (job.step(left) && this.jobs.get(key) === job) this.jobs.delete(key);
      if (now() - start >= budget) break;
    }
    if (this.jobs.size || this.before.length) this.wake();
  }
}

const queues = new WeakMap<object, IdleQueue>();

/** The idle queue of `owner` (a chart), made on first use. */
export function idleQueue(owner: object): IdleQueue {
  let queue = queues.get(owner);
  if (!queue) queues.set(owner, (queue = new IdleQueue()));
  return queue;
}
