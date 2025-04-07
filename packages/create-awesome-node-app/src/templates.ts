import axios from "axios";
import { PromptType } from "prompts";

const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

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

const CACHE_TTL_MS = 3600000; // Cache data for 1 hour

const templateDataCache = {
  data: null as Templates | null,
  timestamp: 0,
};

const fetchTemplateData = async () => {
  try {
    const response = await axios.get<Templates>(TEMPLATE_DATA_FILE_URL);
    return response.data;
  } catch (error) {
    // Handle network error, e.g., log it or show a user-friendly message.
    throw new Error("Failed to fetch template data");
  }
};

const getTemplateData = async () => {
  const currentTime = Date.now();

  if (
    templateDataCache.data === null ||
    currentTime - templateDataCache.timestamp > CACHE_TTL_MS
  ) {
    // Data is not in cache or has expired, fetch and cache it.
    templateDataCache.data = await fetchTemplateData();
    templateDataCache.timestamp = currentTime;
  }

  return templateDataCache.data;
};

export const getTemplateCategories = async (
  cliArgs?: Record<string, string>
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
  categorySlug: string
): Promise<CategoryData | undefined> => {
  const templateData = await getTemplateData();

  if (templateData.categories && templateData.categories.length > 0) {
    return templateData.categories.find(
      (category) => category.slug === categorySlug
    );
  }

  return undefined;
};

export const getTemplatesForCategory = async (
  category?: string,
  cliArgs?: Record<string, string>
) => {
  const selectedCategory = cliArgs?.category || category;
  if (!selectedCategory) {
    throw new Error("Category is required in non-interactive mode.");
  }

  const templateData = await getTemplateData();

  const templates = templateData.templates.filter(
    (template) => template.category === selectedCategory
  );

  return templates;
};

export const getExtensionsGroupedByCategory = async (
  type: ExtensionType,
  cliArgs?: Record<string, string>
) => {
  const selectedType = cliArgs?.type ? cliArgs.type.split(",") : type;

  const safeType = Array.isArray(selectedType) ? selectedType : [selectedType];

  const templateData = await getTemplateData();

  const extensions = templateData.extensions.filter((extension) => {
    const safeExtensionType = Array.isArray(extension.type)
      ? extension.type
      : [extension.type];

    return safeExtensionType.some((extensionType) =>
      safeType.includes(extensionType)
    );
  });

  const extensionsGroupedByCategory = extensions.reduce((acc, extension) => {
    const category = extension.category;

    if (!acc[category]) {
      acc[category] = [];
    }

    acc[category].push(extension);

    return acc;
  }, {} as Record<string, TemplateOrExtensionData[]>);

  return extensionsGroupedByCategory;
};
