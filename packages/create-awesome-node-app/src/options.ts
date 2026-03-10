import type { CnaOptions, TemplateOrExtension } from "@create-node-app/core";
import { loadTemplateCnaConfig } from "@create-node-app/core";
import { isCI } from "ci-info";
import prompts from "prompts";
import type { TemplateData } from "./templates.js";
import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  getCategoryData,
} from "./templates.js";

const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm"];

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Process template and addons in non-interactive mode
 */
const processNonInteractiveOptions = async (
  options: CnaOptions,
): Promise<CnaOptions> => {
  // Extract --set overrides early so they don't leak into EJS template context
  const setOverrides =
    (options.setOverrides as Record<string, string> | undefined) ?? {};
  delete (options as Record<string, unknown>).setOverrides;

  const categories = await getTemplateCategories();
  let matchedTemplate: TemplateData | undefined;
  const templatesOrExtensions: TemplateOrExtension[] = [];
  let resolvedTemplateUrl: string | undefined;

  // Handle cases where templates/extensions are not valid URLs
  if (options.template && !isValidUrl(options.template)) {
    const allTemplates = (
      await Promise.all(
        categories.map((category) => getTemplatesForCategory(category)),
      )
    ).flat();
    matchedTemplate = allTemplates.find(
      (template) => template.slug === options.template,
    );
    if (matchedTemplate) {
      // Add the template to templatesOrExtensions
      templatesOrExtensions.push({ url: matchedTemplate.url });
      resolvedTemplateUrl = matchedTemplate.url;

      // Apply registry customOptions initial values (lowest priority — may be
      // overridden by cna.config.json or --set below)
      if (matchedTemplate.customOptions) {
        matchedTemplate.customOptions.forEach((customOption) => {
          if (customOption.name && customOption.initial !== undefined) {
            options[customOption.name] = customOption.initial;
          }
        });
      }
    } else {
      throw new Error(
        `Invalid template slug: '${options.template}'. Please provide a valid template slug.`,
      );
    }
  } else if (options.template) {
    // If it's a valid URL, add it directly to templatesOrExtensions
    templatesOrExtensions.push({ url: options.template });
    resolvedTemplateUrl = options.template;
  }

  // Load cna.config.json from the resolved template directory.
  // Its initial values take priority over registry customOptions but are
  // overridden by explicit --set flags.
  if (resolvedTemplateUrl) {
    const cnaConfig = await loadTemplateCnaConfig(resolvedTemplateUrl);
    if (cnaConfig?.customOptions) {
      for (const opt of cnaConfig.customOptions) {
        if (opt.name && opt.initial !== undefined) {
          options[opt.name as string] = opt.initial;
        }
      }
    }
  }

  // Apply --set overrides — highest priority, wins over everything above
  Object.assign(options, setOverrides);

  if (options.addons && Array.isArray(options.addons)) {
    const extensionsGroupedByCategory = await getExtensionsGroupedByCategory([
      matchedTemplate?.type || "custom",
      "all",
    ]);

    const extensions = options.addons
      .map((addon) => {
        if (!isValidUrl(addon)) {
          for (const extensions of Object.values(extensionsGroupedByCategory)) {
            const matchedExtension = extensions.find(
              (extension) => extension.slug === addon,
            );
            if (matchedExtension) {
              return matchedExtension.url;
            }
          }
          throw new Error(
            `Invalid extension slug: '${addon}'. Please provide a valid extension slug.`,
          );
        }
        return addon;
      })
      .map((addon) => ({ url: addon }));

    templatesOrExtensions.push(...extensions);
  }

  // Add any additional extensions from the extend option
  if (options.extend && Array.isArray(options.extend)) {
    const additionalExtensions = options.extend
      .filter(Boolean)
      .map((extension) => ({ url: extension }));
    templatesOrExtensions.push(...additionalExtensions);
  }

  // Set default for aiTool if not provided
  // aiTool support removed; ignore any provided value for backwards compatibility
  if (Object.prototype.hasOwnProperty.call(options as object, "aiTool")) {
    delete (options as unknown as { aiTool?: string }).aiTool;
  }

  // Set the templatesOrExtensions in the options
  options.templatesOrExtensions = templatesOrExtensions;

  // Non-interactive mode: Use provided options directly
  if (options.verbose) {
    console.log(JSON.stringify(options, null, 2));
  }

  return options;
};

