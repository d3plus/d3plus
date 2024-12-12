/**
    @function configPrep
    @desc Preps a config object for d3plus data, and optionally bubbles up a specific nested type. When using this function, you must bind a d3plus class' `this` context.
    @param {Object} [config = this._shapeConfig] The configuration object to parse.
    @param {String} [type = "shape"] The event classifier to user for "on" events. For example, the default event type of "shape" will apply all events in the "on" config object with that key, like "click.shape" and "mouseleave.shape", in addition to any gloval events like "click" and "mouseleave".
    @param {String} [nest] An optional nested key to bubble up to the parent config level.
*/
export default function configPrep(config = this._shapeConfig, type = "shape", nest = false) {

  const newConfig = {duration: this._duration, on: {}};

  const wrapFunction = func => (d, i, s, e) => {
    if (!func) return func;
    let parent;
    while (d.__d3plus__) {
      if (parent) d.__d3plusParent__ = parent;
      parent = d;
      i = d.i;
      d = d.data || d.feature;
    }
    return func.bind(this)(d, i, s || parent, e);
  };

  const parseEvents = (newObj, on) => {

    for (const event in on) {

      if ({}.hasOwnProperty.call(on, event) && !event.includes(".") || event.includes(`.${type}`)) {
        newObj.on[event] = wrapFunction(on[event]);
      }

    }

  };

  const arrayEval = arr => arr.map(d => {
    if (d instanceof Array) return arrayEval(d);
    else if (typeof d === "object") return keyEval({}, d);
    else if (typeof d === "function") return wrapFunction(d);
    else return d;
  });

  const keyEval = (newObj, obj) => {

    for (const key in obj) {

      if ({}.hasOwnProperty.call(obj, key)) {

        if (key === "on") parseEvents(newObj, obj[key]);
        else if (typeof obj[key] === "function") {
          newObj[key] = wrapFunction(obj[key]);
        }
        else if (obj[key] instanceof Array) {
          newObj[key] = arrayEval(obj[key]);
        }
        else if (typeof obj[key] === "object") {
          if (!newObj[key]) newObj[key] = {};
          newObj[key].on = {};
          keyEval(newObj[key], obj[key]);
        }
        else newObj[key] = obj[key];

      }

    }

  };

  keyEval(newConfig, config);
  if (this._on) parseEvents(newConfig, this._on);
  if (nest && config[nest]) {
    keyEval(newConfig, config[nest]);
    if (config[nest].on) parseEvents(newConfig, config[nest].on);
  }

  return newConfig;

}
