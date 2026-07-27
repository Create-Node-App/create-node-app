import fs from "fs";
import pc from "picocolors";
import { readdirp } from "readdirp";
import { dirname } from "path";
import { getTemplateDirPath } from "./paths.js";
import { promisify } from "util";
import lodash from "lodash";

const { template } = lodash;

const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);

// Token used inside templates to denote the source directory.
// Templates name a directory literally `[src]` and files inside like `[src]/App.tsx.template`.
// We map the prefix `[src]/` to the selected srcDir (e.g. `src/`).
const SRC_PATH_PATTERN = "[src]/";
const DEFAULT_SRC_PATH = "src/";

const getSrcDirPattern = (srcDir: string) =>
  srcDir === "." ? "" : srcDir + "/";

const makeDirectory = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const getModeFromPath = (path = "") => {
  const matchExts = (...exts: string[]) =>
    exts.find((ext) => path.endsWith(ext));

  if (matchExts(".append")) {
    return "append";
  }
  if (matchExts(".append.template", ".template.append")) {
    return "appendTemplate";
  }
  if (matchExts(".template")) {
    return "copyTemplate";
  }
  return "copy";
};

type FileLoaderOptions = {
  root: string;
  templateDir: string;
  appName: string;
  originalDirectory: string;
  verbose: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
  useBun?: boolean;
  srcDir: string;
  mode?: string;
  runCommand: string;
  installCommand: string;
} & {
  [key: string]: unknown;
};

export type FileLoader = (
  options: FileLoaderOptions,
) => (entry: { path: string }) => Promise<void>;

// Batched file copy operation
const batchedCopyFiles = async (
  operations: { src: string; dest: string; verbose: boolean }[],
) => {
  const batchedPromises = operations.map(async (operation) => {
    try {
      makeDirectory(dirname(operation.dest));
      await copyFileAsync(operation.src, operation.dest);
      // Preserve original file permissions (e.g. executable bit on husky hooks)
      try {
        const srcStat = await promisify(fs.stat)(operation.src);
        await promisify(fs.chmod)(operation.dest, srcStat.mode);
      } catch {
        // Non-critical: file was already copied
      }
      if (operation.verbose) {
        console.log(
          pc.green(
            `Added "${operation.dest}" from "${operation.src}" successfully`,
          ),
        );
      }
    } catch (err) {
      console.log(
        pc.red(`Cannot copy file ${operation.src} to ${operation.dest}`),
      );
      if (operation.verbose) {
        console.log(pc.red(String(err)));
      }
      throw err;
    }
  });

  await Promise.all(batchedPromises);
};

// Batched file write operation
const batchedWriteFiles = async (
  operations: {
    path: string;
    content: string;
    flag: string;
    verbose: boolean;
    mode?: number;
  }[],
) => {
  const batchedPromises = operations.map(async (operation) => {
    try {
      makeDirectory(dirname(operation.path));
      await writeFileAsync(operation.path, operation.content, {
        flag: operation.flag,
        mode: operation.mode,
      });
      if (operation.verbose) {
        console.log(pc.green(`Added "${operation.path}" successfully`));
      }
    } catch (err) {
      console.log(pc.red(`Cannot write file ${operation.path}`));
      if (operation.verbose) {
        console.log(pc.red(String(err)));
      }
      throw err;
    }
  });

  await Promise.all(batchedPromises);
};

// Batched file append operation
const batchedAppendFiles = async (
  operations: { src: string; dest: string; verbose: boolean }[],
) => {
  const batchedPromises = operations.map(async (operation) => {
    try {
      const content = await promisify(fs.readFile)(operation.src, "utf8");
      const fileMode = (await promisify(fs.stat)(operation.src)).mode;
      await batchedWriteFiles([
        {
          path: operation.dest,
          content,
          flag: "a+",
          verbose: operation.verbose,
          mode: fileMode,
        },
      ]);
    } catch (err) {
      console.log(
        pc.red(`Cannot append file ${operation.src} to ${operation.dest}`),
      );
      if (operation.verbose) {
        console.log(pc.red(String(err)));
      }
      throw err;
    }
  });

  await Promise.all(batchedPromises);
};

/**
 * File loader that copies a file from the template directory to the project root as-is.
 * Strips package-manager-specific suffixes (`.if-npm`, `.if-yarn`, etc.) and
 * resolves `[src]/` path tokens to the configured source directory.
 */
const copyLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  async ({ path }) => {
    const operations = [];
    try {
      const newPath = path
        .replace(/.if-(npm|yarn|pnpm|bun)$/, "")
        .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));

      operations.push({
        src: `${templateDir}/${path}`,
        dest: `${root}/${newPath}`,
        verbose,
      });
    } catch (err) {
      if (verbose) {
        console.log(err);
      }
      throw err;
    }

    await batchedCopyFiles(operations);
  };

