import type {BrowserCommand} from "vitest/node";

type MouseOptions = {steps?: number; button?: "left" | "right" | "middle"};

/** The test iframe's offset in the page, to turn its coordinates into the page's. */
async function offset(ctx: Parameters<BrowserCommand>[0]) {
  const box = await (await (await ctx.frame()).frameElement()).boundingBox();
  return {x: box?.x ?? 0, y: box?.y ?? 0};
}

const mouseMove: BrowserCommand<[number, number, MouseOptions?]> = async (
  ctx,
  x,
  y,
  options,
) => {
  const o = await offset(ctx);
  await ctx.page.mouse.move(o.x + x, o.y + y, options);
};

const mouseClick: BrowserCommand<[number, number, MouseOptions?]> = async (
  ctx,
  x,
  y,
  options,
) => {
  const o = await offset(ctx);
  await ctx.page.mouse.click(o.x + x, o.y + y, options);
};

const mouseDown: BrowserCommand<[MouseOptions?]> = async (ctx, options) => {
  await ctx.page.mouse.down(options);
};

const mouseUp: BrowserCommand<[MouseOptions?]> = async (ctx, options) => {
  await ctx.page.mouse.up(options);
};

/** Emulates a `prefers-color-scheme` (or `null` to stop emulating it). */
const emulateColorScheme: BrowserCommand<
  ["light" | "dark" | "no-preference" | null]
> = async (ctx, colorScheme) => {
  await ctx.page.emulateMedia({colorScheme});
};

/**
 * Runs a full garbage collection in the page's renderer. Chromium frees the
 * 2 MiB shared-memory buffers each loaded page leaves behind only when it
 * collects garbage, and a renderer that maps 32 GiB of them stops working.
 */
const collectGarbage: BrowserCommand<[]> = async ctx => {
  const cdp = await ctx.page.context().newCDPSession(ctx.page);
  try {
    await cdp.send("HeapProfiler.collectGarbage");
  } finally {
    await cdp.detach();
  }
};

/**
 * Server commands that drive Playwright's mouse at test-page coordinates
 * (`getBoundingClientRect` values), for tests that need real pointer events,
 * and emulate the system color scheme.
 */
export const commands = {
  mouseMove,
  mouseClick,
  mouseDown,
  mouseUp,
  emulateColorScheme,
  collectGarbage,
};

declare module "vitest/browser" {
  interface BrowserCommands {
    mouseMove: (x: number, y: number, options?: MouseOptions) => Promise<void>;
    mouseClick: (x: number, y: number, options?: MouseOptions) => Promise<void>;
    mouseDown: (options?: MouseOptions) => Promise<void>;
    mouseUp: (options?: MouseOptions) => Promise<void>;
    emulateColorScheme: (
      colorScheme: "light" | "dark" | "no-preference" | null,
    ) => Promise<void>;
    collectGarbage: () => Promise<void>;
  }
}
