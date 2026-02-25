/** Shared ESLint config. Run from repo root: npx eslint backend frontend */
module.exports = {
  root: true,
  env: { node: true, es2022: true, browser: true },
  parserOptions: { ecmaVersion: 2022, sourceType: "module", ecmaFeatures: { jsx: true } },
  extends: ["eslint:recommended"],
  ignorePatterns: ["node_modules/", "dist/", ".tmp/", "*.config.js", "*.config.cjs", "backend/test/"],
  globals: {
    describe: "readonly",
    it: "readonly",
    expect: "readonly",
    vi: "readonly",
    beforeEach: "readonly",
    afterEach: "readonly"
  }
};
