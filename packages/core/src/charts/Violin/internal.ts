/**
    Violin's pipeline pieces (slot layout, outlines, inner marks and emit),
    re-exported by `@d3plus/core/internal`.

    @module
*/
export {categoryStep, violinEdges, violinOutline, violinSlots} from "./violinLayout.js";
export type {ViolinPoint, ViolinSide, ViolinSlot, ViolinSlotOptions} from "./violinLayout.js";
export {emitInner, innerSet} from "./inner.js";
export type {InnerFrame, PlacedViolin, ViolinInner} from "./inner.js";
export {VIOLIN_PADDING, violinEmit} from "./emit.js";
