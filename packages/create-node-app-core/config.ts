import fs from "fs";
import path from "path";
import { getTemplateBaseDirPath } from "./paths.js";

export type CnaCustomOption = {
  name: string;
  type: string;
  message?: string;
  initial?: unknown;
  [key: string]: unknown;
};

export type CnaConfig = {
  customOptions?: CnaCustomOption[];
};

/**
 * Load cna.config.json from the base directory of a template.
 *
 * The config file lives alongside (not inside) the `template/` subdirectory:
 *
 *   my-template/
 *     cna.config.json   ← here
 *     template/
 *       src/
 *       package.json
 *
 * Works for both remote GitHub URLs (uses cached clone) and local file:// URLs.
 * Returns null if the file doesn't exist or cannot be parsed.
 */
export const loadTemplateCnaConfig = async (
  templateUrl: string,
): Promise<CnaConfig | null> => {
  try {
    const basePath = await getTemplateBaseDirPath(templateUrl);
    if (!basePath) return null;

    const configPath = path.join(basePath, "cna.config.json");
    if (!fs.existsSync(configPath)) return null;

    const content = fs.readFileSync(configPath, "utf8");
    return JSON.parse(content) as CnaConfig;
  } catch {
    return null;
  }
};
