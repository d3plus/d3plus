import {
  geoAlbers,
  geoAlbersUsa,
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEqualEarth,
  geoEquirectangular,
  geoGnomonic,
  geoMercator,
  geoNaturalEarth1,
  geoOrthographic,
  geoStereographic,
  geoTransverseMercator,
} from "d3-geo";
import type {GeoProjection} from "d3-geo";
import {geoMiller, geoRobinson, geoWinkel3} from "d3-geo-projection";
// Bundlers load this package's ES modules; Node only gets its UMD file, which
// exports nothing, so these projections are bundle-only.
import * as composite from "d3-composite-projections";

import {warnConfig} from "../../utils/configWarnings.js";

/** The projections Geomap's `projection` accepts by name. */
export const projections: Readonly<Record<string, () => GeoProjection>> = {
  geoAlbers,
  geoAlbersUsa: composite.geoAlbersUsa ?? geoAlbersUsa,
  ...(composite.geoAlbersUsaTerritories && {geoAlbersUsaTerritories: composite.geoAlbersUsaTerritories}),
  geoAzimuthalEqualArea,
  geoAzimuthalEquidistant,
  geoConicConformal,
  geoConicEqualArea,
  geoConicEquidistant,
  geoEqualEarth,
  geoEquirectangular,
  geoGnomonic,
  geoMercator,
  geoMiller,
  geoNaturalEarth1,
  geoOrthographic,
  geoRobinson,
  geoStereographic,
  geoTransverseMercator,
  geoWinkel3,
};

/**
    Builds the projection a name refers to. An unknown name warns and falls
    back to Mercator; any other projection can be passed as a function.
*/
export function projectionByName(name: string): GeoProjection {
  if (Object.hasOwn(projections, name)) return projections[name]();
  warnConfig(
    `Geomap received unknown projection "${name}"; using geoMercator. ` +
      `Pass the projection itself to use one not built in, e.g. .projection(${name}()).`,
  );
  return geoMercator();
}
