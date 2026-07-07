/**
 * @d3plus/types/react — React-specific type definitions for d3plus.
 *
 * Kept separate from the main "@d3plus/types" entry so that non-React
 * consumers don't pull `@d3plus/react` (and its React peer dependencies)
 * into their dependency graph. Import this only in React projects:
 *
 * ```ts
 * import type {D3plusComponentProps} from "@d3plus/types/react";
 * import {D3plusContext} from "@d3plus/types/react";
 * ```
 */

// Only the types unique to @d3plus/react (not the component functions, which
// share names with @d3plus/core classes).
export type {D3plusComponentProps, D3plusConstructor, RendererProps} from "@d3plus/react";
export {D3plusContext} from "@d3plus/react";
