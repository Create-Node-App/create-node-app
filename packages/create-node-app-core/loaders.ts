import _ from "underscore";
import fs from "fs";
import pc from "picocolors";
import { readdirp } from "readdirp";
import { dirname } from "path";
import { getTemplateDirPath } from "./paths.js";
import { promisify } from "util";

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

const copyLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  async ({ path }) => {
    const operations = [];
    try {
      const newPath = path
        .replace(/.if-(npm|yarn|pnpm)$/, "")
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

const appendLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  async ({ path }) => {
    const operations = [];
    try {
      const newPath = path
        .replace(/.append$/, "")
        .replace(/.if-(npm|yarn|pnpm)$/, "")
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
      const newFile = _.template(file);
      const newPath = path
        .replace(/.template$/, "")
        .replace(/.append$/, "")
        .replace(/.if-(npm|yarn|pnpm)$/, "")
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

const fileLoader: FileLoader =
  ({
    root,
    templateDir,
    appName,
    originalDirectory,
    verbose,
    useYarn,
    usePnpm,
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
  srcDir?: string;
  runCommand: string;
  installCommand: string;
} & {
  [key: string]: unknown;
};

export const loadFiles = async ({
  root,
  templatesOrExtensions = [],
  appName,
  originalDirectory,
  verbose,
  useYarn = false,
  usePnpm = false,
  srcDir = DEFAULT_SRC_PATH,
  runCommand,
  installCommand,
  ...customOptions
}: LoadFilesOptions) => {
  try {
    const operations = [];
    for await (const { url: templateOrExtensionUrl } of templatesOrExtensions) {
      const templateDir = await getTemplateDirPath(templateOrExtensionUrl);
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
          ? [/\.if-npm\./, /\.if-yarn\./]
          : useYarn
            ? [/\.if-npm\./, /\.if-pnpm\./]
            : [/\.if-yarn\./, /\.if-pnpm\./];
        const shouldSkip = (p: string) =>
          [...skipGlobs, ...skipManager].some((rgx) => rgx.test(p));

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

    await Promise.all(
      operations.map((operation) => fileLoader(operation)(operation.entry)),
    );
  } catch (err) {
    if (verbose) {
      console.log(err);
    }
    throw err;
  }
};
