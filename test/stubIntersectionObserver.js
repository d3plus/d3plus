// Shared IntersectionObserver stub. The visibility module keeps one observer
// per scroll root for the whole process, so every test file must use this same
// class for `instances[0]` to be the viewport's observer.
export class StubIO {
  static instances = [];
  constructor(cb, opts) {
    this.cb = cb;
    this.opts = opts;
    this.targets = new Set();
    StubIO.instances.push(this);
  }
  observe(el) {
    this.targets.add(el);
  }
  unobserve(el) {
    this.targets.delete(el);
  }
  fire(target, isIntersecting) {
    this.cb([{target, isIntersecting}]);
  }
}

// IntersectionObserver is stubbed only for the duration of each test so other
// tests on the same page don't see it.
export function withIO(fn) {
  return () => {
    globalThis.IntersectionObserver = StubIO;
    try {
      fn();
    } finally {
      delete globalThis.IntersectionObserver;
    }
  };
}

// The observer created most recently, for a scroll root a test has to itself.
export const latest = () => StubIO.instances.at(-1);
