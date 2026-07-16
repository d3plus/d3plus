/**
 * Ambient module declarations for external packages that lack TypeScript types.
 * Included via tsconfig.base.json so all packages can import these without errors.
 */

declare module "d3-composite-projections";
declare module "d3-geo-projection";

declare module "hyphenated";

// Optional peer dependency of @d3plus/ssr; ships no TypeScript types.
declare module "jsdom";

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
