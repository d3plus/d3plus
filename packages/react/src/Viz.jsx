import React, {useContext, useEffect, useRef, useState} from "react";
import {assign} from "@d3plus/dom";

import D3plusContext from "./D3plusContext.jsx";

/**
    @function Viz
    @param {Object} config An object containing method/value pairs to be passed to the visualization's .config( ) method.
    @param {String} [className = "viz"] The class attribute value used for the root/wrapper <div> element.
    @param {Function} [callback] A function to be invoked at the end of each render cycle (passed directly to the render method).
*/
export default ({
  callback,
  className = "viz",
  config,
  vizClass,
}) => {

  const {forceUpdate} = config;

  const globalConfig = useContext(D3plusContext);
  const container = useRef(null);
  const [instance] = useState(() => new vizClass());

  useEffect(() => {
    if (container.current) {

      const c = assign({select: container.current}, globalConfig, config);
      instance.config(c);

      ["data", "links", "nodes", "topojson"].forEach(method => {
        if (c[`${method}Format`] && c[method]) {
          instance[method](c[method], c[`${method}Format`]);
          delete c[`${method}Format`];
        }
      });

      instance.render(callback);
      
    }
  }, forceUpdate ? undefined : [JSON.stringify(globalConfig), JSON.stringify(config)]);

  return <div className={className} ref={container}></div>;

};
