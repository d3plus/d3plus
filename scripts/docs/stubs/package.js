export default function(packageJSON) {
  
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
    exports: isDocs ? undefined : `./es/index.${isReact ? "jsx" : "js"}`,
    browser: (isDocs || isReact) ? undefined : `./umd/d3plus-${folderName}.full.js`,
    engines: isDocs ? undefined : {node: ">=18"},
    sideEffects: isDocs ? undefined : false,
    files: isDocs ? undefined : isReact ? ["es"] : ["umd", "es"],
    homepage: "https://d3plus.org",
    repository: {
      type: "git",
      url: "git+https://github.com/d3plus/d3plus.git",
      directory: `packages/${folderName}`
    },
    keywords,
    scripts: {
      "build:esm": isDocs ? undefined : "node ../../scripts/build-esm.js",
      "build:umd": (isDocs || isReact) ? undefined : "node ../../scripts/build-umd.js",
      "build": isDocs ? "storybook build --docs -o build" : undefined,
      dev: "node ../../scripts/dev.js",
      test: isDocs ? undefined : isReact 
        ? "eslint" 
        : "eslint index.js src/**/*.js && eslint --global=it test && mocha 'test/**/*-test.js'"
    },
    dependencies
  };

  if (packageJSON.devDependencies) obj.devDependencies = packageJSON.devDependencies;
  if (packageJSON.peerDependencies) obj.peerDependencies = packageJSON.peerDependencies;

  return obj;
}