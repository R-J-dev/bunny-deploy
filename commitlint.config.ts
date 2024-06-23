import type { UserConfig } from "@commitlint/types";

const Configuration: UserConfig = {
  extends: ["@commitlint/config-angular"],
  formatter: "@commitlint/format",
  defaultIgnores: true,
};

export default Configuration;
