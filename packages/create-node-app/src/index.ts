#!/usr/bin/env node

import program from "commander";
import chalk from "chalk";
import { createNodeApp } from "@create-node-app/core";
import { getCnaOptions } from "./options";
import packageJS from "../package.json";

const main = async () => {
  let projectName = "app";

  program
    .version(packageJS.version)
    .arguments("[project-directory]")
    .usage(`${chalk.green("[project-directory]")} [options]`)
    .action((name) => {
      projectName = name || projectName;
    })
    .option("--verbose", "print additional logs")
    .option("--info", "print environment debug info")
    .option("--use-npm", "use npm mandatorily")
    .option(
      "--template <template>",
      "specify template to use for initial setup"
    )
    .option(
      "--extend <repos...>",
      "git repositories to extend your boilerplate"
    )
    .option("-a, --alias <alias>", "Import alias to use for the project", "@")
    .option(
      "--src-dir <src-dir>",
      "dir name to put content under [src]/",
      "src"
    )
    .option(
      "--nodeps",
      "generate package.json file without installing dependencies"
    )
    .option("--inplace", "apply setup to an existing project");

  program
    .allowUnknownOption()
    .on("--help", () => {
      console.log();
      console.log(
        `    Only ${chalk.green("[project-directory]")} is required.`
      );
      console.log();
      console.log(
        `    If you have any problems, do not hesitate to file an issue:`
      );
      console.log(`      ${chalk.cyan(`${packageJS.bugs.url}/new`)}`);
    })
    .parse(process.argv);

  return createNodeApp(
    projectName,
    { ...program.opts(), projectName },
    getCnaOptions
  );
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
