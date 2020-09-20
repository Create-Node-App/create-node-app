const fs = require('fs-extra');
const { dirname } = require('path');
const chalk = require('chalk');
const _ = require('underscore');

function copyFile(src, dest, verbose) {
  try {
    fs.copySync(src, dest, { overwrite: true });
    if (verbose) {
      console.log(chalk.green(`Added "${path}" successfully`));
    }
  } catch (err) {
    console.log(chalk.red(`Cannot copy file ${src} to ${dest}`));
    if (verbose) {
      console.log(chalk.red(err));
    }
  }
}

function writeFile(path, content, flag = 'w', verbose) {
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
}

function appendFile(src, dest, verbose) {
  const content = fs.readFileSync(src, 'utf8');
  writeFile(dest, content, 'a+', verbose);
}

function getModeFromPath(path = '') {
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
}

const copyLoader = ({ root, templateDir, verbose }) => ({ path }) => {
  copyFile(`${templateDir}/${path}`, `${root}/${path}`, verbose);
};

const appendLoader = ({ root, templateDir, verbose }) => ({ path }) => {
  const newPath = path.replace(/.append$/, '');
  appendFile(`${templateDir}/${path}`, `${root}/${newPath}`, verbose);
};

const templateLoader = ({ root, templateDir, appName, alias, verbose, mode }) => ({ path }) => {
  const flag = mode.includes('append') ? 'a+' : 'w';
  const file = fs.readFileSync(`${templateDir}/${path}`, 'utf8');
  const newFile = _.template(file);
  const newPath = path.replace(/.template$/, '').replace(/.append$/, '');

  writeFile(`${root}/${newPath}`, newFile({ project: alias, projectName: appName }), flag, verbose);
};

const fileLoader = (root, templateDir, appName, alias, originalDirectory, verbose) => ({
  path,
}) => {
  const mode = getModeFromPath(path);

  const loaders = {
    copy: copyLoader,
    append: appendLoader,
    copyTemplate: templateLoader,
    appendTemplate: appendLoader,
  };

  return loaders[mode]({ root, templateDir, appName, alias, originalDirectory, verbose, mode })({
    path,
  });
};

module.exports = {
  fileLoader,
};
