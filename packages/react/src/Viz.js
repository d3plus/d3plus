import React, {useContext, useEffect, useRef, useState} from "react";
import PropTypes from "prop-types";
import {assign} from "d3plus-common";
import D3plusContext from "./D3plusContext.js";

/**
    @function Viz
    @desc Creates SVG paths and coordinate points based on an array of data. See [this example](https://d3plus.org/examples/d3plus-geomap/getting-started/) for help getting started using the geomap generator.
*/
const Viz = props => {

  const {
    className,
    config,
    dataFormat,
    linksFormat,
    nodesFormat,
    topojsonFormat,
    type: Constructor
  } = props;

  const {forceUpdate} = config;

  const globalConfig = useContext(D3plusContext);
  const container = useRef(null);
  const [viz, setViz] = useState(null);

  /**
      @memberof Viz
      @desc Sets visualization config, accounting for dataFormat, linksFormat, nodesFormat or topojsonFormat, and renders the visualization.
      @private
  */
  const renderViz = () => {

    if (viz) {
      const c = assign({}, globalConfig, config);
      viz.config(c);

      if (dataFormat && c.data) viz.data(c.data, dataFormat);
      if (linksFormat && c.links) viz.links(c.links, linksFormat);
      if (nodesFormat && c.nodes) viz.nodes(c.nodes, nodesFormat);
      if (topojsonFormat && c.topojson) viz.topojson(c.topojson, topojsonFormat);

      viz.render();
    }

  };

  // first mount
  useEffect(() => {
    setViz(new Constructor().select(container.current));
  }, [container]);

  useEffect(renderViz, [viz]);

  if (forceUpdate) renderViz();
  else useEffect(renderViz, [JSON.stringify(globalConfig), JSON.stringify(config)]);

  return <div className={className} ref={container}></div>;

};

Viz.defaultProps = {
  className: "viz",
  forceUpdate: false
};

Viz.propTypes = {
  className: PropTypes.string,
  config: PropTypes.shape({
    forceUpdate: PropTypes.any
  }),
  dataFormat: PropTypes.func,
  linksFormat: PropTypes.func,
  nodesFormat: PropTypes.func,
  topojsonFormat: PropTypes.func,
  type: PropTypes.func
}

/**
    @memberof Viz
    @param {Object} [config = {}] An object containing method/value pairs to be passed to the visualization's .config( ) method.
    @param {Function} [dataFormat = d3plus.dataFold] A custom formatting function to be used when formatting data from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the data method.
    @param {Function} [linksFormat = d3plus.links(path, formatter)] A custom formatting function to be used when formatting links from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the links method.
    @param {Function} [nodesFormat = d3plus.nodes(path, formatter)] A custom formatting function to be used when formatting nodes from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the nodes method.
    @param {Function} [topojsonFormat = d3plus.topojson(path, formatter)] A custom formatting function to be used when formatting topojson from an AJAX request. The function will be passed the raw data returned from the request, and is expected to return an array of values used for the topojson method.
*/
export default Viz;
