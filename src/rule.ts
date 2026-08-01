import { v4 as uuidV4, v7 as uuidV7 } from "uuid";
import type { Rule } from "eslint";

export type UuidVersion = "v4" | "v7";

export interface UuidGeneratorOptions {
  /** The exact raw source text between the quotes that should be replaced. */
  placeholder: string;
  /** Which uuid version to generate. Defaults to "v7". */
  version?: UuidVersion;
}

export type UuidGeneratorOptionsArray = UuidGeneratorOptions[];

export const DEFAULT_PLACEHOLDER = "UUID#7";
export const DEFAULT_VERSION: UuidVersion = "v7";

interface ResolvedConfig {
  placeholder: string;
  version: UuidVersion;
}

function resolveConfigs(
  options: UuidGeneratorOptionsArray[],
): ResolvedConfig[] {
  const raw = options[0];
  if (raw === undefined || raw.length === 0) {
    return [{ placeholder: DEFAULT_PLACEHOLDER, version: DEFAULT_VERSION }];
  }
  return raw.map((option) => ({
    placeholder: option.placeholder,
    version: option.version ?? DEFAULT_VERSION,
  }));
}

function generateUuid(version: UuidVersion): string {
  return version === "v4" ? uuidV4() : uuidV7();
}

export const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Replace placeholder string literals (e.g. '\\UUID') with generated v4/v7 UUIDs via autofix.",
      recommended: true,
    },
    fixable: "code",
    schema: [
      {
        type: "array",
        items: {
          type: "object",
          properties: {
            placeholder: { type: "string", minLength: 1 },
            version: { enum: ["v4", "v7"] },
          },
          required: ["placeholder"],
          additionalProperties: false,
        },
      },
    ],
    messages: {
      replacePlaceholder:
        "Replace the '{{placeholder}}' placeholder with a {{version}} uuid",
    },
  },
  create(context) {
    const configs = resolveConfigs(context.options);
    const sourceCode = context.sourceCode;

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        const rawText = sourceCode.getText(node);
        const rawContent = rawText.slice(1, -1);
        const config = configs.find((c) => c.placeholder === rawContent);
        if (!config) return;
        const uuid = generateUuid(config.version);
        const quote = rawText[0]!;
        context.report({
          node,
          messageId: "replacePlaceholder",
          data: { placeholder: rawContent, version: config.version },
          fix(fixer) {
            return fixer.replaceText(node, `${quote}${uuid}${quote}`);
          },
        });
      },
      TemplateLiteral(node) {
        if (node.expressions.length > 0) return;
        const quasi = node.quasis[0];
        if (!quasi) return;
        const rawContent = quasi.value.raw;
        const config = configs.find((c) => c.placeholder === rawContent);
        if (!config) return;
        const uuid = generateUuid(config.version);
        context.report({
          node,
          messageId: "replacePlaceholder",
          data: { placeholder: rawContent, version: config.version },
          fix(fixer) {
            return fixer.replaceText(node, `\`${uuid}\``);
          },
        });
      },
    };
  },
};
