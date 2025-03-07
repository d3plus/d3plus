import React, {useRef, useMemo, useState} from "react";
import {Transition, TransitionGroup} from 'react-transition-group';
import {treemapConfig} from "./configs.js";

import {Tooltip} from "@mantine/core";
import {useElementSize, useFetch} from "@mantine/hooks";
import {group} from "d3-array";
import {hierarchy, treemap, treemapResquarify} from "d3-hierarchy";
import {merge} from "d3plus-common";

const useGroupBy = (config) => {
  const groupBy = config.groupBy.map(k => typeof k !== "function" ? d => d[k] : k);
  return {
    drawDepth: groupBy.length - 1,
    id: groupBy[groupBy.length - 1],
    groupBy
  }
};

const useSum = ({sum}) => {
  return {
    sum: typeof sum !== "function" ? d => d[sum] : sum
  }
};

const useAggs = ({aggs = {}}) => {
  return {
    aggs
  }
};

const useHover = (config) => {
  const [hover, setHover] = useState(false);
  return {hover, setHover};
};

const useSort = ({sort = (a, b) => b.value - a.value}) => {
  return {
    sort
  }
};

const useData = (config) => {
  const {data, error, loading} = useFetch(config.data);
  return {
    data: data ? data.data : data,
    dataError: error,
    dataLoading: loading,
  }
};

const useMargins = (config) => {
  return {
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 0
  }
};

export default function Three({config = treemapConfig}) {

  const [currentYear, setYear] = useState(2022);
  const {ref, width, height} = useElementSize();

  const {hover, setHover} = useHover(config);
  const {drawDepth, id, groupBy} = useGroupBy(config);
  const {aggs} = useAggs(config);
  const {sum} = useSum(config);
  const {sort} = useSort(config);
  const {data, dataError, dataLoading} = useData(config);
  const {marginBottom, marginLeft, marginRight, marginTop} = useMargins(config);

  const layoutPadding = 1;
  const tile = treemapResquarify;

  const shapeData = useMemo(() => {

    if (!data) return [];

    const filteredData = data.filter(d => d.Year === currentYear);
    const groupArgs = [filteredData].concat(groupBy);
    
    const nestedData = group(...groupArgs);
    const hierarchicalData = hierarchy(nestedData).sum(sum).sort(sort);
  
    const tmapData = treemap().round(true)
      .padding(layoutPadding)
      .size([
        width - marginLeft - marginRight,
        height - marginTop - marginBottom
      ])
      .round(true)
      .tile(tile)(hierarchicalData);
  
    const shapeData = [];
  
    /**
        @memberof Treemap
        @desc Flattens and merges treemap data.
        @private
    */
    function extractLayout(children) {
      for (let i = 0; i < children.length; i++) {
        const node = children[i];
        if (node.depth <= drawDepth) extractLayout(node.children);
        else {
          // const index = node.data.values.length === 1 ? data.indexOf(node.data.values[0]) : undefined;
          // node.__d3plus__ = true;
          // node.id = node.data.key;
          // node.i = index > -1 ? index : undefined;
          node.data = merge(node.children.map(d => d.data), aggs);
          // node.x = node.x0 + (node.x1 - node.x0) / 2;
          // node.y = node.y0 + (node.y1 - node.y0) / 2;
          shapeData.push(node);
        }
      }
    }
    if (tmapData.children) extractLayout(tmapData.children);
  
    const total = tmapData.value;
    shapeData.forEach(d => {
      d.share = sum(d.data, d.i) / total;
    });
  
    // console.log("shapeData", shapeData);
    return shapeData.sort((a, b) => `${id(a.data)}`.localeCompare(`${id(b.data)}`));

  }, [data, currentYear, groupBy]);



  const loading = dataLoading || !data || !width || !height;

  if (loading || dataError) {
    return <svg height="100%" width="100%" ref={ref}>
      {
        loading ? (
          <text x={0} y={100}>Loading</text>
        ) 
        : dataError ? (
          <text x={0} y={100}>Error</text>
        ) 
        : (
          <text x={0} y={100}>Unknown</text>
        )
      }
    </svg>;
  }

  const Rect = (d) => {

    const duration = 1000;
    const nodeRef = useRef(null);

    const defaultStyle = {
      transition: `all ${duration}ms`,
      // transform: `translateX(${d.x0 + (d.x1 - d.x0) / 2}px)translateY(${d.y0 + (d.y1 - d.y0) / 2}px)translateZ(0)`,
      transform: "scale(0)",
      transformOrigin: `${d.x0 + (d.x1 - d.x0) / 2}px ${d.y0 + (d.y1 - d.y0) / 2}px`,
      willChange: "*",


      // height: `${d.y1 - d.y0}px`,
      // width: `${d.x1 - d.x0}px`,
      // x: `${d.x0}px`,
      // y: `${d.y0}px`,
    }

    const transitionStyles = {
      entering: {},
      entered:  {transform: "scale(1)"},
      exiting:  {transform: "scale(0)"},
      exited:  {},
    };

    return (
      <Transition nodeRef={nodeRef} in={true} appear={true} timeout={duration} mountOnEnter unmountOnExit>
        {state => (
          <rect 
            ref={nodeRef} 
            id={d.id} 
            style={{
              ...defaultStyle,
              ...transitionStyles[state]
            }}
            // onMouseEnter={() => setHover(d.data)}
            // onMouseLeave={() => setHover(false)}
            height={d.y1 - d.y0}
            width={d.x1 - d.x0}
            x={d.x0}
            y={d.y0}
            // fill={d.data === hover ? "red" : "black"}
          />
        )}
      </Transition>
    );
  }
  console.log("hover", hover);

  return <>
    <Tooltip.Floating label={hover ? id(hover) : null} disabled={!hover}>
      <div style={{height: "100%", width: "100%"}}>
        <svg height="100%" width="100%">
          <TransitionGroup component={null}>
            {shapeData.map(d => <Rect key={`rect-${id(d.data)}`} id={`rect-${id(d.data)}`} {...d} />)}
          </TransitionGroup>
        </svg>
      </div>
    </Tooltip.Floating>
    <button onClick={() => setYear(2021)}>2021</button>
    <button onClick={() => setYear(2022)}>2022</button>
  </>;
}
