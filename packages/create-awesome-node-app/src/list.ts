import pc from "picocolors";
import {
  getTemplateCategories,
  getTemplatesForCategory,
  getExtensionsGroupedByCategory,
  getCategoryData,
  type TemplateData,
  type ExtensionData,
} from "./templates.js";

/**
 * List all available templates grouped by category.
 * With `json: true` prints machine-readable JSON instead of colored text.
 */
export const listTemplates = async ({ json = false }: { json?: boolean } = {}) => {
  const categories = await getTemplateCategories();

  if (json) {
    const groups = [];
    for (const categorySlug of categories) {
      const categoryData = await getCategoryData(categorySlug);
      const templates = await getTemplatesForCategory(categorySlug);
      groups.push({
        slug: categorySlug,
        name: categoryData?.name ?? categorySlug,
        description: categoryData?.description ?? "",
        templates: templates.map((template: TemplateData) => ({
          name: template.name,
          slug: template.slug,
          description: template.description,
          type: template.type,
          labels: template.labels ?? [],
          url: template.url,
        })),
      });
    }
    console.log(JSON.stringify({ templates: groups }, null, 2));
    return;
  }

  console.log(pc.bold(pc.blue("\nAvailable Templates:")));

  for (const categorySlug of categories) {
    const categoryData = await getCategoryData(categorySlug);
    const templates = await getTemplatesForCategory(categorySlug);

    // Display category name if available, otherwise use the slug
    const categoryName = categoryData?.name || categorySlug;
    console.log(pc.bold(pc.green(`\n${categoryName}:`)));

    // Display category description if available
    if (categoryData?.description) {
      console.log(`  ${categoryData.description}`);
    }

    templates.forEach((template: TemplateData) => {
      console.log(`  ${pc.yellow(template.name)} (${pc.cyan(template.slug)})`);
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
  json = false,
}: {
  templateSlug?: string;
  templateType?: string;
  json?: boolean;
}) => {
  // If templateSlug is provided but templateType is not, try to get the template type
  if (templateSlug && !templateType) {
    templateType = await getTemplateTypeFromSlug(templateSlug);
  }

  const types: string[] = templateType
    ? [templateType, "all"]
    : []; // empty array = show all
  const extensionsGroupedByCategory =
    await getExtensionsGroupedByCategory(types as any);

  if (json) {
    const groups = [];
    for (const [categorySlug, extensions] of Object.entries(
      extensionsGroupedByCategory,
    )) {
      const categoryData = await getCategoryData(categorySlug);
      groups.push({
        slug: categorySlug,
        name: categoryData?.name ?? categorySlug,
        description: categoryData?.description ?? "",
        extensions: (extensions as ExtensionData[]).map((extension) => ({
          name: extension.name,
          slug: extension.slug,
          description: extension.description,
          type: extension.type,
          labels: extension.labels ?? [],
          url: extension.url,
        })),
      });
    }
    console.log(
      JSON.stringify(
        { addons: groups, ...(templateSlug ? { templateSlug } : {}) },
        null,
        2,
      ),
    );
    return;
  }

  console.log(pc.bold(pc.blue("\nAvailable Addons:")));

  if (templateSlug) {
    console.log(
      pc.bold(pc.green(`\nCompatible with template: ${templateSlug}`)),
    );
  }

  for (const [categorySlug, extensions] of Object.entries(
    extensionsGroupedByCategory,
  )) {
    const categoryData = await getCategoryData(categorySlug);

    // Display category name if available, otherwise use the slug
    const categoryName = categoryData?.name || categorySlug;
    console.log(pc.bold(pc.green(`\n${categoryName}:`)));

    // Display category description if available
    if (categoryData?.description) {
      console.log(`  ${categoryData.description}`);
    }

    (extensions as ExtensionData[]).forEach((extension: ExtensionData) => {
      console.log(
        `  ${pc.yellow(extension.name)} (${pc.cyan(extension.slug)})`,
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
