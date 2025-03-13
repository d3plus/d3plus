import React, {useEffect, useState} from "react";
import {Treemap} from "../index.jsx";

const defaultConfig = {
  data: [
    {id: "alpha", value: 29, year: 2010},
    {id: "beta",  value: 10, year: 2010},
    {id: "gamma", value: 2,  year: 2010},
    {id: "delta", value: 29, year: 2010},
    {id: "eta",   value: 25, year: 2010}
  ],
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
