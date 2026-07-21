import type { PromptType } from "prompts";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { IncompatibleExtensionsError } from "@create-node-app/core";

const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

export const CNA_USER_AGENT = `create-awesome-node-app/0.9.9 (https://github.com/Create-Node-App/create-node-app)`;
export const CNA_FETCH_TIMEOUT_MS = 10_000;
export const CACHE_TTL_MS = 3600000; // 1 hour

/**
 * Resolve the fixtures root directory.
 *
 * Priority: CNA_FIXTURE_DIR env var → auto-detect from source location.
 *
 * Auto-detection walks up from the current module to `fixtures/` at the
 * repo root. In CJS builds (where import.meta.url is unavailable) it falls
 * back to checking process.cwd(), which works when the CLI is run from the
 * repo root during development. For production use, set CNA_FIXTURE_DIR.
 */
const resolveFixtureRoot = (): string | null => {
  const env = process.env.CNA_FIXTURE_DIR;
  if (env && env.length > 0) {
    return path.resolve(env);
  }
  // ESM: resolve relative to the source file path
  try {
    const sourceFile = fileURLToPath(import.meta.url);
    const fromSource = path.resolve(sourceFile, "../../../../fixtures");
    if (existsSync(fromSource)) {
      return path.resolve(sourceFile, "../../../../fixtures");
    }
  } catch {
    // CJS: import.meta.url is unavailable; fall through to cwd check
  }
  // CJS / fallback: check whether process.cwd() has a fixtures/ tree
  const fromCwd = path.resolve(
    process.cwd(),
    "fixtures",
    "catalog",
    "templates.json",
  );
  if (existsSync(fromCwd)) {
    return process.cwd();
  }
  return null;
};

let _fixtureRoot: string | null = null;
const getFixtureRoot = (): string | null => {
  if (_fixtureRoot === null) {
    _fixtureRoot = resolveFixtureRoot();
  }
  return _fixtureRoot;
};

/**
 * Override the fixture root (test helper).
 */
export const __setFixtureRootForTests = (root: string | null): void => {
  _fixtureRoot = root;
};

const FORCE_FIXTURE = (): boolean => process.env.CNA_CATALOG_FIXTURE === "1";

/**
 * When in fixture mode, resolve a `file:///fixtures/…` URL to an absolute
 * `file://` URL pointing at the on-disk fixture directory.
 */
const resolveFixtureUrl = (url: string): string => {
  if (!url.startsWith("file:///fixtures/")) return url;
  const root = getFixtureRoot();
  if (!root) return url;
  const relative = url.replace("file:///fixtures/", "");
  const absolute = path.resolve(root, "fixtures", relative);
  return `file://${absolute}`;
};

/**
 * Resolve all fixture URLs in a loaded Templates object so downstream
 * code (downloadRepository, etc.) receives real file:// paths.
 */
const resolveFixtureUrls = (data: Templates): Templates => ({
  ...data,
  templates: data.templates.map((t) => ({
    ...t,
    url: resolveFixtureUrl(t.url),
  })),
  extensions: data.extensions.map((e) => ({
    ...e,
    url: resolveFixtureUrl(e.url),
  })),
});

export const getCatalogCacheDir = (): string => {
  const override = process.env.CNA_CACHE_DIR;
  const base =
    override && override.length > 0
      ? override
      : path.join(os.homedir(), ".cache", "cna");
  return path.join(base, "catalog");
};

export const getCatalogCacheFilePath = (): string => {
  return path.join(getCatalogCacheDir(), "templates.json");
};

export type TemplateOrExtensionData = {
  name: string;
  slug: string;
  description: string;
  url: string;
  category: string;
  labels?: string[];
  /**
   * Slugs of other extensions that this extension is incompatible with.
   * When two incompatible extensions are selected together, the CLI will
   * warn the user and suggest removal.
   */
  incompatibleWith?: string[];
};

export type TemplateData = TemplateOrExtensionData & {
  type: string;
  customOptions?: {
    name: string;
    type: PromptType;
    [key: string]: unknown;
  }[];
};

export type ExtensionType = string | string[];

export type ExtensionData = TemplateOrExtensionData & {
  type: ExtensionType;
};

export type CategoryData = {
  slug: string;
  name: string;
  description: string;
  details: string;
  labels: string[];
};

export type Templates = {
  templates: TemplateData[];
  extensions: ExtensionData[];
  categories: CategoryData[];
};

const templateDataCache = {
  data: null as Templates | null,
  timestamp: 0,
};

const readCachedCatalogFromDisk = async (): Promise<Templates | null> => {
  const filePath = getCatalogCacheFilePath();
  if (!existsSync(filePath)) return null;
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Templates;
  } catch {
    return null;
  }
};

const writeCatalogToDisk = async (data: Templates): Promise<void> => {
  const dir = getCatalogCacheDir();
  const filePath = getCatalogCacheFilePath();
  try {
    const { mkdir } = await import("fs/promises");
    await mkdir(dir, { recursive: true });
    const { writeFile } = await import("fs/promises");
    await writeFile(filePath, JSON.stringify(data), "utf8");
  } catch {
    // Best-effort; disk cache is an optimization.
  }
};

