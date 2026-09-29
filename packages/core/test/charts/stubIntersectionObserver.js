// Shared IntersectionObserver stub. The visibility module keeps one observer
// per scroll root for the whole process, so every test file must use this same
// class for `instances[0]` to be that observer.
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
// suites in the same mocha process don't see it.
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

export const shared = () => StubIO.instances[0];
