import type {DataPoint} from "@d3plus/data";
import { D3plusConfig } from "./D3plusConfig";

interface D3PlusWrapped {
  __d3plus__?: boolean;
  __d3plusParent__?: D3PlusWrapped;
  data?: DataPoint;
  feature?: DataPoint;
  i?: number;
  [key: string]: unknown;
}

type DataAccessor = (
  d: DataPoint,
  i: number,
  s?: D3PlusWrapped,
  e?: Event,
) => DataPoint[keyof DataPoint];
type ConfigValue =
  | DataAccessor
  | string
  | number
  | boolean
  | ConfigObject
  | ConfigValue[];
interface ConfigObject extends D3plusConfig {
  [key: string]: unknown;
}

export interface VizContext {
  _shapeConfig: ConfigObject;
  _duration: number;
  _on: Record<string, DataAccessor>;
  schema?: {duration?: number; [key: string]: unknown};
  [key: string]: unknown;
}

/**
    Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.
    @param config The configuration object to parse.
    @param type The event classifier to user for "on" events. For example, the default event type of "shape" will apply all events in the "on" config object with that key, like "click.shape" and "mouseleave.shape", in addition to any gloval events like "click" and "mouseleave".
    @param nest An optional nested key to bubble up to the parent config level.
*/
export default function configPrep(
  this: VizContext,
  config: ConfigObject = this._shapeConfig,
  type: string = "shape",
  nest: string | false = false,
): ConfigObject {
  const newConfig: ConfigObject = {
    duration: this.schema?.duration ?? this._duration,
    on: {},
  };

  const wrapFunction =
    (func: DataAccessor) =>
    (
      d: DataPoint | D3PlusWrapped,
      i: number,
      s?: D3PlusWrapped,
      e?: Event,
    ): DataPoint[keyof DataPoint] => {
      if (!func) return func as unknown as DataPoint[keyof DataPoint];
      let parent: D3PlusWrapped | undefined;
      while ((d as D3PlusWrapped).__d3plus__) {
        if (parent) (d as D3PlusWrapped).__d3plusParent__ = parent;
        parent = d as D3PlusWrapped;
        i = (d as D3PlusWrapped).i!;
        d = ((d as D3PlusWrapped).data || (d as D3PlusWrapped).feature)!;
      }
      return func.bind(this)(d as DataPoint, i, s || parent, e);
    };

  const parseEvents = (
    newObj: ConfigObject,
    on: Record<string, DataAccessor>,
  ): void => {
    for (const event in on) {
      if (
        ({}.hasOwnProperty.call(on, event) && !event.includes(".")) ||
        event.includes(`.${type}`)
      ) {
        (newObj.on as unknown as Record<string, DataAccessor>)[event] = wrapFunction(on[event]);
      }
    }
  };

  const arrayEval = (arr: ConfigValue[]): ConfigValue[] =>
    arr.map((d: ConfigValue) => {
      if (d instanceof Array) return arrayEval(d);
      else if (typeof d === "object")
        return keyEval({} as ConfigObject, d as ConfigObject);
      else if (typeof d === "function") return wrapFunction(d as DataAccessor);
      else return d;
    });

  const keyEval = (newObj: ConfigObject, obj: ConfigObject): ConfigObject => {
    for (const key in obj) {
      if ({}.hasOwnProperty.call(obj, key)) {
        if (key === "on")
          parseEvents(newObj, obj[key] as unknown as Record<string, DataAccessor>);
        else if (typeof obj[key] === "function") {
          newObj[key] = wrapFunction(obj[key] as DataAccessor);
        } else if (obj[key] instanceof Array) {
          newObj[key] = arrayEval(obj[key] as ConfigValue[]);
        } else if (typeof obj[key] === "object") {
          if (!newObj[key]) newObj[key] = {} as ConfigObject;
          (newObj[key] as ConfigObject).on = {};
          keyEval(newObj[key] as ConfigObject, obj[key] as ConfigObject);
        } else newObj[key] = obj[key];
      }
    }

    return newObj;
  };

  keyEval(newConfig, config);
  if (this._on) parseEvents(newConfig, this._on as unknown as Record<string, DataAccessor>);
  if (nest && config[nest]) {
    keyEval(newConfig, config[nest] as ConfigObject);
    if ((config[nest] as ConfigObject).on)
      parseEvents(newConfig, (config[nest] as ConfigObject).on as unknown as Record<string, DataAccessor>);
  }

  return newConfig;
}