/**
 * File loader that appends a template file's content to the destination file.
 * Strips `.append` and package-manager-specific suffixes before resolving the destination path.
 * Creates the destination file if it does not exist.
 */
const appendLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  async ({ path }) => {
    const operations = [];
    try {
      const newPath = path
        .replace(/.append$/, "")
        .replace(/.if-(npm|yarn|pnpm|bun)$/, "")
        .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));

      operations.push({
        src: `${templateDir}/${path}`,
        dest: `${root}/${newPath}`,
        verbose,
      });
    } catch (err) {
      if (verbose) {
        console.log(err);
      }
      throw err;
    }

    await batchedAppendFiles(operations);
  };

/**
 * File loader that processes a file as a Lodash template before writing it to the project root.
 * Interpolates variables such as `projectName`, `srcDir`, `runCommand`, `installCommand`,
 * and any additional custom options.
 * When `mode` includes `"append"`, the rendered content is appended rather than overwritten.
 */
const templateLoader: FileLoader =
  ({
    root,
    templateDir,
    appName,
    verbose,
    mode = "",
    srcDir,
    runCommand,
    installCommand,
    ...customOptions
  }) =>
  async ({ path }) => {
    const operations = [];
    try {
      const flag = mode.includes("append") ? "a+" : "w";
      const filePath = `${templateDir}/${path}`;
      const file = await promisify(fs.readFile)(filePath, "utf8");
      const fileMode = (await promisify(fs.stat)(filePath)).mode;
      const newFile = template(file);
      const newPath = path
        .replace(/.template$/, "")
        .replace(/.append$/, "")
        .replace(/.if-(npm|yarn|pnpm|bun)$/, "")
        .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));

      operations.push({
        path: `${root}/${newPath}`,
        content: newFile({
          projectName: appName,
          srcDir: srcDir || ".",
          runCommand,
          installCommand,
          ...customOptions,
        }),
        flag,
        verbose,
        mode: fileMode,
      });
    } catch (err) {
      if (verbose) {
        console.log(err);
      }
      throw err;
    }

    await batchedWriteFiles(operations);
  };

/**
 * Dispatches a single template file to the appropriate loader based on its file extension.
 *
 * Dispatch rules (checked against the file path):
 * - `.template`                    → `templateLoader` (render + overwrite)
 * - `.append`                      → `appendLoader`   (copy + append)
 * - `.append.template` / `.template.append` → `templateLoader` (render + append)
 * - anything else                  → `copyLoader`     (plain copy)
 */
const fileLoader: FileLoader =
  ({
    root,
    templateDir,
    appName,
    originalDirectory,
    verbose,
    useYarn,
    usePnpm,
    useBun,
    srcDir = DEFAULT_SRC_PATH,
    runCommand,
    installCommand,
    ...customOptions
  }) =>
  async ({ path }) => {
    try {
      const mode = getModeFromPath(path);

      const loaders = {
        copy: copyLoader,
        append: appendLoader,
        copyTemplate: templateLoader,
        // appendTemplate means treat as a template (interpolate) but append instead of overwrite
        appendTemplate: templateLoader,
      } as const;

      await loaders[mode]({
        root,
        templateDir,
        appName,
        originalDirectory,
        verbose,
        useYarn: !!useYarn,
        usePnpm: !!usePnpm,
        useBun: !!useBun,
        mode,
        srcDir,
        runCommand,
        installCommand,
        ...customOptions,
      })({
        path,
      });
    } catch (err) {
      if (verbose) {
        console.log(err);
      }
      throw err;
    }
  };

export type TemplateOrExtension = { url: string; ignorePackage?: boolean };

export type LoadFilesOptions = {
  root: string;
  templatesOrExtensions?: TemplateOrExtension[];
  appName: string;
  originalDirectory: string;
  verbose: boolean;
  useYarn?: boolean;
  usePnpm?: boolean;
  useBun?: boolean;
  srcDir?: string;
  runCommand: string;
  installCommand: string;
  offline?: boolean;
  cacheDir?: string;
  refresh?: import("./git.js").RefreshMode;
  refreshAfterHours?: number;
} & {
  [key: string]: unknown;
};

