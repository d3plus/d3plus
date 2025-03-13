import React, {useEffect, useState} from "react";
import {Treemap} from "../index.jsx";

const defaultConfig = {
  data: "./data.json",
  dataFormat: resp => resp.filter(d => d.value > 9),
  title: "Hi Felipe!"
};

const Test = () => {

  const [config, setConfig] = useState(defaultConfig);

  useEffect(() => {
    setTimeout(() => {
      setConfig({
        ...defaultConfig,
        height: 200,
        title: "Hi Alan!"
      });
    }, 3000);
  }, []);

  return <Treemap config={config} callback={() => console.log("callback!")} />;
};

export default Test;
