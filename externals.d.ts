/**
 * Ambient module declarations for external packages that lack TypeScript types.
 * Included via tsconfig.base.json so all packages can import these without errors.
 */

declare module "d3-composite-projections";
declare module "d3-geo-projection";

declare module "hyphenated";

// Optional peer dependency of @d3plus/ssr; ships no TypeScript types.
declare module "jsdom";

// @d3plus/ssr avoids a dependency on @types/node; these ambient declarations
// cover just the Node builtins its SSRF-safe tile fetch dispatcher touches.
declare module "node:net" {
  export class BlockList {
    addSubnet(net: string, prefix: number, type?: "ipv4" | "ipv6"): void;
    check(address: string, type?: "ipv4" | "ipv6"): boolean;
  }
  export function isIP(input: string): number;
}

declare module "node:dns" {
  export interface LookupAddress {
    address: string;
    family: number;
  }
  export interface LookupOptions {
    family?: number;
    hints?: number;
    all?: boolean;
    verbatim?: boolean;
  }
  export function lookup(
    hostname: string,
    options: LookupOptions,
    callback: (err: Error | null, address: LookupAddress[] | string, family?: number) => void,
  ): void;
}

declare module "textures" {
  /**
      A configured textures.js instance: callable so it can be applied to a
      d3 selection via `.call(t)`, with `url()` returning the `url(#id)` it
      registers and string-keyed chainable setters for its options.
  */
  type TextureInstance = ((selection: unknown) => void) & {
    url(): string;
    [setter: string]: (...args: unknown[]) => unknown;
  };
  /** Texture factory map keyed by texture name (`lines`, `circles`, …). */
  const textures: Record<string, () => TextureInstance>;
  export default textures;
}
