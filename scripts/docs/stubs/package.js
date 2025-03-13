export default function(packageJSON) {
  
  const {dependencies, description, keywords, name, version} = packageJSON;
  const folderName = name.slice(1).split("/")[1];
  
  if (dependencies) {
    Object.keys(dependencies).forEach(depName => {
      if (depName.includes("@d3plus/")) dependencies[depName] = version;
    });
  }

  const commonJSFile = name === "@d3plus/react" ? undefined : `./build/d3plus-${folderName}.full.js`;

  const obj = {
    name,
    version,
    description,
    license: "MIT",
    type: "module",
    exports: "./es/index.js",
    browser: commonJSFile,
    engines: {node: ">=18"},
    sideEffects: false,
    files: name === "@d3plus/react" ? ["es"] : ["build", "es"],
    homepage: "https://d3plus.org",
    repository: {
      type: "git",
      url: "git+https://github.com/d3plus/d3plus.git",
      directory: `packages/${folderName}`
    },
    keywords,
    scripts: {
      build: "node ../../scripts/build.js",
      dev: "node ../../scripts/dev.js",
      test: name === "@d3plus/react" 
        ? "eslint index.js src/**/*.jsx" 
        : "eslint index.js src/**/*.js && eslint --global=it test && mocha 'test/**/*-test.js'"
    },
    dependencies
  };

  if (packageJSON.devDependencies) obj.devDependencies = packageJSON.devDependencies;
  if (packageJSON.peerDependencies) obj.peerDependencies = packageJSON.peerDependencies;

  return obj;
}