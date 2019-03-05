const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const os = require('os')
const semver = require('semver')
const spawn = require('cross-spawn')
const { execSync } = require('child_process')
const dns = require('dns')
const _ = require('underscore')
const readdirp = require('readdirp')

var dependencies = require('./dependencies')
var devDependencies = require('./devDependencies')

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
    return Promise.resolve(true)
  }

  return new Promise(resolve => {
    dns.lookup('registry.yarnpkg.com', err => {
      let proxy
      if (err != null && (proxy = getProxy())) {
        // If a proxy is defined, we likely can't resolve external hostnames.
        // Try to resolve the proxy name as an indication of a connection.
        dns.lookup(url.parse(proxy).hostname, proxyErr => {
          resolve(proxyErr == null)
        })
      } else {
        resolve(err == null)
      }
    })
  })
}

function createApp(
  name,
  verbose,
  useNpm,
  useTypescript,
  docker,
  alias,
  installDependencies,
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

  const useYarn = useNpm ? false : shouldUseYarn()
  const command = useYarn ? 'yarn' : 'npm run'

  var packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
    scripts: {
      "build": "webpack",
      "build:dev": `${command} build --mode development`,
      "build:dev:watch": `${command} build:dev --watch`,
      "build:dev:bundleanalyze": `${command} build:dev --addons=bundleanalyze`,
      "build:dev:bundlebuddy": `${command} build:dev --addons=bundlebuddy`,
      "build:prod": `${command} build -p`,
      "build:prod:watch": `${command} build:prod --watch`,
      "build:prod:bundleanalyze": `${command} build:prod --addons=bundleanalyze`,
      "build:prod:bundlebuddy": `${command} build:prod --addons=bundlebuddy`,
      "upgrade:package": `${command} upgrade-interactive --latest`  ,
      "lint": "eslint .; exit 0",
      "lint:fix": "eslint . --fix; exit 0",
      "reducer:generate": "reducer-maker -w src",
      "reducer:help": "reducer-maker --help",
      "serve:dev": "webpack-dev-server --mode development",
      "serve:dev:dashboard": "webpack-dashboard webpack-dev-server -- --mode development --addons=dashboard",
      "serve:prod": `${command} build:prod && live-server ./dist`,
      "start": `${command} serve:dev`,
      "test": "jest --config .jest.config.js",
      "test:ci": `${command} test --ci`,
      "test:watch": "jest --config .jest.config.js --watch",
      "webpack-defaults": "webpack-defaults"
    }
  }

  if (docker) {
    packageJson.scripts = {
      ...packageJson.scripts,
      "docker:dev": `${command} docker:build && ${command} docker:start`,
      "docker:build": `docker build -f docker/Dockerfile --target development -t ${appName} .`,
      "docker:start": `docker run --rm -it --network host -v $PWD:/usr/src/app ${appName}`,
      "docker:prod": `${command} docker:build:prod && ${command} docker:start:prod`,
      "docker:build:prod": `docker build -f docker/Dockerfile --target production -t ${appName}:production .`,
      "docker:start:prod": `docker run --rm -it --network host -v $PWD:/usr/src/app ${appName}:production`,

    }
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )

  const originalDirectory = process.cwd();
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
      )
    }
  }

  run(
    root,
    appName,
    originalDirectory,
    verbose,
    useYarn,
    useTypescript,
    docker,
    alias,
    installDependencies,
  ).then()
}

async function run(
  root,
  appName,
  originalDirectory,
  verbose,
  useYarn,
  useTypescript,
  docker,
  alias,
  installDependencies,
) {
  if (useTypescript) {
    // TODO: get user's node version instead of installing latest
    dependencies.push(
      '@types/node',
      '@types/react',
      '@types/react-dom',
      '@types/jest',
      'typescript'
    )
  }

  if (useYarn) {
    isOnline = await checkIfOnline(useYarn)
  } else {
    isOnline = true
  }

  if (installDependencies) {
    console.log(chalk.green('Installing packages. This might take a couple of minutes.'))
    console.log(chalk.green('Installing dependencies...'))
    console.log()
    // Install dependencies
    await install(root, useYarn, dependencies, verbose, isOnline, false)

    if (devDependencies.length > 0) {
      console.log()
      console.log(chalk.green('Installing devDependencies...'))
      console.log()
      //Install devDependencies
      await install(root, useYarn, devDependencies, verbose, isOnline, true)
    }
  } else {
    console.log(chalk.yellow('Skip package installation.'))
    console.log(chalk.yellow('Run npm install/yarn in your project.'))
    let packageJson = JSON.parse(fs.readFileSync(`${root}/package.json`, 'utf8'))
    packageJson.dependencies = dependencies.reduce((dep, elem) => {
      if (/.+@[0-9a-zA-Z-.]+$/.test(elem)) {
        let [ name, version ] = elem.split('@')
        dep[name] = `^${version}`
      } else {
        dep[elem] = '*'
      }
      return dep
    }, {})
    packageJson.devDependencies = devDependencies.reduce((dep, elem) => {
      dep[elem] = '*'
      return dep
    }, {})

    fs.writeFileSync(
      path.join(root, 'package.json'),
      JSON.stringify(packageJson, null, 2) + os.EOL
    )

  }

  provisionConfig(root, appName, originalDirectory, alias, verbose)

  provisionTemplates(root, appName, originalDirectory, alias, verbose)

  if (docker) {
    provisionDocker(root, appName, originalDirectory, alias, verbose)
  }

  spawn('git', [ 'init' ])
}

