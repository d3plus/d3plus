import React, {useEffect, useState} from "react";
import {Treemap} from "d3plus-react";

const config = {
  data: [
    {id: "alpha", value: 29, year: 2010},
    {id: "beta",  value: 10, year: 2010},
    {id: "gamma", value: 2,  year: 2010},
    {id: "delta", value: 29, year: 2010},
    {id: "eta",   value: 25, year: 2010}
  ]
};

const Test = () => {

  const [title, setTitle] = useState("Hi Felipe!");

  useEffect(() => {
    setTimeout(() => {
      setTitle("Hi Alan!");
    }, 3000);
  }, []);

  config.title = title;

  return <Treemap config={config} />;
};

export default Test;
