import program from "commander";
import chalk from "chalk";
import semver from "semver";
import {
  createNodeApp,
  checkForLatestVersion,
  checkNodeVersion,
} from "@create-node-app/core";
import { getCnaOptions } from "./options";
import packageJson from "../package.json";

const main = async () => {
  let projectName = "my-project";

  program
    .version(packageJson.version)
    .arguments("[project-directory]")
    .usage(`${chalk.green("[project-directory]")} [options]`)
    .action((name) => {
      projectName = name || projectName;
    })
    .option("--verbose", "print additional logs")
    .option("--info", "print environment debug info")
    .option(
      "--no-install",
      "Generate package.json without installing dependencies"
    )
    .option(
      "--template <template>",
      "specify a template for the created project"
    )
    .option(
      "--extend [extensions...]",
      "specify extensions to apply for the boilerplate generation"
    )
    .option("--use-yarn", "use yarn instead of npm or pnpm")
    .option("--use-pnpm", "use pnpm instead of yarn or npm")
    .parse(process.argv);

  checkNodeVersion(packageJson.engines.node, packageJson.name);

  const latest = await checkForLatestVersion("create-awesome-node-app");

  if (latest && semver.lt(packageJson.version, latest)) {
    console.log();
    console.error(
      chalk.yellow(
        `You are running \`create-awesome-node-app\` ${packageJson.version}, which is behind the latest release (${latest}).\n\n` +
          "We recommend always using the latest version of create-awesome-node-app if possible."
      )
    );
    return;
  }

  const { useYarn, usePnpm, ...opts } = program.opts();

  const packageManager = useYarn ? "yarn" : usePnpm ? "pnpm" : "npm";
  const templatesOrExtensions = [opts.template]
    .concat(opts.extend || [])
    .filter(Boolean)
    .map((templateOrExtension) => ({
      url: templateOrExtension,
    }));

  return createNodeApp(
    projectName,
    { ...opts, packageManager, templatesOrExtensions, projectName },
    getCnaOptions
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
