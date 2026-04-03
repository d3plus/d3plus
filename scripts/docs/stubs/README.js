export default function ({name, description}) {
  return `# ${name}

${description}

## Installing

If using npm, \`npm install ${name}\`. Otherwise, you can download the [latest release from GitHub](https://github.com/d3plus/d3plus/releases/latest) or load from a [CDN](https://cdn.jsdelivr.net/npm/${name}).

\`\`\`js
import {*} from "${name}";
\`\`\`

In a vanilla environment, a \`d3plus\` global is exported from the pre-bundled version:

\`\`\`html
<script src="https://cdn.jsdelivr.net/npm/${name}"></script>
<script>
  console.log(d3plus);
</script>
\`\`\`

## Examples

Live examples can be found on [d3plus.org](https://d3plus.org/), which includes a collection of example visualizations using [@d3plus/react](https://github.com/d3plus/d3plus/tree/main/packages/react).

## API Reference

`;
}
