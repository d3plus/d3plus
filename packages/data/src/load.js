import {csv, json, text, tsv} from "d3-fetch";
import {isObject} from "@d3plus/dom";

import fold from "./fold.js";
import concat from "./concat.js";
import isData from "./isData.js";

/**
  @function dataLoad
  @desc Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.
  @param {Array|String} path The path to the file or url to be loaded. Also support array of paths strings. If an Array of objects is passed, the xhr request logic is skipped.
  @param {Function} [formatter] An optional formatter function that is run on the loaded data.
  @param {String} [key] The key in the `this` context to save the resulting data to.
  @param {Function} [callback] A function that is called when the final data is loaded. It is passed 2 variables, any error present and the data loaded.
*/
export default function (path, formatter, key, callback) {
  const fetchData = (path, init = {}) => {
    const ext = path.slice(path.length - 4);
    switch (ext) {
      case ".csv":
        return csv(path, init);
      case ".tsv":
        return tsv(path, init);
      case ".txt":
        return text(path, init);
      default:
        return json(path, init);
    }
  };

  const validateData = data => {
    if (data && data instanceof Array) {
      data.forEach(d => {
        for (const k in d) {
          if (!isNaN(d[k])) d[k] = parseFloat(d[k]);
          else if (d[k].toLowerCase() === "false") d[k] = false;
          else if (d[k].toLowerCase() === "true") d[k] = true;
          else if (d[k].toLowerCase() === "null") d[k] = null;
          else if (d[k].toLowerCase() === "undefined") d[k] = undefined;
        }
      });
    }
    return data;
  };

  const loadedLength = loadedArray =>
    loadedArray.reduce((prev, current) => (current ? prev + 1 : prev), 0);

  // If path param is a not an Array then convert path to a 1 element Array to re-use logic
  if (!(path instanceof Array)) path = [path];

  const needToLoad = path.find(isData);

  let loaded = new Array(path.length);
  const toLoad = [];

  // If there is a string I'm assuming is a Array to merge, urls or data
  if (needToLoad) {
    path.forEach((dataItem, ix) => {
      if (isData(dataItem)) toLoad.push(dataItem);
      else loaded[ix] = dataItem;
    });
  }
  // Data array itself
  else {
    loaded[0] = path;
  }

  // Load all urls an combine them with data arrays
  const alreadyLoaded = loadedLength(loaded);
  toLoad.forEach(dataItem => {
    let url = dataItem,
      init = {};
    if (typeof dataItem === "object" && dataItem.url) {
      url = dataItem.url;
      init = dataItem;
    }
    fetchData(url, init)
      .then(data => {
        if (!(data instanceof Array) && data.data && data.headers)
          data = fold(data);
        data = validateData(data);
        loaded[
          path.findIndex(d => JSON.stringify(d) == JSON.stringify(dataItem))
        ] = data;
        // All urls loaded
        if (loadedLength(loaded) - alreadyLoaded === toLoad.length) {
          // Format data
          data = loadedLength(loaded) === 1 ? loaded[0] : loaded;
          if (this._cache) this._lrucache.set(`${key}_${url}`, data);

          if (formatter) {
            const formatterResponse = formatter(
              loadedLength(loaded) === 1 ? loaded[0] : loaded
            );
            if (key === "data" && isObject(formatterResponse)) {
              data = formatterResponse.data || [];
              delete formatterResponse.data;
              this.config(formatterResponse);
            } else data = formatterResponse || [];
          } else if (key === "data") {
            data = concat(loaded, "data");
          }

          if (key && `_${key}` in this) this[`_${key}`] = data;
          if (callback) callback(undefined, data);
        }
      })
      .catch(err => {
        console.log(err);
        if (callback) callback(err, undefined);
      });
  });

  // If there is no data to Load response is immediately
  if (toLoad.length === 0) {
    loaded = loaded.map(data => {
      if (data && !(data instanceof Array) && data.data && data.headers)
        data = fold(data);
      return data;
    });

    // Format data
    let data = loadedLength(loaded) === 1 ? loaded[0] : loaded;
    if (formatter) {
      const formatterResponse = formatter(
        loadedLength(loaded) === 1 ? loaded[0] : loaded
      );
      if (key === "data" && isObject(formatterResponse)) {
        data = formatterResponse.data || [];
        delete formatterResponse.data;
        this.config(formatterResponse);
      } else data = formatterResponse || [];
    } else if (key === "data") {
      data = concat(loaded, "data");
    }

    if (key && `_${key}` in this) this[`_${key}`] = data;
    if (callback) callback(null, data);
  }
}
