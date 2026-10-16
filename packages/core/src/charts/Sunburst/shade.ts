/**
    Sunburst shading: the shared partition level shading (see
    `partition/shade.ts`), one step lighter per ring.
*/

export {
  partitionShadeActive as sunburstShadeActive,
  partitionShadeAmount as sunburstShadeAmount,
  partitionShadeDefaults as sunburstShadeDefaults,
  partitionShadeFill as sunburstShadeFill,
} from "../partition/shade.js";
export type {PartitionShadeConfig as SunburstShadeConfig} from "../partition/shade.js";
