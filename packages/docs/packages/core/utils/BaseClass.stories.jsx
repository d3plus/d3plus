// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, BaseClass} from "../../../args/core/utils/BaseClass.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Utils/BaseClass",
  component: BaseClass,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Provides shared configuration, event handling, and locale management inherited by all d3plus classes.",
      },
    },
  }
};

const Template = (args) => <BaseClass config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.


const note = {margin: 0, fontSize: 14, lineHeight: 1.5, color: "#495057", maxWidth: 720};

export const Reference = () => (
  <p style={note}>
    The root of every d3plus class. Nothing renders here: the table below lists the configuration every chart,
    component, and shape inherits from it, and the snippet shows how a subclass is written.
  </p>
);
Reference.args = {height: 90};
Reference.parameters = {
  controls: {sort: "alpha"},
  docs: {
    source: {
      code: `import {BaseClass} from "@d3plus/core";

class Widget extends BaseClass {
  constructor() {
    super();
    this._size = 10;
  }

  // Getter/setter pairs are what config() drives: no argument reads, one writes.
  size(_) {
    return arguments.length ? ((this._size = _), this) : this._size;
  }
}

const widget = new Widget().config({size: 20, locale: "es-ES"});
widget.size();          // 20
widget.on("click", d => console.log(d));`,
      language: "jsx",
    },
    description: {
      story: "`BaseClass` supplies the fluent API shared by every class: `config()` for deep-merging a settings object (with `RESET` to restore defaults), `on()` for event handlers, `locale()` for translations and number formats, and `translate()` for localized strings. A subclass only has to define getter/setter methods; `config()` discovers and calls them.",
    },
  },
};
