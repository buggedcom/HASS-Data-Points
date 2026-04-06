import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import eslintConfigPrettier from "eslint-config-prettier";
import litPlugin from "eslint-plugin-lit";
import litA11yPlugin from "eslint-plugin-lit-a11y";
import unusedImports from "eslint-plugin-unused-imports";
import wcPlugin from "eslint-plugin-wc";
import globals from "globals";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      "custom_components/hass_datapoints/hass-datapoints-cards.js",
      "node_modules/**",
      ".git/**",
      ".claude/**",
      ".idea/**",
    ],
  },
  js.configs.recommended,
  ...compat.extends("airbnb-base"),
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["custom_components/hass_datapoints/src/**/*.{js,ts}"],
  })),
  {
    files: ["custom_components/hass_datapoints/src/**/*.{js,ts}"],
    plugins: {
      lit: litPlugin,
      "lit-a11y": litA11yPlugin,
      "unused-imports": unusedImports,
      wc: wcPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      "class-methods-use-this": "off",
      "consistent-return": "off",
      curly: ["error", "all"],
      "import/extensions": "off",
      "import/no-mutable-exports": "off",
      "import/no-unresolved": "off",
      "import/prefer-default-export": "off",
      "no-console": "warn",
      "no-continue": "off",
      "no-param-reassign": "off",
      "no-plusplus": "off",
      "no-restricted-syntax": "off",
      "no-undef": "off",
      "no-underscore-dangle": "off",
      "no-use-before-define": "off",
      "object-shorthand": ["error", "always", { avoidQuotes: true }],
      "prefer-destructuring": "off",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "wc/guard-super-call": "error",
      "wc/no-constructor-attributes": "error",
      "lit-a11y/anchor-is-valid": "off",
    },
  },
  {
    files: [
      "custom_components/hass_datapoints/src/atoms/**/*.{js,ts}",
      "custom_components/hass_datapoints/src/molecules/**/*.{js,ts}",
      "custom_components/hass_datapoints/src/controllers/**/*.{js,ts}",
      "custom_components/hass_datapoints/src/contexts/**/*.{js,ts}",
    ],
    languageOptions: {
      sourceType: "module",
    },
  },
  {
    files: [
      "custom_components/hass_datapoints/src/**/__tests__/**/*.{js,ts}",
      "custom_components/hass_datapoints/src/**/*.{spec,test}.{js,ts}",
      "custom_components/hass_datapoints/src/**/stories/**/*.{js,ts}",
      "custom_components/hass_datapoints/src/**/*.stories.{js,ts}",
      "custom_components/hass_datapoints/src/test-support/**/*.{js,ts}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-extraneous-dependencies": "off",
    },
  },
  eslintConfigPrettier,
];
