import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "src/generated/**/*",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "node_modules/**/*",
      ".next/**/*",
      "build/**/*",
      "dist/**/*",
      "coverage/**/*",
      "jest.*.js",
      "jest.*.mjs",
      "jest.setup.mjs",
      "tailwind.config.js",
      "postcss.config.mjs",
      "next.config.cjs"
    ]
  }
];

export default eslintConfig;
