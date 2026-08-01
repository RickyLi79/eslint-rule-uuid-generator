import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@journey-with-observers\/([^/]+)$/,
        replacement: fileURLToPath(
          new URL("./packages$1/src/index.ts", import.meta.url),
        ),
      },
    ],
  },
  test: {
    watch: false,
  },
});
