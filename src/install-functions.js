const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const os = require('os')
const semver = require('semver')
const spawn = require('cross-spawn')
const { execSync } = require('child_process')
const _ = require('underscore')
const readdirp = require('readdirp')

const {
  shouldUseYarn,
  checkThatNpmCanReadCwd,
  checkNpmVersion,
  checkIfOnline,
} = require('./helpers-functions')

var {
  dependencies,
  devDependencies,
} = require('./dependencies')

function createApp(
  name,
  verbose,
  useNpm,
  useTypescript,
  useRedux,
  useSemanticUI,
  docker,
  alias,
  installDependencies,
) {
  const root = path.resolve(name)
  const appName = path.basename(root)

  fs.ensureDirSync(name)

  console.log(`Creating a new React app in ${chalk.green(root)}.`)
  console.log()

  const useYarn = useNpm ? false : shouldUseYarn()
  const command = useYarn ? 'yarn' : 'npm run'

  const packageJson = {
    name: appName,
    version: '0.1.0',
    private: true,
    browserslist: {
      production: [
        ">0.2%",
        "not dead",
        "not op_mini all"
      ],
      development: [
        "last 1 chrome version",
        "last 1 firefox version",
        "last 1 safari version"
      ]
    },
    scripts: {
      "build": "webpack --config webpack.config.js",
      "build:dev": `${command} build --env.env=development`,
      "build:dev:watch": `${command} build:dev --watch --hot`,
      "build:dev:analyze": `${command} build:dev --env.addon=bundleanalyze --env.addon=bundlevisualizer`,
      "build:prod": `${command} build -p --env.env=production`,
      "build:prod:watch": `${command} build:prod --watch`,
      "build:prod:analyze": `${command} build:prod --env.addon=bundleanalyze --env.addon=bundlevisualizer`,
      "lint": "eslint ./src --ext .jsx --ext .js",
      "lint:fix": "eslint ./src --fix --ext .jsx --ext .js --fix",
      "serve:dev": "webpack-dev-server --mode development --open --hot --env.env=development",
      "serve:dev:dashboard": "webpack-dashboard webpack-dev-server -- --mode development --env.addon=dashboard",
      "start": `${command} serve:dev`,
      "test": "jest --runInBand --detectOpenHandles --config .jest.config.js",
      "test:watch": "jest -u --runInBand --verbose --watch --detectOpenHandles --config .jest.config.js",
      "test:coverage": "jest -u --coverage --verbose --runInBand --detectOpenHandles --config .jest.config.js",
    }
  }

  if (docker) {
    packageJson.scripts = {
      ...packageJson.scripts,
      "docker:dev": `${command} docker:dev:build && ${command} docker:dev:start`,
      "docker:dev:build": `docker build -f docker/Dockerfile --target development -t ${appName} .`,
      "docker:dev:start": `docker run --rm -it --network host -v $PWD:/usr/src/app ${appName}`,
      "docker:prod": `${command} docker:prod:build && ${command} docker:prod:start`,
      "docker:prod:build": `docker build --build-arg API_BASE_URL=$API_BASE_URL -f docker/Dockerfile --target production -t ${appName}:production .`,
      "docker:prod:start": `docker run --rm -it --network host -e API_BASE_URL=$API_BASE_URL -v $PWD:/usr/src/app ${appName}:production`
    }
  }

  if (useTypescript) {
    packageJson.scripts.lint += " && prettier --check \"src/**/*.{ts,tsx}\""
    packageJson.scripts["lint:fix"] += " && prettier --write \"src/**/*.{ts,tsx}\""
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )

  const originalDirectory = process.cwd()
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
    useRedux,
    useSemanticUI,
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
  useRedux,
  useSemanticUI,
  docker,
  alias,
  installDependencies,
) {
  let configs = ['common']

  if (useTypescript) {
    configs.push('typescript')

    devDependencies.push(
      '@types/node',
      '@types/react',
      "@types/react-dom",
      "@types/react-router",
      "@types/react-router-dom",
      "@types/react-test-renderer",
      '@types/jest',
      '@types/enzyme',
      '@types/enzyme-adapter-react-16',
      'awesome-typescript-loader',
      'eslint-config-prettier',
      'eslint-plugin-prettier',
      'prettier',
      'prettier-tslint',
      'tslint-config-prettier',
      'tslint-plugin-prettier',
      'ts-jest',
      'tslint',
      'tslint-config-prettier',
      'tslint-loader',
      'tslint-plugin-prettier',
      'tslint-react',
      'typescript',
    )
  }

  if (useRedux) {
    configs.push('redux')

    dependencies.push(
      'connected-react-router',
      'history',
      'react-redux',
      'redux',
      'redux-cookie',
      'redux-form',
      'redux-logger',
      'redux-persist',
      'redux-thunk',
    )

    devDependencies.push(
      'redux-mock-store',
    )
  }

  if (useSemanticUI) {
    configs.push('semantic-ui')

    dependencies.push(
      'semantic-ui-less',
      'semantic-ui-react',
    )

    devDependencies.push(
      'less@2.7.3',
      'less-loader@^5.0.0',
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
        let [name, version] = elem.split('@')
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

  provisionConfig(root, configs, appName, originalDirectory, alias, verbose)

  provisionTemplates(root, configs, appName, originalDirectory, alias, verbose)

  if (docker) {
    provisionDocker(root, appName, originalDirectory, alias, verbose)
  }

  spawn('git', ['init'])
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

function provisionConfig(root, configs = [], appName, originalDirectory, alias, verbose) {
  configs.forEach((config) => {
    fs.readdir(`${__dirname}/../config/${config}`, (err, data) => {
      if (err && verbose) {
        console.log(err)
      }

      (data || []).forEach(elem => {
        secureCopy(`${__dirname}/../config/${config}/${elem}`, `${root}/${elem}`, err => {
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
  })
}

function provisionTemplates(root, configs = [], appName, originalDirectory, alias, verbose) {
  configs.forEach((config) => {
    readdirp({ root: `${__dirname}/../templates/${config}`, fileFilter: '*.template' })
      .on('data', ({ path, parentDir }) => {
        const file = fs.readFileSync(`${__dirname}/../templates/${config}/${path}`, 'utf8')
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

    readdirp({ root: `${__dirname}/../templates/${config}`, fileFilter: '!*.template' })
      .on('data', ({ path }) => {
        secureCopy(`${__dirname}/../templates/${config}/${path}`, `${root}/${path}`, err => {
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
  })
}

function provisionDocker(root, appName, originalDirectory, alias, verbose) {
  fs.readdir(`${__dirname}/../docker`, (err, data) => {
    if (err && verbose) {
      console.log(err)
    }

    (data || []).forEach(elem => {
      secureCopy(`${__dirname}/../docker/${elem}`, `${root}/docker/${elem}`, err => {
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

function secureCopy(src, dest, callback) {
  return fs.copy(src, dest, { overwrite: true }, callback)
}

module.exports = {
  createApp,
}
