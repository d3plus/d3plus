// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/data/load.args";
import {load} from "@d3plus/data";

export default {
  title: "Data/load",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Loads data from a filepath or URL, converts it to a valid JSON object, and returns it to a callback function.",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


import {useEffect, useState} from "react";

const cellStyle = {padding: "3px 10px", borderBottom: "1px solid #e9ecef", textAlign: "left", fontSize: 13};

// Runs load() against the story's path once mounted and tabulates the rows
// it hands to the callback. load() reads `this._cache`, so an empty object
// is enough context when it is used outside a chart.
const Loaded = ({path, limit = 5}) => {
  const [state, setState] = useState({status: "loading"});
  useEffect(() => {
    load.call({}, path, undefined, undefined, (error, rows) =>
      setState(error ? {status: "error", error} : {status: "done", rows}),
    );
  }, [path]);
  if (state.status === "loading") return <em style={{fontSize: 13}}>loading…</em>;
  if (state.status === "error") return <code style={{color: "#c92a2a"}}>{String(state.error)}</code>;
  const rows = state.rows.slice(0, limit);
  const columns = Object.keys(rows[0] || {});
  return (
    <div style={{fontFamily: "ui-monospace, monospace"}}>
      <table style={{borderCollapse: "collapse"}}>
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c} style={{...cellStyle, color: "#666", fontWeight: 600}}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c} style={cellStyle}>
                  {JSON.stringify(row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{fontSize: 12, color: "#666", marginTop: 6}}>
        {state.rows.length} rows loaded{state.rows.length > limit ? `, showing ${limit}` : ""}
      </div>
    </div>
  );
};

const snippet = (pathSource, comment) => ({
  source: {
    code: `import {load} from "@d3plus/data";

load.call({}, ${pathSource}, undefined, undefined, (error, rows) => {
  ${comment}
});`,
    language: "jsx",
  },
});

export const BasicExample = () => <Loaded path="/data/city_coords.json" />;
BasicExample.parameters = {
  docs: {
    ...snippet('"/data/city_coords.json"', "// rows is the parsed JSON array"),
    description: {
      story: "Fetches a URL, parses it by extension (`.json`, `.csv`, `.tsv`, or `.txt`), and passes the rows to the callback. This is what runs behind a chart's `data: \"…\"` config; called directly it only needs an object for `this`.",
    },
  },
};

export const CsvCoercion = () => <Loaded path="/data/fruits.csv" />;
CsvCoercion.parameters = {
  docs: {
    ...snippet('"/data/fruits.csv"', '// rows[0] → {name: "Apple", color: "red", sweet: true, calories: 95}'),
    description: {
      story: "CSV cells arrive as strings, so every value that parses as a number becomes a number and `\"true\"`/`\"false\"` become booleans before the rows are handed over. Here `sweet` and `calories` come back typed.",
    },
  },
};

const inline = [{name: "Durian", color: "green", sweet: true, calories: 147}];
export const MultipleSources = () => <Loaded path={["/data/fruits.csv", inline]} limit={6} />;
MultipleSources.parameters = {
  docs: {
    ...snippet(
      '["/data/fruits.csv", [{name: "Durian", color: "green", sweet: true, calories: 147}]]',
      "// the fetched rows followed by the inline row",
    ),
    description: {
      story: "An array can mix URLs and inline arrays. Everything that needs fetching is loaded, then the pieces are concatenated in the order given, so the inline Durian row lands after the five fetched fruits.",
    },
  },
};