/**
 * Process options in interactive mode
 */
const processInteractiveOptions = async (
  options: CnaOptions,
): Promise<CnaOptions> => {
  // Extract --set overrides and strip from options so they don't leak into EJS context
  const { setOverrides = {}, ...restOptions } = options as CnaOptions & {
    setOverrides?: Record<string, string>;
  };
  options = restOptions as CnaOptions;

  // Pre-fill interactive prompts with CLI-provided values (replaces yargs argv override)
  prompts.override({ ...options, ...setOverrides });

  const categories = await getTemplateCategories();

  // Get category data for each category
  const categoryDataPromises = categories.map(async (categorySlug) => {
    const categoryData = await getCategoryData(categorySlug);
    return {
      slug: categorySlug,
      name: categoryData?.name || categorySlug,
      description: categoryData?.description || "",
    };
  });

  const categoryDataList = await Promise.all(categoryDataPromises);

  const categoriesOptions = [
    ...categoryDataList.map((category) => ({
      title: category.name,
      value: category.slug,
      description: category.description,
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
      type: null,
      name: "__removed_aiTool",
      message: "(AI tool selection removed)",
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
        ],
  );

  const existingTemplate = templates.find(
    (template) => template.url === templateInput.template,
  );

  const templateTemplateOrExtension = templateInput.template;

  // Load cna.config.json from the selected template — takes priority over registry
  // customOptions. Falls back to registry if not found (backward compat).
  const cnaConfig = templateTemplateOrExtension
    ? await loadTemplateCnaConfig(templateTemplateOrExtension)
    : null;

  // Extract --set overrides to pre-fill prompts; removed from options before returning
  // (already extracted at function start, reuse the variable from above)

  const rawCustomOptions =
    cnaConfig?.customOptions ?? existingTemplate?.customOptions ?? [];

  // Apply --set values as initial overrides for custom option prompts
  const customOptions = rawCustomOptions.map((opt) =>
    opt.name &&
    Object.prototype.hasOwnProperty.call(setOverrides, opt.name as string)
      ? { ...opt, initial: setOverrides[opt.name as string] }
      : opt,
  );

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
    ...(customOptions as prompts.PromptObject[]),
  ]);

  appConfig.templatesOrExtensions = [];
  appConfig.extend = [];

  const extensionsGroupedByCategory = await getExtensionsGroupedByCategory([
    existingTemplate?.type || "custom",
    "all",
  ]);

  for (const [categorySlug, extensions] of Object.entries(
    extensionsGroupedByCategory,
  )) {
    const categoryData = await getCategoryData(categorySlug);
    const categoryName = categoryData?.name || categorySlug;
    const categoryDescription = categoryData?.description || "";

    const { selected } = await prompts({
      type: "multiselect",
      name: "selected",
      message: `Select extensions for ${categoryName}${
        categoryDescription ? `: ${categoryDescription}` : ""
      }`,
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
    aiTool: "none", // Default value
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

  // Apply --set overrides (highest priority) and strip the setOverrides key
  // so it doesn't leak into the EJS template context.
  Object.assign(nextOptions, setOverrides);
  delete (nextOptions as Record<string, unknown>).setOverrides;

  if (nextAppOptions.verbose) {
    console.log(JSON.stringify(nextOptions, null, 2));
  }

  return nextOptions;
};

/**
 * Decide if interactive mode should be used.
 * Exported for testing.
 */
export const resolveInteractiveMode = (
  options: Partial<CnaOptions> & { interactive?: boolean },
  ci: boolean = isCI,
): boolean => {
  const explicit = options.interactive;
  if (explicit === true) return true;
  if (explicit === false) return false;
  return !ci; // default to interactive when not CI
};

/**
 * Main function to get CNA options – decides whether to run interactive flow.
 */
export const getCnaOptions = async (
  options: CnaOptions,
): Promise<CnaOptions> => {
  const shouldUseInteractiveMode = resolveInteractiveMode(options);
  if (shouldUseInteractiveMode) {
    return processInteractiveOptions({ ...options, interactive: true });
  }
  return processNonInteractiveOptions(options);
};
