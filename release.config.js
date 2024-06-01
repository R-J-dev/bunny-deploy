/**
 * @type {import('semantic-release').GlobalConfig}
 */
const config = {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/github",
  ],
  dryRun: false,
  ci: true,
};

export default config;
