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

type SearchableChoice = prompts.Choice & { _search: string };

/**
 * Derive a short (≤12 char) label from a full category name.
 *   "Frontend Applications"   → "Frontend"
 *   "Full Stack Applications" → "Full Stack"
 *   "User Acceptance Testing" → "UAT"
 *   "Monorepo Boilerplate"    → "Monorepo"
 */
const shortCategoryLabel = (categoryName: string): string => {
  const stop = new Set(["Applications", "Application", "Boilerplate"]);
  const words = categoryName.split(" ").filter((w) => !stop.has(w));
  if (words.length >= 3)
    return words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return words.slice(0, 2).join(" ");
};

// Assign a distinct colour to each category slug on first use.
const CATEGORY_PALETTE: Array<(s: string) => string> = [
  pc.yellow,
  pc.green,
  pc.cyan,
  pc.magenta,
  pc.blue,
  (s: string) => pc.bold(pc.green(s)),
  (s: string) => pc.bold(pc.cyan(s)),
];
const _catColorCache = new Map<string, (s: string) => string>();
let _catColorIdx = 0;
const categoryColor = (slug: string): ((s: string) => string) => {
  if (!_catColorCache.has(slug)) {
    _catColorCache.set(
      slug,
      (CATEGORY_PALETTE[_catColorIdx++ % CATEGORY_PALETTE.length] ??
        CATEGORY_PALETTE[0]) as (s: string) => string,
    );
  }
  return _catColorCache.get(slug)!;
};

/**
 * Build a selectable choice with an optional coloured category badge
 * and a pre-computed _search token bag so filtering works on category,
 * name, description, and keywords.
 */
