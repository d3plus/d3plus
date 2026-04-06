import React from "react";
import {Treemap} from "@d3plus/react";
import {Source} from "@storybook/addon-docs/blocks";
import stringify from "../helpers/stringify";

const Logo = () => {
  const config = {
    data: [
      {id: "alpha", value: 29},
      {id: "beta", value: 10},
      {id: "gamma", value: 2},
      {id: "delta", value: 29},
      {id: "eta", value: 25},
    ],
    groupBy: "id",
    sum: "value",
  };

  const code = `<Treemap config={${stringify(config)}} />`;

  const mobile = window !== undefined && window.innerWidth <= 768;

  const wrapperStyle = {
    alignItems: "align-start",
    display: "flex",
    flexDirection: mobile ? "column" : "row",
    height: mobile ? "auto" : "300px",
    marginBottom: 50,
  };
  const sourceStyle = {
    marginRight: mobile ? 0 : "20px",
    marginTop: 0,
    width: mobile ? "100%" : "300px",
  };
  const vizStyle = {flex: `1 1 ${mobile ? "300px" : "auto"}`, height: 300};

  return (
    <div style={wrapperStyle}>
      <div style={sourceStyle}>
        <Source code={code} />
      </div>
      <div style={vizStyle}>
        <Treemap config={config} />
      </div>
    </div>
  );
};

export default Logo;
