const fakes = {
  "html-to-image": new URL("./html-to-image.js", import.meta.url).href,
};
const saveBlob = new URL("./saveBlob.js", import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  if (specifier in fakes) return {url: fakes[specifier], shortCircuit: true};
  // saveElement's download is recorded; saveBlob's own test loads the real one.
  if (specifier === "./saveBlob.js" && context.parentURL?.endsWith("/es/src/saveElement.js")) {
    return {url: saveBlob, shortCircuit: true};
  }
  return nextResolve(specifier, context);
}
