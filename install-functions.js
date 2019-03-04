const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const os = require('os')
const semver = require('semver')
const spawn = require('cross-spawn')
const { execSync } = require('child_process')
const dns = require('dns')

const dependencies = require('./dependencies')
const devDependencies = require('./devDependencies')

function shouldUseYarn() {
  try {
    execSync('yarnpkg --version', { stdio: 'ignore' })
    return true
  } catch (e) {
    return false
  }
}

function checkThatNpmCanReadCwd() {
  const cwd = process.cwd()
  let childOutput = null
  try {
    // Note: intentionally using spawn over exec since
    // the problem doesn't reproduce otherwise.
    // `npm config list` is the only reliable way I could find
    // to reproduce the wrong path. Just printing process.cwd()
    // in a Node process was not enough.
    childOutput = spawn.sync('npm', ['config', 'list']).output.join('')
  } catch (err) {
    // Something went wrong spawning node.
    // Not great, but it means we can't do this check.
    // We might fail later on, but let's continue.
    return true
  }
  if (typeof childOutput !== 'string') {
    return true
  }
  const lines = childOutput.split('\n')
  // `npm config list` output includes the following line:
  // " cwd = C:\path\to\current\dir" (unquoted)
  // I couldn't find an easier way to get it.
  const prefix = ' cwd = '
  const line = lines.find(line => line.indexOf(prefix) === 0)
  if (typeof line !== 'string') {
    // Fail gracefully. They could remove it.
    return true
  }
  const npmCWD = line.substring(prefix.length)
  if (npmCWD === cwd) {
    return true
  }
  console.error(
    chalk.red(
      `Could not start an npm process in the right directory.\n\n` +
        `The current directory is: ${chalk.bold(cwd)}\n` +
        `However, a newly started npm process runs in: ${chalk.bold(
          npmCWD
        )}\n\n` +
        `This is probably caused by a misconfigured system terminal shell.`
    )
  )
  if (process.platform === 'win32') {
    console.error(
      chalk.red(`On Windows, this can usually be fixed by running:\n\n`) +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKCU\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n` +
        `  ${chalk.cyan(
          'reg'
        )} delete "HKLM\\Software\\Microsoft\\Command Processor" /v AutoRun /f\n\n` +
        chalk.red(`Try to run the above two lines in the terminal.\n`) +
        chalk.red(
          `To learn more about this problem, read: https://blogs.msdn.microsoft.com/oldnewthing/20071121-00/?p=24433/`
        )
    )
  }
  return false
}


function checkNpmVersion() {
  let hasMinNpm = false
  let npmVersion = null
  try {
    npmVersion = execSync('npm --version')
      .toString()
      .trim()
    hasMinNpm = semver.gte(npmVersion, '3.0.0')
  } catch (err) {
    // ignore
  }
  return {
    hasMinNpm: hasMinNpm,
    npmVersion: npmVersion,
  }
}

function checkIfOnline(useYarn) {
  if (!useYarn) {
    // Don't ping the Yarn registry.
    // We'll just assume the best case.
    return Promise.resolve(true);
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      let proxy;
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null);
        });
      } else {
        resolve(err == null);
      }
    });
  });
}

function createApp(
  name,
  verbose,
  useNpm,
  useTypescript,
) {
  const root = path.resolve(name)
  const appName = path.basename(root)

  //checkAppName(appName)
  fs.ensureDirSync(name)
  /*
  if (!isSafeToCreateProjectIn(root, name)) {
    process.exit(1)
  }
  */

  console.log(`Creating a new React app in ${chalk.green(root)}.`)
  console.log()

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
  }
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )

  const useYarn = useNpm ? false : shouldUseYarn()
  process.chdir(root)
  if (!useYarn && !checkThatNpmCanReadCwd()) {
    process.exit(1)
  }

  if (!semver.satisfies(process.version, '>=6.0.0')) {
    console.log(
      chalk.yellow(
        `You are using Node ${
          process.version
        } so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
          `Please update to Node 6 or higher for a better, fully supported experience.\n`
      )
    )
    // Fall back to latest supported react-scripts on Node 4
    version = 'react-scripts@0.9.x'
  }

  if (!useYarn) {
    const npmInfo = checkNpmVersion()
    if (!npmInfo.hasMinNpm) {
      if (npmInfo.npmVersion) {
        console.log(
          chalk.yellow(
            `You are using npm ${
              npmInfo.npmVersion
            } so the project will be bootstrapped with an old unsupported version of tools.\n\n` +
              `Please update to npm 3 or higher for a better, fully supported experience.\n`
          )
        )
      }
      // Fall back to latest supported react-scripts for npm 3
      version = 'react-scripts@0.9.x'
    }
  }

  if (useYarn) {
    let yarnUsesDefaultRegistry = true
    try {
      yarnUsesDefaultRegistry =
        execSync('yarnpkg config get registry')
          .toString()
          .trim() === 'https://registry.yarnpkg.com'
    } catch (e) {
      // ignore
    }
    if (false && yarnUsesDefaultRegistry) {
      fs.copySync(
        require.resolve('./yarn.lock.cached'),
        path.join(root, 'yarn.lock')
      );
    }
  }

  run(
    root,
    appName,
    verbose,
    useYarn,
    useTypescript,
  )
}

function run(
  root,
  appName,
  verbose,
  useYarn,
  useTypescript,
) {
  const allDependencies = ['react', 'react-dom'];
  if (useTypescript) {
    // TODO: get user's node version instead of installing latest
    allDependencies.push(
      '@types/node',
      '@types/react',
      '@types/react-dom',
      '@types/jest',
      'typescript'
    );
  }

  allDependencies.push(...dependencies)

  if (useYarn) {
    checkIfOnline(useYarn).then(isOnline => {
      console.log('Installing packages. This might take a couple of minutes.');
    
    
        return install(
          root,
          useYarn,
          allDependencies,
          verbose,
          isOnline,
          false,
        )
          .then(() => {
            if (devDependencies.length > 0) {
              install(
                root,
                useYarn,
                devDependencies,
                verbose,
                isOnline,
                true
              ).then(console.log)
              .catch(console.err)
            }
          })
        })
         .catch(console.err)
  }
}

function install(root, useYarn, dependencies, verbose, isOnline, isDevDependencies) {
  return new Promise((resolve, reject) => {
    let command;
    let args;
    if (useYarn) {
      command = 'yarnpkg';
      args = ['add', '--exact'];
      if (!isOnline) {
        args.push('--offline');
      }
      if (isDevDependencies) {
        args.push('--dev')
      }
      [].push.apply(args, dependencies);

      // Explicitly set cwd() to work around issues like
      // https://github.com/facebook/create-react-app/issues/3326.
      // Unfortunately we can only do this for Yarn because npm support for
      // equivalent --prefix flag doesn't help with this issue.
      // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
      args.push('--cwd');
      args.push(root);

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'));
        console.log(chalk.yellow('Falling back to the local Yarn cache.'));
        console.log();
      }
    } else {
      command = 'npm';
      args = [
        'install',
        '--save',
        '--save-exact',
        '--loglevel',
        'error',
      ]
      if (isDevDependencies) {
        args.push('--save-dev')
      }
      args.concat(dependencies);
    }

    if (verbose) {
      args.push('--verbose');
    }

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        });
        return;
      }
      resolve();
    });
  });
}

module.exports = {
  createApp
}