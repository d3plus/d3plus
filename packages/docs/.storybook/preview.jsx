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
              // Utility-function demos (Format / Text / Color / Data) document
              // a plain function, not a docgen'd React component: they carry
              // no `component` (hence no __docgenInfo) and no `args`. Guard
              // every component/args lookup so these stories render their live
              // example instead of throwing, and skip the synthesized import
              // snippet and the "methods" link, which only apply to chart classes.
              const displayName = component?.__docgenInfo?.displayName;
              const compName = displayName
                ? displayName.replace(/_args_[A-z]+/g, "")
                : null;
              const stringifiedArgs =
                moduleExport.args != null ? stringify(moduleExport.args) : null;
              const code = useMemo(() => {
                if (!compName || !stringifiedArgs) return null;
                return `import {${compName}} from "@d3plus/react";
${stringifiedArgs.includes("formatAbbreviate") ? `import {formatAbbreviate} from "@d3plus/format";\n` : ""}
<${component.name} config={${stringifiedArgs}} />`;
              }, [compName, stringifiedArgs]);
              return (
                <Anchor storyId={story.id}>
                  <Heading>{story.name}</Heading>
                  <Canvas
                    of={moduleExport}
                    withToolbar={false}
                    // Charts need a fixed canvas height (their SVG fills it);
                    // utility-function demos have no component, so let the
                    // canvas size to its content instead of padding to 350px.
                    story={
                      component
                        ? {height: `${moduleExport.args?.height || 350}px`}
                        : undefined
                    }
                    source={code ? {code, language: "jsx"} : undefined}
                    sourceState="shown"
                  />
                  {story.parameters.controls ? (
                    <Controls of={moduleExport} />
                  ) : null}
                  {compName ? (
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
                  ) : null}
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
        order: [
          "Introduction",
          "Guides",
          ["Migration (v3 → v4)", "Configuration", "Rendering", "Data", "Interactivity", "Theming", "Accessibility"],
          "Core",
          "*",
        ],
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
