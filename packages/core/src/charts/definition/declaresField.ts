import type {ChartDefinition} from "./ChartDefinition.js";

/** A chart class, as `makeChart` produces it. */
type ChartClass = {_definition?: ChartDefinition};

/**
    Whether a chart's own definition, or that of a chart it specializes
    (see `makeChart`'s `Base`), declares the config field `key`, as
    BumpChart's declares `discrete`. A chart that declares a field lays out
    around it itself.
    @param viz The chart.
    @param key The config field.
*/
export function declaresField(viz: object, key: string): boolean {
  for (
    let ctor: ChartClass | null = viz.constructor as ChartClass;
    ctor && ctor !== Function.prototype;
    ctor = Object.getPrototypeOf(ctor) as ChartClass | null
  ) {
    const def = Object.hasOwn(ctor, "_definition")
      ? ctor._definition
      : undefined;
    if (def?.fields?.some(field => field.key === key)) return true;
  }
  return false;
}
