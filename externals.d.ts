/**
 * Ambient module declarations for external packages that lack TypeScript types.
 * Included via tsconfig.base.json so all packages can import these without errors.
 */

declare module "d3-composite-projections";
declare module "d3-geo-projection";

declare module "hyphenated";

// d3-timer ships no TypeScript types; @d3plus/render schedules against its clock.
declare module "d3-timer" {
  export interface Timer {
    restart(
      callback: (elapsed: number) => void,
      delay?: number,
      time?: number,
    ): void;
    stop(): void;
  }
  export function now(): number;
  export function timer(
    callback: (elapsed: number) => void,
    delay?: number,
    time?: number,
  ): Timer;
}

// Optional peer dependency of @d3plus/ssr; ships no TypeScript types.
declare module "jsdom";

// @d3plus/ssr avoids a dependency on @types/node; these ambient declarations
// cover just the Node builtins its SSRF-safe tile fetch touches.
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
    callback: (
      err: Error | null,
      address: LookupAddress[] | string,
      family?: number,
    ) => void,
  ): void;
}

declare module "node:http" {
  export interface IncomingMessage {
    statusCode?: number;
    headers: Record<string, string | string[] | undefined>;
    on(event: "data", listener: (chunk: Uint8Array) => void): this;
    on(event: "end", listener: () => void): this;
    on(event: "error", listener: (err: Error) => void): this;
  }
  export interface ClientRequest {
    on(event: "error", listener: (err: Error) => void): this;
    end(): void;
  }
  export interface RequestOptions {
    headers?: Record<string, string>;
    signal?: AbortSignal;
    lookup?: (
      hostname: string,
      options: import("node:dns").LookupOptions,
      callback: (
        err: Error | null,
        address: import("node:dns").LookupAddress[] | string,
        family?: number,
      ) => void,
    ) => void;
  }
  export function request(
    url: string,
    options: RequestOptions,
    callback: (res: IncomingMessage) => void,
  ): ClientRequest;
  const http: {request: typeof request};
  export default http;
}

declare module "node:https" {
  const https: {request: typeof import("node:http").request};
  export default https;
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
