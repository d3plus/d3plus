// WARNING: do not edit the top part of this file directly, it is generated
// from the source code. Scroll down to the next WARNING and places stories below it.

import React from "react";

import {argTypes, Tooltip} from "../../../args/core/components/Tooltip.args";
import configify from "../../../helpers/configify";
import funcify from "../../../helpers/funcify";

export default {
  title: "Core/Components/Tooltip",
  component: Tooltip,
  argTypes,
  parameters: {
    docs: {
      description: {
        component: "Creates HTML tooltips in the body of a webpage.",
      },
    },
  }
};

const Template = (args) => <Tooltip config={configify(args, argTypes)} />;
  
// WARNING: do not edit above this line of code directly, it is generated
// from the source code. Stories below this line can be modified.

// export const BasicExample = Template.bind({});
// BasicExample.args = {
//   data: [
//     {"title": "D3plus Tooltip", "body": "Check out this cool table:", "position": "mouse", "label": "Position"}
//   ],
//   thead: ["Axis", d => d.label],
//   tbody: [
//     ["x", d => d.x],
//     ["y", d => d.y]
//   ],
//   position: d => [0, 0]
// };
// BasicExample.parameters = {controls: {include: ["footer"]}};

import {useEffect, useRef, useState} from "react";
import {Tooltip as TooltipClass} from "@d3plus/core";

const boxStyle = {
  display: "inline-block",
  padding: "14px 22px",
  borderRadius: 8,
  background: "#e7f5ff",
  border: "1px solid #74c0fc",
  color: "#1864ab",
  fontSize: 14,
  cursor: "default",
  userSelect: "none",
};

// A Tooltip instance scoped to this box: shown on enter, cleared on leave,
// and removed with its portal when the story unmounts.
const HoverDemo = ({id, config = {}, datum, track, label = "hover me"}) => {
  const box = useRef(null);
  const tip = useRef(null);
  const [pointer, setPointer] = useState(null);
  useEffect(() => {
    // Each story's tooltip gets its own element id, since several share this page.
    tip.current = new TooltipClass().parent(box.current).id(id).config(config);
    return () => {
      tip.current.data([]).render();
      if (tip.current._portalEl) tip.current._portalEl.remove();
    };
  }, []);
  const show = e => {
    const position = track ? () => [e.clientX, e.clientY] : () => box.current;
    tip.current.data([datum]).position(position).render();
  };
  const move = e => {
    if (!track) return;
    setPointer([e.clientX, e.clientY]);
    tip.current.position(() => [e.clientX, e.clientY]).render();
  };
  const hide = () => tip.current.data([]).render();
  return (
    <div style={{display: "grid", gap: 8, justifyItems: "start"}}>
      <div ref={box} style={boxStyle} onMouseEnter={show} onMouseMove={move} onMouseLeave={hide}>
        {label}
      </div>
      {track ? <code style={{fontSize: 12, color: "#666"}}>position → {JSON.stringify(pointer)}</code> : null}
    </div>
  );
};

const story = (props, code, description) => ({
  render: () => <HoverDemo {...props} />,
  args: {height: 200},
  parameters: {docs: {source: {code, language: "jsx"}, description: {story: description}}},
});

export const BasicExample = story(
  {id: "basic", datum: {title: "Alpha", body: "A tooltip built from the datum's title, body, and footer fields.", footer: "Hover away to hide it"}},
  `import {Tooltip} from "@d3plus/core";

const tooltip = new Tooltip().parent(container);

element.addEventListener("mouseenter", () => {
  tooltip
    .data([{title: "Alpha", body: "A tooltip built from the datum's fields.", footer: "Hover away to hide it"}])
    .position(() => element)
    .render();
});
element.addEventListener("mouseleave", () => tooltip.data([]).render());`,
  "A tooltip is a small HTML panel positioned next to an element or a point. Give it `data` (one datum per tooltip), a `position` (an element, or a function returning one or `[x, y]` viewport coordinates), and call `render()`; render with empty data to hide it. By default the `title`, `body`, and `footer` sections read the fields of the same name from the datum. Charts create one of these for you and expose its settings as `tooltipConfig`.",
);

export const TableContent = story(
  {
    id: "table",
    datum: {name: "Alpha", x: 42, y: 17, share: 0.31},
    config: {
      title: d => d.name,
      thead: ["Metric", "Value"],
      tbody: [
        ["x", d => d.x],
        ["y", d => d.y],
        ["share", d => `${Math.round(d.share * 100)}%`],
      ],
    },
  },
  `import {Tooltip} from "@d3plus/core";

new Tooltip()
  .parent(container)
  .title(d => d.name)
  .thead(["Metric", "Value"])
  .tbody([
    ["x", d => d.x],
    ["y", d => d.y],
    ["share", d => \`\${Math.round(d.share * 100)}%\`],
  ])
  .data([{name: "Alpha", x: 42, y: 17, share: 0.31}])
  .position(() => element)
  .render();`,
  "`thead` and `tbody` build a table between the title and footer: `thead` is a row of column headings and `tbody` a list of rows, where each cell can be a string or a function of the datum. This is the shape most chart tooltips use to list the values behind a shape.",
);

export const Styling = story(
  {
    id: "styling",
    datum: {title: "Dark theme", body: "background, border, padding, and borderRadius are all config keys."},
    config: {
      background: "#212529",
      border: "1px solid #212529",
      borderRadius: "8px",
      padding: "12px 16px",
      tooltipStyle: {color: "#f8f9fa", "font-family": "Inter, sans-serif"},
    },
  },
  `import {Tooltip} from "@d3plus/core";

new Tooltip()
  .parent(container)
  .background("#212529")
  .border("1px solid #212529")
  .borderRadius("8px")
  .padding("12px 16px")
  .tooltipStyle({color: "#f8f9fa", "font-family": "Inter, sans-serif"})
  .data([{title: "Dark theme", body: "…"}])
  .position(() => element)
  .render();`,
  "The box is styled through `background`, `border`, `borderRadius`, `padding`, `width`/`maxWidth`, and `tooltipStyle` (arbitrary CSS applied to the panel); `titleStyle`, `bodyStyle`, `footerStyle`, and the table styles target the individual sections. In a chart these all live under `tooltipConfig`.",
);

export const CoordinatePosition = story(
  {id: "pointer", datum: {title: "Following the pointer", body: "position returns [x, y] in viewport coordinates."}, track: true, label: "move the pointer around here"},
  `import {Tooltip} from "@d3plus/core";

const tooltip = new Tooltip().parent(container).data([{title: "Following the pointer", body: "…"}]);

element.addEventListener("mousemove", e => {
  tooltip.position(() => [e.clientX, e.clientY]).render();
});
element.addEventListener("mouseleave", () => tooltip.data([]).render());`,
  "Instead of an element, `position` can return `[x, y]` viewport coordinates, and calling `render()` again moves the panel. The tooltip keeps itself on screen, flipping below the point when there is no room above. This is what charts do for canvas shapes and for the pointer-tracking tooltips of Plot charts.",
);