/**
 * Iterates over all provided templates/extensions, discovers their files,
 * and applies the appropriate file loader to each entry in parallel.
 * Throws if any file operation fails.
 *
 * @param options - See {@link LoadFilesOptions}
 * @param options.root - Absolute path to the target project directory
 * @param [options.templatesOrExtensions] - List of template/extension URLs to apply
 * @param options.appName - App name used for template interpolation
 * @param options.originalDirectory - CWD at the time the CLI was invoked
 * @param options.verbose - Enable debug-level logging
 * @param [options.useYarn] - Whether Yarn is the active package manager
 * @param [options.usePnpm] - Whether pnpm is the active package manager
 * @param [options.useBun] - Whether Bun is the active package manager
 * @param [options.srcDir] - Source directory token replacement (default: `"src/"`)
 * @param options.runCommand - Script run command passed to templates
 * @param options.installCommand - Install command passed to templates
 * @param [options.offline] - Resolve template directories in offline mode
 * @param [options.cacheDir] - Custom cache directory for cloned templates
 * @param [options.refresh] - Git cache refresh mode
 * @param [options.refreshAfterHours] - Cache refresh interval in hours
 */
export const loadFiles = async ({
  root,
  templatesOrExtensions = [],
  appName,
  originalDirectory,
  verbose,
  useYarn = false,
  usePnpm = false,
  useBun = false,
  srcDir = DEFAULT_SRC_PATH,
  runCommand,
  installCommand,
  offline,
  cacheDir,
  refresh,
  refreshAfterHours,
  ...customOptions
}: LoadFilesOptions) => {
  try {
    const operations = [];
    for await (const { url: templateOrExtensionUrl } of templatesOrExtensions) {
      const templateDir = await getTemplateDirPath(templateOrExtensionUrl, {
        ...(offline !== undefined ? { offline } : {}),
        ...(cacheDir !== undefined ? { cacheDir } : {}),
        ...(refresh !== undefined ? { refresh } : {}),
        ...(refreshAfterHours !== undefined ? { refreshAfterHours } : {}),
      });
      if (verbose) {
        try {
          const stat = fs.existsSync(templateDir)
            ? fs.statSync(templateDir)
            : undefined;
          console.log(
            pc.dim(
              `[cna] Template dir resolved: ${templateDir} exists=${!!stat} isDir=$${stat?.isDirectory?.()}`,
            ),
          );
        } catch {
          // ignore
        }
      }

      if (
        fs.existsSync(templateDir) &&
        fs.statSync(templateDir).isDirectory()
      ) {
        // readdirp requires at least one positive pattern when using negations; we'll include '**/*'
        // and then filter out undesired files. This ensures templates are actually discovered.
        let debugFirst = true;
        // Collect all file entries without filters then skip undesired patterns manually
        const skipGlobs = [
          /\bpackage\.js$/,
          /\bpackage\.json$/,
          /\bpackage-lock\.json$/,
          /\btemplate\.json$/,
          /\byarn\.lock$/,
          /\bpnpm-lock\.yaml$/,
        ];
        const skipManager = usePnpm
          ? [/\.if-npm\./, /\.if-yarn\./, /\.if-bun\./]
          : useYarn
            ? [/\.if-npm\./, /\.if-pnpm\./, /\.if-bun\./]
            : useBun
              ? [/\.if-yarn\./, /\.if-pnpm\./]
              : [/\.if-yarn\./, /\.if-pnpm\./, /\.if-bun\./];
        const shouldSkip = (p: string) =>
          [...skipGlobs, ...skipManager].some((rgx) =>
            rgx.test(p.toLowerCase()),
          );

        for await (const entry of readdirp(templateDir, {
          type: "files",
          alwaysStat: false,
        })) {
          if (shouldSkip(entry.path)) continue;
          if (entry.path.startsWith("package/")) continue; // skip helper package dir
          if (verbose && debugFirst) {
            console.log(pc.dim(`[cna] First discovered file: ${entry.path}`));
            debugFirst = false;
          }
          operations.push({
            root,
            templateDir,
            appName,
            originalDirectory,
            verbose,
            useYarn,
            usePnpm,
            useBun,
            srcDir,
            runCommand,
            installCommand,
            entry,
            ...customOptions,
          });
        }
      }
    }

    if (verbose) {
      console.log(
        pc.dim(
          `[cna] Prepared ${operations.length} file operations from ${templatesOrExtensions.length} template(s)`,
        ),
      );
      if (operations.length === 0) {
        console.log(
          pc.yellow(
            "[cna] No files discovered. Check that the template repository was cloned and fileFilter patterns are correct.",
          ),
        );
      }
    }

    const results = await Promise.allSettled(
      operations.map((operation) => fileLoader(operation)(operation.entry)),
    );

    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected",
    );
    if (rejected.length > 0) {
      const errorMessages = rejected
        .map(
          (r, i) =>
            `  ${i + 1}. ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        )
        .join("\n");
      throw new Error(
        `Failed to copy ${rejected.length} of ${results.length} file(s):\n${errorMessages}`,
      );
    }
  } catch (err) {
    if (verbose) {
      console.log(err);
    }
    throw err;
  }
};
