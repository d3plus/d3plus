import React, {useContext, useEffect, useRef} from "react";
import {assign} from "@d3plus/dom";

import D3plusContext from "./D3plusContext.jsx";

/**
    @function Viz
*/
const Viz = ({
  className = "viz",
  config,
  dataFormat,
  instance,
  linksFormat,
  nodesFormat,
  topojsonFormat
}) => {

  const {forceUpdate} = config;

  const globalConfig = useContext(D3plusContext);
  const container = useRef(null);

  useEffect(() => {
    if (container.current) {

      const c = assign({select: container.current}, globalConfig, config);

      instance.config(c);

      if (dataFormat && c.data) instance.data(c.data, dataFormat);
      if (linksFormat && c.links) instance.links(c.links, linksFormat);
      if (nodesFormat && c.nodes) instance.nodes(c.nodes, nodesFormat);
      if (topojsonFormat && c.topojson) instance.topojson(c.topojson, topojsonFormat);

      // ADD CALLBACK
      instance.render();
      
    }
  }, forceUpdate ? undefined : [JSON.stringify(globalConfig), JSON.stringify(config)]);

  return <div className={className} ref={container}></div>;

};

/**
    @memberof Viz
    @param {String} [className = "viz"] The class attribute value used for the root/wrapper <div> element.
    @param {Object} config An object containing method/value pairs to be passed to the visualization's .config( ) method.
    @param {Function} [dataFormat = d3plus.dataFold] A custom formatting function to be used when formatting data from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the data method.
    @param {Function} [linksFormat = d3plus.links(path, formatter)] A custom formatting function to be used when formatting links from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the links method.
    @param {Function} [nodesFormat = d3plus.nodes(path, formatter)] A custom formatting function to be used when formatting nodes from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the nodes method.
    @param {Function} [topojsonFormat = d3plus.topojson(path, formatter)] A custom formatting function to be used when formatting topojson from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the topojson method.
*/
export default Viz;
