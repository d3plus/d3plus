import tseslint from "typescript-eslint";
import globals from "globals";

import js from "@eslint/js";
import prettier from "eslint-config-prettier";
export default [
  js.configs.recommended,
  {
    // Build output, the manual dev pages, and Astro's generated types.
    ignores: [
      "**/{es,umd,types,dist,build,coverage}/**",
      "packages/*/dev/**",
      "packages/site/.astro/**",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    plugins: {
      js,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parser: tseslint.parser,
    },
    rules: {
      ...tseslint.configs.recommended
        .filter(c => c.rules)
        .reduce((acc, c) => ({...acc, ...c.rules}), {}),
      // Relaxed for recently-migrated TypeScript codebase
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unused-vars": ["error", {argsIgnorePattern: "^_"}],
      "prefer-const": "warn",
      "max-lines": [
        "error",
        {max: 500, skipBlankLines: true, skipComments: true},
      ],
      "max-lines-per-function": [
        "error",
        {max: 100, skipBlankLines: true, skipComments: true},
      ],
    },
  },
  {
    // Package entry points are export lists, not code: they grow by a line or
    // two with every new export, so they're exempt from file size, and may
    // hold only imports and re-exports so they stay that way.
    files: [
      "packages/core/internal.ts",
      "packages/core/umd-entry.ts",
      "packages/*/index.ts",
    ],
    ignores: ["packages/{element,svelte,vue}/index.ts"],
    rules: {
      "max-lines": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Program > :not(ImportDeclaration, ExportAllDeclaration, ExportNamedDeclaration:not([declaration]))",
          message:
            "Package entry points hold only imports and re-exports; put code in src/.",
        },
      ],
    },
  },
  {
    // Translation/data dictionaries are data, not code — exempt from file size,
    // as is the config type, which declares one property per config key.
    files: [
      "packages/locales/**/*.ts",
      "packages/core/src/utils/D3plusConfig.ts",
    ],
    rules: {
      "max-lines": "off",
    },
  },
  {
    // The site's example code: each declares the `config` its playground
    // reads, and runs with the d3plus helpers (`formatAbbreviate`, …) in
    // scope, unimported.
    files: ["packages/site/src/examples/**/*.js"],
    rules: {
      "no-undef": "off",
      // Callbacks keep the full signature d3plus calls them with.
      "no-unused-vars": [
        "error",
        {varsIgnorePattern: "^config$", args: "none"},
      ],
    },
  },
  {
    // A function's examples show how to call it, so a value they set up
    // isn't always read again.
    files: [
      "packages/site/src/examples/{color,data,dom,format,locales,math,text}/**/*.js",
      "packages/site/src/examples/core/utils/**/*.js",
    ],
    rules: {"no-unused-vars": "off"},
  },
  {
    // Test functions come from explicit `vitest` imports.
    files: ["**/test/**/*.js", "**/test/**/*.mjs"],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      // Tests may name the globals they rely on in a `/* global … */` comment
      // even when the environment already provides them.
      "no-redeclare": ["error", {builtinGlobals: false}],
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression[callee.name=/^(it|test|jsdomit)$/] > FunctionExpression[generator=true]",
          message:
            "Vitest does not drive generator test bodies; use an async function.",
        },
        {
          selector:
            "CallExpression[callee.object.type='ThisExpression'][callee.property.name='timeout']",
          message:
            "Pass {timeout} in the test's options instead of calling this.timeout().",
        },
      ],
    },
  },
  {
    // Browser tests run in the page, without Node's modules.
    files: ["**/*.browser-test.js"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^node:",
              message: "Browser tests run in the page; use a server command.",
            },
            {
              regex: "^(assert|fs|path|url|child_process)$",
              message:
                "Browser tests run in the page; use ~test/browser/assert.js or a server command.",
            },
          ],
        },
      ],
    },
  },
  // Last, so it turns off any rule that disagrees with Prettier's output.
  prettier,
];
