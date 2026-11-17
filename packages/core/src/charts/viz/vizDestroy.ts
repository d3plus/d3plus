import {select} from "d3-selection";

import {syncSelectSurface} from "../drawSteps/selectGesture.js";
import {teardownKeyboardNav} from "./keyboardNav.js";
import {unregisterLink} from "./linkGroup.js";
import {nearestHoverSurface} from "./nearestHoverSurface.js";
import type Viz from "./Viz.js";
import {stopDataPolling} from "./vizDataPolling.js";
import {unwatchPageTheme} from "./vizTheme.js";
import type {VizInstance} from "./vizTypes.js";
import {releaseScene, stopVisibilityWatch} from "./vizVisibility.js";

/**
    Tears a chart down (see `Viz.destroy`). Counting the call drops a draw a
    render started that hasn't run yet (see `loadAndDraw` in `vizRender`).
    @private
*/
export function vizDestroy(viz: Viz): void {
  viz._destroyCount = (viz._destroyCount ?? 0) + 1;
  const instance = viz as unknown as VizInstance;
  unregisterLink(instance);
  teardownKeyboardNav(instance);
  nearestHoverSurface(instance, true);
  syncSelectSurface(instance, true);
  unwatchPageTheme(instance);
  stopDataPolling(viz);
  viz._resizeObserver?.disconnect();
  viz._fontsUnsubscribe?.();
  viz._fontsUnsubscribe = undefined;
  viz._tooltipClass.data([]).render();
  select("body").on(`touchstart.${viz._uuid}`, null);
  stopVisibilityWatch(viz);
  releaseScene(viz);
}
