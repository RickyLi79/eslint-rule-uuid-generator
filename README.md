# @rickyli79/eslint-rule-uuid-generator

An ESLint rule that replaces configurable placeholder string literals with freshly
generated UUIDs (v4 / v7) via the autofix mechanism.

For example, the default placeholder `'\UUID'` is a valid-but-pointless JS escape
(`\U` evaluates to the literal character `U`), so it can never be written on purpose.
The rule treats it as a marker and rewrites it to a real UUID:

```js
// before
const x = "\UUID";

// after `eslint --fix`
const x = "0189d5f2-0b3a-7a51-8000-4c68d07f4e0a";
```

Each occurrence gets its own fresh UUID, so `['\UUID', '\UUID']` becomes two
different UUIDs.

## Install

```sh
npm install -D @rickyli79/eslint-rule-uuid-generator
```

## Usage (flat config)

```js
// eslint.config.js
import uuidGenerator from "@rickyli79/eslint-rule-uuid-generator";

export default [
  {
    plugins: { "uuid-generator": uuidGenerator },
    rules: {
      "uuid-generator/uuid-generator": "error",
    },
  },
];
```

Or use the bundled recommended config (enables the rule with its defaults):

```js
import uuidGenerator from "@rickyli79/eslint-rule-uuid-generator";

export default [...Object.values(uuidGenerator.configs.recommended)];
```

Run with `eslint --fix` to replace the placeholders.

## Rule options

The rule accepts an array of mappings. Each mapping is:

| option        | type           | default   | description                                                          |
| ------------- | -------------- | --------- | -------------------------------------------------------------------- |
| `placeholder` | `string`       | `"\UUID"` | The exact raw source text between the quotes that triggers the rule. |
| `version`     | `"v4" \| "v7"` | `"v7"`    | Which UUID version to generate.                                      |

Without any options the rule uses `{ placeholder: "\UUID", version: "v7" }`.

Example — replace two different placeholders with different UUID versions:

```js
rules: {
  "uuid-generator/uuid-generator": [
    "error",
    [
      { placeholder: "\\UUID", version: "v7" },
      { placeholder: "UUID#7", version: "v7" },
      { placeholder: "my-uuid", version: "v4" },
    ],
  ],
},
```

## What matches

- **String literals and template literals** whose raw source text between the
  quotes/backticks is exactly the configured `placeholder` (including any escape).
- Single quotes, double quotes and backticks all count: `'\UUID'`, `"\UUID"`,
  `` `\UUID` ``.
- Comments are never matched.
- A literal that merely evaluates to the same value without the escape (e.g.
  `'UUID'`) does **not** match, because the match is on the raw source text.
- Template literals containing expressions (`\`\UUID${x}\``) are ignored.

## License

MIT
