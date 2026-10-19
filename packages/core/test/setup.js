import {bundle} from "./playwright.js";

/**
 * Builds the UMD bundle once in mocha's main process, before any parallel
 * workers spawn. Workers inherit D3PLUS_UMD_BUILT and read the finished file
 * rather than each rebuilding it.
 */
export async function mochaGlobalSetup() {
  await bundle();
  process.env.D3PLUS_UMD_BUILT = "1";
}
