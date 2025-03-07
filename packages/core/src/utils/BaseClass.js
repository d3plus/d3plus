import {assign, isObject} from "@d3plus/dom";
import {findLocale, translateLocale as dictionaries} from "@d3plus/locales";

import RESET from "./RESET.js";
import uuid from "./uuid.js";

/**
    @desc Recursive function that resets nested Object configs.
    @param {Object} obj
    @param {Object} defaults
    @private
*/
function nestedReset(obj, defaults) {
  if (isObject(obj)) {
    for (const nestedKey in obj) {
      if ({}.hasOwnProperty.call(obj, nestedKey) && !nestedKey.startsWith("_")) {
        const defaultValue = defaults && isObject(defaults) ? defaults[nestedKey] : undefined;
        if (obj[nestedKey] === RESET) {
          if (defaultValue) obj[nestedKey] = defaultValue;
          else delete obj[nestedKey];
        }
        else if (isObject(obj[nestedKey])) {
          nestedReset(obj[nestedKey], defaultValue);
        }
      }
    }
  }
}

/**
 * @desc finds all prototype methods of a class and it's parent classes
 * @param {*} obj
 * @private
 */
function getAllMethods(obj) {
  let props = [];
  do {
    props = props.concat(Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  } while (obj && obj !== Object.prototype);
  return props.filter(e => e.indexOf("_") !== 0 && !["config", "constructor", "parent", "render"].includes(e));
}

/**
    @class BaseClass
    @summary An abstract class that contains some global methods and functionality.
*/
export default class BaseClass {

  /**
      @memberof BaseClass
      @desc Invoked when creating a new class instance, and sets any default parameters.
      @private
  */
  constructor() {
    this._locale = "en-US";
    this._on = {};
    this._parent = {};
    this._translate = (d, locale = this._locale) => {
      const dictionary = dictionaries[locale];
      return dictionary && dictionary[d] ? dictionary[d] : d;
    };
    this._uuid = uuid();
  }

  /**
      @memberof BaseClass
      @desc If *value* is specified, sets the methods that correspond to the key/value pairs and returns this class. If *value* is not specified, returns the current configuration.
      @param {Object} [*value*]
      @chainable
  */
  config(_) {

    if (!this._configDefault) {
      const config = {};
      getAllMethods(this.__proto__).forEach(k => {
        const v = this[k]();
        if (v !== this) config[k] = isObject(v) ? assign({}, v) : v;
      });
      this._configDefault = config;
    }

    if (arguments.length) {
      for (const k in _) {
        if ({}.hasOwnProperty.call(_, k) && k in this) {
          const v = _[k];
          if (v === RESET) {
            if (k === "on") this._on = this._configDefault[k];
            else this[k](this._configDefault[k]);
          }
          else {
            nestedReset(v, this._configDefault[k]);
            this[k](v);
          }
        }
      }
      return this;
    }
    else {

      const config = {};
      getAllMethods(this.__proto__).forEach(k => {
        config[k] = this[k]();
      });
      return config;

    }
  }

  /**
      @memberof BaseClass
      @desc Sets the locale used for all text and number formatting. This method supports the locales defined in [d3plus-format](https://github.com/d3plus/d3plus-format/blob/master/src/locale.js). The locale can be defined as a complex Object (like in d3plus-format), a locale code (like "en-US"), or a 2-digit language code (like "en"). If a 2-digit code is provided, the "findLocale" function is used to identify the most approximate locale from d3plus-format.
      @param {Object|String} [*value* = "en-US"]
      @chainable
      @example
      {
        separator: "",
        suffixes: ["y", "z", "a", "f", "p", "n", "µ", "m", "", "k", "M", "B", "t", "q", "Q", "Z", "Y"],
        grouping: [3],
        delimiters: {
          thousands: ",",
          decimal: "."
        },
        currency: ["$", ""]
      }
  */
  locale(_) {
    return arguments.length ? (this._locale = findLocale(_), this) : this._locale;
  }

  /**
      @memberof BaseClass
      @desc Adds or removes a *listener* to each object for the specified event *typenames*. If a *listener* is not specified, returns the currently assigned listener for the specified event *typename*. Mirrors the core [d3-selection](https://github.com/d3/d3-selection#selection_on) behavior.
      @param {String} [*typenames*]
      @param {Function} [*listener*]
      @chainable
      @example <caption>By default, listeners apply globally to all objects, however, passing a namespace with the class name gives control over specific elements:</caption>
new Plot
  .on("click.Shape", function(d) {
    console.log("data for shape clicked:", d);
  })
  .on("click.Legend", function(d) {
    console.log("data for legend clicked:", d);
  })
  */
  on(_, f) {
    return arguments.length === 2 ? (this._on[_] = f, this) : arguments.length ? typeof _ === "string" ? this._on[_] : (this._on = Object.assign({}, this._on, _), this) : this._on;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the parent config used by the wrapper and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  parent(_) {
    return arguments.length ? (this._parent = _, this) : this._parent;
  }

  /**
      @memberof BaseClass
      @desc Defines how informational text strings should be displayed. By default, this function will try to find the string in question (which is the first argument provided to this function) inside of an internally managed translation Object. If you'd like to override to use custom text, simply pass this method your own custom formatting function.
      @param {Function} [*value*]
      @chainable
      @example <caption>For example, if we wanted to only change the string "Back" and allow all other string to return in English:</caption>
.translate(function(d) {
  return d === "Back" ? "Get outta here" : d;
})
  */
  translate(_) {
    return arguments.length ? (this._translate = _, this) : this._translate;
  }

  /**
      @memberof Viz
      @desc If *value* is specified, sets the config method for each shape and returns the current class instance.
      @param {Object} [*value*]
      @chainable
  */
  shapeConfig(_) {
    return arguments.length ? (this._shapeConfig = assign(this._shapeConfig, _), this) : this._shapeConfig;
  }

}
