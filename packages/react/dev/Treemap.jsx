import React, {useState} from "react";
import {Treemap} from "../index.jsx";

const config1 = {
  data: "./data.json",
  dataFormat: resp => resp.filter(d => d.value > 9),
  title: "Hi Felipe!",
};

const config2 = {
  data: "./data.json",
  dataFormat: resp => resp.filter(d => d.value > 0),
  title: "Config #2",
};

const callback = () => console.log("callback!");

const Test = () => {
  const [config, setConfig] = useState(config1);
  return (
    <div>
      <div style={{height: 400}}>
        <Treemap config={config} callback={callback} />
      </div>
      <button onClick={() => setConfig(config2)}>Change</button>
    </div>
  );
};

export default Test;
