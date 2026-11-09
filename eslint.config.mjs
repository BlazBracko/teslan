import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "playwright-report/**",
    "test-results/**",
    // Datoteke, ki jih ustvari Payload (generate:types, generate:importmap, migrate:create).
    "src/payload-types.ts",
    "src/app/(payload)/admin/importMap.js",
    "src/migrations/**",
    "media/**",
  ]),
]);

export default eslintConfig;
