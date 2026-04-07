import React, {useContext, useMemo} from "react";
import {
  Anchor,
  Canvas,
  Controls,
  Description,
  DocsContext,
  Heading,
  Subtitle,
  Title,
} from "@storybook/addon-docs/blocks";
import theme from "./theme.js";
import stringify from "../helpers/stringify.js";

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
              const stringifiedArgs = stringify(moduleExport.args);
              const compName = component.__docgenInfo.displayName.replace(
                /_args_[A-z]+/g,
                "",
              );
              const code = useMemo(() => {
                return `import {${compName}} from "@d3plus/react";
${stringifiedArgs.includes("formatAbbreviate") ? `import {formatAbbreviate} from "@d3plus/format";\n` : ""}
<${component.name} config={${stringifiedArgs}} />`;
              }, [stringifiedArgs]);
              return (
                <Anchor storyId={story.id}>
                  <Heading>{story.name}</Heading>
                  <Canvas
                    of={moduleExport}
                    withToolbar={false}
                    story={{height: `${moduleExport.args.height || 350}px`}}
                    source={{
                      code,
                      language: "jsx",
                    }}
                    sourceState="shown"
                  />
                  {story.parameters.controls ? (
                    <Controls of={moduleExport} />
                  ) : null}
                  <p>
                    Full documentation for all available{" "}
                    <strong>{compName}</strong> methods can be found{" "}
                    <a
                      href={`https://github.com/d3plus/d3plus/tree/main/packages/core#${compName}`}
                      target="_blank"
                    >
                      here
                    </a>
                    .
                  </p>
                </Anchor>
              );
            })}
          </>
        );
      },
      theme: theme,
      toc: {headingSelector: "h2"},
    },
    options: {
      storySort: {
        method: "alphabetical",
        order: ["Introduction", "Installation", "*", "Core", "Advanced"],
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
