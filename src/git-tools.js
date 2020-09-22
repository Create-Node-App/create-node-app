const os = require('os');
const child_process = require('child_process');
const path = require('path');
const { promisify } = require('util');
const fs = require('fs-extra');
const download = require('download');
const debug = require('debug')('crwp');

const exec = promisify(child_process.exec);

/**
 * @todo add options.filter
 *
 * @param {object} opts options
 * @param {string} opts.git Git repository url. If it is a github repo, only
 * type '<username>/<repo>'.
 * @param {string} opts.target The folder of generating to.
 * @param {string} opts.cacheDir? Default `~/.crwp/${name}`, the folder
 * @param {string} opts.branch? Default 'master'. Git branch.
 * @param {string} opts.way? The way of install git, only 'git' or 'zip'.
 * to keep cache.
 * @param {string} opts.zip? Zip downloading url. If opt.git is a github
 * repository, this option is unnecessary.
 * @param {boolean} opts.offline? use cached files, and don't update.
 */
module.exports = async function git(opts) {
  const { git, zip, offline = false, target = './', branch = 'master', way = 'git' } = opts;

  const absoluteTarget = path.isAbsolute(target) ? target : path.resolve(target);
  const isGithub = /^[^\/]+\/[^\/]+$/.test(git);
  const gitUrl = isGithub ? `https://github.com/${git}` : git;
  const zipUrl = isGithub ? `https://github.com/${git}/archive/${branch}.zip` : zip;
  const id = new Buffer(git).toString('base64').substr(0, 6);
  let cacheDir = opts.cacheDir || path.join(os.homedir(), '.crwp', id);

  cacheDir = path.isAbsolute(cacheDir) ? cacheDir : path.resolve(cacheDir);

  debug('cache folder: %s', cacheDir);
  debug('git url: %s', gitUrl);
  debug('zip url: %s', zipUrl);

  const cached = fs.existsSync(cacheDir);

  switch (way) {
    case 'git':
      return await createByGit();
    case 'zip':
      return await createByZip();
    default:
      throw new Error(`Expect parameter opts.way is 'git' or 'zip'`);
  }

  /**
   * opts.way === 'git'
   */
  async function createByGit() {
    debug('git mode');

    if (!cached) {
      await clone(gitUrl, cacheDir, branch);
    }

    if (offline) {
      await fs.copy(cacheDir, absoluteTarget, { filter: filterGit });
      return;
    }

    await pull(cacheDir);
    await fs.copy(cacheDir, absoluteTarget, { filter: filterGit });
  }

  /**
   * opts.way === 'zip'
   * It will never use cached files, opts.cached & opts.offline will be Invalid.
   */
  async function createByZip() {
    debug('zip mode');
    await download(zipUrl, target, { extract: true });
  }
};

/**
 * filter .git folder
 */
function filterGit(src) {
  return !/(\\|\/)\.git\b/.test(src);
}

/**
 *
 * @param {string} git git repository src
 * @param {string} target the target git clone to
 * @param {string} branch git branch
 */
function clone(git, target, branch) {
  const command = ['git', 'clone', '--depth=1', '-b', branch, git, target];
  return exec(command.join(' '));
}

/**
 * git pull
 */
async function pull(cwd) {
  await exec('git checkout -f', { cwd });
  return await exec('git pull', { cwd });
}
