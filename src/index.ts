import type { ESLint } from "eslint";

import { rule } from "./rule";
import { version } from "../package.json";

const plugin: ESLint.Plugin = {
  meta: {
    name: "@rickyli79/eslint-rule-uuid-generator",
    version,
  },
  rules: {
    "uuid-generator": rule,
  },
  configs: {},
};

plugin.configs = {
  recommended: {
    plugins: {
      "uuid-generator": plugin,
    },
    rules: {
      "uuid-generator/uuid-generator": "error",
    },
  },
};

export default plugin;
export { rule };
export type { UuidGeneratorOptions, UuidVersion } from "./rule";
