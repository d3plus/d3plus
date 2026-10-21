/**
 * @d3plus/types — Unified TypeScript type definitions for the d3plus library.
 *
 * Re-exports all types from @d3plus/core and unique types from the other
 * vanilla-JS packages. React component types live in a separate entry,
 * "@d3plus/types/react", so non-React consumers don't pull @d3plus/react
 * (and React itself) into their dependency graph. The re-exports are
 * type-only, so importing this entry adds no runtime code.
 */

export type * from "@d3plus/core";
export type * from "@d3plus/color";
export type * from "@d3plus/data";
export type * from "@d3plus/dom";
export type * from "@d3plus/export";
export type * from "@d3plus/format";
export type * from "@d3plus/locales";
export type * from "@d3plus/math";
export type * from "@d3plus/text";

// @d3plus/core and @d3plus/dom both export a `D3Selection` type; the core
// definition is canonical for consumers of this unified package.
export type {D3Selection} from "@d3plus/core";
