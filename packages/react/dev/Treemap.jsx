import React from "react";
import {Treemap} from "../index.jsx";

const config = {
  data: "./data.json",
  dataFormat: resp => resp.filter(d => d.value > 9),
  title: "Hi Felipe!"
};

const Test = () => {

  return <Treemap config={config} callback={() => console.log("callback!")} />;
};

export default Test;
