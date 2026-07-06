import type { PromptType } from "prompts";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";

const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

export const CNA_USER_AGENT = `create-awesome-node-app/0.9.9 (https://github.com/Create-Node-App/create-node-app)`;
export const CNA_FETCH_TIMEOUT_MS = 10_000;
export const CACHE_TTL_MS = 3600000; // 1 hour

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
