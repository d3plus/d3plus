import React, {useContext, useEffect, useRef, useState} from "react";
import {assign} from "@d3plus/dom";

import D3plusContext from "./D3plusContext.jsx";

/**
    Stable hash that serializes functions by source, so function-valued config
    props trigger re-renders when they change.
    @param {*} val
    @returns {String}
    @private
*/
function hash(val) {
  const seen = new WeakSet();
  return JSON.stringify(val, (_, v) => {
    if (typeof v === "function") return v.toString();
    if (typeof v === "object" && v !== null) {
      if (seen.has(v)) return "[Circular]";
      seen.add(v);
    }
    return v;
  });
}

/**
    @function Renderer
    @param {Object} config An object containing method/value pairs to be passed to the visualization's .config( ) method.
    @param {String} [className = "renderer"] The class attribute value used for the root/wrapper <div> element.
    @param {Function} [callback] A function to be invoked at the end of each render cycle (passed directly to the render method).
    @param {Boolean} [forceUpdate] When true, the visualization re-renders on every React render cycle instead of only when config changes.
*/
export default function Renderer({
  callback,
  className = "renderer",
  config,
  constructor,
  forceUpdate,
}) {
  const globalConfig = useContext(D3plusContext);
  const container = useRef(null);
  const [instance] = useState(() => new constructor());

  useEffect(
    () => {
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

      return () => instance.destroy?.();
    },
    forceUpdate ? undefined : [hash(globalConfig), hash(config)],
  );

  return (
    <div
      className={className}
      style={{height: "100%", minHeight: 150, width: "100%"}}
    >
      <svg ref={container}></svg>
    </div>
  );
}