const fetchTemplateData = async (): Promise<Templates> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      CNA_FETCH_TIMEOUT_MS,
    );
    try {
      const response = await fetch(TEMPLATE_DATA_FILE_URL, {
        headers: {
          Accept: "application/json",
          "User-Agent": CNA_USER_AGENT,
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
      return (await response.json()) as Templates;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    // Fall back to disk cache if network is unavailable.
    const disk = await readCachedCatalogFromDisk();
    if (disk) {
      console.warn(
        `[cna] Could not refresh template catalog (${err instanceof Error ? err.message : String(err)}). Using cached version.`,
      );
      return disk;
    }
    throw new Error(
      `Failed to fetch template data: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
};

const isCacheFresh = (): boolean => {
  if (templateDataCache.data === null) return false;
  if (process.env.CNA_NO_CATALOG_CACHE === "1") return false;
  return Date.now() - templateDataCache.timestamp <= CACHE_TTL_MS;
};

export const getTemplateData = async (): Promise<Templates> => {
  // Fixture mode: bypass network, load from local fixtures/ directory.
  // This enables offline testing and development without network access.
  if (FORCE_FIXTURE()) {
    const root = getFixtureRoot();
    if (!root) {
      throw new Error(
        "Fixture mode is enabled (CNA_CATALOG_FIXTURE=1) but the fixture root could not be resolved. " +
          "Set CNA_FIXTURE_DIR to the repo root or run from a development checkout.",
      );
    }
    const catalogPath = path.join(
      root,
      "fixtures",
      "catalog",
      "templates.json",
    );
    if (!existsSync(catalogPath)) {
      throw new Error(
        `Fixture catalog not found at ${catalogPath}. ` +
          "Ensure CNA_FIXTURE_DIR points to the repo root containing fixtures/catalog/templates.json.",
      );
    }
    const raw = await readFile(catalogPath, "utf8");
    const data = resolveFixtureUrls(JSON.parse(raw) as Templates);
    templateDataCache.data = data;
    templateDataCache.timestamp = Date.now();
    return data;
  }

  if (isCacheFresh()) {
    return templateDataCache.data as Templates;
  }

  const data = await fetchTemplateData();
  templateDataCache.data = data;
  templateDataCache.timestamp = Date.now();
  // Persist to disk so subsequent invocations can fall back when offline.
  // Awaited so callers (and tests) can rely on the file existing after
  // getTemplateData() resolves.
  await writeCatalogToDisk(data);
  return data;
};

// Test-only: reset the in-memory cache.
export const __resetTemplateDataCacheForTests = () => {
  templateDataCache.data = null;
  templateDataCache.timestamp = 0;
};

export const getTemplateCategories = async (
  cliArgs?: Record<string, string>,
) => {
  if (cliArgs?.category) {
    return [cliArgs.category];
  }

  const templateData = await getTemplateData();

  // If categories are available in the data, use them
  if (templateData.categories && templateData.categories.length > 0) {
    return templateData.categories.map((category) => category.slug);
  }

  // Fallback to the old method of extracting categories from templates
  const categories = new Set<string>();

  templateData.templates.forEach((template) => {
    categories.add(template.category);
  });

  return Array.from(categories);
};

export const getCategoryData = async (
  categorySlug: string,
): Promise<CategoryData | undefined> => {
  const templateData = await getTemplateData();

  if (templateData.categories && templateData.categories.length > 0) {
    return templateData.categories.find(
      (category) => category.slug === categorySlug,
    );
  }

  return undefined;
};

export const getTemplatesForCategory = async (
  category?: string,
  cliArgs?: Record<string, string>,
) => {
  const selectedCategory = cliArgs?.category || category;
  if (!selectedCategory) {
    throw new Error("Category is required in non-interactive mode.");
  }

  const templateData = await getTemplateData();

  const templates = templateData.templates.filter(
    (template) => template.category === selectedCategory,
  );

  return templates;
};

export const getExtensionsGroupedByCategory = async (
  type: ExtensionType,
  cliArgs?: Record<string, string>,
) => {
  const selectedType = cliArgs?.type ? cliArgs.type.split(",") : type;

  const safeType = Array.isArray(selectedType) ? selectedType : [selectedType];

  // When called with no type filter, return all extensions
  if (safeType.length === 0) {
    const templateData = await getTemplateData();
    return templateData.extensions.reduce(
      (acc, extension) => {
        const category = extension.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(extension);
        return acc;
      },
      {} as Record<string, ExtensionData[]>,
    );
  }

  const templateData = await getTemplateData();

  const extensions = templateData.extensions.filter((extension) => {
    const safeExtensionType = Array.isArray(extension.type)
      ? extension.type
      : [extension.type];

    return safeExtensionType.some((extensionType) =>
      safeType.includes(extensionType),
    );
  });

  const extensionsGroupedByCategory = extensions.reduce(
    (acc, extension) => {
      const category = extension.category;

      if (!acc[category]) {
        acc[category] = [];
      }

      acc[category].push(extension);

      return acc;
    },
    {} as Record<string, TemplateOrExtensionData[]>,
  );

  return extensionsGroupedByCategory;
};

export type TemplateWithCategory = {
  template: TemplateData;
  categorySlug: string;
  categoryName: string;
  categoryOrder: number;
};

export type ExtensionWithCategory = {
  extension: TemplateOrExtensionData;
  categorySlug: string;
  categoryName: string;
  categoryOrder: number;
};

/**
 * Find all incompatible pairs among the selected extension slugs.
 *
 * Returns an array of `[slugA, slugB]` tuples where A declares B (or B
 * declares A) as incompatible. Each pair appears once, ordered by slug.
 */
export const findIncompatiblePairs = (
  selectedSlugs: string[],
  extensionsBySlug: Map<string, TemplateOrExtensionData>,
): Array<[string, string]> => {
  const pairs: Array<[string, string]> = [];
  const slugSet = new Set(selectedSlugs);

  for (const slug of selectedSlugs) {
    const ext = extensionsBySlug.get(slug);
    if (!ext?.incompatibleWith?.length) continue;

    for (const incompatibleSlug of ext.incompatibleWith) {
      if (slugSet.has(incompatibleSlug)) {
        // Normalize ordering so each pair appears once (A < B alphabetically)
        const pair: [string, string] =
          slug < incompatibleSlug
            ? [slug, incompatibleSlug]
            : [incompatibleSlug, slug];
        if (!pairs.some(([a, b]) => a === pair[0] && b === pair[1])) {
          pairs.push(pair);
        }
      }
    }
  }

  return pairs;
};

/**
 * Validate that none of the selected extensions are mutually incompatible.
 * Throws IncompatibleExtensionsError if any conflict is found.
 */
export const validateIncompatibleExtensions = (
  selectedSlugs: string[],
  extensionsBySlug: Map<string, TemplateOrExtensionData>,
): void => {
  const pairs = findIncompatiblePairs(selectedSlugs, extensionsBySlug);
  if (pairs.length > 0) {
    throw new IncompatibleExtensionsError(pairs);
  }
};

/**
 * Build a slug→ExtensionData lookup map from the fully-loaded template data.
 */
export const getExtensionsBySlug = async (): Promise<
  Map<string, TemplateOrExtensionData>
> => {
  const data = await getTemplateData();
  const map = new Map<string, TemplateOrExtensionData>();
  for (const ext of data.extensions) {
    map.set(ext.slug, ext);
  }
  return map;
};

/**
 * Return all templates in a flat array, tagged with their category
 * metadata and sorted by category order (as defined in the catalog's
 * `categories` list) then by template order within each category.
 *
 * Used by interactive mode to surface every template in a single
 * searchable prompt while preserving visual category grouping.
 */
export const getAllTemplatesWithCategory = async (): Promise<
  TemplateWithCategory[]
> => {
  const templateData = await getTemplateData();

  const categoryOrder = new Map<string, number>();
  (templateData.categories ?? []).forEach((category, index) => {
    categoryOrder.set(category.slug, index);
  });

  const categoryName = new Map<string, string>();
  (templateData.categories ?? []).forEach((category) => {
    categoryName.set(category.slug, category.name);
  });

  const items: TemplateWithCategory[] = templateData.templates.map(
    (template) => ({
      template,
      categorySlug: template.category,
      categoryName: categoryName.get(template.category) ?? template.category,
      categoryOrder: categoryOrder.get(template.category) ?? Infinity,
    }),
  );

  return items.sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) {
      return a.categoryOrder - b.categoryOrder;
    }
    return a.template.name.localeCompare(b.template.name);
  });
};

/**
 * Return all extensions compatible with the given template type(s),
 * flattened and tagged with their category metadata, sorted by
 * category order then alphabetically within each category.
 *
 * Used by interactive mode to present a single searchable multiselect
 * across every applicable extension instead of a per-category loop.
 */
export const getAllExtensionsWithCategory = async (
  type: ExtensionType,
): Promise<ExtensionWithCategory[]> => {
  const grouped = await getExtensionsGroupedByCategory(type);
  const templateData = await getTemplateData();

  const categoryOrder = new Map<string, number>();
  (templateData.categories ?? []).forEach((category, index) => {
    categoryOrder.set(category.slug, index);
  });

  const items: ExtensionWithCategory[] = [];
  for (const [categorySlug, extensions] of Object.entries(grouped)) {
    const categoryData = await getCategoryData(categorySlug);
    const categoryName = categoryData?.name || categorySlug;
    for (const extension of extensions) {
      items.push({
        extension,
        categorySlug,
        categoryName,
        categoryOrder: categoryOrder.get(categorySlug) ?? Infinity,
      });
    }
  }

  return items.sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) {
      return a.categoryOrder - b.categoryOrder;
    }
    return a.extension.name.localeCompare(b.extension.name);
  });
};
