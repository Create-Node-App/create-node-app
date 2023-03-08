const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

export type TemplateOrExtensionData = {
  name: string;
  description: string;
  url: string;
  type: string;
  category: string;
  labels?: string[];
};

export type Templates = {
  templates: TemplateOrExtensionData[];
  extensions: TemplateOrExtensionData[];
};

const templateDataMap = new Map<string, Templates>();

const getTemplateData = async () => {
  if (templateDataMap.has(TEMPLATE_DATA_FILE_URL)) {
    return templateDataMap.get(TEMPLATE_DATA_FILE_URL) as Templates;
  }

  // download template data from TEMPLATE_DATA_FILE_URL
  // and return the template data that matches the template url

  const templateDataFile = await fetch(TEMPLATE_DATA_FILE_URL);
  const templateData: Templates = await templateDataFile.json();

  templateDataMap.set(TEMPLATE_DATA_FILE_URL, templateData);

  return templateData;
};

export const getTemplateCategories = async () => {
  const templateData = await getTemplateData();

  // ensure that the categories are unique
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

export const getExtensionsGroupedByCategory = async (type: string) => {
  const templateData = await getTemplateData();

  const extensions = templateData.extensions.filter(
    (extension) => extension.type === type
  );

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
