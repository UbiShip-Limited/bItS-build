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
  },
  {
    rules: {
      // Keep React Hooks rules as errors - they break functionality
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      
      // Convert other problematic rules to warnings temporarily
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
      "react/no-unescaped-entities": "warn",
      "@next/next/no-img-element": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "prefer-const": "warn"
    }
  }
];

export default eslintConfig;
