/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "conventionalcommits",
        releaseRules: [
          { breaking: true, release: "major" },
          { revert: true, release: "patch" },
          { type: "feat", release: "minor" },
          { type: "fix", release: "patch" },
          { type: "perf", release: "patch" },
          // Custom rule for production dependency updates
          { type: "build", scope: "deps", release: "patch" },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      {
        preset: "conventionalcommits",
        presetConfig: {
          types: [
            { type: "build", section: "Build", hidden: true },
            {
              type: "build(deps)",
              section: "Dependency updates",
              hidden: false,
            },
            { type: "chore", section: "Chores", hidden: true },
            { type: "ci", section: "CI/CD", hidden: true },
            { type: "docs", section: "Docs", hidden: false },
            { type: "feat", section: "Features", hidden: false },
            { type: "fix", section: "Bug Fixes", hidden: false },
            { type: "perf", section: "Performance", hidden: false },
            { type: "refactor", section: "Refactor", hidden: true },
            { type: "revert", section: "Reverts", hidden: false },
            { type: "style", section: "Code Style", hidden: true },
            { type: "test", section: "Tests", hidden: true },
          ],
        },
      },
    ],
    "@semantic-release/github",
  ],
  dryRun: false,
  ci: true,
};

export default config;