const makeSearchableChoice = (opts: {
  name: string;
  value: string;
  description?: string | undefined;
  labels?: string[] | undefined;
  categorySlug?: string | undefined;
  categoryName?: string | undefined;
}): SearchableChoice => {
  const labelSuffix =
    opts.labels && opts.labels.length > 0
      ? pc.dim(" · " + opts.labels.slice(0, 3).join(", "))
      : "";

  // Fixed-width 10-char badge so template names align vertically.
  const badge = opts.categorySlug
    ? categoryColor(opts.categorySlug)(
        shortCategoryLabel(opts.categoryName ?? opts.categorySlug)
          .padEnd(10)
          .slice(0, 10),
      )
    : "";

  const title = badge
    ? badge + "  " + pc.bold(opts.name) + labelSuffix
    : pc.bold(opts.name) + labelSuffix;

  return {
    title,
    value: opts.value,
    description: opts.description,
    _search: [
      opts.categoryName,
      opts.categorySlug,
      opts.name,
      opts.description ?? "",
      ...(opts.labels ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase(),
  };
};

/** Filter by the _search token bag; works with both autocomplete types. */
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
 * Apply --pin <ref> to a URL (skip file:// and URLs with existing ?ref=).
 */
const applyPinRef = (url: string, pinRef?: string): string => {
  if (pinRef && !url.includes("?ref=") && !url.startsWith("file://")) {
    const separator = url.includes("?") ? "&" : "?";
    url = `${url}${separator}ref=${encodeURIComponent(pinRef)}`;
  }
  return url;
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

  // --pin is passed through from index.ts as a string
  const pinRef =
    typeof (options as Record<string, unknown>).pin === "string"
      ? ((options as Record<string, unknown>).pin as string)
      : undefined;

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
      templatesOrExtensions.push({
        url: applyPinRef(matchedTemplate.url, pinRef),
      });
      resolvedTemplateUrl = applyPinRef(matchedTemplate.url, pinRef);

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
    templatesOrExtensions.push({ url: applyPinRef(options.template, pinRef) });
    resolvedTemplateUrl = applyPinRef(options.template, pinRef);
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
      .map((addon) => ({ url: applyPinRef(addon, pinRef) }));

    templatesOrExtensions.push(...extensions);
  }

  // Add any additional extensions from the extend option
  if (options.extend && Array.isArray(options.extend)) {
    const additionalExtensions = options.extend
      .filter(Boolean)
      .map((extension) => ({ url: applyPinRef(extension, pinRef) }));
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

  // Build one flat list — each item has a coloured fixed-width category
  // badge so the list is scannable without separator items.
  // (prompts autocomplete treats disabled items as selectable, so we
  // never use separator/divider items here.)
  const templateChoices: SearchableChoice[] = allTemplates.map(
    ({ template, categorySlug, categoryName }) =>
      makeSearchableChoice({
        name: template.name,
        value: template.url,
        description: template.description,
        labels: template.labels,
        categorySlug,
        categoryName,
      }),
  );

  // "Use my own URL" entry at the bottom — no badge (custom)
  templateChoices.push({
    title: "          " + "  " + pc.italic("Use my own template URL"),
    value: CUSTOM_TEMPLATE_SENTINEL,
    description: "Point at any GitHub repo or file:// path",
    _search: "custom own template url github file",
  });

  // Pre-select the current template (if provided via --template).
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
      message:
        "Pick a template " +
        pc.dim("(↑↓ to browse, type to search, Enter to pick)"),
      choices: templateChoices,
      initial: preselectedTemplateIdx >= 0 ? preselectedTemplateIdx : 1,
      suggest: suggestBySearchTokens,
      // Show only 9 choices at a time so the list never scrolls off screen.
      limit: 9,
      hint: pc.dim(
        `${allTemplates.length} templates · type any framework, category, or keyword`,
      ),
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

  // Extensions: two-step UX.
  //
  // Step 1 — Pick which CATEGORIES you need (short list, one checkbox per
  //           category). Users who want no extensions skip immediately.
  // Step 2 — For each selected category show a focused multiselect of its
  //           extensions (5-15 items instead of 51 in one giant list).
  const allExtensions = await getAllExtensionsWithCategory([
    existingTemplate?.type || "custom",
    "all",
  ]);

  if (allExtensions.length > 0) {
    // Group extensions by category slug, preserving catalog order.
    const categoryMap = new Map<
      string,
      { name: string; items: (typeof allExtensions)[0][] }
    >();
    for (const ext of allExtensions) {
      const entry = categoryMap.get(ext.categorySlug);
      if (entry) {
        entry.items.push(ext);
      } else {
        categoryMap.set(ext.categorySlug, {
          name: ext.categoryName,
          items: [ext],
        });
      }
    }

    const categoryChoices = [...categoryMap.entries()].map(
      ([slug, { name, items }]) => ({
        title: pc.bold(name),
        value: slug,
        description: `${items.length} extension${items.length > 1 ? "s" : ""}`,
      }),
    );

    const { selectedCategories } = await prompts({
      type: "multiselect",
      name: "selectedCategories",
      message:
        "Which kinds of extensions do you need? " +
        pc.dim("(Space = toggle, Enter = done, none = skip all)"),
      choices: categoryChoices,
      instructions: false,
      min: 0,
    });

    const selectedExtUrls: string[] = [];

    for (const catSlug of (selectedCategories ?? []) as string[]) {
      const cat = categoryMap.get(catSlug);
      if (!cat) continue;

      const extChoices = cat.items.map(({ extension }) =>
        makeSearchableChoice({
          name: extension.name,
          value: extension.url,
          description: extension.description,
          labels: extension.labels,
        }),
      );

      const { picked } = await prompts({
        type: "multiselect",
        name: "picked",
        message:
          pc.bold(cat.name) +
          " " +
          pc.dim("(Space = toggle, Enter = done, none = skip)"),
        choices: extChoices,
        instructions: false,
        min: 0,
      });

      if (Array.isArray(picked)) {
        selectedExtUrls.push(...(picked as string[]));
      }
    }

    appConfig.templatesOrExtensions = selectedExtUrls;
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
