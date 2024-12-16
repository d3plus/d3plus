import React, {useContext, useMemo} from "react";
import { Anchor, Canvas, Controls, Description, DocsContext, Subheading, Subtitle, Title } from '@storybook/blocks';

const replacer = (key, value) => {
  if (value instanceof Array && typeof value[0] === "object") {
    return value.map(d => JSON.stringify(d));
  }
  return value;
}

const preview = {
  parameters: {
    docs: {
      page: () => {
        const {componentStories} = useContext(DocsContext);
        const stories = componentStories();
        return (
          <>
            <Title />
            <Subtitle />
            <Description />
            {stories.map(story => {
              const {component, moduleExport} = story;
              const stringifiedArgs = JSON.stringify(moduleExport.args);
              const code = useMemo(() => {
                return `import {${component.name}} from "d3plus-react";
${stringifiedArgs.includes("formatAbbreviate") ? `import {formatAbbreviate} from "d3plus-format";\n` : ""}
const myChart = () => <${component.name} config={${JSON.stringify(moduleExport.args, replacer, 2)
                  // "data" cleanup
                  .replace(/\"(\{[^\}]+\})\"/g, "$1")
                  .replace(/\\"([A-z0-9]+)\\"\:/g, "$1:")
                  .replace(/([^\s]):([^\s^\/])/g, "$1: $2")
                  .replace(/([^\s]),([^\s])/g, "$1, $2")
                  .replace(/\[([^\]^\{]+)\]/g, str => str.replace(/ /gm, "").replace(/\n/gm, " "))
            
                  // remove parentheses from keys
                  .replace(/\"([A-z0-9]+)\"\:/g, "$1:")
            
                  // cleans up funcitons
                  .replace(/\"([^=].+=)> ([^\"].+)\"/g, "$1> $2")
                  .replace(/\:\s\"function\(([^\"].+)\"/g, "($1")
                  .replace(/\\n/g, "\n")
                  .replace(/\\"/g, "\"")}} />`;
              }, [stringifiedArgs]);
              return (
                <Anchor storyId={story.id}>
                  <Subheading>{story.name}</Subheading>
                  <Description />
                  <Canvas
                    of={moduleExport}
                    withToolbar={false}
                    story={{height: `${moduleExport.args.height || 400}px`}}
                    source={{
                      code,
                      language: "jsx"
                    }}
                    sourceState="shown"
                  />
                  {story.parameters.controls ? <Controls of={moduleExport} /> : null}
                </Anchor>
              );
            })}
          </>
        );
      },
      toc: true
    },
    options: {
      storySort: {
        method: "alphabetical",
        order: [
          "Introduction", 
          "Installation", 
          "*", 
          "Core", 
          "Advanced"
        ]
      }
    }
  },
  tags: ["autodocs"]
}

export default preview;