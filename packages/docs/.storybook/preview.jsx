import React, {useContext, useMemo} from "react";
import { Anchor, Canvas, Controls, Description, DocsContext, Subheading, Subtitle, Title } from '@storybook/blocks';
import theme from "./theme.js";
import stringify from "../helpers/stringify.js";
import {D3plusContext} from "@d3plus/react";
const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const tickColor = darkMode ? "#dee2e6" : "#495057";
const gridColor = darkMode ? "#495057" : "#dee2e6";

const axisConfig = {
  barConfig: {
    stroke: tickColor
  },
  gridConfig: {
    stroke: gridColor
  },
  shapeConfig: {
    fill: tickColor,
    labelConfig: {
      fontColor: tickColor
    },
    stroke: tickColor
  },
  titleConfig: {
    fontColor: tickColor
  }
};
const globalConfig = {
  axisConfig,
  colorScaleConfig: {
    axisConfig: {
      barConfig: {
        stroke: tickColor
      },
      gridConfig: {
        stroke: gridColor
      },
      shapeConfig: {
        labelConfig: {
          fontColor: tickColor
        },
        stroke: tickColor
      },
      titleConfig: {
        fontColor: tickColor
      }
    }
  },
  columnConfig: axisConfig,
  fontColor: tickColor,
  legendConfig: {
    shapeConfig: {
      labelConfig: {
        fontColor: tickColor
      }
    }
  },
  rowConfig: axisConfig,
  xConfig: axisConfig,
  x2Config: axisConfig,
  yConfig: axisConfig,
  y2Config: axisConfig
};

const preview = {
  decorators: [
    (Story) => (
      <D3plusContext.Provider value={globalConfig}>
        <Story />
      </D3plusContext.Provider>
    )
  ],
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
              const stringifiedArgs = stringify(moduleExport.args);
              const compName = component.__docgenInfo.displayName.replace(/_args_[A-z]+/g, "");
              const code = useMemo(() => {
                return `import {${compName}} from "@d3plus/react";
${stringifiedArgs.includes("formatAbbreviate") ? `import {formatAbbreviate} from "@d3plus/format";\n` : ""}
<${component.name} config={${stringifiedArgs}} />`;
              }, [stringifiedArgs]);
              return (
                <Anchor storyId={story.id}>
                  <Subheading>{story.name}</Subheading>
                  <Canvas
                    of={moduleExport}
                    withToolbar={false}
                    story={{height: `${moduleExport.args.height || 350}px`}}
                    source={{
                      code,
                      language: "jsx"
                    }}
                    sourceState="shown"
                  />
                  {story.parameters.controls ? <Controls of={moduleExport} /> : null}
                  <p>Full documentation for all available <strong>{compName}</strong> methods can be found <a href={`https://github.com/d3plus/d3plus/tree/main/packages/core#${compName}`} target="_blank">here</a>.</p>
                  <br />
                  <br />
                </Anchor>
              );
            })}
          </>
        );
      },
      theme: theme,
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