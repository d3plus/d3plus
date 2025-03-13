import React, {useEffect, useState} from "react";
import {Treemap} from "../index.jsx";

const defaultConfig = {
  data: [
    {id: "Dave", value: 10},
    {id: "Alex", value: 9}
  ]
};

const Test2 = () => {

  const [config, setConfig] = useState(defaultConfig);

  // useEffect(() => {
  //   setTimeout(() => {
  //     setConfig({
  //       ...defaultConfig,
  //       height: 200,
  //       title: "Hi Alan!"
  //     });
  //   }, 3000);
  // }, []);

  return <Treemap config={config} />;
};

export default Test2;
