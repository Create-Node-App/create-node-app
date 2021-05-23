const os = require('os');
const path = require('path');
const gitCache = require('./git-tools');

const solveGitPath = async (addon) => {
  const [gitPath, type] = addon.split('#path=');
  const [branch, ...url] = gitPath.split('@').reverse();
  const targetId = Buffer.from(addon).toString('base64');
  const target = path.join(os.homedir(), '.cna', targetId);
  try {
    await gitCache({
      git: url.reverse().join('@'),
      branch,
      target,
      targetId,
    });
  } catch (err) {
    console.error(err);
  }
  return { dir: target, type };
};

const getAddonPackagePath = async (addon, git, name = 'package') => {
  if (git) {
    const { dir, type } = await solveGitPath(addon);
    if (type) {
      return path.resolve(dir, type, name);
    }
    return path.resolve(dir, name);
  }

  return `${__dirname}/../addons/${addon}/${name}`;
};

const getAddonTemplateDir = async (addon, git) => {
  if (git) {
    const { dir, type } = await solveGitPath(addon);
    if (type) {
      return path.resolve(dir, type, 'template');
    }
    return path.resolve(dir, 'template');
  }

  return `${__dirname}/../addons/${addon}/template`;
};

module.exports = {
  getAddonPackagePath,
  getAddonTemplateDir,
};
