const excludedAttributes = [
  "aria-hidden",
  "aria-label",
  "class", 
  "clip-path", 
  "id",
  "role",
  "shape-rendering",
  "style",
  "vector-effect"
];

function parseElem(element) {
  // console.log(element);
  const returnObject = [...element.attributes].reduce((obj, attr) => {
    if (attr.specified && !excludedAttributes.includes(attr.name)) {
      obj[attr.name] = !isNaN(parseFloat(attr.value, 10))
        ? parseFloat(attr.value, 10)
        : attr.value.replace(/\n\s+/gm, "");
    }
    return obj;
  }, {});
  if (element.innerHTML !== "") returnObject.innerHTML = element.innerHTML;
  if (element.d) returnObject.d = element.d;
  return returnObject;
}

function analyze(element) {

  function getClass(className) {
    return element.getElementsByClassName(className)[0];
  }

  const results = {}

  results.bar = parseElem(getClass("bar"));
  results.grid = [...getClass("grid").getElementsByTagName("line")].map(parseElem);

  const tickGroup = getClass("ticks");
  const tickGroups = tickGroup.getElementsByClassName("d3plus-Shape");
  results.ticks = [...[...tickGroups].map(elem => elem.getElementsByTagName("path")[0])].map(parseElem);
  const textGroups = tickGroup.getElementsByClassName("d3plus-textBox");
  results.labels = [...[...textGroups].map(elem => elem.getElementsByTagName("text"))].map(texts => {
    return [...texts].map(parseElem);
  });

  const titleGroup = getClass("d3plus-Axis-title");
  results.title = [...titleGroup.getElementsByTagName("text")].map(parseElem);

  return JSON.parse(JSON.stringify(results));
}

export default analyze;