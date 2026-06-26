/**
    UMD/CDN bundle entry — superset of the ESM entry.

    The typed ESM API is intentionally curated: `@d3plus/core` exposes the
    stable public surface (`./index.ts`) and the v4 pipeline lives behind the
    opt-in `@d3plus/core/internal` subpath (`./internal.ts`). The standalone
    UMD global (`window.d3plus`) has no `.d.ts` and is a convenience build, so
    it carries both — advanced/browser consumers and the in-browser parity
    tests can reach the pipeline through the same global.

    This file is the rollup input for the UMD build only; it is not part of
    the package's `exports` map.
*/
export * from "./index.js";
export * from "./internal.js";
