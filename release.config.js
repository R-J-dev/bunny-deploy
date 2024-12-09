/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        preset: "angular",
        releaseRules: [
          // Default rules
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
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
  ],
  dryRun: false,
  ci: true,
};

export default config;
