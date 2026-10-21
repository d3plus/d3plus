import type {BrowserCommand} from "vitest/node";

type MouseOptions = {steps?: number; button?: "left" | "right" | "middle"};

/** The test iframe's offset in the page, to turn its coordinates into the page's. */
async function offset(ctx: Parameters<BrowserCommand>[0]) {
  const box = await (await (await ctx.frame()).frameElement()).boundingBox();
  return {x: box?.x ?? 0, y: box?.y ?? 0};
}

const mouseMove: BrowserCommand<[number, number, MouseOptions?]> = async (ctx, x, y, options) => {
  const o = await offset(ctx);
  await ctx.page.mouse.move(o.x + x, o.y + y, options);
};

const mouseClick: BrowserCommand<[number, number, MouseOptions?]> = async (ctx, x, y, options) => {
  const o = await offset(ctx);
  await ctx.page.mouse.click(o.x + x, o.y + y, options);
};

const mouseDown: BrowserCommand<[MouseOptions?]> = async (ctx, options) => {
  await ctx.page.mouse.down(options);
};

const mouseUp: BrowserCommand<[MouseOptions?]> = async (ctx, options) => {
  await ctx.page.mouse.up(options);
};

/**
 * Server commands that drive Playwright's mouse at test-page coordinates
 * (`getBoundingClientRect` values), for tests that need real pointer events.
 */
export const commands = {mouseMove, mouseClick, mouseDown, mouseUp};

declare module "vitest/browser" {
  interface BrowserCommands {
    mouseMove: (x: number, y: number, options?: MouseOptions) => Promise<void>;
    mouseClick: (x: number, y: number, options?: MouseOptions) => Promise<void>;
    mouseDown: (options?: MouseOptions) => Promise<void>;
    mouseUp: (options?: MouseOptions) => Promise<void>;
  }
}
