const logFactory = require("../node_modules/d3plus-dev/bin/log.cjs");
const shell = require("shelljs");

const log = logFactory("documentation");
const {description, name} = JSON.parse(shell.cat("package.json"));

log.timer("writing JSDOC comments to README.md");
const template = `${shell.tempdir()}/README.hbs`;
const docDir = `${shell.pwd()}/node_modules/d3plus-dev/bin/docs`;
const contents = `# ${name}

${description}

## Installing

Using npm: \`npm install ${name}\`

## Configuration

A valid d3plus \`config\` _Object_ needs to be provided to the \`config\` prop of every visualization.

\`\`\`jsx
import {Treemap} from "d3plus-react";

const methods = {
  groupBy: "id",
  data: [
    {id: "alpha", value: 29},
    {id: "beta",  value: 10}
  ],
  size: d => d.value
};

<Treemap config={methods} />
\`\`\`

Additionally, a global set of styles can be set using the \`D3plusContext\` Provider. This allows you to set base styles on all of your visualizations in one place, often in an external file. A component's \`config\` set by props will override global defaults key-by-key using a deep cloning function.
\`\`\`jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {D3plusContext} from "d3plus-react";
import App from "src/App.jsx";

const globalConfig = {
  shapeConfig: {
    fill: "red"
  }
};

ReactDOM.createRoot(document.getElementById("viz")).render(
  <React.StrictMode>
    <D3plusContext.Provider value={globalConfig}>
      <App />
    </D3plusContext.Provider>
  </React.StrictMode>
);
\`\`\`

## Update Cycle

In order to detect whether a component _should_ udpate in React, each component does a rudimentary check between the current \`config\` object and the incoming new \`config\` object. This is done via a simple equality check on the stringified versions of each object. This can also be overridded using the \`forceUpdate\` prop:

\`\`\`js
const shouldUpdate = this.props.forceUpdate ? false : JSON.stringify(oldConfig) === JSON.stringify(newConfig);
\`\`\`

This works in _most_ cases, but may not update your visualizations if using an accessor function that references an external variable. For example, if your \`x\` accessor is:

\`\`\`jsx
const config = {
  ...,
  x: d => d[xVar]
};
\`\`\`

...and \`xVar\` changes, the visualization will not update. The quick "hack" for this is add \`xVar\` to the config object so that it triggers the update via stringify:

\`\`\`jsx
const config = {
  ...,
  x: d => d[xVar],
  xVar
};
\`\`\`

## API Reference

{{#modules~}}
{{#if @first~}}##### Scripts
{{/if~}}
* [{{{name}}}](#{{{anchorName}}}){{#if summary}} - {{{summary}}}{{else if description}} - {{{description}}}{{/if}}
{{#if @last}}

{{/if~}}
{{/modules}}
{{>list kind="class" title="Classes" ~}}
{{>list kind="mixin" title="Mixins" ~}}
{{>list kind="member" title="Members" ~}}
{{>list kind="namespace" title="Objects" ~}}
{{>list kind="constant" title="Constants" ~}}
{{>list kind="function" title="Functions" ~}}
{{>list kind="event" title="Events" ~}}
{{>list kind="typedef" title="Typedefs" ~}}
{{>list kind="external" title="External" ~}}
{{>list kind="file" title="File" ~}}

---

{{#orphans ~}}
<a name="{{{anchorName}}}"></a>
#### {{>sig}}
{{>body~}}

---

{{/orphans~}}


###### <sub>Documentation generated on {{currentDate}}</sub>
`;
new shell.ShellString(contents).to(template);

shell.exec(`jsdoc2md '+(src)/**/*.+(js|jsx)' --separators --helper ${ docDir }/helpers.cjs --partial '${ docDir }/partials/*.hbs' -t ${template} > README.md`, (code, stdout) => {
  if (code) {
    log.fail();
    shell.echo(stdout);
    shell.exit(code);
  }
  else {
    log.exit();
    shell.exit(0);
  }
});
