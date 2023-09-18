import axios from "axios";
import { PromptType } from "prompts";

const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

export type TemplateOrExtensionData = {
  name: string;
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

export type Templates = {
  templates: TemplateData[];
  extensions: ExtensionData[];
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

export const getTemplateCategories = async () => {
  const templateData = await getTemplateData();

  // Ensure that the categories are unique
  const categories = new Set<string>();

  templateData.templates.forEach((template) => {
    categories.add(template.category);
  });

  return Array.from(categories);
};

export const getTemplatesForCategory = async (category: string) => {
  const templateData = await getTemplateData();

  const templates = templateData.templates.filter(
    (template) => template.category === category
  );

  return templates;
};

export const getExtensionsGroupedByCategory = async (type: ExtensionType) => {
  const safeType = Array.isArray(type) ? type : [type];

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
