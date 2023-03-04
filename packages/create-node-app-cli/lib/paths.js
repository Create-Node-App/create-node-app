const os = require('os');
const path = require('path');
const gitCache = require('./git-tools');

const solveGitPath = async ({ url, branch, subdir }) => {
  const targetId = Buffer.from(`${url}#${branch}#${subdir}`).toString('base64');
  const target = path.join(os.homedir(), '.cna', targetId);
  try {
    await gitCache({
      git: url,
      branch,
      target,
      targetId,
    });
  } catch {
    // ignore git error
  }
  return { dir: target, subdir };
};

const solveAddonPath = async (addon) => {
  try {
    const url = new URL(addon);
    const branch = url.searchParams.get('branch');
    const subdir = url.searchParams.get('subdir');
    const templateDirName = url.searchParams.get('templatedir');
    const ignorePackage = url.searchParams.get('ignorePackage') === 'true';
    if (url.protocol === 'file:') {
      return { dir: path.resolve(url.host, url.pathname), subdir, templateDirName };
    }
    const urlWithoutParams = `${url.origin}${url.pathname}`;
    const gitData = await solveGitPath({ url: urlWithoutParams, branch, subdir });
    return { ...gitData, templateDirName, ignorePackage };
  } catch {
    // failed solving file/http/ssh/... url
    return { dir: path.resolve(__dirname, '..', 'addons', addon) };
  }
};

const getAddonPackagePath = async (addon, name = 'package', ignorePackage = false) => {
  const { dir, subdir, ignorePackage: addonIgnorePackage } = await solveAddonPath(addon);
  if (name === 'package.json' && (ignorePackage || addonIgnorePackage)) {
    throw new Error('package.json should be ignored for file addon');
  }
  if (subdir) {
    return path.resolve(dir, subdir, name);
  }
  return path.resolve(dir, name);
};

const getAddonTemplateDir = async (addon, templateDirName = '') => {
  const { dir, subdir, templateDirName: addonTemplateDirName } = await solveAddonPath(addon);
  const safeDirName =
    (addonTemplateDirName === null ? templateDirName : addonTemplateDirName) || '';
  if (subdir) {
    return path.resolve(dir, subdir, safeDirName);
  }
  return path.resolve(dir, safeDirName);
};

module.exports = {
  getAddonPackagePath,
  getAddonTemplateDir,
};
