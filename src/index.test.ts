import { describe, assert, it, vi, beforeEach } from "vitest";
import { Linter } from "eslint";

import plugin, { rule } from "./index.js";
import type { UuidGeneratorOptions } from "./index.js";

const mocks = vi.hoisted(() => ({
  v4: vi.fn<() => string>(),
  v7: vi.fn<() => string>(),
}));

vi.mock("uuid", async (importOriginal) => {
  const actual = await importOriginal<typeof import("uuid")>();
  return {
    ...actual,
    v4: mocks.v4.mockImplementation(() => actual.v4()),
    v7: mocks.v7.mockImplementation(() => actual.v7()),
  };
});

beforeEach(() => {
  mocks.v4.mockClear();
  mocks.v7.mockClear();
});

const V7_UUID_REGEX =
  /'[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}'/;
const V4_UUID_REGEX =
  /'[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}'/;

function verify(code: string, options?: UuidGeneratorOptions[]) {
  const linter = new Linter();
  const config: Linter.Config = {
    plugins: { "uuid-generator": plugin },
    rules: {
      "uuid-generator/uuid-generator":
        options === undefined ? "error" : ["error", options],
    },
    languageOptions: { ecmaVersion: "latest", sourceType: "module" },
  };
  return linter.verifyAndFix(code, config);
}

function generatedV7(): string | undefined {
  return mocks.v7.mock.results[0]?.value;
}

describe("uuid-generator rule", () => {
  it("is exposed as a rule on the plugin", () => {
    assert.strictEqual(plugin.rules?.["uuid-generator"], rule);
  });

  it("replaces the default 'UUID#7' placeholder with a fresh v7 uuid", () => {
    const result = verify("const x = 'UUID#7'");
    const uuid = generatedV7();

    assert.strictEqual(result.fixed, true);
    assert.ok(uuid, "should have generated a v7 uuid");
    assert.ok(result.output, "should produce output");
    assert.ok(
      result.output!.includes(uuid!),
      "output should contain the generated uuid",
    );
    assert.ok(!result.output!.includes("UUID#7"), "placeholder should be gone");
    assert.match(result.output!, V7_UUID_REGEX);
  });

  it("preserves the original quote style", () => {
    const single = verify("const x = 'UUID#7'");
    const double = verify('const x = "UUID#7"');
    const template = verify("const x = `UUID#7`");

    assert.ok(single.output!.startsWith("const x = '"));
    assert.ok(double.output!.startsWith('const x = "'));
    assert.ok(template.output!.startsWith("const x = `"));
  });

  it("generates v4 uuids when configured", () => {
    const result = verify("const x = 'UUID#7'", [
      { placeholder: "UUID#7", version: "v4" },
    ]);
    const uuid = mocks.v4.mock.results[0]?.value;

    assert.strictEqual(result.fixed, true);
    assert.ok(uuid, "should have generated a v4 uuid");
    assert.match(result.output!, V4_UUID_REGEX);
    assert.strictEqual(mocks.v7.mock.results.length, 0);
  });

  it("generates a distinct uuid for every occurrence", () => {
    const result = verify("const x = ['UUID#7', 'UUID#7', 'UUID#7']");

    assert.strictEqual(result.fixed, true);
    assert.strictEqual(mocks.v7.mock.results.length, 3);
    const values = mocks.v7.mock.results.map((r) => r.value as string);
    const first = values[0]!;
    const second = values[1]!;
    const third = values[2]!;
    assert.notStrictEqual(first, second);
    assert.notStrictEqual(second, third);
    assert.notStrictEqual(first, third);
    assert.strictEqual(
      result.output!.split(first).length - 1,
      1,
      "each generated uuid should appear exactly once",
    );
  });

  it("does not match a plain 'UUID' literal (no escape)", () => {
    const result = verify("const x = 'UUID'");
    assert.strictEqual(result.fixed, false);
    assert.strictEqual(mocks.v7.mock.results.length, 0);
  });

  it("supports a custom placeholder", () => {
    const result = verify("const x = 'my-uuid'", [
      { placeholder: "my-uuid", version: "v7" },
    ]);
    const uuid = generatedV7();

    assert.strictEqual(result.fixed, true);
    assert.ok(result.output!.includes(`'${uuid}'`));
    assert.ok(!result.output!.includes("my-uuid"));
  });

  it("supports multiple placeholder mappings", () => {
    const result = verify("const a = 'UUID#7'; const b = 'my-uuid'", [
      { placeholder: "UUID#7", version: "v7" },
      { placeholder: "my-uuid", version: "v4" },
    ]);

    assert.strictEqual(result.fixed, true);
    assert.strictEqual(mocks.v7.mock.results.length, 1);
    assert.strictEqual(mocks.v4.mock.results.length, 1);
    const v7 = mocks.v7.mock.results[0]!.value as string;
    const v4 = mocks.v4.mock.results[0]!.value as string;
    assert.ok(result.output!.includes(`'${v7}'`));
    assert.ok(result.output!.includes(`'${v4}'`));
  });

  it("supports many placeholders mapping to the same version (many-to-1)", () => {
    const result = verify(
      "const a = 'UUID#7'; const b = 'UUID#7'; const c = 'my-uuid'",
      [
        { placeholder: "UUID#7", version: "v7" },
        { placeholder: "UUID#7", version: "v7" },
        { placeholder: "my-uuid", version: "v4" },
      ],
    );

    assert.strictEqual(result.fixed, true);
    assert.strictEqual(mocks.v7.mock.results.length, 2);
    assert.strictEqual(mocks.v4.mock.results.length, 1);
    const v7a = mocks.v7.mock.results[0]!.value as string;
    const v7b = mocks.v7.mock.results[1]!.value as string;
    const v4 = mocks.v4.mock.results[0]!.value as string;
    assert.notStrictEqual(v7a, v7b, "each occurrence gets a distinct uuid");
    assert.ok(result.output!.includes(`'${v7a}'`));
    assert.ok(result.output!.includes(`'${v7b}'`));
    assert.ok(result.output!.includes(`'${v4}'`));
    assert.ok(!result.output!.includes("UUID#7"));
    assert.ok(!result.output!.includes("UUID#7"));
    assert.ok(!result.output!.includes("my-uuid"));
  });

  it("ignores template literals containing expressions", () => {
    const result = verify("const x = `UUID#7${y}`");
    assert.strictEqual(result.fixed, false);
    assert.strictEqual(mocks.v7.mock.results.length, 0);
  });

  it("ignores non-string literals", () => {
    const result = verify("const x = 123; const y = true; const z = null;");
    assert.strictEqual(result.fixed, false);
    assert.strictEqual(mocks.v7.mock.results.length, 0);
  });

  it("works through the recommended flat config", () => {
    const linter = new Linter();
    const recommended = plugin.configs!.recommended as Linter.Config;
    const result = linter.verifyAndFix("const x = 'UUID#7'", {
      ...recommended,
      languageOptions: { ecmaVersion: "latest", sourceType: "module" },
    });

    assert.strictEqual(result.fixed, true);
    assert.match(result.output!, V7_UUID_REGEX);
  });
});
