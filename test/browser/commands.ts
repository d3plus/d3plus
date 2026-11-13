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

/** The DevTools session holding each page's time zone override, which ends with it. */
const timezoneSessions = new WeakMap<object, {detach(): Promise<void>}>();

/**
 * Emulates a time zone (an IANA name such as `"America/Los_Angeles"`), or
 * with `null` restores the system's, so dates read in local time differ
 * from UTC as they do for a viewer there.
 */
const emulateTimezone: BrowserCommand<[string | null]> = async (
  ctx,
  timezoneId,
) => {
  const page = ctx.page;
  const current = timezoneSessions.get(page);
  if (timezoneId === null) {
    if (current) {
      timezoneSessions.delete(page);
      await current.detach();
    }
    return;
  }
  const cdp = current ?? (await page.context().newCDPSession(page));
  timezoneSessions.set(page, cdp);
  await cdp.send("Emulation.setTimezoneOverride", {timezoneId});
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
 * and emulate the system color scheme and time zone.
 */
export const commands = {
  mouseMove,
  mouseClick,
  mouseDown,
  mouseUp,
  emulateColorScheme,
  emulateTimezone,
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
    emulateTimezone: (timezoneId: string | null) => Promise<void>;
    collectGarbage: () => Promise<void>;
  }
}
