import { CnaOptions } from "@create-node-app/core";
import prompts from "prompts";
import yargs from "yargs";
prompts.override(yargs.argv);
import { getCnaAddons } from "./addons";

/**
 * Addons options to bootstrap the Node app
 */
export const addonsOptions = [];

export const getCnaOptions = async (options: CnaOptions) => {
  let appOptions = options;

  if (appOptions.interactive) {
    const baseInput = await prompts([
      {
        type: "text",
        name: "projectName",
        message: `What's your project name?`,
        initial: appOptions.projectName,
      },
      {
        type: "toggle",
        name: "useNpm",
        message: "Use `npm` mandatorily?",
        initial: appOptions.useNpm,
        active: "yes",
        inactive: "no",
      },
    ]);

    const { template } = await prompts([
      {
        type: "text",
        name: "template",
        message: "Template to use to bootstrap application",
        initial: "",
      },
    ]);

    baseInput.template = template;

    const defaultSrcDir = baseInput.cra === true ? "src" : appOptions.srcDir;

    const backendConfig = await prompts([
      {
        type: "text",
        name: "srcDir",
        message:
          "Sub directory to put all source content (.e.g. `src`, `app`). Will be on root directory by default",
        initial: defaultSrcDir,
      },
      {
        type: "text",
        name: "alias",
        message: "Webpack alias if needed",
        initial: appOptions.alias,
      },
      {
        type: "list",
        name: "extend",
        message: "Enter extensions",
        initial: "",
        separator: ",",
      },
    ]);

    const { ...nextAppOptions } = {
      ...options,
      ...baseInput,
      ...backendConfig,
    };

    appOptions = nextAppOptions;
  }

  const addons = getCnaAddons(appOptions);

  if (appOptions.verbose) {
    console.log({ ...appOptions, addons });
  }

  const nextOptions: CnaOptions = { ...appOptions, addons };

  return nextOptions;
};
