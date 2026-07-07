/**
 * @d3plus/types — Unified TypeScript type definitions for the d3plus library.
 *
 * Re-exports all types from @d3plus/core and unique types from the other
 * vanilla-JS packages. React component types live in a separate entry,
 * "@d3plus/types/react", so non-React consumers don't pull @d3plus/react
 * (and React itself) into their dependency graph.
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

// @d3plus/core and @d3plus/dom both export a `D3Selection` type; the core
// definition is canonical for consumers of this unified package.
export type {D3Selection} from "@d3plus/core";
