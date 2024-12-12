import React, {useMemo} from "react";
import { Source } from "@storybook/blocks";
import { ArgTypes, Description, Subtitle, Title } from '@storybook/blocks';

const replacer = (key, value) => {
  if (key === "data" && value instanceof Array) {
    return value.map(d => JSON.stringify(d));
  }
  return value;
}

const codeRenderer = (Story, context) => {

  const code = useMemo(() => {
    return JSON.stringify(context.allArgs, replacer, 2)
      // "data" cleanup
      .replace(/\"(\{[^\}]+\})\"/g, "$1")
      .replace(/\\"([A-z0-9]+)\\"\:/g, "$1:")
      .replace(/([^\s]):([^\s])/g, "$1: $2")
      .replace(/([^\s]),([^\s])/g, "$1, $2")

      // remove parentheses from keys
      .replace(/\"([A-z0-9]+)\"\:/g, "$1:")

      // cleans up funcitons
      .replace(/\"d => ([^\"].+)\"/g, "d => $1")
      .replace(/\:\s\"function\(([^\"].+)\"/g, "($1")
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, "\"");
  }, [JSON.stringify(context.allArgs)]);
  
  const {showCode} = context.globals;
  return showCode ? <Source code={code} /> : <Story />;

};

const preview = {
  actions: {argTypesRegex: "^on[A-Z].*"},
  chromatic: {delay: 2000},
  controls: {
    expanded: false,
    sort: "requiredFirst"
  },
  decorators: [codeRenderer],
  globalTypes: {
    showCode: {
      defaultValue: false
    },
  },
  jsx: {
    showFunctions: true
  },
  parameters: {
    docs: {
      page: () => (
        <>
          <Title />
          <Subtitle />
          <Description />
          <ArgTypes />
        </>
      )
    },
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Introduction", 
          "Installation", 
          "*", 
          "Charts", 
          "Advanced"
        ]
      }
    },
    toolbar: {
      zoom: {hidden: true}
    }
  }
}

export default preview;