import _ from "underscore";
import fs from "fs";
import pc from "picocolors";
import { readdirp } from "readdirp";
import { dirname } from "path";
import { getTemplateDirPath } from "./paths.js";
import { promisify } from "util";

const writeFileAsync = promisify(fs.writeFile);
const copyFileAsync = promisify(fs.copyFile);

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

// AI tool specific filters removed (cursor/copilot). All files now processed uniformly.

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
        appendTemplate: appendLoader,
      };

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

      if (
        fs.existsSync(templateDir) &&
        fs.statSync(templateDir).isDirectory()
      ) {
        for await (const entry of readdirp(templateDir, {
          fileFilter: [
            "!package.js",
            "!package.json",
            "!package-lock.json",
            "!template.json",
            "!yarn.lock",
            "!pnpm-lock.yaml",
            // based on the package manager we want to ignore files containing
            // the other package as condition.
            // For example, if `usePnpm` is true, the we need to ignore
            // all files with `.if-npm` or `.if-yarn` somewhere in the name.
            ...(usePnpm
              ? ["!*.if-npm.*", "!*.if-yarn.*"]
              : useYarn
                ? ["!*.if-npm.*", "!*.if-pnpm.*"]
                : ["!*.if-yarn.*", "!*.if-pnpm.*"]),
          ],
          directoryFilter: ["!package"],
        })) {
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
