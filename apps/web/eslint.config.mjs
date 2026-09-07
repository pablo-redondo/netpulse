import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Salida generada por el adaptador de Cloudflare y estado local de
    // wrangler: es codigo compilado, no fuente que debamos lintar.
    ".open-next/**",
    ".wrangler/**",
  ]),
]);

export default eslintConfig;
