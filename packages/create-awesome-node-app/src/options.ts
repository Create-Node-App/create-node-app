import { CnaOptions } from "@create-node-app/core";
import { TemplateOrExtension } from "@create-node-app/core/loaders";
import { isCI } from "ci-info";
import prompts from "prompts";
import yargs from "yargs";
prompts.override(yargs.argv);
import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  TemplateData,
} from "./templates";

const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"];

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getCnaOptions = async (
  options: CnaOptions
): Promise<CnaOptions> => {
  const categories = await getTemplateCategories();

  if (isCI || !options.interactive) {
    let matchedTemplate: TemplateData | undefined;

    // Handle cases where templates/extensions are not valid URLs
    if (options.template && !isValidUrl(options.template)) {
      const allTemplates = (
        await Promise.all(
          categories.map((category) => getTemplatesForCategory(category))
        )
      ).flat();
      matchedTemplate = allTemplates.find(
        (template) => template.slug === options.template
      );
      if (matchedTemplate) {
        options.template = matchedTemplate.url;

        // Apply initial values for custom options
        if (matchedTemplate.customOptions) {
          matchedTemplate.customOptions.forEach((customOption) => {
            if (customOption.name && customOption.initial !== undefined) {
              options[customOption.name] = customOption.initial;
            }
          });
        }
      } else {
        throw new Error(
          `Invalid template slug: '${options.template}'. Please provide a valid template slug.`
        );
      }
    }

    if (options.addons && Array.isArray(options.addons)) {
      const extensionsGroupedByCategory = await getExtensionsGroupedByCategory([
        matchedTemplate?.type || "custom",
        "all",
      ]);

      options.addons = options.addons.map((addon) => {
        if (!isValidUrl(addon)) {
          for (const extensions of Object.values(extensionsGroupedByCategory)) {
            const matchedExtension = extensions.find(
              (extension) => extension.slug === addon
            );
            if (matchedExtension) {
              return matchedExtension.url;
            }
          }
          throw new Error(
            `Invalid extension slug: '${addon}'. Please provide a valid extension slug.`
          );
        }
        return addon;
      });
    }

    // Non-interactive mode: Use provided options directly
    if (options.verbose) {
      console.log(JSON.stringify(options, null, 2));
    }

    return options;
  }

  const categoriesOptions = [
    ...categories.map((category) => ({
      title: category,
      value: category,
    })),
    {
      title: "None of the above",
      value: "custom",
      description: "I have my own template",
    },
  ];

  const baseInput = await prompts([
    {
      type: "text",
      name: "projectName",
      message: `What's your project name?`,
      initial: options.projectName,
    },
    {
      type: "select",
      name: "packageManager",
      message: "What package manager do you want to use?",
      choices: PACKAGE_MANAGERS.map((packageManager) => ({
        title: packageManager,
        value: packageManager,
      })),
      initial: options.packageManager
        ? PACKAGE_MANAGERS.indexOf(options.packageManager)
        : 0,
    },
    {
      type: "select",
      name: "category",
      message: "What type of app do you want to create?",
      choices: categoriesOptions,
      initial: 0,
    },
  ]);

  const templates = await getTemplatesForCategory(baseInput.category);

  const templateOptions = templates.map((template) => ({
    title: template.name,
    value: template.url,
    description:
      template.description + " Keywords: " + template.labels?.join(", "),
  }));

  const templateInput = await prompts(
    baseInput.category === "custom"
      ? [
          {
            type: "text",
            name: "template",
            message:
              "Enter the URL of your template. e.g: https://github.com/username/repository/tree/main/subdir",
            initial: options.template,
            validate: (value) => {
              if (!value) {
                return "Template URL is required";
              }
              return true;
            },
          },
        ]
      : [
          {
            type: "select",
            name: "template",
            message: "Select a template",
            choices: templateOptions,
            initial: 0,
          },
        ]
  );

  const existingTemplate = templates.find(
    (template) => template.url === templateInput.template
  );

  const templateTemplateOrExtension = templateInput.template;

  const customOptions = existingTemplate?.customOptions || [];

  const appConfig = await prompts([
    // The following prompts are placeholders for future inputs
    {
      type: null,
      name: "templatesOrExtensions",
      message: "Select extensions",
      initial: 0,
    },
    {
      type: null,
      name: "extend",
      message: "Enter extra extensions",
      initial: 0,
    },

    // The following prompts are for custom options
    ...customOptions,
  ]);

  appConfig.templatesOrExtensions = [];
  appConfig.extend = [];

  const extensionsGroupedByCategory = await getExtensionsGroupedByCategory([
    existingTemplate?.type || "custom",
    "all",
  ]);

  for (const [category, extensions] of Object.entries(
    extensionsGroupedByCategory
  )) {
    const { selected } = await prompts({
      type: "multiselect",
      name: "selected",
      message: `Select extensions for ${category}`,
      choices: extensions.map((extension) => ({
        title: extension.name,
        value: extension.url,
        description:
          extension.description + " Keywords: " + extension.labels?.join(", "),
      })),
      initial: 0,
    });

    appConfig.templatesOrExtensions = appConfig.templatesOrExtensions
      ? [...appConfig.templatesOrExtensions, ...selected]
      : [];
  }

  const askForExtend = await prompts([
    {
      type: "confirm",
      name: "extend",
      message: "Do you want to extend the app with more extensions?",
      initial: false,
    },
  ]);

  if (askForExtend.extend) {
    const { extend } = await prompts([
      {
        type: "list",
        name: "extend",
        message:
          "Enter extra extensions separater by comma. e.g: https://github.com/username/repository/tree/main/extension1,https://github.com/username/repository/tree/main/extension2",
        initial: "",
        separator: ",",
      },
    ]);
    appConfig.extend = extend;
  }

  const { ...nextAppOptions } = {
    extend: [],
    ...options,
    ...baseInput,
    ...templateInput,
    ...appConfig,
  };

  const templatesOrExtensions: TemplateOrExtension[] = [
    templateTemplateOrExtension,
    ...(nextAppOptions.templatesOrExtensions || []),
    ...(nextAppOptions.extend || []),
  ]
    .filter(Boolean)
    .map((templateOrExtension) => ({ url: templateOrExtension }));

  const nextOptions = { ...nextAppOptions, templatesOrExtensions };

  if (nextAppOptions.verbose) {
    console.log(JSON.stringify(nextOptions, null, 2));
  }

  return nextOptions;
};
