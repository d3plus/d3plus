export default function(packageJSON) {
  
  const {dependencies, description, keywords, name, version} = packageJSON;
  const folderName = name.slice(1).split("/")[1];
  
  if (dependencies) {
    Object.keys(dependencies).forEach(depName => {
      if (depName.includes("@d3plus/")) dependencies[depName] = version;
    });
  }

  const isReact = name === "@d3plus/react";

  const obj = {
    name,
    version,
    description,
    license: "MIT",
    type: "module",
    exports: `./es/index.${isReact ? "jsx" : "js"}`,
    browser: isReact ? undefined : `./umd/d3plus-${folderName}.full.js`,
    engines: {node: ">=18"},
    sideEffects: false,
    files: isReact ? ["es"] : ["umd", "es"],
    homepage: "https://d3plus.org",
    repository: {
      type: "git",
      url: "git+https://github.com/d3plus/d3plus.git",
      directory: `packages/${folderName}`
    },
    keywords,
    scripts: {
      "build:esm": "node ../../scripts/build-esm.js",
      "build:umd": isReact ? undefined : "node ../../scripts/build-umd.js",
      dev: "node ../../scripts/dev.js",
      test: isReact 
        ? "eslint index.jsx src/**/*.jsx" 
        : "eslint index.js src/**/*.js && eslint --global=it test && mocha 'test/**/*-test.js'"
    },
    dependencies
  };

  if (packageJSON.devDependencies) obj.devDependencies = packageJSON.devDependencies;
  if (packageJSON.peerDependencies) obj.peerDependencies = packageJSON.peerDependencies;

  return obj;
}