import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "../index.jsx";
import "@mantine/core/styles.css";
import {createTheme, MantineProvider} from "@mantine/core";
import Treemap from "./Treemap.jsx";
import TextBox from "./TextBox.jsx";
import Icon from "./Icon.jsx";
import Logo from "./Logo.jsx";

export const theme = createTheme({
  /* Put your mantine theme override here */
});

const globalConfig = {};

const boxStyle = {
  border: "1px solid rgba(255, 0, 0, 0.25)",
  display: "block", 
  height: "500px", 
  margin: "auto 10%", 
  padding: "20px", 
  textAlign: "center",
  width: "80%", 
  verticalAlign: "middle"
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <D3plusContext.Provider value={globalConfig}>
    <MantineProvider theme={theme}>
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
    </MantineProvider>
  </D3plusContext.Provider>
);
