const _ = require('underscore');
const fs = require('fs-extra');
const chalk = require('chalk');
const readdirp = require('readdirp');
const { dirname } = require('path');
const { getAddonTemplateDir } = require('./paths');

const SRC_PATH_PATTERN = '[src]/';
const DEFAULT_SRC_PATH = 'src/';

const getSrcDirPattern = (srcDir) => `${srcDir === '.' ? '' : srcDir}/`;

const copyFile = (src, dest, verbose) => {
  try {
    const parentDir = dirname(dest);
    if (parentDir) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.copySync(src, dest, { overwrite: true });
    if (verbose) {
      console.log(chalk.green(`Added "${dest}" from "${src}" successfully`));
    }
  } catch (err) {
    console.log(chalk.red(`Cannot copy file ${src} to ${dest}`));
    if (verbose) {
      console.log(chalk.red(err));
    }
  }
};

const writeFile = (path, content, flag = 'w', verbose) => {
  try {
    const parentDir = dirname(path);
    if (parentDir) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(path, content, { flag });
    if (verbose) {
      console.log(chalk.green(`Added "${path}" successfully`));
    }
  } catch (err) {
    console.log(chalk.red(`Cannot write file ${path}`));
    if (verbose) {
      console.log(chalk.red(err));
    }
  }
};

const appendFile = (src, dest, verbose) => {
  const content = fs.readFileSync(src, 'utf8');
  writeFile(dest, content, 'a+', verbose);
};

const getModeFromPath = (path = '') => {
  const matchExts = (...exts) => exts.find((ext) => path.endsWith(ext));

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

const copyLoader = ({ root, templateDir, verbose, srcDir }) => ({ path }) => {
  copyFile(
    `${templateDir}/${path}`,
    `${root}/${path}`.replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir)),
    verbose
  );
};

const appendLoader = ({ root, templateDir, verbose, srcDir }) => ({ path }) => {
  const newPath = path.replace(/.append$/, '').replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));
  appendFile(`${templateDir}/${path}`, `${root}/${newPath}`, verbose);
};

const templateLoader = ({ root, templateDir, appName, alias, verbose, mode, srcDir }) => ({
  path,
}) => {
  const flag = mode.includes('append') ? 'a+' : 'w';
  const file = fs.readFileSync(`${templateDir}/${path}`, 'utf8');
  const newFile = _.template(file);
  const newPath = path
    .replace(/.template$/, '')
    .replace(/.append$/, '')
    .replace(SRC_PATH_PATTERN, getSrcDirPattern(srcDir));

  writeFile(
    `${root}/${newPath}`,
    newFile({
      project: alias,
      projectImport: alias,
      projectImportPath: alias === '' ? '' : `${alias}/`,
      projectName: appName,
      srcDir: srcDir || '.',
    }),
    flag,
    verbose
  );
};

const fileLoader = ({
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

const loadFiles = async ({
  root,
  addons = [],
  appName,
  originalDirectory,
  alias,
  verbose,
  srcDir = DEFAULT_SRC_PATH,
}) => {
  // eslint-disable-next-line no-restricted-syntax
  for await (const { addon, templateDirName = 'template' } of addons) {
    const templateDir = await getAddonTemplateDir(addon, templateDirName);
    if (!fs.existsSync(templateDir)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    // eslint-disable-next-line no-restricted-syntax
    for await (const entry of readdirp(templateDir, {
      fileFilter: [
        '!package.js',
        '!package.json',
        '!package-lock.json',
        '!template.json',
        '!yarn.lock',
      ],
      directoryFilter: ['!package'],
    })) {
      try {
        fileLoader({ root, templateDir, appName, originalDirectory, alias, verbose, srcDir })(
          entry
        );
      } catch (err) {
        if (verbose) {
          console.log(err);
        }
      }
    }
  }
};

module.exports = {
  loadFiles,
};
