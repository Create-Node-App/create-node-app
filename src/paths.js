const os = require('os');
const path = require('path');
const gitCache = require('./git-tools');

async function solveGitPath(addon) {
  const [gitPath, type] = addon.split('#type=');
  const [branch, ...url] = gitPath.split('@').reverse();
  const id = Buffer.from(addon).toString('base64');
  const target = path.join(os.homedir(), '.crwp', 'crwp', id);
  try {
    await gitCache({ git: url.reverse().join('@'), branch, target });
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
