import { Command } from "commander";
import chalk from "chalk";
import semver from "semver";
import {
  createNodeApp,
  checkForLatestVersion,
  checkNodeVersion,
  type TemplateOrExtension,
} from "@create-node-app/core";
import { getCnaOptions } from "./options.js";
// NodeNext JSON import with import attributes
import packageJson from "../package.json" with { type: "json" };
import { listTemplates, listAddons } from "./list.js";

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
      "Generate package.json without installing dependencies",
    )
    .option(
      "-t, --template <template>",
      "specify a template for the created project",
    )
    .option(
      "--addons [extensions...]",
      "specify extensions to apply for the boilerplate generation",
    )
    .option("--use-yarn", "use yarn instead of npm or pnpm")
    .option("--use-pnpm", "use pnpm instead of yarn or npm")
    .option("--interactive", "run in interactive mode to select options", false)
    .option("--list-templates", "list all available templates")
    .option("--list-addons", "list all available addons")
    .action((providedProjectName: string | undefined) => {
      projectName = providedProjectName || projectName;
    });

  program.parse(process.argv);

  const opts = program.opts();
  checkNodeVersion(packageJson.engines.node, packageJson.name);

  const latestVersion = await checkForLatestVersion("create-awesome-node-app");
  if (latestVersion && semver.lt(packageJson.version, latestVersion)) {
    console.log();
    console.error(
      chalk.yellow(
        `You are running \`create-awesome-node-app\` ${packageJson.version}, which is behind the latest release (${latestVersion}).\n\n` +
          "We recommend always using the latest version of create-awesome-node-app if possible.",
      ),
    );
    return;
  }

  // Handle list templates flag
  if (opts.listTemplates) {
    await listTemplates();
    return;
  }

  // Handle list addons flag
  if (opts.listAddons) {
    await listAddons({
      templateSlug: opts.template,
    });
    return;
  }

  // Extract package manager options directly from opts
  const { useYarn, usePnpm, ...restOpts } = opts;
  const packageManager = useYarn ? "yarn" : usePnpm ? "pnpm" : "npm";

  const templatesOrExtensions: TemplateOrExtension[] = [restOpts.template]
    .concat(Array.isArray(restOpts.extend) ? restOpts.extend : [])
    .filter(Boolean)
    .reduce((acc, templateOrExtension) => {
      if (!templateOrExtension) return acc;
      return acc.concat({ url: templateOrExtension });
    }, [] as TemplateOrExtension[]);

  return createNodeApp(
    projectName,
    { ...restOpts, packageManager, templatesOrExtensions, projectName },
    getCnaOptions,
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
