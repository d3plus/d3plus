// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes} from "../../args/format/formatAbbreviate.args";
import {formatAbbreviate} from "@d3plus/format";

export default {
  title: "Format/formatAbbreviate",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Formats a number to an appropriate number of decimal places and rounding, adding suffixes if applicable (ie. 1200000 to \"1.2M\").",
      },
    },
  }
};
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

export const BasicExample = () => {
  const values = [42, 1234, 1234567, 1234567890, 0.0042];
  return (
    <table style={{borderCollapse: "collapse", fontFamily: "monospace", fontSize: 14}}>
      <thead>
        <tr><th style={{textAlign: "right", padding: "4px 16px"}}>input</th><th style={{textAlign: "left", padding: "4px 16px"}}>formatAbbreviate(n)</th></tr>
      </thead>
      <tbody>
        {values.map(v => (
          <tr key={v}>
            <td style={{textAlign: "right", padding: "4px 16px"}}>{v}</td>
            <td style={{padding: "4px 16px", fontWeight: "bold"}}>{formatAbbreviate(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
