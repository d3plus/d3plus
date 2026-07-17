import React, {useContext} from "react";
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

// Strips the react-docgen `_args_*` suffix Storybook appends to display names.
const componentName = component => {
  const displayName = component?.__docgenInfo?.displayName;
  return displayName ? displayName.replace(/_args_[A-z]+/g, "") : null;
};

// Rebuilds the "Show code" snippet for a chart story from its LIVE args.
// Storybook re-runs this transform with the current args on every control
// change (the reactive dynamic-source path), so the code block stays in sync
// with the rendered chart instead of freezing at the story's initial args.
// Utility-function demos set an explicit `docs.source.code`, which Storybook
// prefers over this transform, so they keep their hand-written snippet. Stories
// with no docgen'd component (MDX pages) fall through to the original code.
const configSourceTransform = (code, {args, component}) => {
  const compName = componentName(component);
  if (!compName || args == null) return code;
  const stringifiedArgs = stringify(args);
  return `import {${compName}} from "@d3plus/react";
${stringifiedArgs.includes("formatAbbreviate") ? `import {formatAbbreviate} from "@d3plus/format";\n` : ""}
<${component.name} config={${stringifiedArgs}} />`;
};

const preview = {
  parameters: {
    docs: {
      source: {type: "dynamic", transform: configSourceTransform},
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
              const compName = componentName(component);
              return (
                <Anchor storyId={story.id}>
                  <Heading>{story.name}</Heading>
                  {/* Per-story prose (`parameters.docs.description.story`).
                      Bare <Description/> resolves the component-level text, so
                      the story's own description needs an explicit `of`. */}
                  <Description of={moduleExport} />
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
          ["Migration (v3 → v4)", "Frameworks", "Configuration", "Rendering", "Server-Side Rendering", "Data", "Interactivity", "Animation", "Theming", "Color", "Accessibility", "TypeScript"],
          "Core",
          "*",
        ],
      },
    },
  },
  tags: ["autodocs"],
};

export default preview;
