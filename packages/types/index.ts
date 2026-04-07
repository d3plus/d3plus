/**
 * @d3plus/types — Unified TypeScript type definitions for the d3plus library.
 *
 * Re-exports all types from @d3plus/core and unique types from other packages.
 * For React component types, use the "@d3plus/react" package directly or
 * import from "@d3plus/types/react" to avoid name collisions with core classes.
 */

export * from "@d3plus/core";
export * from "@d3plus/color";
export * from "@d3plus/data";
export * from "@d3plus/dom";
export * from "@d3plus/export";
export * from "@d3plus/format";
export * from "@d3plus/locales";
export * from "@d3plus/math";
export * from "@d3plus/text";

// Re-export only the types unique to @d3plus/react (not the component functions
// which share names with @d3plus/core classes).
export type { D3plusComponentProps, D3plusConstructor, RendererProps } from "@d3plus/react";
export { D3plusContext } from "@d3plus/react";
