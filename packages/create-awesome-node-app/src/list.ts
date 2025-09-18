import chalk from "chalk";
import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  getCategoryData,
  type TemplateData,
  type ExtensionData,
} from "./templates.js";

/**
 * List all available templates grouped by category
 */
export const listTemplates = async () => {
  const categories = await getTemplateCategories();

  console.log(chalk.bold.blue("\nAvailable Templates:"));

  for (const categorySlug of categories) {
    const categoryData = await getCategoryData(categorySlug);
    const templates = await getTemplatesForCategory(categorySlug);

    // Display category name if available, otherwise use the slug
    const categoryName = categoryData?.name || categorySlug;
    console.log(chalk.bold.green(`\n${categoryName}:`));

    // Display category description if available
    if (categoryData?.description) {
      console.log(`  ${categoryData.description}`);
    }

    templates.forEach((template: TemplateData) => {
      console.log(
        `  ${chalk.yellow(template.name)} (${chalk.cyan(template.slug)})`,
      );
      console.log(`    ${template.description}`);
      if (template.labels && template.labels.length > 0) {
        console.log(`    Keywords: ${template.labels.join(", ")}`);
      }
    });
  }
};

/**
 * List all available addons grouped by category
 * @param templateSlug Optional template slug to filter compatible addons
 * @param templateType Optional template type to filter compatible addons
 */
export const listAddons = async ({
  templateSlug,
  templateType,
}: {
  templateSlug?: string;
  templateType?: string;
}) => {
  // If templateSlug is provided but templateType is not, try to get the template type
  if (templateSlug && !templateType) {
    templateType = await getTemplateTypeFromSlug(templateSlug);
  }

  const types = templateType ? [templateType, "all"] : ["all"];
  const extensionsGroupedByCategory =
    await getExtensionsGroupedByCategory(types);

  console.log(chalk.bold.blue("\nAvailable Addons:"));

  if (templateSlug) {
    console.log(
      chalk.bold.green(`\nCompatible with template: ${templateSlug}`),
    );
  }

  for (const [categorySlug, extensions] of Object.entries(
    extensionsGroupedByCategory,
  )) {
    const categoryData = await getCategoryData(categorySlug);

    // Display category name if available, otherwise use the slug
    const categoryName = categoryData?.name || categorySlug;
    console.log(chalk.bold.green(`\n${categoryName}:`));

    // Display category description if available
    if (categoryData?.description) {
      console.log(`  ${categoryData.description}`);
    }

    (extensions as ExtensionData[]).forEach((extension: ExtensionData) => {
      console.log(
        `  ${chalk.yellow(extension.name)} (${chalk.cyan(extension.slug)})`,
      );
      console.log(`    ${extension.description}`);
      if (extension.labels && extension.labels.length > 0) {
        console.log(`    Keywords: ${extension.labels.join(", ")}`);
      }
    });
  }
};

/**
 * Get template type from template slug
 * @param templateSlug The template slug to look up
 */
export const getTemplateTypeFromSlug = async (
  templateSlug: string,
): Promise<string | undefined> => {
  const categories = await getTemplateCategories();

  for (const category of categories) {
    const templates = await getTemplatesForCategory(category);
    const template = templates.find(
      (t: TemplateData) => t.slug === templateSlug,
    );

    if (template) {
      return template.type;
    }
  }

  return undefined;
};
