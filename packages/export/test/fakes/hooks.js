const fakes = {
  "file-saver": new URL("./file-saver.js", import.meta.url).href,
  "html-to-image": new URL("./html-to-image.js", import.meta.url).href,
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier in fakes) return {url: fakes[specifier], shortCircuit: true};
  return nextResolve(specifier, context);
}
