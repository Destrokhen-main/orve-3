import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const resolve = (path: string) =>
  fileURLToPath(new URL(path, import.meta.url));

/**
 * Площадка для ручной проверки библиотеки в браузере.
 * Пакет ещё не опубликован, поэтому `orve` резолвится прямо в исходники —
 * правки в src/ подхватываются без пересборки.
 */
export default defineConfig({
  root: "playground",
  resolve: {
    alias: {
      "orve/jsx-dev-runtime": resolve("./src/jsx-dev-runtime.ts"),
      "orve/jsx-runtime": resolve("./src/jsx-runtime.ts"),
      orve: resolve("./src/index.ts"),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "orve",
  },
  server: {
    port: 5273,
    open: true,
  },
});
