export default function({name, description, version}) {
  return `# ${name}
  
${description}

## Installing

If using npm, \`npm install ${name}\`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/${name}).

\`\`\`js
import modules from "${name}";
\`\`\`

In vanilla JavaScript, a \`d3plus\` global is exported from the pre-bundled version:

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/${name}@${version}"></script>
<script>
  console.log(d3plus);
</script>
\`\`\`

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using @d3plus/react.

## API Reference

{{>list kind="class" title="Classes" ~}}
{{>list kind="function" title="Functions" ~}}
{{>list kind="mixin" title="Mixins" ~}}
{{>list kind="member" title="Members" ~}}
{{>list kind="namespace" title="Objects" ~}}
{{>list kind="constant" title="Constants" ~}}
{{>list kind="event" title="Events" ~}}
{{>list kind="typedef" title="Typedefs" ~}}
{{>list kind="external" title="External" ~}}
{{>list kind="file" title="File" ~}}
{{#modules~}}
{{#if @first~}}

##### Scripts
{{/if~}}
* [{{{name}}}](#{{{anchorName}}}){{#if summary}} - {{{summary}}}{{else if description}} - {{{description}}}{{/if}}
{{/modules~}}

---

{{>parent kind="class" ~}}
{{>parent kind="function" ~}}
{{>parent kind="mixin" ~}}
{{>parent kind="member" ~}}
{{>parent kind="namespace" ~}}
{{>parent kind="constant" ~}}
{{>parent kind="event" ~}}
{{>parent kind="typedef" ~}}
{{>parent kind="external" ~}}
{{>parent kind="file" ~}}
{{>parent kind="module" ~}}
{{#modules~}}
<a name="{{{anchorName}}}"></a>
#### {{>sig}}
{{>body~}}

---

{{/modules}}

###### <sub>Documentation generated on {{currentDate}}</sub>
`;

}