import type { CnaOptions, TemplateOrExtension } from "@create-node-app/core";
import { loadTemplateCnaConfig, ConfigParseError } from "@create-node-app/core";
import pc from "picocolors";
import { isCI } from "ci-info";
import prompts from "prompts";
import type { TemplateData } from "./templates.js";
import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  getAllTemplatesWithCategory,
  getAllExtensionsWithCategory,
} from "./templates.js";

const CUSTOM_TEMPLATE_SENTINEL = "__custom_template__";

/**
 * Build a searchable choice list where each entry is prefixed with its
 * category so users can visually scan by category *and* filter by
 * typing (matches on category, template name, description, and
 * keywords).
 */
const makeCategorizedChoice = (opts: {
  categoryName: string;
  name: string;
  value: string;
  description?: string | undefined;
  labels?: string[] | undefined;
}) => {
  const prefix = pc.dim(`[${opts.categoryName}]`);
  const label = pc.bold(opts.name);
  const searchTokens = [
    opts.categoryName,
    opts.name,
    opts.description ?? "",
    ...(opts.labels ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return {
    title: `${prefix} ${label}`,
    value: opts.value,
    description: opts.description,
    // Attach lowercased searchable text for the suggest() filter.
    // prompts ignores unknown keys so this is safe.
    _search: searchTokens,
  } as prompts.Choice & { _search: string };
};

/**
 * Filter callback for autocomplete/autocompleteMultiselect that
 * matches against the pre-computed _search token bag instead of
 * only the visible title (which contains ANSI escape codes).
 */
const suggestBySearchTokens = (
  input: string,
  choices: (prompts.Choice & { _search?: string })[],
): Promise<prompts.Choice[]> => {
  const needle = input.trim().toLowerCase();
  if (!needle) return Promise.resolve(choices);
  return Promise.resolve(
    choices.filter((c) =>
      (c._search ?? c.title.toLowerCase()).includes(needle),
    ),
  );
};

const PACKAGE_MANAGERS = ["npm", "yarn", "pnpm", "bun"];

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
    try {
      const cnaConfig = await loadTemplateCnaConfig(resolvedTemplateUrl);
      if (cnaConfig?.customOptions) {
        for (const opt of cnaConfig.customOptions) {
          if (opt.name && opt.initial !== undefined) {
            options[opt.name as string] = opt.initial;
          }
        }
      }
    } catch (err) {
      if (err instanceof ConfigParseError) {
        console.warn(pc.yellow(`Warning: ${err.message}`));
      } else {
        throw err;
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

  // Fetch every template across every category so we can offer a single
  // searchable prompt instead of a two-step category → template flow.
  // This dramatically improves discovery — users can browse the full
  // catalog at once and filter by typing.
  const allTemplates = await getAllTemplatesWithCategory();

  // Build choices: templates first (grouped visually by category prefix
  // in the title), then a footer entry for "use my own template URL".
  const templateChoices = [
    ...allTemplates.map(({ template, categoryName }) =>
      makeCategorizedChoice({
        categoryName,
        name: template.name,
        value: template.url,
        description: template.description,
        labels: template.labels,
      }),
    ),
    {
      title: `${pc.dim("[Custom]")} ${pc.italic("Use my own template URL")}`,
      value: CUSTOM_TEMPLATE_SENTINEL,
      description: "Point at any GitHub repo or file:// path",
      _search: "custom own template url github file",
    } as prompts.Choice & { _search: string },
  ];

  // Pre-select the current template (if provided via --template) so users
  // who partially specified via CLI can just hit Enter.
  const preselectedTemplateIdx = options.template
    ? templateChoices.findIndex((c) => c.value === options.template)
    : 0;

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
      type: "autocomplete",
      name: "template",
      message: "Pick a template (type to filter across all categories)",
      choices: templateChoices,
      initial: preselectedTemplateIdx >= 0 ? preselectedTemplateIdx : 0,
      suggest: suggestBySearchTokens,
      // Show category counts as an initial hint.
      hint: `${allTemplates.length} templates available — type any framework, category, or keyword`,
    },
  ]);

  // If the user picked the custom sentinel, prompt for the URL now.
  let templateUrl: string = baseInput.template;
  if (templateUrl === CUSTOM_TEMPLATE_SENTINEL) {
    const { customTemplate } = await prompts([
      {
        type: "text",
        name: "customTemplate",
        message:
          "Enter the URL of your template (e.g. https://github.com/user/repo/tree/main/subdir)",
        initial: options.template,
        validate: (value: string) =>
          value ? true : "Template URL is required",
      },
    ]);
    templateUrl = customTemplate;
  }

  const existingTemplate = allTemplates
    .map((t) => t.template)
    .find((template) => template.url === templateUrl);

  const templateTemplateOrExtension = templateUrl;

  // Preserve the category-derived shape the rest of the flow expects.
  // `baseInput` was declared with strict prompt-name typing, so we widen
  // it here to attach the derived `category` field.
  const baseInputWithCategory = baseInput as typeof baseInput & {
    category: string;
    template: string;
  };
  baseInputWithCategory.template = templateUrl;
  baseInputWithCategory.category = existingTemplate?.category ?? "custom";

  // Load cna.config.json from the selected template — takes priority over registry
  // customOptions. Falls back to registry if not found (backward compat).
  const cnaConfig = templateTemplateOrExtension
    ? await loadTemplateCnaConfig(templateTemplateOrExtension).catch(
        (err: unknown) => {
          if (err instanceof ConfigParseError) {
            console.warn(pc.yellow(`Warning: ${err.message}`));
            return null;
          }
          throw err;
        },
      )
    : null;

  // Extract --set overrides to pre-fill prompts; removed from options before returning
  // (already extracted at function start, reuse the variable from above)

  const rawCustomOptions =
    cnaConfig?.customOptions ?? existingTemplate?.customOptions ?? [];

  // Filter out sensitive prompt types that config files cannot use
  const blockedTypes = new Set(["invisible", "password"]);
  const filteredCustomOptions = rawCustomOptions.filter(
    (opt) => !blockedTypes.has(opt.type as string),
  );
  if (filteredCustomOptions.length < rawCustomOptions.length) {
    console.warn(
      pc.yellow(
        "Warning: one or more custom options use blocked prompt types and were skipped.",
      ),
    );
  }

  // Apply --set values as initial overrides for custom option prompts
  const customOptions = filteredCustomOptions.map((opt) =>
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
  appConfig.extend = Array.isArray(options.extend) ? options.extend : [];

  // Flat, searchable list of every compatible extension across every
  // category. Users can filter by typing (framework, purpose, keyword)
  // and select multiple with Space, then submit with Enter.
  const allExtensions = await getAllExtensionsWithCategory([
    existingTemplate?.type || "custom",
    "all",
  ]);

  if (allExtensions.length > 0) {
    const extensionChoices = allExtensions.map(({ extension, categoryName }) =>
      makeCategorizedChoice({
        categoryName,
        name: extension.name,
        value: extension.url,
        description: extension.description,
        labels: extension.labels,
      }),
    );

    const { selected } = await prompts({
      type: "autocompleteMultiselect",
      name: "selected",
      message:
        "Pick extensions (Space to toggle, type to filter, Enter to confirm)",
      choices: extensionChoices,
      suggest: suggestBySearchTokens,
      hint: `${allExtensions.length} extensions available — leave empty to skip`,
      instructions: false,
      // Prevent user from being forced to select at least one.
      min: 0,
    });

    if (Array.isArray(selected)) {
      appConfig.templatesOrExtensions = selected;
    }
  }

  if (appConfig.extend.length === 0) {
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
            "Enter extra extensions separated by comma. e.g: https://github.com/username/repository/tree/main/extension1,https://github.com/username/repository/tree/main/extension2",
          initial: "",
          separator: ",",
        },
      ]);
      appConfig.extend = extend;
    }
  }

  appConfig.extend = Array.isArray(appConfig.extend)
    ? appConfig.extend.filter(Boolean)
    : [];

  const { ...nextAppOptions } = {
    extend: [],
    aiTool: "none", // Default value
    ...options,
    ...baseInput,
    ...appConfig,
  };

  const templatesOrExtensions: TemplateOrExtension[] = (
    [
      templateTemplateOrExtension,
      ...(nextAppOptions.templatesOrExtensions || []),
      ...(nextAppOptions.extend || []),
    ] as unknown[]
  )
    .filter(Boolean)
    .map((templateOrExtension) => {
      // Support both plain URL strings and already-shaped
      // { url: string } objects (e.g. from options.extend).
      if (
        typeof templateOrExtension === "object" &&
        templateOrExtension !== null &&
        "url" in templateOrExtension
      ) {
        return templateOrExtension as TemplateOrExtension;
      }
      return { url: templateOrExtension as string };
    });

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
