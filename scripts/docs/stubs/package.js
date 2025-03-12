export default function(packageJSON) {
  
  const {dependencies, description, keywords, name, version} = packageJSON;
  const folderName = name.slice(1).split("/")[1];
  
  if (dependencies) {
    Object.keys(dependencies).forEach(depName => {
      if (depName.includes("@d3plus/")) dependencies[depName] = version;
    });
  }

  const obj = {
    name,
    version,
    description,
    license: "MIT",
    type: "module",
    exports: "./es/index.js",
    main: name === "@d3plus/react" ? undefined : `build/d3plus-${folderName}.full.js`,
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
    scripts: name === "@d3plus/react" ? {
      "build": "node ../../scripts/build.js",
      "dev": "vite serve dev",
      "pretest": "npm run build",
      "test": "eslint src"
    } : {
      build: "node ../../scripts/build.js",
      dev: "node ../../scripts/dev.js",
      pretest: "npm run build",
      test: "eslint index.js src && eslint --global=it test && mocha 'test/**/*-test.js'"
    },
    dependencies
  };

  if (packageJSON.devDependencies) obj.devDependencies = packageJSON.devDependencies;
  if (packageJSON.peerDependencies) obj.peerDependencies = packageJSON.peerDependencies;

  return obj;
}