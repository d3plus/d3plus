import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "../index.js";
import "@mantine/core/styles.css";
import {createTheme, MantineProvider} from "@mantine/core";
import Test from "./Test.jsx";

export const theme = createTheme({
  /* Put your mantine theme override here */
});

const globalConfig = {
  // title: "Hi Alex!"
};

const boxStyle = {
  border: "1px solid rgba(255, 0, 0, 0.25)",
  display: "inline-block", 
  height: "500px", 
  padding: "2%", 
  width: "45%", 
  verticalAlign: "middle"
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <D3plusContext.Provider value={globalConfig}>
      <MantineProvider theme={theme}>
        <div style={boxStyle}>
          <Test />
        </div>
      </MantineProvider>
    </D3plusContext.Provider>
  </React.StrictMode>
);
