import { CnaOptions } from "@create-node-app/core";
import { Addon } from "@create-node-app/core/loaders";

const TEMPLATE_DATA_FILE_URL =
  "https://raw.githubusercontent.com/Create-Node-App/cna-templates/main/templates.json";

export type TemplateOrExtensionData = {
  name: string;
  description: string;
  url: string;
  type: string;
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

export const getBaseTemplates = async () => {
  const templateData = await getTemplateData();

  return templateData.templates;
};

export const getCnaExtensions = async (appType: string) => {
  const templateData = await getTemplateData();

  return templateData.extensions.filter(
    (extension) => extension.type === appType
  );
};
