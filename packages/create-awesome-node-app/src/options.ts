import { CnaOptions } from "@create-node-app/core";
import { Addon } from "@create-node-app/core/loaders";
import prompts from "prompts";
import yargs from "yargs";
prompts.override(yargs.argv);
import { getBaseTemplates, getCnaExtensions } from "./templates";

export const getCnaOptions = async (options: CnaOptions) => {
  const templates = await getBaseTemplates();

  const appTypeOptions = templates.map((template) => ({
    title: template.name,
    value: template.type,
    description: template.description + " - " + template.labels?.join(", "),
  }));

  const baseInput = await prompts([
    {
      type: "text",
      name: "projectName",
      message: `What's your project name?`,
      initial: options.projectName,
    },
    {
      type: "toggle",
      name: "useNpm",
      message: "Use `npm` mandatorily?",
      initial: options.useNpm,
      active: "yes",
      inactive: "no",
    },
    {
      type: "select",
      name: "appType",
      message: "What type of app do you want to create?",
      choices: appTypeOptions,
      initial: 0,
    },
    {
      type: "text",
      name: "template",
      message:
        "Template to use to bootstrap application. e.g: https://github.com/username/repository/tree/main/subdir",
      initial: "",
    },
  ]);

  const extensions = await getCnaExtensions(baseInput.appType);

  const defaultSrcDir = options.srcDir;

  const appConfig = await prompts([
    {
      type: "text",
      name: "srcDir",
      message:
        "Sub directory to put all source content (.e.g. `src`, `app`). Leave blank to use the root directory.",
      initial: defaultSrcDir,
    },
    {
      type: "text",
      name: "alias",
      message: "Import alias to use for the project, e.g. `@`",
      initial: options.alias,
    },
    {
      type: "multiselect",
      name: "addons",
      message: `Select extensions to extend your ${baseInput.appType} project`,
      hint: "- Space to select. Return to submit",
      choices: extensions.map((option) => ({
        title: option.name,
        value: option.url,
        description: option.description + " - " + option.labels?.join(", "),
      })),
    },
    {
      type: "list",
      name: "extend",
      message:
        "Enter extra extensions separater by comma. e.g: https://github.com/username/repository/tree/main/extension1,https://github.com/username/repository/tree/main/extension2",
      initial: "",
      separator: ",",
    },
  ]);

  const { ...nextAppOptions } = {
    ...options,
    ...baseInput,
    ...appConfig,
  };

  const templateAddon =
    baseInput.template ||
    templates.find((template) => template.type === nextAppOptions.appType)?.url;

  const addons: Addon[] = [
    templateAddon,
    ...nextAppOptions.addons,
    ...nextAppOptions.extend,
  ]
    .filter(Boolean)
    .map((addon) => ({ url: addon }));

  const nextOptions = { ...nextAppOptions, addons };

  if (nextAppOptions.verbose) {
    console.log(JSON.stringify(nextOptions, null, 2));
  }

  return nextOptions;
};
