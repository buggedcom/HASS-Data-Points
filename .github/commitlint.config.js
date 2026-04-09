/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow both `doc` (historically used here) and `docs` (conventional spec)
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "chore",
        "doc",
        "docs",
        "refactor",
        "test",
        "ci",
        "perf",
        "style",
        "revert",
      ],
    ],
    // Allow any subject casing — sentence case reads better for this project
    "subject-case": [0],
  },
};
