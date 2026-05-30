/**
    `applyDefinition(viz, def)` — wire a ChartDefinition into a Viz instance.

    Seeds `viz.ctx` from `def.ctx`, seeds legacy `_<key>` slots from
    `def.defaults` (for unmigrated charts), and installs fluent accessors
    from `def.fields` (which write into `viz.schema`). All config defaults
    — `shapeConfig`, `tooltipConfig`, `legendSort`, `legend`, etc. — live
    in `fields` and use `factory` / `merge` for viz-bound and merge
    semantics.
*/

import {installFluent} from "../fluent.js";
import type {ChartDefinition} from "./ChartDefinition.js";
import type {VizInstance} from "./vizTypes.js";

export function applyDefinition(viz: VizInstance, def: ChartDefinition): void {
  if (def.ctx) {
    for (const [key, value] of Object.entries(def.ctx)) viz.ctx[key] = value;
  }
  if (def.defaults) {
    const scratch = viz as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(def.defaults)) {
      scratch[`_${key}`] = value;
    }
  }
  if (def.fields) installFluent(viz, def.fields);
  if (def.setup) def.setup(viz);
}
