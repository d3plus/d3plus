/**
    HorizonChart's band colors: a ramp per sign, pale to dark (dim to bright
    on a dark theme) from the band nearest zero up.
*/
import {colorDefaults as baseDefaults} from "@d3plus/color";
import type {ColorDefaults} from "@d3plus/color";

import {themeRamp, themeScaleColor} from "../../utils/theme.js";
import type {ResolvedTheme} from "../../utils/theme.js";

/** A sign's colors in `colors`: a base color to ramp, or one color per band. */
export type HorizonColorSetting = string | string[];

/** The `colors` setting. */
export interface HorizonColorConfig {
  positive?: HorizonColorSetting;
  negative?: HorizonColorSetting;
}

/** Each sign's band colors, from the band nearest zero up. */
export interface HorizonPalette {
  positive: string[];
  negative: string[];
}

/** One sign's `bands` colors: a ramp toward a base color, or the colors given (the last repeated). */
function signColors(
  theme: ResolvedTheme | undefined,
  setting: HorizonColorSetting,
  bands: number,
): string[] {
  if (Array.isArray(setting))
    return Array.from(
      {length: bands},
      (_, i) => setting[Math.min(i, setting.length - 1)],
    );
  return themeRamp(theme, setting, bands, true);
}

/**
    The band colors for a chart: by default, ramps toward the theme's
    colorScale poles (`max` for positive bands, `min` for negative ones), so
    they follow dark and custom themes. `colors` overrides either sign with a
    base color to ramp or a list of colors.
    @param theme The chart's resolved theme, when it has drawn.
    @param bands How many bands each sign has.
    @param colors The chart's `colors` setting.
    @param defaults The chart's `colorDefaults`.
*/
export function horizonPalette(
  theme: ResolvedTheme | undefined,
  bands: number,
  colors: HorizonColorConfig | undefined,
  defaults: ColorDefaults = baseDefaults,
): HorizonPalette {
  const count = Math.max(1, Math.floor(bands));
  const valid = (s: HorizonColorSetting | undefined) =>
    (typeof s === "string" && s) || (Array.isArray(s) && s.length)
      ? s
      : undefined;
  const positive =
    valid(colors?.positive) ??
    themeScaleColor(theme, "max", defaults.sequential);
  const negative =
    valid(colors?.negative) ?? themeScaleColor(theme, "min", defaults.off);
  return {
    positive: signColors(theme, positive, count),
    negative: signColors(theme, negative, count),
  };
}
