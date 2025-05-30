import React from "react";
import {TextBox} from "../index.jsx";

const config = {
  data: [
    {text: "Here is some | [sample text] that has been wrapped using d3plus.textBox."},
    {text: "Facilities <b>with</b> All Three <b>Leadership Examples and then some</b> text and then a forth line"},
    {text: "...and here is a second sentence!"},
    {text: "这是句3号。这也即使包装没有空格！"},
    {text: "supercalifragilisticexpialidociousdavedavedavedavedavedave"},
  ],
  duration: 500,
  fontSize: 16,
  lineHeight: 18,
  width: 150,
  x: (d, i) => i * (150 + 50)
};

const Test = () => {

  return <TextBox config={config} />;
};

export default Test;
