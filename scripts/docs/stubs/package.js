export default function (packageJSON) {
  const {dependencies, description, keywords, name, version} = packageJSON;
  const folderName = name.slice(1).split("/")[1];

  if (dependencies) {
    Object.keys(dependencies).forEach(depName => {
      if (depName.includes("@d3plus/")) dependencies[depName] = version;
    });
  }

  const isReact = name === "@d3plus/react";
  const isDocs = name === "@d3plus/docs";

  const obj = {
    name,
    version,
    description,
    license: "MIT",
    type: isDocs ? undefined : "module",
    types: `./types/index.${isReact ? "tsx" : "ts"}`,
    exports: isDocs
      ? undefined
      : {
          ".": {
            types: `./types/index.${isReact ? "tsx" : "ts"}`,
            default: `./es/index.${isReact ? "jsx" : "js"}`,
          },
        },
    browser:
      isDocs || isReact ? undefined : `./umd/d3plus-${folderName}.full.js`,
    engines: isDocs ? undefined : {node: ">=18"},
    sideEffects: isDocs ? undefined : false,
    files: isDocs
      ? undefined
      : isReact
        ? ["es", "types"]
        : ["umd", "es", "types"],
    homepage: "https://d3plus.org",
    repository: {
      type: "git",
      url: "git+https://github.com/d3plus/d3plus.git",
      directory: `packages/${folderName}`,
    },
    keywords,
    scripts: {
      "build:esm": isDocs ? undefined : "node ../../scripts/build-esm.js",
      "build:types": isDocs ? undefined : "tsc",
      "build:umd":
        isDocs || isReact ? undefined : "node ../../scripts/build-umd.js",
      build: isDocs ? "storybook build --docs -o build" : undefined,
      dev: "node ../../scripts/dev.js",
      "dev:local": isDocs
        ? "storybook dev --docs --ci --no-version-updates --port=4000"
        : undefined,
      test: isDocs
        ? undefined
        : isReact
          ? "eslint && mocha --import=./test/loader.mjs 'test/**/*-test.mjs'"
          : "eslint index.ts src/**/*.ts && eslint --global=it test && mocha 'test/**/*-test.ts'",
    },
    dependencies,
  };

  if (packageJSON.devDependencies)
    obj.devDependencies = packageJSON.devDependencies;
  if (packageJSON.peerDependencies)
    obj.peerDependencies = packageJSON.peerDependencies;

  return obj;
}
