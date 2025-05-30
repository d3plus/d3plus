const capitalize = str => str.replace(/\b[a-z]/g, char => char.toUpperCase());

const warning = `// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.
`;

export default function(story, packageName, filePath, existingContent) {
  const {kind, name} = story;
  const description = (story.description || "").replace(/\`/g, "").replace(/\"/g, '\\"');
  const existingStories = existingContent.length ? existingContent.split(warning)[1].trimStart() : "";
  const jumps = filePath.split("/").map(() => "..").join("/");
  return `// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";
${
    kind === "class" ? `
import {argTypes, ${name}} from "${jumps}/../args/${packageName}${filePath}/${name}.args";
import configify from "${jumps}/../helpers/configify";
import funcify from "${jumps}/../helpers/funcify";

export default {
  title: "${capitalize(`${packageName}${filePath}/${name}`)}",
  component: ${name},
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "${description}",
      },
    },
  }
};

const Template = (args) => <${name} config={configify(args, argTypes)} />;` 
      : `
import {argTypes} from "${jumps}/../args/${packageName}${filePath}/${name}.args";
import {${name}} from "@d3plus/${packageName}";

export default {
  title: "${capitalize(`${packageName}${filePath}`)}/${name}",
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "${description}",
      },
    },
  }
};`}
  
${warning}
${existingStories}`;

}