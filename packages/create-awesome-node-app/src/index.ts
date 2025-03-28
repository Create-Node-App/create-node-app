import { Command } from "commander";
import chalk from "chalk";
import semver from "semver";
import {
  createNodeApp,
  checkForLatestVersion,
  checkNodeVersion,
} from "@create-node-app/core";
import { getCnaOptions } from "./options";
import packageJson from "../package.json";
import { TemplateOrExtension } from "@create-node-app/core/loaders";

const program = new Command();

const main = async () => {
  let projectName = "my-project";

  program
    .version(packageJson.version)
    .arguments("[project-directory]")
    .usage(`${chalk.green("[project-directory]")} [options]`)
    .option("-v, --verbose", "print additional logs")
    .option("-i, --info", "print environment debug info")
    .option(
      "--no-install",
      "Generate package.json without installing dependencies"
    )
    .option(
      "-t, --template <template>",
      "specify a template for the created project"
    )
    .option(
      "--addons [extensions...]",
      "specify extensions to apply for the boilerplate generation"
    )
    .option("--use-yarn", "use yarn instead of npm or pnpm")
    .option("--use-pnpm", "use pnpm instead of yarn or npm")
    .option("--interactive", "run in interactive mode to select options", false)
    .action((providedProjectName: string | undefined) => {
      projectName = providedProjectName || projectName;
    });

  program.parse(process.argv);

  const opts = program.opts();
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

  const options = await getCnaOptions({ ...opts, projectName });

  const { useYarn, usePnpm, ...restOptions } = options;
  const packageManager = useYarn ? "yarn" : usePnpm ? "pnpm" : "npm";

  const templatesOrExtensions: TemplateOrExtension[] = [restOptions.template]
    .concat(Array.isArray(restOptions.addons) ? restOptions.addons : [])
    .concat(Array.isArray(restOptions.extend) ? restOptions.extend : [])
    .reduce((acc, templateOrExtension) => {
      if (!templateOrExtension) {
        return acc;
      }
      return acc.concat({
        url: templateOrExtension,
      });
    }, [] as TemplateOrExtension[]);

  return createNodeApp(
    projectName,
    { ...restOptions, packageManager, templatesOrExtensions, projectName },
    getCnaOptions
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
