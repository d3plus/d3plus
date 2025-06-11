import React from "react";
import {Treemap} from "@d3plus/react";
import {Source} from '@storybook/blocks';
import stringify from "../helpers/stringify";

const Logo = () => {

  const config = {
    data: [
      {id: "alpha", value: 29},
      {id: "beta", value: 10},
      {id: "gamma", value: 2},
      {id: "delta", value: 29},
      {id: "eta", value: 25}
    ],
    groupBy: "id",
    sum: "value"
  };

  const code = `<Treemap config={${stringify(config)}} />`;

  return (
    <div style={{
      alignItems: "stretch",
      display: "flex",
      height: "300px"
    }}>
      <div style={{marginRight: "20px", width: "300px"}}>
        <Source code={code} />
      </div>
      <div style={{flex: "1 1 auto"}}>
        <Treemap config={config} />
      </div>
    </div>
  );
};

export default Logo;
