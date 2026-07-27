import fs from "fs";
import path from "path";
import { getTemplateBaseDirPath } from "./paths.js";
import { ConfigParseError } from "./errors.js";

/** Configuration for custom CLI options in a CNA template. */
export type CnaCustomOption = {
  name: string;
  type: string;
  message?: string;
  initial?: unknown;
  [key: string]: unknown;
};

/** Shape of the configuration parsed from a template's `cna.config.json` */
export type CnaConfig = {
  customOptions?: CnaCustomOption[];
};

export const NON_EMPTY_DIR_ERROR_CODE = "CNA_NON_EMPTY_TARGET_DIR";

/** Error thrown when the scaffolding target directory is not empty. */
export class NonEmptyTargetDirectoryError extends Error {
  readonly code = NON_EMPTY_DIR_ERROR_CODE;

  constructor(readonly targetPath: string) {
    super(
      `Target directory is not empty: ${targetPath}. Use --force to continue.`,
    );
    this.name = "NonEmptyTargetDirectoryError";
  }
}

/**
 * Asserts that the target directory is empty before scaffolding.
 * @param dirPath - Absolute path to the target directory.
 * @throws {NonEmptyTargetDirectoryError} if the directory contains any entries other than `.DS_Store` or `Thumbs.db`.
 */
export const assertDirectoryIsEmpty = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    return;
  }

  const entries = fs
    .readdirSync(dirPath)
    .filter((entry) => entry !== ".DS_Store" && entry !== "Thumbs.db");

  if (entries.length > 0) {
    throw new NonEmptyTargetDirectoryError(dirPath);
  }
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
  const basePath = await getTemplateBaseDirPath(templateUrl);
  if (!basePath) return null;

  const configPath = path.join(basePath, "cna.config.json");
  if (!fs.existsSync(configPath)) return null;

  const content = fs.readFileSync(configPath, "utf8");
  try {
    return JSON.parse(content) as CnaConfig;
  } catch (err) {
    throw new ConfigParseError(configPath, err);
  }
};
