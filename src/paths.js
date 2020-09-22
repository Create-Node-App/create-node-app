const path = require('path');
const findCacheDir = require('find-cache-dir');
const gitCache = require('./git-tools');

async function solveGitPath(addon) {
  const [gitPath, type] = addon.split('#type=');
  const [url, branch] = gitPath.split('@');
  const id = new Buffer(gitPath).toString('base64');
  const target = findCacheDir({ name: `crwp/${id}` });
  try {
    await gitCache({ git: url, branch, target });
  } catch (err) {
    console.log(err);
  }
  return { dir: target, type };
}

async function getAddonPackagePath({ addon, git }) {
  if (git) {
    const { dir, type } = await solveGitPath(addon);
    if (type) {
      return path.resolve(dir, type, 'package');
    }
    return path.resolve(dir, 'package');
  }

  return `../addons/${addon}/package`;
}

async function getAddonTemplateDir({ addon, git }) {
  if (git) {
    const { dir, type } = await solveGitPath(addon);
    if (type) {
      return path.resolve(dir, type, 'template');
    }
    return path.resolve(dir, 'template');
  }

  return `${__dirname}/../addons/${addon}/template`;
}

module.exports = {
  getAddonPackagePath,
  getAddonTemplateDir,
};