function install(root, useYarn, dependencies, verbose, isOnline, isDevDependencies) {
  return new Promise((resolve, reject) => {
    let command
    let args
    if (useYarn) {
      command = 'yarnpkg'
      //args = ['add', '--exact']
      args = ['add']
      if (!isOnline) {
        args.push('--offline')
      }
      if (isDevDependencies) {
        args.push('--dev')
      }
      [].push.apply(args, dependencies)

      // Explicitly set cwd() to work around issues like
      // https://github.com/facebook/create-react-app/issues/3326.
      // Unfortunately we can only do this for Yarn because npm support for
      // equivalent --prefix flag doesn't help with this issue.
      // This is why for npm, we run checkThatNpmCanReadCwd() early instead.
      args.push('--cwd')
      args.push(root)

      if (!isOnline) {
        console.log(chalk.yellow('You appear to be offline.'))
        console.log(chalk.yellow('Falling back to the local Yarn cache.'))
        console.log()
      }
    } else {
      command = 'npm'
      args = [
        'install',
        '--loglevel',
        'error',
      ]
      if (isDevDependencies) {
        args.push('--save-dev')
      } else {
        args.push('--save')
      }

      [].push.apply(args, dependencies)
    }

    if (verbose) {
      args.push('--verbose')
    }

    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', code => {
      if (code !== 0) {
        reject({
          command: `${command} ${args.join(' ')}`,
        })
        return
      }
      resolve()
    })
  })
}

function provisionConfig(root, appName, originalDirectory, alias, verbose) {
  fs.readdir(`${__dirname}/config`, (err, data) => {
    if (err && verbose) {
      console.log(err)
    }

    data.forEach(elem => {
      fs.copy(`${__dirname}/config/${elem}`, `${root}/${elem}`, err => {
        if (err) {
          console.log(chalk.red(`Cannot copy ${elem}`))
          if (verbose) {
            console.log(chalk.red(err))
          }
        } else {
          if (verbose) {
            console.log(chalk.green(`Copied "${elem}" successfully`))
          }
        }
      })
    })
  })
}

function provisionTemplates(root, appName, originalDirectory, alias, verbose) {
  readdirp({ root: `${__dirname}/templates`, fileFilter: '*.template'})
    .on('data', ({path, parentDir}) => {
      const file = fs.readFileSync(`${__dirname}/templates/${path}`, 'utf8')
      const newFile = _.template(file)
      const newPath = path.replace(/.template$/, '')
      if (parentDir) {
        fs.mkdir(parentDir, { recursive: true }, err => {
          // Not fail if directory already exists
          if (err && err.code !== 'EEXIST') {
            console.log(err)
            console.log(chalk.red(`Cannot create directory ${parentDir}`))
          }
          
          fs.writeFile(`${root}/${newPath}`, newFile({ project: alias, projectName: appName }))
        })
      } else {
        fs.writeFile(`${root}/${newPath}`, newFile({ project: alias, projectName: appName }))
      }
    })
    .on('error', error => console.error('fatal error', error))

  readdirp({ root: `${__dirname}/templates`, fileFilter: '!*.template'})
    .on('data', ({path}) => {
      fs.copy(`${__dirname}/templates/${path}`, `${root}/${path}`, err => {
        if (err) {
          console.log(chalk.red(`Cannot copy ${path}`))
          if (verbose) {
            console.log(chalk.red(err))
          }
        } else {
          if (verbose) {
            console.log(chalk.green(`Copied "${path}" successfully`))
          }
        }
      })
    })
    .on('error', error => console.error('fatal error', error))
}

function provisionDocker(root, appName, originalDirectory, alias, verbose) {
  fs.readdir(`${__dirname}/docker`, (err, data) => {
    if (err && verbose) {
      console.log(err)
    }

    data.forEach(elem => {
      fs.copy(`${__dirname}/docker/${elem}`, `${root}/docker/${elem}`, err => {
        if (err) {
          console.log(chalk.red(`Cannot copy ${elem}`))
          if (verbose) {
            console.log(chalk.red(err))
          }
        } else {
          if (verbose) {
            console.log(chalk.green(`Copied "docker/${elem}" successfully`))
          }
        }
      })
    })
  })
}

module.exports = {
  createApp
}
