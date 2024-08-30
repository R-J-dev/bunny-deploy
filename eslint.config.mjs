import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import globals from "globals";

const rules = {
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      args: "all",
      argsIgnorePattern: "^_",
      caughtErrors: "all",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      ignoreRestSiblings: true,
    },
  ],
  "@typescript-eslint/restrict-template-expressions": [
    "error",
    {
      allowAny: false,
      allowBoolean: true,
      allowNullish: true,
      allowNumber: true,
      allowRegExp: false,
      allowNever: false,
    },
  ],
};

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.vscode/**",
      "**/*.config.*",
    ],
  },
  eslint.configs.recommended,
  // See for more info: https://typescript-eslint.io/getting-started/typed-linting
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
  },
  prettierConfig,
  {
    files: ["**/*.{js,ts}"],
    rules: rules,
  },
  {
    files: ["**/*spec.{js,ts}", "**/testServer.ts"],
    rules: {
      ...rules,
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },
];
