import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "../index.tsx";
import Treemap from "./Treemap.jsx";
import TextBox from "./TextBox.jsx";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";

const globalConfig = {};

const boxStyle = {
  border: "1px solid rgba(255, 0, 0, 0.25)",
  display: "block",
  height: 500,
  margin: "auto 10%",
  padding: "20px",
  textAlign: "center",
  width: "80%",
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <D3plusContext.Provider value={globalConfig}>
    {/* <div style={boxStyle}>
      <Logo />
    </div>
    <div style={boxStyle}>
      <Icon />
    </div> */}
    <div style={boxStyle}>
      <TextBox />
    </div>
    <div style={boxStyle}>
      <Treemap />
    </div>
  </D3plusContext.Provider>,
);
