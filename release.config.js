/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    {
      "@semantic-release/github": {
        assets: [{ path: "dist", label: "dist" }],
      },
    },
  ],
  dryRun: true,
  ci: true,
};

export default config;
