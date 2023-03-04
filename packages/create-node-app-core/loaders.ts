const _ = require('underscore');
const fs = require('fs-extra');
const chalk = require('chalk');
const readdirp = require('readdirp');
const { dirname } = require('path');
const { getAddonTemplateDir } = require('./paths');

const SRC_PATH_PATTERN = '[src]/';
const DEFAULT_SRC_PATH = 'src/';

const getSrcDirPattern = (srcDir: string) => `${srcDir === '.' ? '' : srcDir}/`;

const copyFile = async (src: string, dest: string, verbose = false) => {
  try {
    const parentDir = dirname(dest);
    if (parentDir) {
      await fs.mkdir(parentDir, { recursive: true });
    }
    await fs.copy(src, dest, { overwrite: true });
    if (verbose) {
      console.log(chalk.green(`Added "${dest}" from "${src}" successfully`));
    }
  } catch (err) {
    console.log(chalk.red(`Cannot copy file ${src} to ${dest}`));
    if (verbose) {
      console.log(chalk.red(err));
    }
    throw err;
  }
};

const writeFile = async (path: string, content: string, flag = 'w', verbose = false) => {
  try {
    const parentDir = dirname(path);
    if (parentDir) {
      await fs.mkdir(parentDir, { recursive: true });
    }
    await fs.writeFile(path, content, { flag });
    if (verbose) {
      console.log(chalk.green(`Added "${path}" successfully`));
    }
  } catch (err) {
    console.log(chalk.red(`Cannot write file ${path}`));
    if (verbose) {
      console.log(chalk.red(err));
    }
    throw err;
  }
};

const appendFile = async (src: string, dest: string, verbose = false) => {
  const content = await fs.readFile(src, 'utf8');
  return writeFile(dest, content, 'a+', verbose);
};

const getModeFromPath = (path = '') => {
  const matchExts = (...exts: string[]) => exts.find((ext) => path.endsWith(ext));

  if (matchExts('.append')) {
    return 'append';
  }
  if (matchExts('.append.template', '.template.append')) {
    return 'appendTemplate';
  }
  if (matchExts('.template')) {
    return 'copyTemplate';
  }
  return 'copy';
};

type FileLoaderOptions = {
  root: string;
  templateDir: string;
  appName: string;
  originalDirectory: string;
  alias: string;
  verbose: boolean;
  srcDir: string;
  mode?: string;
};

export type FileLoader = (
  options: FileLoaderOptions
) => (entry: { path: string }) => Promise<void>;

const copyLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  ({ path }) => {
    return copyFile(
      `${templateDir}/${path}`,
      `${root}/${path}`.replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir)),
      verbose
    );
  };

const appendLoader: FileLoader =
  ({ root, templateDir, verbose, srcDir }) =>
  ({ path }) => {
    const newPath = path
      .replace(/.append$/, "")
      .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));
    return appendFile(`${templateDir}/${path}`, `${root}/${newPath}`, verbose);
  };

const templateLoader: FileLoader =
  ({ root, templateDir, appName, alias, verbose, mode = '', srcDir }) =>
  async ({ path }) => {
    const flag = mode.includes("append") ? "a+" : "w";
    const file = await fs.readFile(`${templateDir}/${path}`, "utf8");
    const newFile = _.template(file);
    const newPath = path
      .replace(/.template$/, "")
      .replace(/.append$/, "")
      .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));

    return writeFile(
      `${root}/${newPath}`,
      newFile({
        project: alias,
        projectImport: alias,
        projectImportPath: alias === "" ? "" : `${alias}/`,
        projectName: appName,
        srcDir: srcDir || ".",
      }),
      flag,
      verbose
    );
  };

const fileLoader: FileLoader = ({
  root,
  templateDir,
  appName,
  originalDirectory,
  alias,
  verbose,
  srcDir = DEFAULT_SRC_PATH,
}) => ({ path }) => {
  const mode = getModeFromPath(path);

  const loaders = {
    copy: copyLoader,
    append: appendLoader,
    copyTemplate: templateLoader,
    appendTemplate: appendLoader,
  };

  return loaders[mode]({
    root,
    templateDir,
    appName,
    originalDirectory,
    alias,
    verbose,
    mode,
    srcDir,
  })({
    path,
  });
};

export type LoadFilesOptions = {
  root: string;
  addons?: { addon: string; templateDirName?: string }[];
  appName: string;
  originalDirectory: string;
  alias: string;
  verbose: boolean;
  srcDir: string;
};

export const loadFiles = async ({
  root,
  addons = [],
  appName,
  originalDirectory,
  alias,
  verbose,
  srcDir = DEFAULT_SRC_PATH,
}: LoadFilesOptions) => {
  for await (const { addon, templateDirName = "template" } of addons) {
    const templateDir = await getAddonTemplateDir(addon, templateDirName);
    if (!(await fs.exists(templateDir))) {
      continue;
    }

    for await (const entry of readdirp(templateDir, {
      fileFilter: [
        "!package.js",
        "!package.json",
        "!package-lock.json",
        "!template.json",
        "!yarn.lock",
        "!pnpm-lock.yaml"
      ],
      directoryFilter: ["!package"],
    })) {
      try {
        await fileLoader({
          root,
          templateDir,
          appName,
          originalDirectory,
          alias,
          verbose,
          srcDir,
        })(entry);
      } catch (err) {
        if (verbose) {
          console.log(err);
        }
        throw err;
      }
    }
  }
};
