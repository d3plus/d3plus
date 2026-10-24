/** Options for {@link createDataPoller}. */
export interface DataPollerOptions<T> {
  /** Milliseconds between the end of one fetch and the start of the next. */
  interval: number;
  /** Fetches a fresh value. */
  fetch: () => Promise<T>;
  /** Receives each value fetched while the poller is running. */
  onData: (value: T) => void;
  /** Receives the first error of each run of consecutive failures. */
  onError: (error: unknown) => void;
  /** Whether ticks should wait (a hidden tab or an off-screen chart). */
  paused: () => boolean;
}

/** A running poller, from {@link createDataPoller}. */
export interface DataPoller {
  /** Stops the poller; a fetch still in flight is discarded. */
  stop(): void;
  /** Fetches at once if a tick came due while paused, then resumes the cadence. */
  resume(): void;
}

/**
    Calls `fetch` every `interval` ms, chaining each wait from the end of the
    previous fetch so requests never overlap. A tick that comes due while
    `paused()` is held until `resume()`. Errors are reported once per streak
    and polling continues.
    @private
*/
export function createDataPoller<T>(opts: DataPollerOptions<T>): DataPoller {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let inFlight = false;
  let missed = false;
  let failing = false;

  const schedule = (): void => {
    timer = setTimeout(tick, opts.interval);
  };

  const run = (): void => {
    missed = false;
    inFlight = true;
    Promise.resolve()
      .then(opts.fetch)
      .then(
        value => {
          if (stopped) return;
          failing = false;
          opts.onData(value);
        },
        (err: unknown) => {
          if (stopped) return;
          if (!failing) opts.onError(err);
          failing = true;
        },
      )
      .catch((err: unknown) => {
        if (!stopped) opts.onError(err);
      })
      .finally(() => {
        inFlight = false;
        if (!stopped) schedule();
      });
  };

  function tick(): void {
    timer = undefined;
    if (stopped) return;
    if (opts.paused()) missed = true;
    else run();
  }

  schedule();

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      timer = undefined;
    },
    resume() {
      if (stopped || !missed || inFlight || opts.paused()) return;
      run();
    },
  };
}
